// Componentes compartidos del sitio y del mapa 3D: cabecera, avisos y el cajón para agendar.

import {
  getState, onChange, addCita, activeSedes, activeTratamientos, tratamiento, sede, doctor, zone, slotsFor,
  whatsappLink, esc, money, iso, today, addDays, fmtDate, CATEGORIES,
} from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Escultura 3D: la que elige quien visita, o la que definió la clínica ---------- */

export function esculturaActual() {
  let v = null;
  try { v = localStorage.getItem('med.escultura'); } catch { /* sin almacenamiento */ }
  return v || getState().settings.escultura || 'david';
}
export function setEsculturaVisitante(id) {
  try { localStorage.setItem('med.escultura', id); } catch { /* sin almacenamiento */ }
}

/* ---------- Tema claro u oscuro ---------- */

export function initTheme() {
  const btn = document.querySelectorAll('[data-theme-toggle]');
  const sync = () => {
    const dark = document.documentElement.dataset.themeResolved === 'dark';
    btn.forEach((b) => {
      b.setAttribute('aria-pressed', dark);
      b.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
      b.title = dark ? 'Tema claro' : 'Tema oscuro';
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0d1422' : '#f7f2ee');
  };
  btn.forEach((b) => b.addEventListener('click', () => {
    const next = document.documentElement.dataset.themeResolved === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('med.theme', next); } catch { /* sin almacenamiento */ }
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.themeResolved = next;
    sync();
  }));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (document.documentElement.dataset.theme !== 'auto') return;
    document.documentElement.dataset.themeResolved = e.matches ? 'dark' : 'light';
    sync();
  });
  sync();
}

export const ICON = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l1.7 5.6a3 3 0 0 0 2 2l5.8 1.9-5.8 1.9a3 3 0 0 0-2 2L12 21.5l-1.7-5.6a3 3 0 0 0-2-2L2.5 12l5.8-1.9a3 3 0 0 0 2-2z"/></svg>',
  cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.6 20.4l1.3-4.3a8.4 8.4 0 1 1 3.2 3.1z"/><path d="M9.2 8.2c-.6 2.6 3 6.3 6.4 6.5l1.1-1.5-2-1.3-1 .8c-.9-.5-1.6-1.2-2.1-2.1l.8-1L11.1 7.7z" fill="currentColor" stroke="none"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.5" width="16" height="15" rx="3"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4"/></svg>',
};

/* ---------- Avisos ---------- */

let toastBox;
export function toast(msg) {
  if (!toastBox) { toastBox = document.createElement('div'); toastBox.className = 'toasts'; toastBox.setAttribute('role', 'status'); document.body.append(toastBox); }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  toastBox.append(el);
  setTimeout(() => el.remove(), 3600);
}

/* ---------- Revelado al hacer scroll ---------- */

let io;
export function observeReveals(root = document) {
  if (!io) {
    io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  }
  $$('[data-reveal]:not(.is-in)', root).forEach((el) => io.observe(el));
}

/* ---------- Cabecera, enlaces y datos del negocio ---------- */

export function applySettings() {
  const s = getState();
  const st = s.settings;
  const years = new Date().getFullYear() - st.desde;
  const sedes = activeSedes();
  const sedesTxt = sedes.map((x) => x.nombre).join(sedes.length > 2 ? ', ' : ' y ').replace(/, ([^,]*)$/, ' y $1');
  $$('[data-years]').forEach((el) => { el.textContent = `hace ${years} años`; });
  $$('[data-years-n]').forEach((el) => { el.textContent = years; });
  $$('[data-sedes-n]').forEach((el) => { el.textContent = sedes.length; });
  $$('[data-sedes-list]').forEach((el) => { el.textContent = sedesTxt; });
  $$('[data-setting]').forEach((el) => { const v = st[el.dataset.setting]; if (v != null) el.textContent = v; });
  $$('[data-wa]').forEach((a) => { a.href = whatsappLink('Hola Medesthetique 🤍 Quisiera agendar una valoración.'); });
  $$('[data-ig]').forEach((a) => { a.href = `https://www.instagram.com/${st.instagram}/`; });
  $$('[data-tt]').forEach((a) => { a.href = `https://www.tiktok.com/@${st.tiktok}`; });
  $$('[data-mail]').forEach((a) => { a.href = `mailto:${st.email}`; });

  const promo = $('#promo');
  if (promo) {
    const c = st.campana;
    let closed = false;
    try { closed = sessionStorage.getItem('med.promo') === c.titulo; } catch { /* sin almacenamiento */ }
    promo.hidden = !c.activa || closed;
    document.documentElement.classList.toggle('has-promo', !promo.hidden);
    $('#promo-title').textContent = c.titulo;
    $('#promo-text').textContent = c.texto;
    const link = $('#promo-link');
    link.textContent = c.cta;
    link.href = c.href || '#regalo';
  }
}

