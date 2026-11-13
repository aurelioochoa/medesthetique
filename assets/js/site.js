// Sitio público: portada con la escultura 3D, recorrido por zonas con scroll, catálogo, etapas, tecnología,
// equipo, testimonios, mitos, gift cards y sedes.

import {
  getState, onChange, CATEGORIES, TECH, ETAPAS, MITOS, TESTIMONIOS, activeSedes, activeTratamientos, tratamiento,
  addGift, whatsappLink, esc, money,
} from './data.js';
import { initChrome, observeReveals, toast, openBooking, ICON, esculturaActual, setEsculturaVisitante } from './ui.js';
import { MusaStage, webglAvailable, ESCULTURAS, escultura } from './face3d.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const has3D = webglAvailable();
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (a, b, v) => { const x = clamp01((v - a) / (b - a)); return x * x * (3 - 2 * x); };

/* ---------- Catálogo ---------- */

let activeCat = 'facial';
let query = '';
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function renderTabs() {
  const list = activeTratamientos().filter((x) => x.id !== 'valoracion');
  $('#cat-tabs').innerHTML = CATEGORIES.map((c) => {
    const n = list.filter((x) => x.cat === c.id).length;
    return `<button role="tab" aria-selected="${c.id === activeCat && !query}" data-cat="${c.id}">${esc(c.nombre)}<span>${n}</span></button>`;
  }).join('');
}

function treatCard(x, i) {
  const meta = [
    x.dur ? `<span>${ICON.clock}${x.dur} min</span>` : '',
    x.sesiones ? `<span>${esc(x.sesiones)}</span>` : '',
    x.recup ? `<span>${esc(x.recup)}</span>` : '',
  ].join('');
  const cat = CATEGORIES.find((c) => c.id === x.cat)?.nombre;
  return `
    <article class="treat ${x.destacado ? 'is-featured' : ''}" data-reveal style="--i:${i % 3}">
      <div class="treat-top">
        <span class="treat-cat">${esc(cat)}</span>
        ${x.tech === 'ultraclear' ? '<span class="tag">Únicos en Ecuador</span>' : x.destacado ? '<span class="tag">Más pedido</span>' : ''}
      </div>
      <h3>${esc(x.nombre)}${x.alias ? ` <small>(${esc(x.alias)})</small>` : ''}</h3>
      <p>${esc(x.desc)}</p>
      ${x.efecto ? `<p class="treat-effect">${ICON.spark}${esc(x.efecto)}</p>` : ''}
      <div class="treat-meta">${meta}</div>
      <div class="treat-foot">
        <div class="treat-price">${x.precio != null ? `<small>Desde</small><b class="num">${money(x.precio)}</b>` : '<b class="treat-tbd">Precio en valoración</b>'}</div>
        <div class="treat-actions">
          ${x.zonas?.length ? `<a class="btn btn-soft btn-xs" href="mapa.html?zona=${x.zonas[0]}" aria-label="Ver ${esc(x.nombre)} en el mapa 3D">${ICON.cube} 3D</a>` : ''}
          <button class="btn btn-primary btn-xs" data-book="${x.id}">Agendar</button>
        </div>
      </div>
    </article>`;
}

function renderTreatments() {
  const list = activeTratamientos().filter((x) => x.id !== 'valoracion');
  const q = norm(query.trim());
  const shown = q
    ? list.filter((x) => norm(`${x.nombre} ${x.alias || ''} ${x.desc} ${(x.zonas || []).join(' ')}`).includes(q) || (q.includes('botox') && x.id === 'toxina'))
    : list.filter((x) => x.cat === activeCat);
  $('#treatments').innerHTML = shown.map(treatCard).join('')
    || `<p class="empty">No encontramos “${esc(query)}”. <button class="link" data-book>Cuéntanos en tu valoración</button></p>`;
  observeReveals($('#treatments'));
}

/* ---------- Etapas ---------- */

let etapa = '40';
function renderEtapas() {
  $('#etapas-seg').innerHTML = ETAPAS.map((e) => `<button role="tab" aria-selected="${e.id === etapa}" data-etapa="${e.id}">${e.nombre}</button>`).join('');
  const e = ETAPAS.find((x) => x.id === etapa);
  const trs = e.tratamientos.map(tratamiento).filter((x) => x?.activo);
  const R = 52, C = 2 * Math.PI * R;
  $('#etapa-card').innerHTML = `
    <div class="etapa-meter" aria-label="Colágeno aproximado: ${e.colageno}%">
      <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${R}" class="track"/><circle cx="60" cy="60" r="${R}" class="fill" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - e.colageno / 100)}"/></svg>
      <div><b class="num">${e.colageno}%</b><span>colágeno de referencia</span></div>
    </div>
    <div class="etapa-body">
      <span class="etapa-age">${e.nombre}</span>
      <h3 class="display">${esc(e.titulo)}</h3>
      <p>${esc(e.texto)}</p>
      <ul class="etapa-list">${trs.map((x) => `<li><span>${esc(x.nombre)}</span><button class="btn btn-soft btn-xs" data-book="${x.id}">Agendar</button></li>`).join('')}</ul>
    </div>`;
}

