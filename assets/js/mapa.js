// Mapa facial 3D: elegir zonas y preocupaciones sobre la escultura, ver tratamientos sugeridos,
// simular antes y después (ilustrativo) y agendar la valoración con ese plan.

import { ZONES, tratamiento, zone, esc, money, whatsappLink } from './data.js';
import { initChrome, openBooking, toast, ICON, esculturaActual, setEsculturaVisitante } from './ui.js';
import { MusaStage, ZONE_GEO, webglAvailable, ESCULTURAS, escultura } from './face3d.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const VIEWS = {
  frente: { az: 0, el: 0.04, dist: 6.4, t: [0, -0.25, 0.1] },
  tres: { az: 0.6, el: 0.05, dist: 6.6, t: [0.05, -0.28, 0.1] },
  perfil: { az: 1.5, el: 0.03, dist: 6.6, t: [0, -0.3, 0.1] },
};

// Qué capa de la simulación representa cada preocupación.
const SIM_LAYER = {
  lines: ['lineas-frente', 'ceno', 'patas', 'codigo-barras', 'bandas', 'celulitis-menton'],
  spots: ['textura-frente', 'manchas', 'poros-nariz', 'piel-fina-ojo', 'mirada-cansada'],
  age: ['soporte', 'surcos-marcados', 'ojera-hundida', 'definicion-labios', 'proyeccion', 'contorno', 'papada-grasa', 'cuello-flacidez', 'rinomodelacion', 'bruxismo'],
};

const state = { zona: null, hover: null, sel: new Set(), sim: 100 };
let stage = null;

/* ---------- Panel ---------- */

function zonesWithSelection() {
  return new Set(ZONES.filter((z) => z.preocupaciones.some((p) => state.sel.has(p.id))).map((z) => z.id));
}

function renderChips() {
  const marked = zonesWithSelection();
  $('#zone-chips').innerHTML = ZONES.map((z) => `
    <button class="zone-chip ${marked.has(z.id) ? 'has-sel' : ''}" data-zona="${z.id}" aria-pressed="${state.zona === z.id}">
      ${esc(z.nombre)}${marked.has(z.id) ? '<i aria-hidden="true"></i>' : ''}</button>`).join('');
}

function trPill(id) {
  const x = tratamiento(id);
  if (!x || !x.activo) return '';
  return `<span class="tr-pill">${esc(x.nombre)}<small>${x.precio != null ? 'desde ' + money(x.precio) : 'en valoración'}</small></span>`;
}

function renderDetail() {
  const box = $('#zone-detail');
  const z = zone(state.zona);
  if (!z) {
    box.innerHTML = `<div class="zone-empty">${ICON.cube}<p>Elige una zona para ver qué puede estar pasando y qué tratamientos pueden ayudarte.</p></div>`;
    return;
  }
  box.innerHTML = `
    <div class="zone-head">
      <h2 class="display">${esc(z.nombre)}</h2>
      <button class="link" data-clear-zone>Ver todo el rostro</button>
    </div>
    <p class="panel-label">¿Qué notas en esta zona?</p>
    <div class="concerns">
      ${z.preocupaciones.map((p) => `
        <label class="concern ${state.sel.has(p.id) ? 'is-on' : ''}">
          <input type="checkbox" data-concern="${p.id}" ${state.sel.has(p.id) ? 'checked' : ''}>
          <span class="concern-box" aria-hidden="true">${ICON.check}</span>
          <span class="concern-body">
            <b>${esc(p.texto)}</b>
            ${p.nota ? `<small>${esc(p.nota)}</small>` : ''}
            <span class="concern-trs">${p.tratamientos.map(trPill).join('')}</span>
          </span>
        </label>`).join('')}
    </div>`;
}

