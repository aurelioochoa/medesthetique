// Convierte los escaneos de esculturas en mallas livianas para la web: assets/models/<id>.bin
//
//   node tools/build-esculturas.mjs --src <carpeta con los originales> --meshopt <ruta a meshopt_simplifier.module.js> [--only david] [--raw]
//
// Originales (no se guardan en el repo):
//   david.glb      "Head Of Michelangelo's David, Optimised", Thomas Flynn, CC BY 4.0 (datos CC0 del SMK)
//                  https://sketchfab.com/3d-models/d29af50360624e5e9b1855666475380d (espejo: Objaverse, Hugging Face)
//   venus.glb      "Venus de Milo (Aphrodite of Milos)", SMK – National Gallery of Denmark, CC0
//                  https://sketchfab.com/3d-models/53082b5d6cef4c34a9701a2a24f58075 (espejo: Objaverse, Hugging Face)
//   aphrodite.stl  "Aphrodite", Usher Gallery, Lincoln, escaneo de Oliver Laric, sin copyright
//                  https://threedscans.com/lincoln/aphrodite/
//
// Pasos: orientar, recortar la cabeza, alinear al marco de las zonas del rostro (ojos, nariz, mentón),
// simplificar con meshoptimizer, recalcular normales y hornear oclusión ambiental por vértice.
//
// Formato de salida: 'MESH' · uint32 largo del JSON · JSON · bloques alineados a 4 bytes
//   pos uint16×3 (cuantizado en la caja del JSON) · nrm int16×3 · ao uint8 · [uv uint16×2] · idx uint32

import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => a.startsWith('--') ? [a.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] == null ? true : all[i + 1]] : null).filter(Boolean));
const SRC = args.src;
const OUT = fileURLToPath(new URL('../assets/models/', import.meta.url));
if (!SRC || !args.meshopt) { console.error('Uso: node tools/build-esculturas.mjs --src <carpeta> --meshopt <meshopt_simplifier.module.js>'); process.exit(1); }
const { MeshoptSimplifier } = await import(args.meshopt);
await MeshoptSimplifier.ready;

// Marco canónico de las zonas (assets/js/face3d.js): punta de la nariz y distancia ojos–mentón.
// Ojos en y = 0.04, mentón en y = -0.89 y punta de la nariz en x = 0, z = 0.995.
const CANON = { eyeY: 0.04, noseX: 0, noseZ: 0.995, eyeToChin: 0.93 };

const MODELS = {
  // rot: giros en orden ([eje, grados]) para que el rostro mire a +z con la mirada horizontal.
  // landmarks: altura de los ojos, del mentón y la punta de la nariz, medidas en el marco previo.
  david: { src: 'david.glb', rot: [['y', 40]], tris: 100000, keepUV: true, normalMap: 1,
    landmarks: { eyeY: 0.273, chinY: -0.42, nose: [-0.065, -0.019, 0.672] } },
  venus: { src: 'venus.glb', rot: [['y', -42], ['x', -6]], cropTop: 0.16, tris: 90000,
    landmarks: { eyeY: 0.18, chinY: -0.86, nose: [-0.79, -0.256, 1.153] } },
  afrodita: { src: 'aphrodite.stl', rot: [['x', 180]], tris: 110000, cutY: -2.3,
    landmarks: { eyeY: 0.47, chinY: -0.18, nose: [0.08, 0.222, 0.69] } },
};

/* ---------- Lectura ---------- */