/* ---------- Tecnología, equipo, testimonios, mitos, sedes ---------- */

function renderTech() {
  $('#tech-rail').innerHTML = TECH.map((x, i) => {
    const tr = getState().tratamientos.find((t) => t.tech === x.id || t.id === x.id);
    return `
    <article class="tech-card" style="--h:${(i * 37) % 360}">
      <div class="tech-orb" aria-hidden="true"><i></i><i></i><i></i></div>
      <span class="tag">${esc(x.claim)}</span>
      <h3 class="display">${esc(x.nombre)}</h3>
      <p class="tech-type">${esc(x.tipo)}</p>
      <p>${esc(x.texto)}</p>
      <div class="tech-tags">${x.tags.map((g) => `<span class="chip">${esc(g)}</span>`).join('')}</div>
      ${tr ? `<button class="btn btn-ghost btn-sm" data-book="${tr.id}">Agendar ${esc(x.nombre)}</button>` : ''}
    </article>`;
  }).join('');
}

function renderTeam() {
  const s = getState();
  $('#team').innerHTML = s.doctores.filter((d) => d.activo).map((d, i) => `
    <article class="doc" data-reveal style="--i:${i}">
      <div class="doc-portrait"><span>${esc(d.iniciales)}</span></div>
      <div class="doc-body">
        <h3>${esc(d.nombre)}</h3>
        <p class="doc-role">${esc(d.rol)}</p>
        <p>${esc(d.bio)}</p>
        <div class="doc-actions">
          <button class="btn btn-soft btn-sm" data-book data-doctor="${d.id}">Agendar con ${esc(d.corto)}</button>
          ${d.instagram ? `<a class="link" href="https://www.instagram.com/${esc(d.instagram)}/" target="_blank" rel="noopener">@${esc(d.instagram)}</a>` : ''}
        </div>
      </div>
    </article>`).join('');
}

function renderQuotes() {
  $('#quotes').innerHTML = TESTIMONIOS.map((q, i) => `
    <figure class="quote" data-reveal style="--i:${i}">
      <blockquote>${esc(q.texto)}</blockquote>
      <figcaption><span class="avatar">${esc(q.quien.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span>
        <span><b>${esc(q.quien)}</b><small>${esc(q.tratamiento)} · <a href="${q.url}" target="_blank" rel="noopener">verlo en Instagram</a></small></span></figcaption>
    </figure>`).join('');
  $('#faq').innerHTML = MITOS.map((m, i) => `
    <details ${i === 0 ? 'open' : ''}><summary>${esc(m.q)}<i aria-hidden="true"></i></summary><p>${esc(m.a)}</p></details>`).join('');
}

function renderSedes() {
  const sedes = activeSedes();
  $('#sedes-grid').innerHTML = sedes.map((x, i) => `
    <article class="sede" data-reveal style="--i:${i}">
      <div class="sede-map" aria-hidden="true"><i></i><b>${ICON.pin}</b></div>
      <h3 class="display">${esc(x.nombre)}</h3>
      <p>${esc(x.direccion)}</p>
      <dl><div><dt>Lunes a viernes</dt><dd>${x.horario.lv.join(' – ')}</dd></div><div><dt>Sábados</dt><dd>${x.horario.sab.join(' – ')}</dd></div></dl>
      <div class="sede-actions">
        <button class="btn btn-primary btn-sm" data-book data-sede="${x.id}">Agendar aquí</button>
        <a class="btn btn-ghost btn-sm" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.mapa)}" target="_blank" rel="noopener">Cómo llegar</a>
      </div>
    </article>`).join('');
  $('#sedes-grid').style.setProperty('--cols', Math.min(sedes.length, 3));
}

/* ---------- Gift card ---------- */

const gift = { tipo: 'monto', monto: 150, tratamiento: 'limpieza' };
const AMOUNTS = [70, 150, 320, 500];