function planData() {
  const items = [];
  for (const z of ZONES) for (const p of z.preocupaciones) if (state.sel.has(p.id)) items.push({ z, p });
  const trs = [...new Set(items.flatMap((i) => i.p.tratamientos))].filter((id) => tratamiento(id)?.activo);
  return { items, trs, zonas: [...new Set(items.map((i) => i.z.id))] };
}

function renderPlan() {
  const { items, trs } = planData();
  const box = $('#plan');
  if (!items.length) {
    box.innerHTML = `
      <p class="panel-label">Tu plan</p>
      <p class="note">Aún no marcas nada. Puedes agendar una valoración general y contarle a tu médico lo que te preocupa.</p>
      <button class="btn btn-primary btn-block" data-book-plan>Agendar valoración</button>`;
    return;
  }
  box.innerHTML = `
    <p class="panel-label">Tu plan · ${items.length} ${items.length === 1 ? 'punto' : 'puntos'}</p>
    <ul class="plan-items">${items.map(({ z, p }) => `<li><span>${esc(z.nombre)}</span>${esc(p.texto)}<button aria-label="Quitar" data-concern-rm="${p.id}">${ICON.close}</button></li>`).join('')}</ul>
    <p class="panel-label">Tratamientos que tu médico puede considerar</p>
    <div class="plan-trs">${trs.map(trPill).join('')}</div>
    <p class="note">Es una orientación, no una indicación médica. En la valoración se confirma qué necesitas, cuánto y en qué orden.</p>
    <div class="plan-cta">
      <button class="btn btn-primary btn-block" data-book-plan>Agendar valoración con este plan</button>
      <a class="btn btn-ghost btn-block" data-wa-plan href="#" target="_blank" rel="noopener">${ICON.wa} Enviar mi plan por WhatsApp</a>
    </div>`;
  const msg = ['Hola Medesthetique 🤍 Armé mi plan en el mapa facial 3D:', ...items.map(({ z, p }) => `• ${z.nombre}: ${p.texto}`),
    `Me interesa: ${trs.map((id) => tratamiento(id).nombre).join(', ')}.`, '¿Me ayudan a agendar una valoración?'].join('\n');
  box.querySelector('[data-wa-plan]').href = whatsappLink(msg);
}

function renderAll() { renderChips(); renderDetail(); renderPlan(); syncStage(); }

/* ---------- 3D ---------- */

function syncStage() {
  if (!stage) return;
  const marked = zonesWithSelection();
  const map = {};
  for (const id of marked) map[id] = 0.38;
  if (state.hover) map[state.hover] = Math.max(map[state.hover] || 0, 0.55);
  if (state.zona) map[state.zona] = 0.95;
  stage.setZones(map);
  applySim();
  $$('.mapa-dot').forEach((d) => {
    d.classList.toggle('is-active', d.dataset.zona === state.zona);
    d.classList.toggle('has-sel', marked.has(d.dataset.zona));
  });
}

function applySim() {
  if (!stage) return;
  const k = 1 - state.sim / 100;
  const sel = [...state.sel];
  const any = sel.length > 0;
  const has = (layer) => !any || sel.some((id) => SIM_LAYER[layer].includes(id));
  stage.setSkin({ lines: has('lines') ? k : 0, spots: has('spots') ? k * 0.9 : 0, age: has('age') ? k : 0 });
}

