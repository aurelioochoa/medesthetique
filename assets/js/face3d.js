// Medesthetique — motor 3D (Three.js) con esculturas clásicas escaneadas: David, Venus de Milo y Afrodita.
// Las mallas salen de tools/build-esculturas.mjs y están alineadas a un mismo marco (ojos, nariz y mentón),
// así las zonas del rostro, las vistas de cámara y la capa de piel sirven para cualquiera.
// La piel tiene una capa ilustrativa de líneas de expresión, manchas y flacidez, y puede iluminar zonas.

import * as THREE from 'three';
import { RoomEnvironment } from '../../vendor/three/RoomEnvironment.js';

/* ---------- Esculturas disponibles ---------- */

export const ESCULTURAS = [
  { id: 'david', nombre: 'David', detalle: 'Miguel Ángel · cabeza', normalScale: 0.9,
    credito: '“Head Of Michelangelo’s David, Optimised”, Thomas Flynn, CC BY 4.0, a partir del escaneo CC0 del SMK – National Gallery of Denmark',
    url: 'https://sketchfab.com/3d-models/head-of-michelangelos-david-optimised-d29af50360624e5e9b1855666475380d' },
  { id: 'venus', nombre: 'Venus de Milo', detalle: 'Afrodita de Milos', zonas: { frente: [[0, 0.3, 0.85]] },
    credito: '“Venus de Milo (Aphrodite of Milos)”, SMK – National Gallery of Denmark, CC0',
    url: 'https://sketchfab.com/3d-models/venus-de-milo-aphrodite-of-milos-53082b5d6cef4c34a9701a2a24f58075' },
  { id: 'afrodita', nombre: 'Afrodita', detalle: 'copia romana de Praxíteles',
    credito: '“Aphrodite”, The Usher Gallery, Lincoln; escaneo de Oliver Laric, threedscans.com, sin copyright',
    url: 'https://threedscans.com/lincoln/aphrodite/' },
];
export const DEFAULT_ESCULTURA = 'david';
export const escultura = (id) => ESCULTURAS.find((e) => e.id === id) || ESCULTURAS[0];

/* ---------- Zonas del rostro: dónde están y cómo se encuadran ---------- */
// pts: puntos de referencia en el marco común (se pegan al vértice más cercano). sym: se repite en el otro lado.
// view: azimut (rad, + mira desde la derecha de la escultura), elevación (rad), distancia y punto de mira.
export const ZONE_GEO = {
  frente:     { pts: [[0, 0.44, 0.7]], r: 0.28, view: { az: 0.25, el: 0.12, dist: 3.4, t: [0, 0.3, 0.4] } },
  entrecejo:  { pts: [[0, 0.17, 0.74]], r: 0.12, view: { az: 0.15, el: 0.08, dist: 2.7, t: [0, 0.15, 0.5] } },
  'patas-gallo': { pts: [[0.46, 0.04, 0.5]], sym: true, r: 0.14, view: { az: 0.85, el: 0.05, dist: 2.9, t: [0.15, 0.05, 0.4] } },
  ojeras:     { pts: [[0.25, -0.1, 0.72]], sym: true, r: 0.12, view: { az: 0.3, el: 0.05, dist: 2.8, t: [0, -0.05, 0.5] } },
  pomulos:    { pts: [[0.36, -0.1, 0.66]], sym: true, r: 0.17, view: { az: 0.6, el: 0.02, dist: 3.2, t: [0.05, -0.12, 0.4] } },
  nariz:      { pts: [[0, -0.12, 0.92]], r: 0.16, view: { az: 1.2, el: 0.02, dist: 3.1, t: [0, -0.15, 0.6] } },
  surcos:     { pts: [[0.2, -0.45, 0.8]], sym: true, r: 0.12, view: { az: 0.45, el: -0.02, dist: 2.9, t: [0, -0.4, 0.5] } },
  labios:     { pts: [[0, -0.51, 0.88]], r: 0.17, view: { az: 0.35, el: -0.02, dist: 2.7, t: [0, -0.5, 0.55] } },
  menton:     { pts: [[0, -0.84, 0.66]], r: 0.16, view: { az: 1.1, el: -0.05, dist: 3.2, t: [0, -0.75, 0.45] } },
  mandibula:  { pts: [[0.4, -0.6, 0.4]], sym: true, r: 0.2, view: { az: 0.95, el: -0.08, dist: 3.6, t: [0.1, -0.6, 0.2] } },
  papada:     { pts: [[0, -0.95, 0.3]], r: 0.18, view: { az: 1.15, el: -0.3, dist: 3.4, t: [0, -0.95, 0.25] } },
  cuello:     { pts: [[0, -1.25, 0.2]], r: 0.24, view: { az: 0.7, el: -0.12, dist: 4, t: [0, -1.15, 0.1] } },
};