export function initChrome() {
  initTheme();
  const header = $('#site-header');
  const onScroll = () => header?.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = $('#menu-toggle');
  const nav = $('#nav');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open);
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  });
  nav?.addEventListener('click', (e) => {
    if (e.target.closest('a')) { toggle?.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); document.body.classList.remove('menu-open'); }
  });

  $('#promo-close')?.addEventListener('click', () => {
    $('#promo').hidden = true;
    document.documentElement.classList.remove('has-promo');
    try { sessionStorage.setItem('med.promo', getState().settings.campana.titulo); } catch { /* sin almacenamiento */ }
  });

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-book]');
    if (!b) return;
    e.preventDefault();
    const tr = b.dataset.book ? b.dataset.book.split(',').filter(Boolean) : [];
    openBooking({ tratamientos: tr, sede: b.dataset.sede, doctor: b.dataset.doctor });
  });

  applySettings();
  onChange(applySettings);
  if (location.hash === '#agendar-ahora') openBooking();
}

/* ---------- Cajón para agendar ---------- */

const STEPS = ['Qué quieres tratar', 'Sede y médico', 'Fecha y hora', 'Tus datos'];
let bk, els;

function ensureDrawer() {
  if (els) return;
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const d = document.createElement('aside');
  d.className = 'drawer booking';
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-modal', 'true');
  d.setAttribute('aria-labelledby', 'bk-title');
  d.innerHTML = `
    <div class="drawer-head">
      <h2 id="bk-title">Agenda tu valoración</h2>
      <button class="icon-btn" data-bk-close aria-label="Cerrar">${ICON.close}</button>
    </div>
    <div class="bk-progress" aria-hidden="true"><i></i></div>
    <div class="drawer-body" id="bk-body"></div>
    <div class="drawer-foot" id="bk-foot"></div>`;
  document.body.append(scrim, d);
  els = { scrim, d, body: d.querySelector('#bk-body'), foot: d.querySelector('#bk-foot'), bar: d.querySelector('.bk-progress i'), title: d.querySelector('#bk-title') };
  scrim.addEventListener('click', closeBooking);
  d.addEventListener('click', onDrawerClick);
  d.addEventListener('input', onDrawerInput);
  d.addEventListener('change', onDrawerInput);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && d.classList.contains('is-open')) closeBooking(); });
}

export function openBooking(opts = {}) {
  ensureDrawer();
  const sedes = activeSedes();
  bk = {
    step: 1,
    tratamientos: [...new Set((opts.tratamientos || []).filter((id) => tratamiento(id) && id !== 'valoracion'))],
    plan: opts.plan || null,
    origen: opts.origen || 'web',
    sede: opts.sede && sede(opts.sede)?.activa ? opts.sede : sedes.length === 1 ? sedes[0].id : null,
    doctor: opts.doctor || '',
    fecha: null, hora: null,
    nombre: '', telefono: '', primeraVez: true, nota: '', acepto: false,
    cita: null,
  };
  render();
  els.scrim.classList.add('is-open');
  els.d.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => els.d.querySelector('[data-bk-close]').focus(), 60);
}

export function closeBooking() {
  if (!els) return;
  els.scrim.classList.remove('is-open');
  els.d.classList.remove('is-open');
  document.body.style.overflow = '';
}

function canNext() {
  if (bk.step === 2) return !!bk.sede;
  if (bk.step === 3) return !!(bk.fecha && bk.hora);
  if (bk.step === 4) return bk.nombre.trim().length > 2 && bk.telefono.replace(/\D/g, '').length >= 9 && bk.acepto;
  return true;
}