function readGLB(file) {
  const buf = readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const j = JSON.parse(buf.subarray(20, 20 + jsonLen).toString());
  const binStart = 20 + jsonLen + 8;
  const bin = buf.subarray(binStart);
  const acc = (i, comps) => {
    const a = j.accessors[i], bv = j.bufferViews[a.bufferView];
    const off = (bv.byteOffset || 0) + (a.byteOffset || 0);
    const size = { 5126: 4, 5125: 4, 5123: 2, 5121: 1 }[a.componentType];
    const stride = bv.byteStride || size * comps;
    const out = a.componentType === 5126 ? new Float32Array(a.count * comps) : new Uint32Array(a.count * comps);
    for (let k = 0; k < a.count; k++) for (let c = 0; c < comps; c++) {
      const p = off + k * stride + c * size;
      out[k * comps + c] = a.componentType === 5126 ? bin.readFloatLE(p) : a.componentType === 5125 ? bin.readUInt32LE(p) : a.componentType === 5123 ? bin.readUInt16LE(p) : bin.readUInt8(p);
    }
    return out;
  };
  // Matrices de mundo de cada nodo con malla
  const mul = (a, b) => { const o = new Array(16).fill(0); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; };
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const parts = [];
  const walk = (ni, parent) => {
    const n = j.nodes[ni];
    const m = mul(parent, n.matrix || I);
    if (n.mesh != null) for (const p of j.meshes[n.mesh].primitives) parts.push({ p, m });
    (n.children || []).forEach((c) => walk(c, m));
  };
  (j.scenes?.[j.scene || 0]?.nodes || [0]).forEach((ni) => walk(ni, I));
  const pos = [], uv = [], idx = [];
  let base = 0;
  for (const { p, m } of parts) {
    const P = acc(p.attributes.POSITION, 3);
    const UV = p.attributes.TEXCOORD_0 != null ? acc(p.attributes.TEXCOORD_0, 2) : null;
    const X = acc(p.indices, 1);
    for (let k = 0; k < P.length; k += 3) {
      const x = P[k], y = P[k + 1], z = P[k + 2];
      pos.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]);
    }
    if (UV) uv.push(...UV);
    for (const v of X) idx.push(v + base);
    base += P.length / 3;
  }
  const images = (j.images || []).map((im) => { const bv = j.bufferViews[im.bufferView]; return { mime: im.mimeType, data: bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength) }; });
  const mat = j.materials?.[0];
  return { pos: new Float32Array(pos), uv: uv.length ? new Float32Array(uv) : null, idx: new Uint32Array(idx), images, normalTex: mat?.normalTexture?.index };
}

function readSTL(file) {
  const buf = readFileSync(file);
  const n = buf.readUInt32LE(80);
  const pos = [], idx = [];
  const map = new Map();
  let minv = Infinity, maxv = -Infinity;
  for (let t = 0; t < n; t++) for (let v = 0; v < 3; v++) { const o = 84 + t * 50 + 12 + v * 12; for (let c = 0; c < 3; c++) { const f = buf.readFloatLE(o + c * 4); if (f < minv) minv = f; if (f > maxv) maxv = f; } }
  const q = (maxv - minv) * 1e-6;
  for (let t = 0; t < n; t++) {
    for (let v = 0; v < 3; v++) {
      const o = 84 + t * 50 + 12 + v * 12;
      const x = buf.readFloatLE(o), y = buf.readFloatLE(o + 4), z = buf.readFloatLE(o + 8);
      const key = `${Math.round(x / q)},${Math.round(y / q)},${Math.round(z / q)}`;
      let id = map.get(key);
      if (id == null) { id = pos.length / 3; map.set(key, id); pos.push(x, y, z); }
      idx.push(id);
    }
  }
  return { pos: new Float32Array(pos), uv: null, idx: new Uint32Array(idx), images: [] };
}

/* ---------- Geometría ---------- */

function rotate(pos, steps) {
  for (const [axis, deg] of steps) {
    const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i], y = pos[i + 1], z = pos[i + 2];
      if (axis === 'x') { pos[i + 1] = y * c - z * sn; pos[i + 2] = y * sn + z * c; }
      if (axis === 'y') { pos[i] = x * c + z * sn; pos[i + 2] = -x * sn + z * c; }
      if (axis === 'z') { pos[i] = x * c - y * sn; pos[i + 1] = x * sn + y * c; }
    }
  }
}

function bbox(pos) {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) for (let c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], pos[i + c]); mx[c] = Math.max(mx[c], pos[i + c]); }
  return { mn, mx };
}

// Escala a altura 2.4 con el tope en y = 1.1 y centrado en x/z (marco previo a los puntos de referencia).
function preNormalize(pos) {
  const { mn, mx } = bbox(pos);
  const s = 2.4 / (mx[1] - mn[1]);
  const cx = (mn[0] + mx[0]) / 2, cz = (mn[2] + mx[2]) / 2;
  for (let i = 0; i < pos.length; i += 3) { pos[i] = (pos[i] - cx) * s; pos[i + 1] = (pos[i + 1] - mx[1]) * s + 1.1; pos[i + 2] = (pos[i + 2] - cz) * s; }
}

function compact(pos, idx, uv) {
  const remap = new Int32Array(pos.length / 3).fill(-1);
  let n = 0;
  for (const v of idx) if (remap[v] < 0) remap[v] = n++;
  const P = new Float32Array(n * 3), U = uv ? new Float32Array(n * 2) : null;
  for (let v = 0; v < remap.length; v++) if (remap[v] >= 0) {
    P.set(pos.subarray(v * 3, v * 3 + 3), remap[v] * 3);
    if (U) U.set(uv.subarray(v * 2, v * 2 + 2), remap[v] * 2);
  }
  return { pos: P, idx: idx.map((v) => remap[v]), uv: U };
}