function renderGift() {
  const trs = activeTratamientos().filter((x) => x.precio != null && x.id !== 'valoracion');
  $('#gift-amounts').hidden = gift.tipo !== 'monto';
  $('#gift-treat-field').hidden = gift.tipo !== 'tratamiento';
  $('#gift-amounts').innerHTML = AMOUNTS.map((a) => `<button type="button" class="gift-amount" data-gamount="${a}" aria-pressed="${gift.monto === a}">${money(a)}</button>`).join('');
  const sel = $('#gift-treat');
  if (!sel.options.length) sel.innerHTML = trs.map((x) => `<option value="${x.id}">${esc(x.nombre)} · ${money(x.precio)}</option>`).join('');
  sel.value = gift.tratamiento;
  $$('[data-gtype]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.gtype === gift.tipo));
  updateGiftPreview();
}

function updateGiftPreview() {
  const f = $('#gift-form');
  const tr = tratamiento(gift.tratamiento);
  $('#gc-amount').textContent = gift.tipo === 'monto' ? money(gift.monto) : money(tr?.precio);
  $('#gc-what').textContent = gift.tipo === 'monto' ? 'Para el tratamiento que elija' : tr?.nombre || '';
  $('#gc-para').textContent = f.para.value.trim() || 'ti';
  $('#gc-de').textContent = f.de.value.trim() || 'alguien que te quiere';
  $('#gc-msg').textContent = f.mensaje.value.trim() ? `“${f.mensaje.value.trim()}”` : '';
}

function bindGift() {
  const f = $('#gift-form');
  f.addEventListener('click', (e) => {
    const t = e.target.closest('[data-gtype],[data-gamount]');
    if (!t) return;
    if (t.dataset.gtype) gift.tipo = t.dataset.gtype;
    if (t.dataset.gamount) gift.monto = Number(t.dataset.gamount);
    renderGift();
  });
  f.addEventListener('input', (e) => {
    if (e.target.id === 'gift-treat') gift.tratamiento = e.target.value;
    updateGiftPreview();
  });
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    if (f.telefono.value.replace(/\D/g, '').length < 9) { toast('Revisa tu número de WhatsApp.'); f.telefono.focus(); return; }
    const tr = tratamiento(gift.tratamiento);
    const g = addGift({
      tipo: gift.tipo, monto: gift.tipo === 'monto' ? gift.monto : tr.precio, tratamiento: gift.tipo === 'tratamiento' ? tr.id : null,
      de: f.de.value.trim(), para: f.para.value.trim(), mensaje: f.mensaje.value.trim(), telefono: f.telefono.value.trim(),
    });
    const what = g.tipo === 'monto' ? `por ${money(g.monto)}` : `para ${tr.nombre} (${money(g.monto)})`;
    toast(`Gift card ${g.codigo} creada. Te llevamos a WhatsApp para coordinar el pago.`);
    window.open(whatsappLink(`Hola Medesthetique 🎁 Quiero una gift card ${what}.\nCódigo: ${g.codigo}\nPara: ${g.para}\nDe: ${g.de}${g.mensaje ? `\nMensaje: ${g.mensaje}` : ''}`), '_blank', 'noopener');
    f.reset();
    updateGiftPreview();
  });
  // Inclinación de la tarjeta hacia el puntero
  const card = $('#giftcard');
  if (!reduced) {
    card.parentElement.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--rx', `${-y * 14}deg`);
      card.style.setProperty('--ry', `${x * 18}deg`);
      card.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
    });
    card.parentElement.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  }
}

/* ---------- 3D: portada ---------- */

const HERO_SPOTS = [
  { zona: 'frente', titulo: 'Toxina botulínica', sub: '20 min · sin incapacidad', side: 'l' },
  { zona: 'labios', titulo: 'Ácido hialurónico', sub: 'Natural, en tu proporción', side: 'l' },
  { zona: 'mandibula', titulo: 'Liftera', sub: 'Contorno sin agujas', side: 'r' },
];

const stages = [];

