// Panel de la clínica: resumen, agenda por sede, pacientes con ficha y mapa 3D de zonas tratadas,
// seguimiento de controles y retoques, tratamientos y precios, gift cards y ajustes.
// Comparte el estado con el sitio: lo que se cambia aquí se ve al instante en la web.

import {
  getState, update, onChange, resetDemo, CATEGORIES, ZONES, ESTADOS, ORIGENES, tratamiento, sede, doctor, zone,
  activeSedes, slotsFor, addCita, seguimiento, mensajeSeguimiento, esc, money, iso, today, addDays, parseISO, fmtDate, daysBetween,
} from './data.js';
import { MusaStage, webglAvailable, ESCULTURAS } from './face3d.js';
import { initTheme } from './ui.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-6.5 8 6.5V20H4z"/><path d="M10 20v-5h4v5"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.5" width="16" height="15" rx="3"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="9" cy="8.5" r="3.5"/><path d="M2.8 19.5c1.2-3.2 3.5-4.8 6.2-4.8s5 1.6 6.2 4.8"/><path d="M15.5 5.2a3.4 3.4 0 0 1 0 6.6M17.6 14.9c1.6.6 2.8 2.1 3.6 4.6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3.5-6-4-6-1.5S10 8 12 8zm0 0c1.5-3.5 6-4 6-1.5S14 8 12 8z"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.6 20.4l1.3-4.3a8.4 8.4 0 1 1 3.2 3.1z"/><path d="M9.2 8.2c-.6 2.6 3 6.3 6.4 6.5l1.1-1.5-2-1.3-1 .8c-.9-.5-1.6-1.2-2.1-2.1l.8-1L11.1 7.7z" fill="currentColor" stroke="none"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.2v.1"/></svg>',
};

const NAV = [
  { id: 'resumen', nombre: 'Resumen', icon: I.home, sub: () => fmtDate(iso(today()), { weekday: 'long', day: 'numeric', month: 'long' }) },
  { id: 'agenda', nombre: 'Agenda', icon: I.cal, count: () => getState().citas.filter((c) => c.estado === 'pendiente' && c.fecha >= iso(today())).length, sub: () => 'Citas por sede y horario' },
  { id: 'pacientes', nombre: 'Pacientes', icon: I.users, sub: () => `${getState().pacientes.length} fichas` },
  { id: 'seguimiento', nombre: 'Seguimiento', icon: I.bell, count: () => seguimiento().filter((x) => !x.contactado && !x.proxima).length, sub: () => 'Controles y retoques que tocan esta semana' },
  { id: 'tratamientos', nombre: 'Tratamientos y precios', icon: I.tag, sub: () => 'Lo que cambies aquí se ve al instante en el sitio' },
  { id: 'giftcards', nombre: 'Gift cards', icon: I.gift, count: () => getState().giftcards.filter((g) => g.estado === 'por-pagar').length, sub: () => 'Pedidos desde la web' },
  { id: 'ajustes', nombre: 'Ajustes', icon: I.gear, sub: () => 'Campaña, sedes, contacto y equipo' },
];

const ui = { view: 'resumen', agendaDate: iso(today()), agendaSede: 'todas', q: '', seg: 'pendientes', cat: 'facial' };
let drawerStage = null;

/* ---------- Utilidades ---------- */