export const VIEW_FULL = { az: 0.55, el: 0.06, dist: 7.4, t: [0, -0.3, 0] };

const MAX_ZONE_PTS = 24;

/* ---------- Carga de mallas ---------- */

const geoCache = new Map();
export function loadEscultura(id) {
  if (!geoCache.has(id)) {
    const url = new URL(`../models/${id}.bin`, import.meta.url);
    geoCache.set(id, fetch(url).then((r) => { if (!r.ok) throw new Error(`No se pudo cargar ${id}`); return r.arrayBuffer(); }).then((b) => buildGeometry(b, id)));
  }
  return geoCache.get(id);
}

function buildGeometry(buf, id) {
  const dv = new DataView(buf);
  const jsonLen = dv.getUint32(4, true);
  const meta = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, jsonLen)));
  const base = 8 + jsonLen;
  const block = (k, T) => new T(buf, base + meta.blocks[k][0], meta.blocks[k][1] / T.BYTES_PER_ELEMENT);
  const N = meta.vertices;
  const q = block('pos', Uint16Array);
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < pos.length; i++) { const c = i % 3; pos[i] = meta.min[c] + (q[i] / 65535) * (meta.max[c] - meta.min[c]); }
  const g = new THREE.BufferGeometry();
  g.setIndex(new THREE.BufferAttribute(block('idx', Uint32Array), 1));
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(block('nrm', Int16Array), 3, true));
  const ao = new THREE.BufferAttribute(block('ao', Uint8Array), 1, true);
  g.setAttribute('ao0', ao);
  g.setAttribute('ao1', ao);
  if (meta.blocks.uv) g.setAttribute('uv', new THREE.BufferAttribute(block('uv', Uint16Array), 2, true));
  g.computeBoundingSphere();
  g.computeBoundingBox();
  g.userData = { id, meta };
  return g;
}

const texCache = new Map();
function normalTexture(file) {
  if (!texCache.has(file)) {
    const t = new THREE.TextureLoader().load(new URL(`../models/${file}`, import.meta.url).href);
    t.colorSpace = THREE.NoColorSpace;
    t.anisotropy = 4;
    texCache.set(file, t);
  }
  return texCache.get(file);
}

/* ---------- Piel: material con capa ilustrativa ---------- */