function render() {
  const s = getState();
  const done = !!bk.cita;
  els.title.textContent = done ? '¡Cita reservada!' : STEPS[bk.step - 1];
  els.bar.style.width = done ? '100%' : `${(bk.step / STEPS.length) * 100}%`;
  els.body.innerHTML = done ? viewDone() : [viewTreat, viewSede, viewDate, viewData][bk.step - 1](s);
  els.foot.innerHTML = done
    ? `<button class="btn btn-ghost" data-bk-close>Listo</button>
       <a class="btn btn-wa" style="flex:1" href="${waConfirm()}" target="_blank" rel="noopener">${ICON.wa} Confirmar por WhatsApp</a>`
    : `${bk.step > 1 ? `<button class="btn btn-ghost" data-bk-back>${ICON.back} Atrás</button>` : `<span class="note bk-stepn">Paso 1 de ${STEPS.length}</span>`}
       <button class="btn btn-primary" style="margin-left:auto" data-bk-next ${canNext() ? '' : 'disabled'}>
         ${bk.step === STEPS.length ? 'Reservar cita' : 'Continuar'} ${ICON.arrow}</button>`;
  if (bk.step === 3 && !done) els.body.querySelector('.bk-day[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
}

function viewTreat() {
  const list = activeTratamientos();
  const sel = bk.tratamientos;
  const planHtml = bk.plan ? `
    <div class="bk-plan">
      <p class="bk-label">${ICON.cube} Tu plan desde el mapa 3D</p>
      <ul>${bk.plan.preocupaciones.map((pid) => {
        const z = bk.plan.zonas.map(zone).find((zz) => zz?.preocupaciones.some((p) => p.id === pid));
        const p = z?.preocupaciones.find((pp) => pp.id === pid);
        return p ? `<li><b>${esc(z.nombre)}:</b> ${esc(p.texto)}</li>` : '';
      }).join('')}</ul>
    </div>` : '';
  const destacados = list.filter((x) => x.destacado && x.id !== 'valoracion');
  return `
    <p class="bk-intro">Tu cita empieza con una <b>valoración médica</b>. Si ya sabes qué te interesa, márcalo y tu médico lo tendrá en cuenta.</p>
    ${planHtml}
    <p class="bk-label">Seleccionados</p>
    <div class="bk-selected">
      <span class="chip chip-navy">${ICON.check} Valoración médica</span>
      ${sel.map((id) => `<button class="chip chip-powder" data-bk-rm="${id}" aria-label="Quitar ${esc(tratamiento(id).nombre)}">${esc(tratamiento(id).nombre)} ${ICON.close}</button>`).join('')}
    </div>
    <p class="bk-label">Los más pedidos</p>
    <div class="bk-options">
      ${destacados.map((x) => `<button class="bk-opt" data-bk-toggle="${x.id}" aria-pressed="${sel.includes(x.id)}">
        <b>${esc(x.nombre)}</b><small>${x.precio != null ? 'Desde ' + money(x.precio) : 'Precio en valoración'}</small></button>`).join('')}
    </div>
    <label class="field bk-more"><span>Otro tratamiento</span>
      <select class="select" data-bk-add>
        <option value="">Elegir…</option>
        ${CATEGORIES.map((c) => `<optgroup label="${esc(c.nombre)}">${list.filter((x) => x.cat === c.id && x.id !== 'valoracion').map((x) => `<option value="${x.id}">${esc(x.nombre)}</option>`).join('')}</optgroup>`).join('')}
      </select>
    </label>`;
}

function viewSede(s) {
  const docs = s.doctores.filter((d) => d.activo);
  return `
    <p class="bk-label">Sede</p>
    <div class="bk-sedes">
      ${activeSedes().map((x) => `<button class="bk-sede" data-bk-sede="${x.id}" aria-pressed="${bk.sede === x.id}">
        <span class="bk-sede-icon">${ICON.pin}</span><span><b>${esc(x.nombre)}</b><small>${esc(x.direccion)}</small></span></button>`).join('')}
    </div>
    <p class="bk-label">Médico</p>
    <div class="bk-docs">
      <button class="bk-doc" data-bk-doc="" aria-pressed="${!bk.doctor}"><span class="avatar avatar-sm">${ICON.user}</span><b>Sin preferencia</b></button>
      ${docs.map((d) => `<button class="bk-doc" data-bk-doc="${d.id}" aria-pressed="${bk.doctor === d.id}"><span class="avatar avatar-sm">${esc(d.iniciales)}</span><b>${esc(d.corto)}</b></button>`).join('')}
    </div>`;
}

function viewDate() {
  const days = [];
  for (let i = 0, d = today(); days.length < 18 && i < 30; i++, d = addDays(d, 1)) {
    if (d.getDay() === 0) continue;
    const f = iso(d);
    const free = slotsFor(bk.sede, f).filter((x) => x.libre).length;
    days.push({ f, d, free });
  }
  if (!bk.fecha) bk.fecha = days.find((x) => x.free > 0)?.f || null;
  const slots = bk.fecha ? slotsFor(bk.sede, bk.fecha) : [];
  const groups = [['Mañana', (h) => h < '12:00'], ['Tarde', (h) => h >= '12:00' && h < '17:00'], ['Noche', (h) => h >= '17:00']];
  return `
    <p class="bk-label">${esc(sede(bk.sede).nombre)} · elige el día</p>
    <div class="bk-days" role="listbox" aria-label="Días disponibles">
      ${days.map(({ f, d, free }) => `<button class="bk-day" data-bk-day="${f}" aria-pressed="${bk.fecha === f}" ${free ? '' : 'disabled'}>
        <small>${d.toLocaleDateString('es-EC', { weekday: 'short' })}</small><b>${d.getDate()}</b><small>${d.toLocaleDateString('es-EC', { month: 'short' })}</small></button>`).join('')}
    </div>
    ${bk.fecha ? `<p class="bk-label">Horarios del ${fmtDate(bk.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    ${groups.map(([name, fn]) => {
      const g = slots.filter((x) => fn(x.hora));
      return g.length ? `<div class="bk-slot-group"><span>${name}</span><div class="bk-slots">${g.map((x) => `<button class="bk-slot" data-bk-hora="${x.hora}" aria-pressed="${bk.hora === x.hora}" ${x.libre ? '' : 'disabled'}>${x.hora}</button>`).join('')}</div></div>` : '';
    }).join('')}` : '<p class="note">No hay horarios libres en los próximos días. Escríbenos por WhatsApp.</p>'}
    <p class="note">Las citas duran unos 30 minutos para la valoración. Te confirmamos por WhatsApp.</p>`;
}

function viewData() {
  return `
    <div class="bk-summary">${summaryHtml()}</div>
    <div class="form-grid">
      <label class="field full"><span>Nombre y apellido</span><input class="input" data-bk-f="nombre" value="${esc(bk.nombre)}" autocomplete="name" required></label>
      <label class="field full"><span>WhatsApp</span><input class="input" data-bk-f="telefono" value="${esc(bk.telefono)}" inputmode="tel" autocomplete="tel" placeholder="09…" required></label>
      <div class="field full"><span>¿Es tu primera vez en Medesthetique?</span>
        <div class="seg"><button type="button" data-bk-first="1" aria-pressed="${bk.primeraVez}">Sí</button><button type="button" data-bk-first="0" aria-pressed="${!bk.primeraVez}">Ya soy paciente</button></div>
      </div>
      <label class="field full"><span>¿Algo que tu médico deba saber? (opcional)</span><textarea class="textarea" data-bk-f="nota" placeholder="Por ejemplo: tomo omega 3, tengo un evento en diciembre…">${esc(bk.nota)}</textarea></label>
      <label class="check full"><input type="checkbox" data-bk-f="acepto" ${bk.acepto ? 'checked' : ''}> Acepto que Medesthetique me escriba por WhatsApp para confirmar mi cita.</label>
    </div>`;
}

function summaryHtml() {
  const doc = bk.doctor ? doctor(bk.doctor).corto : 'Sin preferencia de médico';
  const trs = ['Valoración médica', ...bk.tratamientos.map((id) => tratamiento(id).nombre)];
  return `
    <div><span>${ICON.cal}</span><p><b>${fmtDate(bk.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}</b> · ${bk.hora}</p></div>
    <div><span>${ICON.pin}</span><p><b>${esc(sede(bk.sede).nombre)}</b> · ${esc(doc)}</p></div>
    <div><span>${ICON.spark}</span><p>${trs.map(esc).join(', ')}</p></div>`;
}

function viewDone() {
  const c = bk.cita;
  return `
    <div class="bk-done">
      <div class="bk-done-mark">${ICON.check}</div>
      <p class="bk-code">Código <b>${esc(c.codigo)}</b></p>
      <p>Gracias, ${esc(c.nombre.split(' ')[0])}. Tu cita quedó registrada y la verás confirmada por WhatsApp.</p>
    </div>
    <div class="bk-summary">${summaryHtml()}</div>
    <button class="btn btn-soft btn-block" data-bk-ics>${ICON.cal} Añadir a mi calendario</button>
    <div class="bk-tips">
      <p class="bk-label">Antes de tu cita</p>
      <ul>
        <li>Llega con el rostro limpio, sin maquillaje si es posible.</li>
        <li>Si tomas omega 3, vitamina E, ginkgo o anticoagulantes, cuéntaselo a tu médico.</li>
        <li>Trae tus preguntas: la valoración es para resolverlas.</li>
      </ul>
    </div>`;
}

function waConfirm() {
  const c = bk.cita;
  const doc = c.doctor ? doctor(c.doctor).corto : 'Sin preferencia';
  const trs = c.tratamientos.map((id) => tratamiento(id)?.nombre).join(', ');
  return whatsappLink([
    'Hola Medesthetique 🤍 Acabo de agendar en la web.',
    `Código: ${c.codigo}`,
    `Nombre: ${c.nombre}`,
    `Sede: ${sede(c.sede).nombre}`,
    `Fecha: ${fmtDate(c.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}, ${c.hora}`,
    `Médico: ${doc}`,
    `Motivo: ${trs}`,
    c.plan ? `Zonas del mapa 3D: ${c.plan.zonas.map((z) => zone(z)?.nombre).join(', ')}` : '',
    c.nota ? `Nota: ${c.nota}` : '',
  ].filter(Boolean).join('\n'));
}

function downloadIcs() {
  const c = bk.cita;
  const [y, m, d] = c.fecha.split('-');
  const [hh, mm] = c.hora.split(':').map(Number);
  const end = hh * 60 + mm + 30;
  const dt = (h, mi) => `${y}${m}${d}T${String(h).padStart(2, '0')}${String(mi).padStart(2, '0')}00`;
  const se = sede(c.sede);
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Medesthetique//Citas//ES', 'BEGIN:VEVENT',
    `UID:${c.codigo}@medesthetique.com.ec`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${dt(hh, mm)}`, `DTEND:${dt(Math.floor(end / 60), end % 60)}`,
    `SUMMARY:Medesthetique · ${c.tratamientos.map((id) => tratamiento(id)?.nombre).join(', ')}`,
    `LOCATION:${se.direccion.replace(/,/g, '\\,')}`, `DESCRIPTION:Código ${c.codigo}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `medesthetique-${c.codigo}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function onDrawerClick(e) {
  const t = e.target.closest('button, a');
  if (!t) return;
  const ds = t.dataset;
  if ('bkClose' in ds) return closeBooking();
  if ('bkBack' in ds) { bk.step--; return render(); }
  if ('bkNext' in ds) {
    if (!canNext()) return;
    if (bk.step < STEPS.length) { bk.step++; return render(); }
    const free = slotsFor(bk.sede, bk.fecha).find((x) => x.hora === bk.hora)?.libre;
    if (!free) { toast('Ese horario se acaba de ocupar. Elige otro, por favor.'); bk.step = 3; bk.hora = null; return render(); }
    bk.cita = addCita({
      nombre: bk.nombre.trim(), telefono: bk.telefono.trim(), sede: bk.sede, doctor: bk.doctor,
      fecha: bk.fecha, hora: bk.hora, tratamientos: ['valoracion', ...bk.tratamientos],
      primeraVez: bk.primeraVez, nota: bk.nota.trim(), plan: bk.plan, origen: bk.origen,
    });
    return render();
  }
  if ('bkIcs' in ds) return downloadIcs();
  if (ds.bkToggle) {
    const id = ds.bkToggle;
    bk.tratamientos = bk.tratamientos.includes(id) ? bk.tratamientos.filter((x) => x !== id) : [...bk.tratamientos, id];
    return render();
  }
  if (ds.bkRm) { bk.tratamientos = bk.tratamientos.filter((x) => x !== ds.bkRm); return render(); }
  if (ds.bkSede) { if (bk.sede !== ds.bkSede) { bk.fecha = null; bk.hora = null; } bk.sede = ds.bkSede; return render(); }
  if (ds.bkDoc != null) { bk.doctor = ds.bkDoc; return render(); }
  if (ds.bkDay) { bk.fecha = ds.bkDay; bk.hora = null; return render(); }
  if (ds.bkHora) { bk.hora = ds.bkHora; return render(); }
  if (ds.bkFirst) { bk.primeraVez = ds.bkFirst === '1'; return render(); }
}

function onDrawerInput(e) {
  const t = e.target;
  if (t.matches('[data-bk-add]') && t.value) {
    if (!bk.tratamientos.includes(t.value)) bk.tratamientos.push(t.value);
    return render();
  }
  const f = t.dataset.bkF;
  if (!f) return;
  bk[f] = t.type === 'checkbox' ? t.checked : t.value;
  const next = els.foot.querySelector('[data-bk-next]');
  if (next) next.disabled = !canNext();
}