function initHero() {
  const canvas = $('#hero-canvas');
  if (!has3D) { document.body.classList.add('no-3d'); $('#sculpt-switch').hidden = true; return; }
  const stage = new MusaStage(canvas, { model: esculturaActual(), follow: !reduced, idle: true, view: { az: 0.55, el: 0.04, dist: 10, t: [0.2, -0.5, 0] } });
  stages.push(stage);
  const box = $('#hero-hotspots');
  box.innerHTML = HERO_SPOTS.map((h, i) => `<div class="hotspot hs-${h.side}" style="--d:${0.9 + i * 0.25}s"><i></i><span><b>${h.titulo}</b><small>${h.sub}</small></span></div>`).join('');
  const spots = $$('.hotspot', box);
  let first = true;
  const fit = (instant) => {
    const wide = innerWidth > 980;
    stage.setView(wide ? stage.fullView({ az: 0.55, shiftX: 0.2, pad: 1.12, shiftY: 0.12 }) : stage.fullView({ az: 0.45, pad: 1.04 }), instant);
  };
  addEventListener('resize', () => requestAnimationFrame(() => fit(true)));
  stage.on((type) => {
    if (type === 'loading') box.classList.add('is-loading');
    if (type === 'ready') {
      canvas.classList.add('is-ready');
      box.classList.remove('is-loading');
      fit(first);
      first = false;
      stage.setZones({ frente: 0.55, labios: 0.55, mandibula: 0.55 });
    }
    if (type !== 'frame') return;
    HERO_SPOTS.forEach((h, i) => {
      const p = stage.projectZone(h.zona, h.which || 0);
      if (!p) return;
      spots[i].style.transform = `translate(${p.x}px, ${p.y}px)`;
      spots[i].classList.toggle('is-hidden', !p.visible);
    });
  });
  // La portada se aleja suavemente con el scroll
  addEventListener('scroll', () => {
    const k = clamp01(scrollY / innerHeight);
    stage.root.rotation.x = k * 0.25;
    canvas.style.opacity = String(1 - k * 0.7);
  }, { passive: true });
  renderSculptSwitch();
}

// Selector de escultura: cambia la portada y el recorrido; la elección se recuerda en este navegador.
function renderSculptSwitch() {
  const box = $('#sculpt-switch');
  const cur = esculturaActual();
  box.innerHTML = `<span>Escultura</span>${ESCULTURAS.map((e) => `<button type="button" data-sculpt="${e.id}" aria-pressed="${e.id === cur}" title="${esc(e.nombre)} · ${esc(e.detalle)}">${esc(e.nombre)}</button>`).join('')}`;
}

function bindSculptSwitch() {
  $('#sculpt-switch').addEventListener('click', (e) => {
    const b = e.target.closest('[data-sculpt]');
    if (!b || b.getAttribute('aria-pressed') === 'true') return;
    setEsculturaVisitante(b.dataset.sculpt);
    stages.forEach((st) => st.setModel(b.dataset.sculpt));
    renderSculptSwitch();
    renderCredits();
  });
}

function renderCredits() {
  const cur = escultura(esculturaActual());
  $('#credits').innerHTML = `Escultura 3D: <a href="${cur.url}" target="_blank" rel="noopener">${esc(cur.credito)}</a>.`;
}

/* ---------- 3D: recorrido zona por zona ---------- */

const STORY = [
  { n: '01', titulo: 'Frente y mirada', zonas: ['frente', 'entrecejo', 'patas-gallo'], trats: ['toxina'],
    texto: 'Las líneas que hoy aparecen al gesticular mañana se quedan en reposo. La toxina botulínica relaja el músculo lo justo: sin efecto congelado.',
    view: { az: 0.42, el: 0.1, dist: 3.9, t: [0.05, 0.15, 0.35] }, before: { lines: 1, spots: 0.2, age: 0.25 } },
  { n: '02', titulo: 'Pómulos y ojeras', zonas: ['pomulos', 'ojeras', 'surcos'], trats: ['hialuronico', 'bioestimuladores'],
    texto: 'Cuando el pómulo pierde soporte, la mirada se cansa y el surco se marca. Antes de rellenar, devolvemos estructura.',
    view: { az: 0.75, el: 0.02, dist: 3.8, t: [0.05, -0.2, 0.35] }, before: { lines: 0.5, spots: 0.2, age: 1 } },
  { n: '03', titulo: 'Nariz y labios', zonas: ['nariz', 'labios'], trats: ['hialuronico'],
    texto: 'Rinomodelación sin cirugía y labios con definición e hidratación, siempre en la proporción de tu rostro.',
    view: { az: 1.05, el: 0, dist: 3.5, t: [0, -0.3, 0.45] }, before: { lines: 0.3, spots: 0.1, age: 0.9 } },
  { n: '04', titulo: 'Mentón y contorno', zonas: ['menton', 'mandibula'], trats: ['liftera', 'alteon', 'hialuronico'],
    texto: 'Un mentón bien proyectado define la mandíbula y el cuello. Liftera y Alteon tensan el contorno sin agujas.',
    view: { az: 1.2, el: -0.06, dist: 4.4, t: [0.05, -0.6, 0.2] }, before: { lines: 0.3, spots: 0.1, age: 1 } },
  { n: '05', titulo: 'Cuello y papada', zonas: ['papada', 'cuello'], trats: ['liftera', 'enzimas-facial', 'bioestimuladores'],
    texto: 'Tu cara puede verse increíble, pero el cuello te delata. Firmeza, líneas y papada también se tratan.',
    view: { az: 0.85, el: -0.18, dist: 4.6, t: [0, -0.95, 0.15] }, before: { lines: 1, spots: 0, age: 1 } },
  { n: '06', titulo: 'Calidad de piel', zonas: [], trats: ['ultraclear', 'bioremodeladores', 'peptidos'],
    texto: 'Manchas, poros y textura: Ultraclear, que solo tenemos nosotros en Ecuador, skinboosters y péptidos que regeneran desde adentro.',
    view: { az: 0.3, el: 0.04, dist: 4.4, t: [0, -0.1, 0.3] }, before: { lines: 0.4, spots: 1, age: 0.3 } },
];