const SKIN_GLSL = /* glsl */ `
  varying vec3 vObj;
  varying float vAO;
  uniform float uAO;
  uniform float uLines;
  uniform float uSpots;
  uniform float uTime;
  uniform vec4 uZones[${MAX_ZONE_PTS}];
  uniform float uZoneOn[${MAX_ZONE_PTS}];
  uniform vec3 uZoneColor;

  float mHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float mNoise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(mHash(i), mHash(i + vec3(1, 0, 0)), f.x), mix(mHash(i + vec3(0, 1, 0)), mHash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(mHash(i + vec3(0, 0, 1)), mHash(i + vec3(1, 0, 1)), f.x), mix(mHash(i + vec3(0, 1, 1)), mHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float band(float v, float w) { return 1.0 - smoothstep(0.0, w, abs(v)); }

  // Líneas de expresión: frente, entrecejo, patas de gallo, surcos y cuello, como sombras suaves.
  float mWrinkles(vec3 p) {
    float ax = abs(p.x);
    float front = smoothstep(0.3, 0.55, p.z);
    float lines = 0.0;
    float yy = p.y + 0.01 * sin(p.x * 9.0) + 0.06 * p.x * p.x;
    float fm = smoothstep(0.3, 0.36, p.y) * (1.0 - smoothstep(0.6, 0.7, p.y)) * front;
    for (int i = 0; i < 4; i++) {
      float c = 0.38 + float(i) * 0.065;
      float len = 0.06 + 0.04 * float(i);
      lines += band(yy - c, 0.012) * (1.0 - smoothstep(len, len + 0.2, ax)) * fm * (0.7 + 0.3 * sin(p.x * 11.0 + float(i) * 1.7));
    }
    float gm = smoothstep(0.1, 0.13, p.y) * (1.0 - smoothstep(0.2, 0.24, p.y)) * front;
    lines += band(ax - 0.035 - 0.08 * (p.y - 0.1), 0.008) * gm;
    vec2 e = vec2(ax - 0.4, p.y - 0.04);
    float r = length(e);
    float ang = atan(e.y, e.x);
    float cf = band(sin(ang * 6.0 + 0.4), 0.3) * smoothstep(0.03, 0.05, r) * (1.0 - smoothstep(0.08, 0.13, r));
    cf *= smoothstep(-0.01, 0.03, e.x) * smoothstep(0.05, 0.25, p.z);
    lines += cf * 0.8;
    vec2 a = vec2(0.11, -0.31), b = vec2(0.2, -0.53);
    vec2 pa = vec2(ax, p.y) - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    lines += band(length(pa - ba * h), 0.03) * front * 0.55;
    float nm = smoothstep(-1.4, -1.32, p.y) * (1.0 - smoothstep(-1.12, -1.06, p.y)) * smoothstep(0.1, 0.3, p.z);
    lines += band(fract((p.y + 0.015 * sin(p.x * 5.0)) * 9.0) - 0.5, 0.06) * nm * 0.6 * (1.0 - smoothstep(0.12, 0.3, ax));
    return clamp(lines, 0.0, 1.0);
  }

  float mSpots(vec3 p) {
    float n = mNoise(p * 11.0) * 0.65 + mNoise(p * 26.0) * 0.35;
    float m = smoothstep(0.45, 0.62, p.z) * smoothstep(-0.5, -0.35, p.y) * (1.0 - smoothstep(-0.02, 0.06, p.y));
    m += smoothstep(0.5, 0.65, p.z) * smoothstep(0.3, 0.4, p.y) * (1.0 - smoothstep(0.55, 0.65, p.y)) * 0.6;
    float ax = abs(p.x);
    m *= 1.0 - (1.0 - smoothstep(0.06, 0.14, length(vec2(ax - 0.245, p.y - 0.045) * vec2(0.8, 1.6))));
    m *= smoothstep(0.08, 0.16, ax) + smoothstep(0.25, 0.35, p.y);
    return smoothstep(0.64, 0.76, n) * clamp(m, 0.0, 1.0);
  }

  float mZones(vec3 p) {
    float g = 0.0;
    for (int i = 0; i < ${MAX_ZONE_PTS}; i++) {
      vec4 z = uZones[i];
      float d = distance(p, z.xyz);
      g = max(g, uZoneOn[i] * (1.0 - smoothstep(z.w * 0.25, z.w, d)));
    }
    return g;
  }
`;