const estadoTag = (e) => {
  const cls = { pendiente: 'tag-warn', confirmada: '', atendida: 'tag-ok', 'no-asistio': 'tag-danger', cancelada: 'tag-muted', 'por-pagar': 'tag-warn', pagada: 'tag-ok', canjeada: 'tag-muted' }[e] ?? '';
  const name = ESTADOS.find((x) => x.id === e)?.nombre || { 'por-pagar': 'Por pagar', pagada: 'Pagada', canjeada: 'Canjeada' }[e] || e;
  return `<span class="tag ${cls}">${esc(name)}</span>`;
};
const valorCita = (c) => c.tratamientos.reduce((s, id) => s + (tratamiento(id)?.precio || 0), 0);
const waPaciente = (tel, text) => {
  const d = String(tel || '').replace(/\D/g, '');
  const intl = d.startsWith('593') ? d : '593' + d.replace(/^0/, '');
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
};
const trNames = (ids) => ids.map((id) => tratamiento(id)?.nombre || id).join(', ');
const edad = (nac) => { if (!nac) return ''; const d = parseISO(nac); const t = today(); let a = t.getFullYear() - d.getFullYear(); if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
const rel = (f) => { const d = daysBetween(f, iso(today())); return d === 0 ? 'hoy' : d === 1 ? 'ayer' : d > 0 ? `hace ${d} días` : d === -1 ? 'mañana' : `en ${-d} días`; };

function toast(msg) {
  let box = $('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.append(box); }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  box.append(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------- Estructura ---------- */

function renderNav() {
  $('#side-nav').innerHTML = NAV.map((n) => {
    const c = n.count?.() || 0;
    return `<a href="#${n.id}" data-nav="${n.id}" ${ui.view === n.id ? 'aria-current="page"' : ''}>${n.icon}<span>${n.nombre}</span>${c ? `<span class="count">${c}</span>` : ''}</a>`;
  }).join('');
}

const VIEWS = {};

function render() {
  const n = NAV.find((x) => x.id === ui.view) || NAV[0];
  $('#view-title').textContent = n.nombre;
  $('#view-sub').textContent = n.sub?.() || '';
  $('#top-actions').innerHTML = '';
  renderNav();
  VIEWS[n.id]();
}

function go(view) {
  if ($('#drawer').classList.contains('is-open')) { closeStage(); $('#drawer').classList.remove('is-open'); $('#scrim').classList.remove('is-open'); }
  ui.view = NAV.some((n) => n.id === view) ? view : 'resumen';
  if (location.hash.slice(1) !== ui.view) history.replaceState(null, '', '#' + ui.view);
  $('#side').classList.remove('is-open');
  render();
  scrollTo(0, 0);
}

/* ---------- Resumen ---------- */

VIEWS.resumen = () => {
  const s = getState();
  const hoy = iso(today());
  const fin = iso(addDays(today(), 6));
  const vivas = s.citas.filter((c) => c.estado !== 'cancelada');
  const citasHoy = vivas.filter((c) => c.fecha === hoy).sort((a, b) => a.hora.localeCompare(b.hora));
  const semana = vivas.filter((c) => c.fecha >= hoy && c.fecha <= fin);
  const hace7 = addDays(today(), -7).toISOString();
  const nuevasWeb = s.citas.filter((c) => c.creada >= hace7 && (c.origen === 'web' || c.origen === 'mapa'));
  const mes = hoy.slice(0, 7);
  const ingresos = s.citas.filter((c) => c.estado === 'atendida' && c.fecha.startsWith(mes)).reduce((a, c) => a + valorCita(c), 0);
  const desde30 = iso(addDays(today(), -30));
  const ult30 = s.citas.filter((c) => c.fecha >= desde30 && c.fecha < hoy);
  const att = ult30.filter((c) => c.estado === 'atendida').length;
  const noa = ult30.filter((c) => c.estado === 'no-asistio').length;
  const seg = seguimiento().filter((x) => !x.contactado && !x.proxima);

  // Citas por día: dos semanas atrás y una adelante, apiladas por sede
  const sedes = activeSedes();
  const days = [];
  for (let i = -13; i <= 7; i++) {
    const d = addDays(today(), i);
    if (d.getDay() === 0) continue;
    const f = iso(d);
    days.push({ f, d, per: sedes.map((se) => vivas.filter((c) => c.fecha === f && c.sede === se.id).length) });
  }
  const max = Math.max(4, ...days.map((x) => x.per.reduce((a, b) => a + b, 0)));
  const W = 620, H = 190, bw = W / days.length;
  const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];
  const bars = days.map((x, i) => {
    let y = H - 22;
    const segs = x.per.map((v, k) => {
      const h = (v / max) * (H - 40);
      y -= h;
      return v ? `<rect x="${i * bw + 4}" y="${y}" width="${bw - 8}" height="${h}" rx="3" fill="${colors[k]}"><title>${fmtDate(x.f)} · ${sedes[k].nombre}: ${v}</title></rect>` : '';
    }).join('');
    const isToday = x.f === hoy;
    return `${segs}<text x="${i * bw + bw / 2}" y="${H - 6}" text-anchor="middle" class="${isToday ? 'is-today' : ''}">${x.d.getDate()}</text>${isToday ? `<line x1="${i * bw + bw / 2}" x2="${i * bw + bw / 2}" y1="6" y2="${H - 24}" class="today-line"/>` : ''}`;
  }).join('');

  const count = (arr, key) => { const m = {}; arr.forEach((c) => [].concat(key(c)).forEach((k) => { m[k] = (m[k] || 0) + 1; })); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const top = count(ult30.filter((c) => c.estado !== 'cancelada'), (c) => c.tratamientos).slice(0, 6);
  const origen = count(s.citas.filter((c) => c.fecha >= desde30), (c) => c.origen);
  const hbar = (rows, label) => { const m = Math.max(...rows.map((r) => r[1]), 1); return rows.map(([k, v]) => `<div class="hbar"><span>${esc(label(k))}</span><i><b style="width:${(v / m) * 100}%"></b></i><em class="num">${v}</em></div>`).join(''); };

  $('#top-actions').innerHTML = `<button class="btn btn-primary btn-sm" data-new-cita>${I.plus} Nueva cita</button>`;
  $('#view').innerHTML = `
    <div class="kpis">
      <div class="kpi accent"><span>Citas hoy</span><strong class="num">${citasHoy.length}</strong><small>${citasHoy.filter((c) => c.estado === 'confirmada').length} confirmadas · ${citasHoy.filter((c) => c.estado === 'pendiente').length} por confirmar</small></div>
      <div class="kpi"><span>Próximos 7 días</span><strong class="num">${semana.length}</strong><small>en ${sedes.map((x) => x.nombre).join(' y ')}</small></div>
      <div class="kpi"><span>Reservas desde la web</span><strong class="num">${nuevasWeb.length}</strong><small>últimos 7 días · ${nuevasWeb.filter((c) => c.origen === 'mapa').length} desde el mapa 3D</small></div>
      <div class="kpi"><span>Facturado este mes</span><strong class="num">${money(ingresos)}</strong><small>asistencia ${att + noa ? Math.round((att / (att + noa)) * 100) : 100}% en 30 días</small></div>
    </div>
    <div class="cols">
      <section class="panel-card">
        <h2>Citas por día <span class="legend">${sedes.map((x, k) => `<i style="background:${colors[k]}"></i>${esc(x.nombre)}`).join('')}</span></h2>
        <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Citas por día y sede">${[0.25, 0.5, 0.75].map((g) => `<line x1="0" x2="${W}" y1="${(H - 22) - g * (H - 40)}" y2="${(H - 22) - g * (H - 40)}" class="grid"/>`).join('')}${bars}</svg>
      </section>
      <section class="panel-card">
        <h2>Hoy <a class="link" href="#agenda" data-nav="agenda">Ver agenda</a></h2>
        <ul class="list">${citasHoy.map((c) => `
          <li><button class="row-btn" data-cita="${c.id}"><b class="num">${c.hora}</b><span>${esc(c.nombre)}<small>${esc(trNames(c.tratamientos))} · ${esc(sede(c.sede)?.nombre || '')}</small></span>${estadoTag(c.estado)}</button></li>`).join('') || '<li class="note">No hay citas hoy.</li>'}</ul>
      </section>
    </div>
    <div class="cols cols-3">
      <section class="panel-card">
        <h2>Por contactar <a class="link" href="#seguimiento" data-nav="seguimiento">Ver todo</a></h2>
        <ul class="list">${seg.slice(0, 5).map((x) => `
          <li class="seg-mini"><span><b>${esc(x.paciente.nombre)}</b><small>${x.tipo === 'control' ? 'Control' : 'Retoque'} de ${esc(x.tr.nombre.toLowerCase())} · ${rel(x.h.fecha)}</small></span>
          <a class="btn btn-wa btn-xs" href="${waPaciente(x.paciente.telefono, mensajeSeguimiento(x))}" target="_blank" rel="noopener" data-contactar="${esc(x.key)}">${I.wa} Escribir</a></li>`).join('') || '<li class="note">Nada pendiente.</li>'}</ul>
      </section>
      <section class="panel-card"><h2>Lo más pedido · 30 días</h2>${hbar(top, (k) => tratamiento(k)?.nombre || k)}</section>
      <section class="panel-card"><h2>De dónde llegan · 30 días</h2>${hbar(origen, (k) => ORIGENES[k] || k)}</section>
    </div>`;
};

/* ---------- Agenda ---------- */

VIEWS.agenda = () => {
  const s = getState();
  const f = ui.agendaDate;
  const d = parseISO(f);
  const sedes = activeSedes().filter((x) => ui.agendaSede === 'todas' || x.id === ui.agendaSede);
  const delDia = s.citas.filter((c) => c.fecha === f && sedes.some((x) => x.id === c.sede));
  const horas = new Set();
  sedes.forEach((se) => slotsFor(se.id, f).forEach((x) => horas.add(x.hora)));
  delDia.forEach((c) => horas.add(c.hora));
  const rows = [...horas].sort();
  const vivas = delDia.filter((c) => c.estado !== 'cancelada');

  $('#top-actions').innerHTML = `<button class="btn btn-primary btn-sm" data-new-cita>${I.plus} Nueva cita</button>`;
  $('#view').innerHTML = `
    <div class="toolbar">
      <div class="datenav">
        <button class="icon-btn" data-day="-1" aria-label="Día anterior">${I.left}</button>
        <div><b>${fmtDate(f, { weekday: 'long', day: 'numeric', month: 'long' })}</b><small>${rel(f)}</small></div>
        <button class="icon-btn" data-day="1" aria-label="Día siguiente">${I.right}</button>
        <button class="btn btn-ghost btn-sm" data-day="0">Hoy</button>
        <input class="input input-sm" type="date" value="${f}" data-pick-day aria-label="Elegir fecha">
      </div>
      <div class="seg" role="group" aria-label="Sede">
        <button data-sede-f="todas" aria-pressed="${ui.agendaSede === 'todas'}">Todas</button>
        ${activeSedes().map((x) => `<button data-sede-f="${x.id}" aria-pressed="${ui.agendaSede === x.id}">${esc(x.nombre)}</button>`).join('')}
      </div>
    </div>
    <p class="note">${vivas.length} citas · ${vivas.filter((c) => c.estado === 'confirmada').length} confirmadas · ${vivas.filter((c) => c.estado === 'pendiente').length} por confirmar · ${s.settings.cabinas} cabinas por sede</p>
    ${d.getDay() === 0 ? '<div class="panel-card empty-day">Los domingos la clínica no atiende.</div>' : `
    <div class="agenda" style="--cols:${sedes.length}">
      <div class="agenda-head"><span></span>${sedes.map((x) => `<b>${esc(x.nombre)}</b>`).join('')}</div>
      ${rows.map((h) => `
        <div class="agenda-row">
          <span class="agenda-time num">${h}</span>
          ${sedes.map((se) => {
            const cs = delDia.filter((c) => c.sede === se.id && c.hora === h);
            return `<div class="agenda-cell" data-slot="${se.id}|${h}">${cs.map((c) => `
              <button class="appt st-${c.estado}" data-cita="${c.id}">
                <b>${esc(c.nombre)}</b><small>${esc(trNames(c.tratamientos))}</small>
                <span>${c.doctor ? esc(doctor(c.doctor)?.corto || '') : 'Sin médico asignado'}${c.origen === 'mapa' ? ` · ${I.cube}` : ''}</span>
              </button>`).join('')}${cs.filter((c) => c.estado !== 'cancelada').length < s.settings.cabinas ? `<button class="appt-add" data-new-cita="${se.id}|${h}" aria-label="Agendar ${h} en ${esc(se.nombre)}">${I.plus}</button>` : ''}</div>`;
          }).join('')}
        </div>`).join('')}
    </div>`}`;
};

/* ---------- Pacientes ---------- */

VIEWS.pacientes = () => {
  const s = getState();
  const hoy = iso(today());
  const q = ui.q.trim().toLowerCase();
  const list = s.pacientes
    .filter((p) => !q || p.nombre.toLowerCase().includes(q) || p.telefono.includes(q))
    .map((p) => ({ p, last: p.historial[0], next: s.citas.filter((c) => c.pacienteId === p.id && c.fecha >= hoy && c.estado !== 'cancelada').sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0] }))
    .sort((a, b) => (b.last?.fecha || '').localeCompare(a.last?.fecha || ''));
  $('#view').innerHTML = `
    <div class="toolbar"><input class="input search-input" type="search" placeholder="Buscar por nombre o teléfono" value="${esc(ui.q)}" data-search><span class="note">${list.length} pacientes</span></div>
    <div class="panel-card table-card">
      <table class="table">
        <thead><tr><th>Paciente</th><th>Sede</th><th>Último tratamiento</th><th>Próxima cita</th><th>Alertas</th></tr></thead>
        <tbody>${list.map(({ p, last, next }) => `
          <tr data-paciente="${p.id}" tabindex="0">
            <td><b>${esc(p.nombre)}</b><small>${esc(p.telefono)}${p.nacimiento ? ` · ${edad(p.nacimiento)} años` : ''}</small></td>
            <td>${esc(sede(p.sede)?.nombre || '')}</td>
            <td>${last ? `${esc(tratamiento(last.tratamiento)?.nombre || '')}<small>${rel(last.fecha)}</small>` : '<span class="note">—</span>'}</td>
            <td>${next ? `${fmtDate(next.fecha)} · ${next.hora}<small>${esc(sede(next.sede)?.nombre || '')}</small>` : '<span class="note">Sin cita</span>'}</td>
            <td>${p.alertas.map((a) => `<span class="tag tag-danger">${esc(a)}</span>`).join(' ')}${p.consentimiento ? '' : ' <span class="tag tag-warn">Sin consentimiento</span>'}</td>
          </tr>`).join('')}</tbody>
      </table>
    </div>`;
};

/* ---------- Seguimiento ---------- */

VIEWS.seguimiento = () => {
  const all = seguimiento();
  const pend = all.filter((x) => !x.contactado);
  const filters = { pendientes: (x) => !x.contactado, control: (x) => x.tipo === 'control', retoque: (x) => x.tipo === 'retoque', contactados: (x) => !!x.contactado };
  const list = all.filter(filters[ui.seg]);
  const potencial = pend.filter((x) => x.tipo === 'retoque').reduce((a, x) => a + (x.tr.precio || 0), 0);
  $('#view').innerHTML = `
    <div class="kpis">
      <div class="kpi accent"><span>Por contactar</span><strong class="num">${pend.length}</strong><small>según el historial de cada paciente</small></div>
      <div class="kpi"><span>Controles</span><strong class="num">${pend.filter((x) => x.tipo === 'control').length}</strong><small>toxina e hialurónico a los 15 días</small></div>
      <div class="kpi"><span>Retoques</span><strong class="num">${pend.filter((x) => x.tipo === 'retoque').length}</strong><small>toxina a los 4 meses, sesiones de planes</small></div>
      <div class="kpi"><span>Valor de los retoques</span><strong class="num">${money(potencial)}</strong><small>a precio de referencia</small></div>
    </div>
    <div class="toolbar">
      <div class="seg" role="group" aria-label="Filtro">
        ${[['pendientes', 'Por contactar'], ['control', 'Controles'], ['retoque', 'Retoques'], ['contactados', 'Contactados']].map(([k, v]) => `<button data-seg="${k}" aria-pressed="${ui.seg === k}">${v}</button>`).join('')}
      </div>
      <p class="note">El mensaje sale escrito con el nombre, el tratamiento y el médico. Solo hay que enviarlo.</p>
    </div>
    <div class="follow">${list.map((x) => `
      <article class="panel-card follow-card ${x.contactado ? 'is-done' : ''}">
        <div class="follow-head">
          <span class="tag ${x.tipo === 'control' ? '' : 'tag-ok'}">${x.tipo === 'control' ? 'Control' : 'Retoque'}</span>
          <button class="link" data-paciente="${x.paciente.id}">${esc(x.paciente.nombre)}</button>
        </div>
        <p><b>${esc(x.tr.nombre)}</b> · ${fmtDate(x.h.fecha, { day: 'numeric', month: 'long' })} (${x.dias} días) · ${esc(doctor(x.h.doctor)?.corto || '')}${x.h.zonas.length ? ` · ${x.h.zonas.map((z) => zone(z)?.nombre).join(', ')}` : ''}</p>
        ${x.proxima ? '<p class="note">Ya tiene una cita agendada.</p>' : ''}
        <blockquote>${esc(mensajeSeguimiento(x))}</blockquote>
        <div class="follow-actions">
          <a class="btn btn-wa btn-sm" href="${waPaciente(x.paciente.telefono, mensajeSeguimiento(x))}" target="_blank" rel="noopener" data-contactar="${esc(x.key)}">${I.wa} Enviar por WhatsApp</a>
          ${x.contactado ? `<span class="note">Contactado ${rel(x.contactado.slice(0, 10))}</span> <button class="link" data-uncontact="${esc(x.key)}">Deshacer</button>` : `<button class="btn btn-ghost btn-sm" data-contactar="${esc(x.key)}">Marcar contactado</button>`}
        </div>
      </article>`).join('') || '<div class="panel-card note">No hay pacientes en esta lista.</div>'}</div>`;
};

/* ---------- Tratamientos ---------- */

VIEWS.tratamientos = () => {
  const s = getState();
  const list = s.tratamientos.filter((x) => x.cat === ui.cat);
  $('#view').innerHTML = `
    <div class="toolbar"><div class="seg seg-scroll" role="tablist">${CATEGORIES.map((c) => `<button data-cat="${c.id}" aria-pressed="${ui.cat === c.id}">${esc(c.nombre)}</button>`).join('')}</div></div>
    <div class="panel-card table-card">
      <table class="table table-edit">
        <thead><tr><th>Visible</th><th>Tratamiento</th><th>Precio desde</th><th>Duración</th><th>Destacado</th></tr></thead>
        <tbody>${list.map((x) => `
          <tr>
            <td><label class="switch"><input type="checkbox" data-tr="${x.id}" data-k="activo" ${x.activo ? 'checked' : ''} ${x.siempre ? 'disabled' : ''}><i></i></label></td>
            <td><input class="input input-sm" data-tr="${x.id}" data-k="nombre" value="${esc(x.nombre)}"><small>${esc(x.desc)}</small></td>
            <td><div class="money-in"><span>$</span><input class="input input-sm num" type="number" min="0" step="1" data-tr="${x.id}" data-k="precio" value="${x.precio ?? ''}" placeholder="En valoración"></div></td>
            <td><div class="money-in"><input class="input input-sm num" type="number" min="5" step="5" data-tr="${x.id}" data-k="dur" value="${x.dur ?? ''}"><span>min</span></div></td>
            <td><label class="switch"><input type="checkbox" data-tr="${x.id}" data-k="destacado" ${x.destacado ? 'checked' : ''}><i></i></label></td>
          </tr>`).join('')}</tbody>
      </table>
    </div>
    <p class="note">Los precios iniciales son los publicados en medesthetique.com.ec. Deja el precio vacío para mostrar “Precio en valoración”.</p>`;
};

/* ---------- Gift cards ---------- */

VIEWS.giftcards = () => {
  const s = getState();
  const vendidas = s.giftcards.filter((g) => g.estado !== 'por-pagar');
  $('#view').innerHTML = `
    <div class="kpis">
      <div class="kpi accent"><span>Vendidas</span><strong class="num">${money(vendidas.reduce((a, g) => a + g.monto, 0))}</strong><small>${vendidas.length} gift cards pagadas o canjeadas</small></div>
      <div class="kpi"><span>Por pagar</span><strong class="num">${s.giftcards.filter((g) => g.estado === 'por-pagar').length}</strong><small>esperan transferencia</small></div>
      <div class="kpi"><span>Por canjear</span><strong class="num">${s.giftcards.filter((g) => g.estado === 'pagada').length}</strong><small>pagadas, aún sin usar</small></div>
      <div class="kpi"><span>Campaña</span><strong class="kpi-text">${s.settings.campana.activa ? 'Activa' : 'Apagada'}</strong><small>${esc(s.settings.campana.titulo)}</small></div>
    </div>
    <div class="panel-card table-card">
      <table class="table">
        <thead><tr><th>Código</th><th>Para · De</th><th>Valor</th><th>Pedida</th><th>Estado</th><th></th></tr></thead>
        <tbody>${s.giftcards.map((g) => `
          <tr>
            <td><b class="code">${esc(g.codigo)}</b></td>
            <td><b>${esc(g.para)}</b><small>de ${esc(g.de)}${g.mensaje ? ` · “${esc(g.mensaje)}”` : ''}</small></td>
            <td>${money(g.monto)}<small>${g.tratamiento ? esc(tratamiento(g.tratamiento)?.nombre || '') : 'Por monto'}</small></td>
            <td>${fmtDate(g.creada.slice(0, 10))}</td>
            <td><select class="select input-sm" data-gift="${g.id}">${[['por-pagar', 'Por pagar'], ['pagada', 'Pagada'], ['canjeada', 'Canjeada']].map(([k, v]) => `<option value="${k}" ${g.estado === k ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
            <td><a class="btn btn-wa btn-xs" href="${waPaciente(g.telefono, `Hola ${g.de} 🎁 Te escribimos de Medesthetique por tu gift card ${g.codigo} para ${g.para}.`)}" target="_blank" rel="noopener">${I.wa}</a></td>
          </tr>`).join('')}</tbody>
      </table>
    </div>`;
};

/* ---------- Ajustes ---------- */

VIEWS.ajustes = () => {
  const s = getState();
  const st = s.settings;
  const hours = (se, k) => `<input class="input input-sm num" type="time" data-sede-h="${se.id}|${k}|0" value="${se.horario[k][0]}"> – <input class="input input-sm num" type="time" data-sede-h="${se.id}|${k}|1" value="${se.horario[k][1]}">`;
  $('#view').innerHTML = `
    <div class="cols cols-even">
      <form class="panel-card form-card" data-form="campana">
        <h2>Campaña en el sitio</h2>
        <label class="switch-row"><span>Mostrar el aviso arriba del sitio</span><label class="switch"><input type="checkbox" name="activa" ${st.campana.activa ? 'checked' : ''}><i></i></label></label>
        <label class="field"><span>Título</span><input class="input" name="titulo" value="${esc(st.campana.titulo)}"></label>
        <label class="field"><span>Texto</span><input class="input" name="texto" value="${esc(st.campana.texto)}"></label>
        <div class="form-grid"><label class="field"><span>Botón</span><input class="input" name="cta" value="${esc(st.campana.cta)}"></label>
        <label class="field"><span>Enlace</span><input class="input" name="href" value="${esc(st.campana.href)}"></label></div>
        <button class="btn btn-primary btn-sm" type="submit">Guardar campaña</button>
      </form>
      <form class="panel-card form-card" data-form="contacto">
        <h2>Contacto</h2>
        <div class="form-grid">
          <label class="field"><span>WhatsApp (internacional)</span><input class="input" name="whatsapp" value="${esc(st.whatsapp)}"></label>
          <label class="field"><span>WhatsApp (como se muestra)</span><input class="input" name="whatsappDisplay" value="${esc(st.whatsappDisplay)}"></label>
          <label class="field"><span>Correo</span><input class="input" name="email" value="${esc(st.email)}"></label>
          <label class="field"><span>Instagram</span><input class="input" name="instagram" value="${esc(st.instagram)}"></label>
          <label class="field"><span>Cabinas por sede</span><input class="input" type="number" min="1" max="6" name="cabinas" value="${st.cabinas}"></label>
        </div>
        <button class="btn btn-primary btn-sm" type="submit">Guardar contacto</button>
      </form>
    </div>
    <section class="panel-card">
      <h2>Sedes</h2>
      <div class="sedes-edit">${s.sedes.map((se) => `
        <div class="sede-edit">
          <label class="switch-row"><span><b>${esc(se.nombre)}</b><small>${esc(se.direccion)}</small></span><label class="switch"><input type="checkbox" data-sede-on="${se.id}" ${se.activa ? 'checked' : ''}><i></i></label></label>
          <div class="hours"><span>Lunes a viernes</span>${hours(se, 'lv')}</div>
          <div class="hours"><span>Sábados</span>${hours(se, 'sab')}</div>
          ${se.id === 'manta' ? '<p class="note">Aparece en su web de 2023, pero no en el Instagram actual. Encender solo si sigue abierta.</p>' : ''}
        </div>`).join('')}</div>
    </section>
    <div class="cols cols-even">
      <section class="panel-card">
        <h2>Equipo médico</h2>
        ${s.doctores.map((d) => `<label class="switch-row"><span><b>${esc(d.nombre)}</b><small>${esc(d.rol)}</small></span><label class="switch"><input type="checkbox" data-doc-on="${d.id}" ${d.activo ? 'checked' : ''}><i></i></label></label>`).join('')}
      </section>
      <section class="panel-card">
        <h2>Escultura 3D</h2>
        <p class="note">La que se muestra por defecto en el sitio, el mapa facial y las fichas. Quien visita el sitio puede cambiarla.</p>
        <div class="sculpt-pick">${ESCULTURAS.map((e) => `<label><input type="radio" name="escultura" value="${e.id}" data-escultura ${s.settings.escultura === e.id ? 'checked' : ''}><span><b>${esc(e.nombre)}</b><small>${esc(e.detalle)}</small></span></label>`).join('')}</div>
      </section>
      <section class="panel-card danger-card">
        <h2>Maqueta</h2>
        <p class="note">Vuelve a los datos de demostración: pacientes, citas, precios y ajustes iniciales.</p>
        <button class="btn btn-ghost btn-sm" data-reset>Restablecer la maqueta</button>
      </section>
    </div>`;
};

/* ---------- Cajón: cita ---------- */

function openDrawer(html, wide = false) {
  closeStage();
  const d = $('#drawer');
  d.classList.toggle('drawer-xl', wide);
  d.innerHTML = html;
  d.classList.add('is-open');
  $('#scrim').classList.add('is-open');
}
function closeDrawer() {
  const wasOpen = $('#drawer').classList.contains('is-open');
  closeStage();
  $('#drawer').classList.remove('is-open');
  $('#scrim').classList.remove('is-open');
  if (wasOpen) render();
}
function closeStage() { if (drawerStage) { drawerStage.dispose(); drawerStage = null; } }

function openCita(id) {
  const c = getState().citas.find((x) => x.id === id);
  if (!c) return;
  const p = getState().pacientes.find((x) => x.id === c.pacienteId);
  const docs = getState().doctores.filter((x) => x.activo);
  const confirmMsg = `Hola ${c.nombre.split(' ')[0]} 🤍 Te escribimos de Medesthetique para confirmar tu cita del ${fmtDate(c.fecha, { weekday: 'long', day: 'numeric', month: 'long' })} a las ${c.hora} en ${sede(c.sede)?.nombre}. ¿Nos confirmas tu asistencia?`;
  openDrawer(`
    <div class="drawer-head"><h2>${esc(c.codigo)}</h2>${estadoTag(c.estado)}<button class="icon-btn" data-close aria-label="Cerrar">${I.close}</button></div>
    <div class="drawer-body detail">
      <div class="detail-person">
        <span class="avatar">${esc(c.nombre.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span>
        <div><b>${esc(c.nombre)}</b><small>${esc(c.telefono)} · ${ORIGENES[c.origen] || c.origen}${c.primeraVez ? ' · Primera vez' : ''}</small></div>
        ${p ? `<button class="btn btn-soft btn-xs" data-paciente="${p.id}">Ver ficha</button>` : ''}
      </div>
      ${p?.alertas.length ? `<div class="alert-box">${I.alert}<span>${p.alertas.map(esc).join(' · ')}</span></div>` : ''}
      <dl class="detail-grid">
        <div><dt>Fecha</dt><dd>${fmtDate(c.fecha, { weekday: 'long', day: 'numeric', month: 'long' })} · ${c.hora}</dd></div>
        <div><dt>Sede</dt><dd>${esc(sede(c.sede)?.nombre || '')}</dd></div>
        <div class="full"><dt>Motivo</dt><dd>${c.tratamientos.map((id) => `<span class="chip chip-powder">${esc(tratamiento(id)?.nombre || id)}</span>`).join(' ')}</dd></div>
        ${c.plan ? `<div class="full"><dt>${I.cube} Plan del mapa 3D</dt><dd><ul class="plan-list">${c.plan.preocupaciones.map((pid) => { const z = ZONES.find((zz) => zz.preocupaciones.some((x) => x.id === pid)); const pp = z?.preocupaciones.find((x) => x.id === pid); return pp ? `<li><b>${esc(z.nombre)}</b> ${esc(pp.texto)}</li>` : ''; }).join('')}</ul></dd></div>` : ''}
        ${c.nota ? `<div class="full"><dt>Nota del paciente</dt><dd>${esc(c.nota)}</dd></div>` : ''}
      </dl>
      <label class="field"><span>Médico</span><select class="select" data-cita-doc="${c.id}"><option value="">Sin asignar</option>${docs.map((d) => `<option value="${d.id}" ${c.doctor === d.id ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}</select></label>
      <div class="field"><span>Estado</span><div class="seg seg-wrap">${ESTADOS.map((e) => `<button data-estado="${e.id}" data-cita-id="${c.id}" aria-pressed="${c.estado === e.id}">${e.nombre}</button>`).join('')}</div></div>
      ${c.estado === 'atendida' ? '<p class="note">Al marcarla atendida, los tratamientos quedaron registrados en la ficha y entran al seguimiento.</p>' : ''}
    </div>
    <div class="drawer-foot">
      <a class="btn btn-wa" style="flex:1" href="${waPaciente(c.telefono, confirmMsg)}" target="_blank" rel="noopener">${I.wa} Confirmar por WhatsApp</a>
    </div>`);
}

function setEstado(id, estado) {
  update((s) => {
    const c = s.citas.find((x) => x.id === id);
    if (!c) return;
    c.estado = estado;
    if (estado === 'atendida' && !c.registrada) {
      const p = s.pacientes.find((x) => x.id === c.pacienteId);
      const zonasPlan = c.plan?.zonas || [];
      c.tratamientos.filter((t) => t !== 'valoracion').forEach((t) => {
        const tz = tratamiento(t)?.zonas || [];
        p?.historial.unshift({ fecha: c.fecha, tratamiento: t, zonas: zonasPlan.filter((z) => tz.includes(z)), detalle: '', doctor: c.doctor || 'estefania' });
      });
      p?.historial.sort((a, b) => b.fecha.localeCompare(a.fecha));
      c.registrada = true;
    }
  });
  toast(`Cita marcada como “${ESTADOS.find((e) => e.id === estado).nombre.toLowerCase()}”.`);
  openCita(id);
}

/* ---------- Cajón: ficha del paciente ---------- */

function openPaciente(id) {
  const s = getState();
  const p = s.pacientes.find((x) => x.id === id);
  if (!p) return;
  const hoy = iso(today());
  const citas = s.citas.filter((c) => c.pacienteId === id).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  const prox = citas.filter((c) => c.fecha >= hoy && c.estado !== 'cancelada');
  const zonasTratadas = {};
  p.historial.forEach((h) => { const age = daysBetween(h.fecha, hoy); h.zonas.forEach((z) => { zonasTratadas[z] = Math.max(zonasTratadas[z] || 0, age < 120 ? 0.9 : 0.5); }); });
  const trs = s.tratamientos.filter((x) => x.activo && x.id !== 'valoracion');
  openDrawer(`
    <div class="drawer-head"><h2>${esc(p.nombre)}</h2><button class="icon-btn" data-close aria-label="Cerrar">${I.close}</button></div>
    <div class="drawer-body ficha">
      <div class="ficha-3d">
        <canvas id="ficha-canvas"></canvas>
        <div class="ficha-legend">${Object.keys(zonasTratadas).length ? `<b>Zonas tratadas</b>${Object.keys(zonasTratadas).map((z) => `<span class="chip">${esc(zone(z)?.nombre || z)}</span>`).join('')}` : '<span class="note">Aún sin zonas registradas</span>'}</div>
      </div>
      <div class="ficha-info">
        <dl class="detail-grid">
          <div><dt>WhatsApp</dt><dd><a class="link" href="${waPaciente(p.telefono, `Hola ${p.nombre.split(' ')[0]} 🤍 Te escribimos de Medesthetique.`)}" target="_blank" rel="noopener">${esc(p.telefono)}</a></dd></div>
          <div><dt>Sede</dt><dd>${esc(sede(p.sede)?.nombre || '')}</dd></div>
          <div><dt>Edad</dt><dd>${p.nacimiento ? `${edad(p.nacimiento)} años` : '—'}</dd></div>
          <div><dt>Próxima cita</dt><dd>${prox.length ? `${fmtDate(prox.at(-1).fecha)} · ${prox.at(-1).hora}` : 'Sin cita'}</dd></div>
        </dl>
        <label class="switch-row"><span><b>Consentimiento informado firmado</b><small>Obligatorio antes de cualquier procedimiento</small></span><label class="switch"><input type="checkbox" data-consent="${p.id}" ${p.consentimiento ? 'checked' : ''}><i></i></label></label>
        <div class="field"><span>Alertas médicas</span>
          <div class="alerts">${p.alertas.map((a, i) => `<span class="tag tag-danger">${esc(a)} <button data-alert-rm="${p.id}|${i}" aria-label="Quitar alerta">×</button></span>`).join('')}
          <form data-alert-add="${p.id}" class="alert-add"><input class="input input-sm" name="a" placeholder="Ej.: toma omega 3"><button class="btn btn-soft btn-xs">Añadir</button></form></div>
        </div>
      </div>
      <section>
        <p class="sec-label">Registrar tratamiento</p>
        <form class="reg-form" data-reg="${p.id}">
          <div class="form-grid">
            <label class="field"><span>Tratamiento</span><select class="select" name="t">${CATEGORIES.map((c) => `<optgroup label="${esc(c.nombre)}">${trs.filter((x) => x.cat === c.id).map((x) => `<option value="${x.id}">${esc(x.nombre)}</option>`).join('')}</optgroup>`).join('')}</select></label>
            <label class="field"><span>Fecha</span><input class="input" type="date" name="f" value="${hoy}"></label>
            <label class="field"><span>Detalle</span><input class="input" name="d" placeholder="20 U, 1 ml, lote…"></label>
            <label class="field"><span>Médico</span><select class="select" name="doc">${s.doctores.filter((d) => d.activo).map((d) => `<option value="${d.id}">${esc(d.corto)}</option>`).join('')}</select></label>
          </div>
          <div class="zone-pick">${ZONES.map((z) => `<label><input type="checkbox" name="z" value="${z.id}"><span>${esc(z.nombre)}</span></label>`).join('')}</div>
          <button class="btn btn-primary btn-sm">Guardar en la ficha</button>
        </form>
      </section>
      <section>
        <p class="sec-label">Historial</p>
        <ol class="timeline">${p.historial.map((h) => `
          <li><span class="num">${fmtDate(h.fecha, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <div><b>${esc(tratamiento(h.tratamiento)?.nombre || h.tratamiento)}</b>${h.detalle ? ` · ${esc(h.detalle)}` : ''}<small>${h.zonas.map((z) => zone(z)?.nombre).join(', ') || 'Sin zona'} · ${esc(doctor(h.doctor)?.corto || '')}</small></div></li>`).join('') || '<li class="note">Sin tratamientos registrados.</li>'}</ol>
      </section>
      <section>
        <p class="sec-label">Citas</p>
        <ul class="list">${citas.slice(0, 8).map((c) => `<li><button class="row-btn" data-cita="${c.id}"><b class="num">${fmtDate(c.fecha)}</b><span>${esc(trNames(c.tratamientos))}<small>${c.hora} · ${esc(sede(c.sede)?.nombre || '')}</small></span>${estadoTag(c.estado)}</button></li>`).join('') || '<li class="note">Sin citas.</li>'}</ul>
      </section>
      <label class="field"><span>Notas internas</span><textarea class="textarea" data-notas="${p.id}" placeholder="Preferencias, evolución, fotos pendientes…">${esc(p.notas)}</textarea></label>
    </div>
    <div class="drawer-foot"><button class="btn btn-primary" style="flex:1" data-new-cita data-for="${p.id}">${I.plus} Agendar cita para ${esc(p.nombre.split(' ')[0])}</button></div>`, true);

  if (webglAvailable()) {
    drawerStage = new MusaStage($('#ficha-canvas'), { model: getState().settings.escultura, interactive: true, idle: false, particles: false, halo: true, plinth: false, view: { az: 0.5, el: 0.04, dist: 5.4, t: [0.05, -0.12, 0.2] } });
    drawerStage.ready.then((st) => { $('#ficha-canvas')?.classList.add('is-ready'); st.setZones(zonasTratadas); });
  }
}

/* ---------- Modal: nueva cita ---------- */

function openNewCita(prefill = {}) {
  const s = getState();
  const p = prefill.paciente ? s.pacientes.find((x) => x.id === prefill.paciente) : null;
  const sedeId = prefill.sede || p?.sede || activeSedes()[0]?.id;
  const fecha = prefill.fecha || ui.agendaDate;
  const trs = s.tratamientos.filter((x) => x.activo);
  const card = $('#modal-card');
  card.innerHTML = `
    <form class="new-cita" id="new-cita">
      <div class="modal-head"><h2 class="display">Nueva cita</h2><button type="button" class="icon-btn" data-modal-close aria-label="Cerrar">${I.close}</button></div>
      <div class="form-grid">
        <label class="field full"><span>Paciente</span><input class="input" name="nombre" list="pac-list" value="${esc(p?.nombre || '')}" required placeholder="Nombre y apellido"></label>
        <datalist id="pac-list">${s.pacientes.map((x) => `<option value="${esc(x.nombre)}">`).join('')}</datalist>
        <label class="field full"><span>WhatsApp</span><input class="input" name="telefono" value="${esc(p?.telefono || '')}" required inputmode="tel"></label>
        <label class="field"><span>Sede</span><select class="select" name="sede">${activeSedes().map((x) => `<option value="${x.id}" ${x.id === sedeId ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select></label>
        <label class="field"><span>Fecha</span><input class="input" type="date" name="fecha" value="${fecha}" min="${iso(today())}" required></label>
        <label class="field"><span>Hora</span><select class="select" name="hora" required></select></label>
        <label class="field"><span>Médico</span><select class="select" name="doctor"><option value="">Sin asignar</option>${s.doctores.filter((d) => d.activo).map((d) => `<option value="${d.id}">${esc(d.corto)}</option>`).join('')}</select></label>
        <label class="field"><span>Tratamiento</span><select class="select" name="tratamiento">${trs.map((x) => `<option value="${x.id}">${esc(x.nombre)}</option>`).join('')}</select></label>
        <label class="field"><span>Llegó por</span><select class="select" name="origen">${['whatsapp', 'instagram', 'recepcion'].map((k) => `<option value="${k}">${ORIGENES[k]}</option>`).join('')}</select></label>
        <label class="field full"><span>Nota</span><input class="input" name="nota"></label>
      </div>
      <button class="btn btn-primary btn-block" type="submit">Guardar cita confirmada</button>
    </form>`;
  const f = $('#new-cita');
  const fillHours = () => {
    const slots = slotsFor(f.sede.value, f.fecha.value);
    f.hora.innerHTML = slots.filter((x) => x.libre).map((x) => `<option ${x.hora === prefill.hora ? 'selected' : ''}>${x.hora}</option>`).join('') || '<option value="">Sin horarios</option>';
  };
  fillHours();
  f.sede.addEventListener('change', fillHours);
  f.fecha.addEventListener('change', fillHours);
  f.nombre.addEventListener('change', () => { const m = s.pacientes.find((x) => x.nombre === f.nombre.value); if (m) { f.telefono.value = m.telefono; f.sede.value = m.sede; fillHours(); } });
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!f.hora.value) { toast('No hay horarios libres ese día.'); return; }
    const c = addCita({ nombre: f.nombre.value.trim(), telefono: f.telefono.value.trim(), sede: f.sede.value, fecha: f.fecha.value, hora: f.hora.value,
      doctor: f.doctor.value, tratamientos: [f.tratamiento.value], origen: f.origen.value, nota: f.nota.value.trim() });
    update((st) => { const x = st.citas.find((y) => y.id === c.id); if (x) x.estado = 'confirmada'; });
    closeModal();
    ui.agendaDate = c.fecha;
    toast(`Cita ${c.codigo} guardada.`);
    if (ui.view !== 'agenda') go('agenda'); else render();
  });
  $('#modal').classList.add('is-open');
  setTimeout(() => f.nombre.focus(), 50);
}
function closeModal() { $('#modal').classList.remove('is-open'); }

function confirmReset() {
  $('#modal-card').innerHTML = `
    <div class="modal-head"><h2 class="display">¿Restablecer la maqueta?</h2></div>
    <p class="note" style="margin:10px 0 20px">Se borran las citas, pacientes y cambios hechos en este navegador y se cargan de nuevo los datos de demostración.</p>
    <div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-ghost btn-sm" data-modal-close>Cancelar</button><button class="btn btn-primary btn-sm" data-reset-ok>Restablecer</button></div>`;
  $('#modal').classList.add('is-open');
}

/* ---------- Eventos ---------- */

function markContact(key, on = true) {
  update((s) => { if (on) s.contactados[key] = new Date().toISOString(); else delete s.contactados[key]; });
}

function bind() {
  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    try { sessionStorage.setItem('med.admin', '1'); } catch { /* sin almacenamiento */ }
    $('#login').classList.add('is-hidden');
  });
  $('#side-toggle').addEventListener('click', () => $('#side').classList.toggle('is-open'));
  $('#scrim').addEventListener('click', closeDrawer);
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeDrawer(); } });
  addEventListener('hashchange', () => go(location.hash.slice(1)));

  document.addEventListener('click', (e) => {
    const t = e.target.closest('a, button, tr[data-paciente]');
    if (!t) return;
    const ds = t.dataset;
    if (ds.nav) { e.preventDefault(); go(ds.nav); return; }
    if ('close' in ds) { closeDrawer(); return; }
    if ('modalClose' in ds) { closeModal(); return; }
    if (ds.cita) { openCita(ds.cita); return; }
    if (ds.paciente) { openPaciente(ds.paciente); return; }
    if (ds.newCita != null && t.tagName !== 'FORM') {
      const [se, h] = (ds.newCita || '').split('|');
      closeDrawer();
      openNewCita({ sede: se || undefined, hora: h, paciente: ds.for });
      return;
    }
    if (ds.estado) { setEstado(ds.citaId, ds.estado); return; }
    if (ds.day != null) {
      const n = Number(ds.day);
      ui.agendaDate = n === 0 ? iso(today()) : iso(addDays(parseISO(ui.agendaDate), n));
      render();
      return;
    }
    if (ds.sedeF) { ui.agendaSede = ds.sedeF; render(); return; }
    if (ds.seg) { ui.seg = ds.seg; render(); return; }
    if (ds.cat) { ui.cat = ds.cat; render(); return; }
    if (ds.contactar) {
      // Si es el enlace de WhatsApp, se deja abrir y se repinta después.
      markContact(ds.contactar);
      if (t.tagName === 'BUTTON') { toast('Marcado como contactado.'); render(); } else setTimeout(render, 80);
      return;
    }
    if (ds.uncontact) { markContact(ds.uncontact, false); render(); return; }
    if (ds.alertRm) {
      const [pid, i] = ds.alertRm.split('|');
      update((s) => { s.pacientes.find((x) => x.id === pid)?.alertas.splice(Number(i), 1); });
      openPaciente(pid);
      return;
    }
    if ('reset' in ds) { confirmReset(); return; }
    if ('resetOk' in ds) { resetDemo(); closeModal(); toast('Maqueta restablecida.'); go('resumen'); }
  });

  document.addEventListener('keydown', (e) => {
    const tr = e.target.closest?.('tr[data-paciente]');
    if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPaciente(tr.dataset.paciente); }
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-search]')) {
      ui.q = t.value;
      const pos = t.selectionStart;
      render();
      const n = $('[data-search]');
      n.focus();
      n.setSelectionRange(pos, pos);
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-pick-day]') && t.value) { ui.agendaDate = t.value; render(); return; }
    if (t.dataset.tr) {
      const k = t.dataset.k;
      update((s) => {
        const x = s.tratamientos.find((y) => y.id === t.dataset.tr);
        if (!x) return;
        if (k === 'activo' || k === 'destacado') x[k] = t.checked;
        else if (k === 'precio') x.precio = t.value === '' ? null : Math.max(0, Number(t.value));
        else if (k === 'dur') x.dur = t.value === '' ? null : Number(t.value);
        else x[k] = t.value.trim() || x[k];
      });
      toast('Guardado. Ya se ve en el sitio.');
      return;
    }
    if (t.dataset.gift) { update((s) => { const g = s.giftcards.find((x) => x.id === t.dataset.gift); if (g) g.estado = t.value; }); toast('Gift card actualizada.'); render(); return; }
    if (t.dataset.citaDoc) { update((s) => { const c = s.citas.find((x) => x.id === t.dataset.citaDoc); if (c) c.doctor = t.value; }); toast('Médico asignado.'); return; }
    if (t.dataset.consent) { update((s) => { const p = s.pacientes.find((x) => x.id === t.dataset.consent); if (p) p.consentimiento = t.checked; }); return; }
    if (t.dataset.notas) { update((s) => { const p = s.pacientes.find((x) => x.id === t.dataset.notas); if (p) p.notas = t.value; }); toast('Notas guardadas.'); return; }
    if (t.dataset.sedeOn) {
      const on = t.checked;
      if (!on && activeSedes().length === 1) { t.checked = true; toast('Debe quedar al menos una sede activa.'); return; }
      update((s) => { s.sedes.find((x) => x.id === t.dataset.sedeOn).activa = on; });
      toast(on ? 'Sede visible en el sitio.' : 'Sede oculta en el sitio.');
      return;
    }
    if (t.dataset.sedeH) {
      const [id, k, i] = t.dataset.sedeH.split('|');
      update((s) => { s.sedes.find((x) => x.id === id).horario[k][Number(i)] = t.value; });
      toast('Horario actualizado.');
      return;
    }
    if (t.matches('[data-escultura]')) { update((s) => { s.settings.escultura = t.value; }); toast('Escultura por defecto actualizada.'); return; }
    if (t.dataset.docOn) { update((s) => { s.doctores.find((x) => x.id === t.dataset.docOn).activo = t.checked; }); toast('Equipo actualizado.'); }
  });

  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.dataset.form === 'campana') {
      e.preventDefault();
      update((s) => { Object.assign(s.settings.campana, { activa: f.activa.checked, titulo: f.titulo.value.trim(), texto: f.texto.value.trim(), cta: f.cta.value.trim(), href: f.href.value.trim() || '#regalo' }); });
      toast('Campaña guardada. Mírala en el sitio.');
    } else if (f.dataset.form === 'contacto') {
      e.preventDefault();
      update((s) => {
        const st = s.settings;
        st.whatsapp = f.whatsapp.value.replace(/\D/g, '') || st.whatsapp;
        st.whatsappDisplay = f.whatsappDisplay.value.trim();
        st.email = f.email.value.trim();
        st.instagram = f.instagram.value.trim().replace(/^@/, '');
        st.cabinas = Math.max(1, Math.min(6, Number(f.cabinas.value) || 2));
      });
      toast('Contacto guardado.');
    } else if (f.dataset.reg) {
      e.preventDefault();
      const pid = f.dataset.reg;
      const zonas = [...f.querySelectorAll('[name="z"]:checked')].map((x) => x.value);
      update((s) => {
        const p = s.pacientes.find((x) => x.id === pid);
        p.historial.unshift({ fecha: f.f.value, tratamiento: f.t.value, zonas, detalle: f.d.value.trim(), doctor: f.doc.value });
        p.historial.sort((a, b) => b.fecha.localeCompare(a.fecha));
      });
      toast('Tratamiento registrado. Entra al seguimiento automático.');
      openPaciente(pid);
    } else if (f.dataset.alertAdd) {
      e.preventDefault();
      const v = f.a.value.trim();
      if (!v) return;
      update((s) => { s.pacientes.find((x) => x.id === f.dataset.alertAdd).alertas.push(v); });
      openPaciente(f.dataset.alertAdd);
    }
  });
}

/* ---------- Inicio ---------- */

initTheme();
bind();
try { if (sessionStorage.getItem('med.admin')) $('#login').classList.add('is-hidden'); } catch { /* sin almacenamiento */ }
// Las vistas de edición (precios, ajustes) no se repintan al guardar para no perder el foco.
onChange(() => {
  if ($('#drawer').classList.contains('is-open') || ['tratamientos', 'ajustes'].includes(ui.view)) renderNav();
  else setTimeout(render, 80);
});
go(location.hash.slice(1) || 'resumen');