function selectZone(id, frame = true) {
  state.zona = id;
  if (stage && frame) stage.frameZone(id || null);
  if (stage && !id) stage.setView(VIEWS.tres);
  $('#mapa-intro').classList.toggle('is-hidden', !!id);
  renderAll();
  if (id && innerWidth < 900) $('#zone-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initStage() {
  if (!webglAvailable()) { $('#mapa-fallback').hidden = false; $('.mapa-tools').hidden = true; return; }
  const canvas = $('#mapa-canvas');
  stage = new MusaStage(canvas, { model: esculturaActual(), interactive: true, idle: false, particles: true, plinth: true, view: VIEWS.tres });
  renderSculpt();
  const dots = $('#mapa-dots');
  dots.innerHTML = ZONES.map((z) => `<button class="mapa-dot" data-zona="${z.id}" aria-label="${esc(z.nombre)}"><i></i><span>${esc(z.nombre)}</span></button>`).join('');
  const dotEls = $$('.mapa-dot', dots);
  stage.on((type, data) => {
    if (type === 'ready') { canvas.classList.add('is-ready'); syncStage(); renderSculpt(); }
    if (type === 'pick') { if (data) selectZone(data, false); }
    if (type === 'hover') { state.hover = data; syncStage(); }
    if (type !== 'frame') return;
    dotEls.forEach((el) => {
      const p = stage.projectZone(el.dataset.zona);
      if (!p) return;
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      el.classList.toggle('is-hidden', !p.visible);
    });
  });
}

/* ---------- Escultura ---------- */

function renderSculpt() {
  const cur = esculturaActual();
  $('#sculpt').innerHTML = ESCULTURAS.map((e) => `<button type="button" data-sculpt="${e.id}" aria-pressed="${e.id === cur}" title="${esc(e.detalle)}">${esc(e.nombre)}</button>`).join('');
  const info = escultura(cur);
  $('#mapa-credit').innerHTML = `Escultura: <a href="${info.url}" target="_blank" rel="noopener">${esc(info.credito)}</a>.`;
}

/* ---------- Eventos ---------- */

function bind() {
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.dataset.zona) { selectZone(state.zona === t.dataset.zona && t.classList.contains('zone-chip') ? null : t.dataset.zona); return; }
    if ('clearZone' in t.dataset) { selectZone(null); return; }
    if (t.dataset.sculpt) {
      if (t.getAttribute('aria-pressed') === 'true') return;
      setEsculturaVisitante(t.dataset.sculpt);
      stage?.setModel(t.dataset.sculpt);
      renderSculpt();
      return;
    }
    if (t.dataset.view) {
      $$('[data-view]').forEach((b) => b.setAttribute('aria-pressed', b === t));
      stage?.setView(VIEWS[t.dataset.view]);
      return;
    }
    if (t.dataset.concernRm) { state.sel.delete(t.dataset.concernRm); renderAll(); return; }
    if ('bookPlan' in t.dataset) {
      const { items, trs, zonas } = planData();
      openBooking({ tratamientos: trs, origen: items.length ? 'mapa' : 'web', plan: items.length ? { zonas, preocupaciones: items.map((i) => i.p.id) } : null });
    }
  });
  document.addEventListener('change', (e) => {
    const c = e.target.closest('[data-concern]');
    if (!c) return;
    if (c.checked) {
      state.sel.add(c.dataset.concern);
      if (state.sim > 60) { state.sim = 0; $('#sim').value = 0; animateSim(); }
    } else state.sel.delete(c.dataset.concern);
    renderAll();
    if (c.checked) toast('Añadido a tu plan. Mueve “Antes / Después” para ver la simulación.');
  });
  $('#sim').addEventListener('input', (e) => { state.sim = Number(e.target.value); applySim(); });
}

// Al marcar la primera preocupación, la simulación arranca en "antes" y se desliza sola hacia "después".
let simRaf;
function animateSim() {
  cancelAnimationFrame(simRaf);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const start = performance.now() + 700;
  const step = (now) => {
    const k = Math.max(0, Math.min(1, (now - start) / 2200));
    state.sim = Math.round(k * 100);
    $('#sim').value = state.sim;
    applySim();
    if (k < 1) simRaf = requestAnimationFrame(step);
  };
  simRaf = requestAnimationFrame(step);
}

initChrome();
initStage();
bind();
const initial = new URLSearchParams(location.search).get('zona');
if (initial && ZONE_GEO[initial]) {
  stage?.ready.then(() => selectZone(initial));
  if (!stage) selectZone(initial);
} else renderAll();