function crop(m, yMin) {
  const keep = [];
  for (let t = 0; t < m.idx.length; t += 3) {
    const a = m.idx[t], b = m.idx[t + 1], c = m.idx[t + 2];
    if (m.pos[a * 3 + 1] >= yMin && m.pos[b * 3 + 1] >= yMin && m.pos[c * 3 + 1] >= yMin) keep.push(a, b, c);
  }
  return compact(m.pos, new Uint32Array(keep), m.uv);
}

function normals(pos, idx) {
  const n = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const k of [a, b, c]) { n[k] += nx; n[k + 1] += ny; n[k + 2] += nz; }
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}

// Oclusión ambiental: se vuelve la malla una grilla de vóxeles y se lanzan rayos en el hemisferio de cada vértice.
function bakeAO(pos, idx, nrm) {
  const { mn, mx } = bbox(pos);
  const R = 176;
  const size = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]);
  const cs = size / (R - 6);
  const o = [mn[0] - 3 * cs, mn[1] - 3 * cs, mn[2] - 3 * cs];
  const D = [Math.ceil((mx[0] - mn[0]) / cs) + 6, Math.ceil((mx[1] - mn[1]) / cs) + 6, Math.ceil((mx[2] - mn[2]) / cs) + 6];
  const grid = new Uint8Array(D[0] * D[1] * D[2]);
  const mark = (x, y, z) => {
    const i = Math.floor((x - o[0]) / cs), j = Math.floor((y - o[1]) / cs), k = Math.floor((z - o[2]) / cs);
    if (i >= 0 && j >= 0 && k >= 0 && i < D[0] && j < D[1] && k < D[2]) grid[(k * D[1] + j) * D[0] + i] = 1;
  };
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const e = Math.max(Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]), Math.hypot(pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]));
    const s = Math.max(1, Math.ceil(e / (cs * 0.5)));
    for (let u = 0; u <= s; u++) for (let v = 0; v <= s - u; v++) {
      const wu = u / s, wv = v / s, ww = 1 - wu - wv;
      mark(pos[a] * ww + pos[b] * wu + pos[c] * wv, pos[a + 1] * ww + pos[b + 1] * wu + pos[c + 1] * wv, pos[a + 2] * ww + pos[b + 2] * wu + pos[c + 2] * wv);
    }
  }
  const solid = (x, y, z) => {
    const i = Math.floor((x - o[0]) / cs), j = Math.floor((y - o[1]) / cs), k = Math.floor((z - o[2]) / cs);
    return i >= 0 && j >= 0 && k >= 0 && i < D[0] && j < D[1] && k < D[2] && grid[(k * D[1] + j) * D[0] + i] === 1;
  };
  // Direcciones fijas en un hemisferio (+z), repartidas con la espiral de Fibonacci y pesadas por coseno.
  const K = 40, dirs = [];
  for (let i = 0; i < K; i++) {
    const r = Math.sqrt((i + 0.5) / K), th = i * 2.399963;
    dirs.push([r * Math.cos(th), r * Math.sin(th), Math.sqrt(1 - r * r)]);
  }
  const L = 0.42, step = cs * 0.6;
  const ao = new Uint8Array(pos.length / 3);
  for (let v = 0; v < ao.length; v++) {
    const n = [nrm[v * 3], nrm[v * 3 + 1], nrm[v * 3 + 2]];
    const t1 = Math.abs(n[0]) < 0.9 ? [0, -n[2], n[1]] : [-n[2], 0, n[0]];
    const l1 = Math.hypot(...t1); t1[0] /= l1; t1[1] /= l1; t1[2] /= l1;
    const t2 = [n[1] * t1[2] - n[2] * t1[1], n[2] * t1[0] - n[0] * t1[2], n[0] * t1[1] - n[1] * t1[0]];
    let occ = 0;
    for (const d of dirs) {
      const w = [t1[0] * d[0] + t2[0] * d[1] + n[0] * d[2], t1[1] * d[0] + t2[1] * d[1] + n[1] * d[2], t1[2] * d[0] + t2[2] * d[1] + n[2] * d[2]];
      for (let t = cs * 2.2; t < L; t += step) {
        if (solid(pos[v * 3] + w[0] * t, pos[v * 3 + 1] + w[1] * t, pos[v * 3 + 2] + w[2] * t)) { occ += 1 - (t / L) * 0.6; break; }
      }
    }
    ao[v] = Math.round(Math.max(0, Math.min(1, 1 - (occ / K) * 1.15)) * 255);
  }
  return ao;
}