// Flacidez ilustrativa: con la edad, mejillas, mandíbula y papada bajan un poco.
const SAG_GLSL = /* glsl */ `
  uniform float uSag;
  vec3 mSag(vec3 p) {
    float ax = abs(p.x);
    float front = smoothstep(0.1, 0.45, p.z);
    float jowl = exp(-pow(length(vec2(ax - 0.3, p.y + 0.6) * vec2(1.0, 1.3)) / 0.2, 2.0));
    float cheek = exp(-pow(length(vec2(ax - 0.3, p.y + 0.18)) / 0.18, 2.0));
    float chin = exp(-pow(length(vec2(p.x, (p.y + 0.95) * 1.2)) / 0.24, 2.0)) * smoothstep(0.0, 0.3, p.z);
    vec3 d = vec3(0.0, -0.06, 0.0) * jowl * front + vec3(0.0, -0.04, -0.01) * cheek * front + vec3(0.0, -0.035, 0.02) * chin;
    d.x += sign(p.x) * 0.018 * jowl * front;
    return d;
  }
`;

export function createSkinMaterial() {
  const uniforms = {
    uLines: { value: 0 },
    uSpots: { value: 0 },
    uAge: { value: 0 },
    uSag: { value: 0 },
    uAO: { value: 1 },
    uTime: { value: 0 },
    uZones: { value: Array.from({ length: MAX_ZONE_PTS }, () => new THREE.Vector4(0, 99, 0, 0.001)) },
    uZoneOn: { value: new Float32Array(MAX_ZONE_PTS) },
    uZoneColor: { value: new THREE.Color('#5fa9c4') },
  };
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ece3dc'),
    roughness: 0.52,
    metalness: 0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.6,
    sheen: 0.6,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color('#ffe2d6'),
  });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;\nvarying float vAO;\nattribute float ao0;\nattribute float ao1;\nuniform float uAge;\n' + SAG_GLSL)
      .replace('#include <morphtarget_vertex>', '#include <morphtarget_vertex>\nvObj = transformed;\nvAO = mix(ao0, ao1, uAge);\ntransformed += mSag(transformed) * uSag;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + SKIN_GLSL)
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= mix(1.0, pow(vAO, 1.5), uAO);
        float mW = mWrinkles(vObj) * uLines;
        diffuseColor.rgb *= 1.0 - mW * 0.32;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.64, 0.46, 0.38), mSpots(vObj) * uSpots * 0.45);
        float mZ = mZones(vObj);
        float mPulse = 0.85 + 0.15 * sin(uTime * 2.4);
        diffuseColor.rgb = mix(diffuseColor.rgb, uZoneColor, mZ * 0.62 * mPulse);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += uZoneColor * mZ * 0.22 * mPulse;`);
  };
  mat.userData.uniforms = uniforms;
  return mat;
}

/* ---------- Escena ---------- */

function radialTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([o, col]) => grd.addColorStop(o, col));
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDark = () => document.documentElement.dataset.themeResolved === 'dark';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

/**
 * Escenario de la escultura.
 * opciones: model (id), halo, particles, plinth, interactive (arrastrar para girar, rueda para acercar),
 * idle (vaivén suave), follow (sigue al puntero), view (encuadre inicial).
 */
export class MusaStage {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.opts = { model: DEFAULT_ESCULTURA, halo: true, particles: true, plinth: true, interactive: false, idle: true, follow: false, view: VIEW_FULL, ...opts };
    this.reduced = reducedMotion();
    this.clock = new THREE.Clock();
    this.listeners = new Set();
    this.zoneIds = Object.keys(ZONE_GEO);
    this.zoneState = {};
    this.zoneIds.forEach((id) => { this.zoneState[id] = { v: 0, t: 0 }; });
    this.skin = { lines: 0, spots: 0, age: 0 };
    this.skinTarget = { lines: 0, spots: 0, age: 0 };
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.fade = 0;

    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.45;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(28, 1, 0.05, 60);
    const v = this.opts.view;
    this.cam = { az: v.az, el: v.el, dist: v.dist, t: new THREE.Vector3(...v.t) };
    this.camTarget = { az: v.az, el: v.el, dist: v.dist, t: new THREE.Vector3(...v.t) };

    this.key = new THREE.DirectionalLight('#fff0e4', 2.4);
    this.key.position.set(-3.5, 3.5, 4);
    this.rim = new THREE.DirectionalLight('#bfe4f2', 2.4);
    this.rim.position.set(4, 2.5, -4);
    const rim2 = new THREE.DirectionalLight('#ffe2d6', 0.9);
    rim2.position.set(-4, 1, -3);
    this.hemi = new THREE.HemisphereLight('#ffffff', '#d9c2b8', 0.35);
    this.scene.add(this.key, this.rim, rim2, this.hemi);

    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.material = createSkinMaterial();
    this.u = this.material.userData.uniforms;

    if (this.opts.halo) this.addHalo();
    if (this.opts.particles) this.addParticles();
    if (this.opts.plinth) this.addPlinth();
    this.applyTheme();

    this.ready = this.setModel(this.opts.model);

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(canvas);
    this.visible = true;
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; if (this.visible) this.kick(); }, { rootMargin: '120px' });
    this.io.observe(canvas);
    this.mo = new MutationObserver(() => { this.applyTheme(); this.kick(); });
    this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-resolved'] });
    if (this.opts.follow) {
      window.addEventListener('pointermove', (e) => {
        this.pointer.tx = (e.clientX / innerWidth) * 2 - 1;
        this.pointer.ty = (e.clientY / innerHeight) * 2 - 1;
      }, { passive: true });
    }
    if (this.opts.interactive) this.bindInteraction();
    this.resize();
    this.kick();
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(type, data) { this.listeners.forEach((fn) => fn(type, data)); }

  /* ----- Modelo ----- */

  // Cambia de escultura con un fundido. Devuelve una promesa que se cumple cuando ya está en escena.
  setModel(id) {
    const info = escultura(id);
    this.modelId = info.id;
    const token = (this.loadToken = (this.loadToken || 0) + 1);
    this.emit('loading', info.id);
    return loadEscultura(info.id).then((geo) => {
      if (token !== this.loadToken) return this;
      if (this.mesh) { this.root.remove(this.mesh); }
      const nm = geo.userData.meta.normalMap;
      this.material.normalMap = nm && geo.attributes.uv ? normalTexture(nm) : null;
      this.material.normalScale = new THREE.Vector2(info.normalScale || 1, info.normalScale || 1);
      this.material.needsUpdate = true;
      this.mesh = new THREE.Mesh(geo, this.material);
      this.root.add(this.mesh);
      this.fade = 0;
      if (this.plinth) this.plinth.position.y = geo.boundingBox.min.y + 0.02;
      this.setupZones(geo);
      this.emit('ready', info.id);
      this.kick();
      return this;
    });
  }

  addHalo() {
    this.haloGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTexture([[0, 'rgba(198,228,238,0.85)'], [0.45, 'rgba(198,228,238,0.32)'], [1, 'rgba(198,228,238,0)']]),
      transparent: true, depthWrite: false,
    }));
    this.haloGlow.scale.set(6.2, 6.2, 1);
    this.haloGlow.renderOrder = -2;
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.92, 1.935, 160), new THREE.MeshBasicMaterial({ color: '#7fb6c9', transparent: true, opacity: 0.55, depthWrite: false }));
    ring.renderOrder = -1;
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(2.25, 2.256, 160, 1, 0.3, Math.PI * 1.15), new THREE.MeshBasicMaterial({ color: '#27477d', transparent: true, opacity: 0.25, depthWrite: false }));
    this.halo = new THREE.Group();
    this.halo.add(this.haloGlow, ring, ring2);
    this.halo.userData = { ring, ring2 };
    this.scene.add(this.halo);
  }

  addParticles() {
    const n = 420;
    const pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      const rad = 2.1 + Math.random() * 1.6;
      pos[i * 3] = Math.cos(th) * Math.sin(ph) * rad;
      pos[i * 3 + 1] = Math.cos(ph) * rad * 0.9 - 0.3;
      pos[i * 3 + 2] = Math.sin(th) * Math.sin(ph) * rad * 0.7 - 0.4;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uPx: { value: this.renderer.getPixelRatio() } },
      vertexShader: /* glsl */ `
        attribute float seed; uniform float uTime; uniform float uPx; varying float vA;
        void main() {
          vec3 p = position;
          p.y += mod(uTime * (0.04 + seed * 0.05) + seed * 5.0, 5.0) - 2.5;
          p.x += sin(uTime * 0.3 + seed * 20.0) * 0.08;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (2.0 + seed * 5.0) * uPx * (6.0 / -mv.z);
          vA = (0.35 + 0.65 * seed) * smoothstep(-2.6, -1.6, p.y) * (1.0 - smoothstep(1.6, 2.4, p.y));
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(mix(vec3(0.62, 0.81, 0.87), vec3(1.0, 0.95, 0.92), a), a * vA * 0.75);
        }`,
    });
    this.particles = new THREE.Points(g, m);
    this.scene.add(this.particles);
  }

  addPlinth() {
    this.plinthMat = new THREE.MeshPhysicalMaterial({ color: '#ece6e2', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.64, 0.08, 96), this.plinthMat);
    top.position.y = -0.04;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.5, 96), this.plinthMat);
    col.position.y = -0.33;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.8, 0.1, 96), this.plinthMat);
    base.position.y = -0.62;
    this.plinth = new THREE.Group();
    this.plinth.add(top, col, base);
    this.root.add(this.plinth);
  }

  // Ajusta luces, halo y pedestal al tema claro u oscuro de la página.
  applyTheme() {
    const dark = isDark();
    this.scene.environmentIntensity = dark ? 0.32 : 0.45;
    this.hemi.intensity = dark ? 0.22 : 0.35;
    this.rim.intensity = dark ? 3.2 : 2.4;
    if (this.halo) {
      this.haloGlow.material.opacity = dark ? 0.32 : 1;
      this.halo.userData.ring.material.opacity = dark ? 0.4 : 0.55;
      this.halo.userData.ring2.material.color.set(dark ? '#9bc9d8' : '#27477d');
      this.halo.userData.ring2.material.opacity = dark ? 0.35 : 0.25;
    }
    if (this.plinthMat) this.plinthMat.color.set(dark ? '#3a4458' : '#ece6e2');
  }

  /* ----- Zonas ----- */

  setupZones(geo) {
    const pos = geo.attributes.position.array, nrm = geo.attributes.normal;
    const nearest = (x, y, z) => {
      let best = 0, bd = Infinity;
      for (let i = 0; i < pos.length; i += 3) {
        const dx = pos[i] - x, dy = pos[i + 1] - y, dz = pos[i + 2] - z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bd) { bd = d; best = i / 3; }
      }
      return best;
    };
    this.zonePts = [];
    this.zoneAnchors = {};
    for (const id of this.zoneIds) {
      const z = ZONE_GEO[id];
      const pts = [];
      for (const p of escultura(this.modelId).zonas?.[id] || z.pts) { pts.push(p); if (z.sym && p[0] !== 0) pts.push([-p[0], p[1], p[2]]); }
      this.zoneAnchors[id] = pts.map(([x, y, zz]) => {
        const k = nearest(x, y, zz);
        return { p: new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]), n: new THREE.Vector3(nrm.getX(k), nrm.getY(k), nrm.getZ(k)).normalize() };
      });
      this.zoneAnchors[id].forEach((a) => this.zonePts.push({ id, p: [a.p.x, a.p.y, a.p.z], r: z.r }));
    }
    this.zonePts.slice(0, MAX_ZONE_PTS).forEach((zp, i) => this.u.uZones.value[i].set(zp.p[0], zp.p[1], zp.p[2], zp.r));
    for (const id of this.zoneIds) this.zoneState[id].t = this.zoneTargets?.[id] || 0;
  }

  // Ilumina zonas. map: { id: intensidad 0..1 }. Las que no están se apagan.
  setZones(map = {}) {
    this.zoneTargets = map;
    for (const id of this.zoneIds) this.zoneState[id].t = map[id] || 0;
    this.kick();
  }

  setSkin({ lines, spots, age } = {}, instant = false) {
    if (lines != null) this.skinTarget.lines = lines;
    if (spots != null) this.skinTarget.spots = spots;
    if (age != null) this.skinTarget.age = age;
    if (instant) Object.assign(this.skin, this.skinTarget);
    this.kick();
  }

  // Encuadre completo del busto (con pedestal) según el tamaño de la escultura y del lienzo.
  fullView({ az = 0.55, el = 0.04, pad = 1.1, shiftX = 0, shiftY = 0 } = {}) {
    const bb = this.mesh?.geometry.boundingBox;
    if (!bb) return { az, el, dist: 9, t: [shiftX, -0.4 + shiftY, 0] };
    const bottom = this.plinth ? bb.min.y - 0.66 : bb.min.y;
    const h = bb.max.y - bottom;
    const vfov = (this.camera.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect);
    const dist = Math.max((h * pad) / 2 / Math.tan(vfov / 2), (2.4 * pad) / 2 / Math.tan(hfov / 2));
    return { az, el, dist, t: [shiftX, (bb.max.y + bottom) / 2 + shiftY, 0] };
  }

  setView(v, instant = false) {
    const t = this.camTarget;
    if (v.az != null) t.az = v.az;
    if (v.el != null) t.el = v.el;
    if (v.dist != null) t.dist = v.dist;
    if (v.t) t.t.set(...v.t);
    if (instant) { this.cam.az = t.az; this.cam.el = t.el; this.cam.dist = t.dist; this.cam.t.copy(t.t); }
    this.kick();
  }

  frameZone(id, instant = false) {
    const z = ZONE_GEO[id];
    this.setView(z ? z.view : this.opts.view, instant);
  }

  // Pantalla → zona tocada (o null).
  pick(clientX, clientY) {
    if (!this.mesh || !this.zonePts) return null;
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = ray.intersectObject(this.mesh, false)[0];
    if (!hit) return null;
    const p = this.mesh.worldToLocal(hit.point.clone());
    this.lastHit = p;
    let best = null, bestD = Infinity;
    for (const zp of this.zonePts) {
      const d = p.distanceTo(new THREE.Vector3(...zp.p)) / zp.r;
      if (d < bestD) { bestD = d; best = zp.id; }
    }
    return bestD < 1.35 ? best : null;
  }

  // Posición en pantalla (px, relativa al canvas) del ancla de una zona y si mira a la cámara.
  projectZone(id, which = 0) {
    const a = this.zoneAnchors?.[id]?.[which];
    if (!a || !this.mesh) return null;
    const w = this.mesh.localToWorld(a.p.clone());
    const n = a.n.clone().transformDirection(this.mesh.matrixWorld);
    const toCam = this.camera.position.clone().sub(w).normalize();
    const facing = n.dot(toCam);
    const p = w.project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    return { x: ((p.x + 1) / 2) * rect.width, y: ((1 - p.y) / 2) * rect.height, visible: facing > 0.1 && p.z < 1, facing };
  }

  /* ----- Interacción ----- */

  bindInteraction() {
    const c = this.canvas;
    let last = null, moved = 0;
    c.style.touchAction = 'pan-y';
    c.addEventListener('pointerdown', (e) => {
      last = { x: e.clientX, y: e.clientY };
      moved = 0;
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      if (!last) {
        const z = this.pick(e.clientX, e.clientY);
        if (z !== this.hoverZone) { this.hoverZone = z; this.emit('hover', z); }
        c.style.cursor = z ? 'pointer' : 'grab';
        return;
      }
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      last = { x: e.clientX, y: e.clientY };
      this.camTarget.az -= dx * 0.008;
      this.camTarget.el = Math.max(-0.6, Math.min(0.7, this.camTarget.el + dy * 0.005));
      this.kick();
    });
    c.addEventListener('pointerup', (e) => {
      if (last && moved < 6) this.emit('pick', this.pick(e.clientX, e.clientY));
      last = null;
    });
    c.addEventListener('pointercancel', () => { last = null; });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camTarget.dist = Math.max(2.2, Math.min(9, this.camTarget.dist * (1 + Math.sign(e.deltaY) * 0.08)));
      this.kick();
    }, { passive: false });
  }

  /* ----- Render ----- */

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.particles) this.particles.material.uniforms.uPx.value = this.renderer.getPixelRatio();
    this.kick();
  }

  kick() { if (!this.raf) this.raf = requestAnimationFrame(this.loop); }

  loop() {
    this.raf = null;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    const k = this.reduced ? 1 : 1 - Math.pow(0.0015, dt);
    let busy = false;
    const ease = (obj, key, target) => {
      const d = target - obj[key];
      if (Math.abs(d) > 1e-4) { obj[key] += d * k; busy = true; } else obj[key] = target;
    };

    ease(this.cam, 'az', this.camTarget.az);
    ease(this.cam, 'el', this.camTarget.el);
    ease(this.cam, 'dist', this.camTarget.dist);
    if (this.cam.t.distanceTo(this.camTarget.t) > 1e-4) { this.cam.t.lerp(this.camTarget.t, k); busy = true; }
    ease(this.pointer, 'x', this.pointer.tx);
    ease(this.pointer, 'y', this.pointer.ty);
    const az = this.cam.az + this.pointer.x * 0.28;
    const el = this.cam.el + this.pointer.y * 0.1;
    const { dist, t: tgt } = this.cam;
    this.camera.position.set(tgt.x + Math.sin(az) * Math.cos(el) * dist, tgt.y + Math.sin(el) * dist, tgt.z + Math.cos(az) * Math.cos(el) * dist);
    this.camera.lookAt(tgt);

    ease(this.skin, 'lines', this.skinTarget.lines);
    ease(this.skin, 'spots', this.skinTarget.spots);
    ease(this.skin, 'age', this.skinTarget.age);
    this.u.uLines.value = this.skin.lines;
    this.u.uSpots.value = this.skin.spots;
    this.u.uSag.value = this.skin.age;

    let anyZone = false;
    if (this.zonePts) {
      for (const id of this.zoneIds) { ease(this.zoneState[id], 'v', this.zoneState[id].t); if (this.zoneState[id].v > 0.001) anyZone = true; }
      this.zonePts.slice(0, MAX_ZONE_PTS).forEach((zp, i) => { this.u.uZoneOn.value[i] = this.zoneState[zp.id].v; });
    }
    this.u.uTime.value = t;

    // Entrada de la escultura: sube y aparece
    if (this.mesh && this.fade < 1) {
      this.fade = this.reduced ? 1 : Math.min(1, this.fade + dt * 1.6);
      const e = 1 - Math.pow(1 - this.fade, 3);
      this.mesh.position.y = (1 - e) * -0.25;
      this.mesh.scale.setScalar(0.96 + 0.04 * e);
      busy = true;
    }

    const idle = this.opts.idle && !this.reduced;
    if (idle) this.root.rotation.y = Math.sin(t * 0.25) * 0.08;
    this.root.position.y = idle ? Math.sin(t * 0.8) * 0.02 : 0;
    if (this.halo) {
      this.halo.quaternion.copy(this.camera.quaternion);
      const back = new THREE.Vector3().subVectors(tgt, this.camera.position).normalize().multiplyScalar(1.3);
      this.halo.position.set(0, 0.05, 0).add(back);
      if (!this.reduced) this.halo.userData.ring2.rotation.z = t * 0.12;
    }
    if (this.particles) this.particles.material.uniforms.uTime.value = t;

    this.emit('frame', t);
    this.renderer.render(this.scene, this.camera);

    const animating = idle || this.opts.particles || anyZone;
    if (this.visible && (busy || (animating && !this.reduced))) this.raf = requestAnimationFrame(this.loop);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    this.mo.disconnect();
    this.renderer.dispose();
  }
}