function renderStory() {
  $('#story-steps').innerHTML = STORY.map((s, i) => `
    <article class="story-step ${i === 0 ? 'is-active' : ''}" data-step="${i}">
      <span class="story-n num">${s.n}</span>
      <h2 class="display">${esc(s.titulo)}</h2>
      <p>${esc(s.texto)}</p>
      <div class="story-trats">${s.trats.map(tratamiento).filter((x) => x?.activo).map((x) => `<button class="chip chip-powder" data-book="${x.id}">${esc(x.nombre)}</button>`).join('')}</div>
      ${i === STORY.length - 1 ? `<a class="btn btn-primary btn-sm" href="mapa.html">${ICON.cube} Explora tu rostro en 3D</a>` : ''}
    </article>`).join('');
  $('#story-dots').innerHTML = STORY.map(() => '<i></i>').join('');
}

function initStory() {
  renderStory();
  const section = $('#zona-por-zona');
  if (!has3D || reduced) { section.classList.add('is-static'); return; }
  section.style.setProperty('--steps', STORY.length);
  const stage = new MusaStage($('#story-canvas'), { model: esculturaActual(), idle: false, particles: false, halo: true, plinth: false, view: STORY[0].view });
  stages.push(stage);
  const steps = $$('.story-step'), dots = $$('#story-dots i'), bar = $('#story-bar');
  let current = -1;
  const onScroll = () => {
    const r = section.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = clamp01(-r.top / total) * STORY.length;
    const i = Math.min(STORY.length - 1, Math.floor(p));
    const local = p - i;
    if (i !== current) {
      current = i;
      steps.forEach((el, k) => el.classList.toggle('is-active', k === i));
      dots.forEach((el, k) => el.classList.toggle('is-active', k <= i));
      stage.setView(STORY[i].view);
      stage.setZones(Object.fromEntries(STORY[i].zonas.map((z) => [z, 0.75])));
    }
    const k = smooth(0.18, 0.78, local);
    const b = STORY[i].before;
    stage.setSkin({ lines: b.lines * (1 - k), spots: b.spots * (1 - k), age: b.age * (1 - k) });
    bar.style.transform = `scaleX(${k})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  stage.ready.then(() => { $('#story-canvas').classList.add('is-ready'); onScroll(); });
}

/* ---------- Eventos ---------- */

function bind() {
  $('#cat-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    activeCat = b.dataset.cat;
    query = '';
    $('#cat-search').value = '';
    renderTabs();
    renderTreatments();
  });
  $('#cat-search').addEventListener('input', (e) => { query = e.target.value; renderTabs(); renderTreatments(); });
  $('#etapas-seg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-etapa]');
    if (b) { etapa = b.dataset.etapa; renderEtapas(); }
  });
  $$('[data-rail]').forEach((b) => b.addEventListener('click', () => {
    const rail = $('#tech-rail');
    rail.scrollBy({ left: Number(b.dataset.rail) * Math.min(rail.clientWidth * 0.8, 420), behavior: reduced ? 'auto' : 'smooth' });
  }));
  bindGift();
}

function renderAll() {
  renderTabs(); renderTreatments(); renderEtapas(); renderTech(); renderTeam(); renderQuotes(); renderSedes(); renderGift();
  observeReveals();
}

initChrome();
renderAll();
bind();
bindSculptSwitch();
renderCredits();
onChange(() => { renderAll(); });
initHero();
initStory();
document.documentElement.classList.add('is-loaded');
if (location.hash === '#agendar-valoracion') openBooking();