/* ---------- Escritura ---------- */

function write(id, m, extra) {
  const { mn, mx } = bbox(m.pos);
  const N = m.pos.length / 3;
  const blocks = [];
  const qpos = new Uint16Array(m.pos.length);
  for (let i = 0; i < m.pos.length; i++) { const c = i % 3; qpos[i] = Math.round(((m.pos[i] - mn[c]) / (mx[c] - mn[c])) * 65535); }
  blocks.push(['pos', Buffer.from(qpos.buffer)]);
  const qn = new Int16Array(m.nrm.length);
  for (let i = 0; i < qn.length; i++) qn[i] = Math.round(m.nrm[i] * 32767);
  blocks.push(['nrm', Buffer.from(qn.buffer)]);
  blocks.push(['ao', Buffer.from(m.ao.buffer)]);
  if (m.uv) { const qu = new Uint16Array(m.uv.length); for (let i = 0; i < qu.length; i++) qu[i] = Math.round(Math.max(0, Math.min(1, m.uv[i])) * 65535); blocks.push(['uv', Buffer.from(qu.buffer)]); }
  blocks.push(['idx', Buffer.from(m.idx.buffer, m.idx.byteOffset, m.idx.byteLength)]);
  const offsets = {};
  let off = 0;
  const parts = [];
  for (const [k, b] of blocks) { const pad = (4 - (b.length % 4)) % 4; offsets[k] = [off, b.length]; parts.push(b, Buffer.alloc(pad)); off += b.length + pad; }
  const meta = { v: 1, vertices: N, triangles: m.idx.length / 3, min: mn, max: mx, blocks: offsets, ...extra };
  let json = Buffer.from(JSON.stringify(meta));
  json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const head = Buffer.alloc(8);
  head.write('MESH', 0);
  head.writeUInt32LE(json.length, 4);
  const out = Buffer.concat([head, json, ...parts]);
  writeFileSync(join(OUT, `${id}.bin`), out);
  return out.length;
}

/* ---------- Principal ---------- */

for (const [id, cfg] of Object.entries(MODELS)) {
  if (args.only && args.only !== id) continue;
  const t0 = Date.now();
  const src = join(SRC, cfg.src);
  let m = cfg.src.endsWith('.glb') ? readGLB(src) : readSTL(src);
  rotate(m.pos, cfg.rot);
  preNormalize(m.pos);
  if (cfg.cropTop) m = { ...crop(m, 1.1 - 2.4 * cfg.cropTop), images: m.images, normalTex: m.normalTex };
  if (cfg.cropTop) preNormalize(m.pos);
  if (!args.raw && cfg.landmarks) {
    const { eyeY, chinY, nose } = cfg.landmarks;
    const s = CANON.eyeToChin / (eyeY - chinY);
    for (let i = 0; i < m.pos.length; i += 3) {
      m.pos[i] = (m.pos[i] - nose[0]) * s + CANON.noseX;
      m.pos[i + 1] = (m.pos[i + 1] - eyeY) * s + CANON.eyeY;
      m.pos[i + 2] = (m.pos[i + 2] - nose[2]) * s + CANON.noseZ;
    }
    if (cfg.cutY != null) m = { ...crop(m, cfg.cutY), images: m.images, normalTex: m.normalTex };
  }
  if (m.idx.length / 3 > cfg.tris * 1.05) {
    const [simp] = MeshoptSimplifier.simplify(m.idx, m.pos, 3, cfg.tris * 3, 0.01);
    m = { ...compact(m.pos, simp, m.uv), images: m.images, normalTex: m.normalTex };
  }
  m.nrm = normals(m.pos, m.idx);
  m.ao = bakeAO(m.pos, m.idx, m.nrm);
  let normalMap = null;
  if (cfg.normalMap != null && m.images[cfg.normalMap]) {
    const im = m.images[cfg.normalMap];
    normalMap = `${id}-normal.${im.mime.includes('png') ? 'png' : 'jpg'}`;
    writeFileSync(join(OUT, normalMap), im.data);
  }
  const bytes = write(id, cfg.keepUV ? m : { ...m, uv: null }, { normalMap, raw: !!args.raw || !cfg.landmarks });
  console.log(`${id}: ${m.pos.length / 3} vértices, ${m.idx.length / 3} triángulos, ${(bytes / 1024).toFixed(0)} KB${normalMap ? ' + ' + normalMap : ''}, ${Date.now() - t0} ms`);
}
