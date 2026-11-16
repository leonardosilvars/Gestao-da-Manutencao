/* ===== Interface ===== */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (v, d = 0) => v == null || isNaN(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const n0 = v => nf(v, 0), n1 = v => nf(v, 1), n2 = v => nf(v, 2);
const pc = (v, d = 1) => v == null ? '—' : nf(v, d) + '%';
const COL = { blue: '#3b82f6', green: '#22c55e', amber: '#f59e0b', orange: '#fb923c', purple: '#a78bfa', red: '#f87171', cyan: '#22d3ee', gray: '#6b82ab' };
const CT_COL = [COL.blue, COL.amber, COL.purple];
const OG_COL = { 1: COL.red, 2: COL.blue, 3: COL.amber };
const IC = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  calcheck: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  hourglass: '<path d="M6 2h12M6 22h12M7 2v4l5 6-5 6v4M17 2v4l-5 6 5 6v4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  bars: '<path d="M5 21V10M12 21V4M19 21v-8"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  pie: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  star: '<polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
};
const ic = n => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>';

/* ---------- dica flutuante ---------- */
const tipEl = document.getElementById('tip');
function showTip(html, ev) { tipEl.innerHTML = html; tipEl.style.display = 'block'; moveTip(ev); }
function moveTip(ev) {
  const p = 14, w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let x = ev.clientX + p, y = ev.clientY + p;
  if (x + w > innerWidth - 8) x = ev.clientX - w - p;
  if (y + h > innerHeight - 8) y = ev.clientY - h - p;
  tipEl.style.transform = 'translate(' + Math.max(4, x) + 'px,' + Math.max(4, y) + 'px)';
}
const hideTip = () => { tipEl.style.display = 'none'; };
const tipRows = (title, rows) => '<b>' + esc(title) + '</b>' + rows.filter(r => r.v != null && r.v !== '').map(r =>
  '<div><span>' + (r.c ? '<i style="background:' + r.c + '"></i>' : '') + esc(r.n) + '</span><b style="margin:0">' + esc(r.v) + '</b></div>').join('');

/* ---------- escalas ---------- */
function niceNum(x, round) {
  const e = Math.floor(Math.log10(x)), f = x / Math.pow(10, e);
  const nfv = round ? (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) : (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10);
  return nfv * Math.pow(10, e);
}
function scale(min, max, cnt = 4) {
  if (max <= min) max = min + 1;
  const step = niceNum((max - min) / cnt, true), lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step, t = [];
  for (let v = lo; v <= hi + step / 2; v += step) t.push(+v.toFixed(10));
  return { lo, hi, t };
}
let uid = 0;
const emptyMsg = host => { host.innerHTML = '<div class="empty">Sem dados para os filtros selecionados</div>'; };
const xStep = (n, iw, minPx = 52) => Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / minPx))));

/* ---------- gráfico de linhas ---------- */
function lineChart(host, c) {
  const W = Math.max(180, host.clientWidth || 600), H = c.h || 230, m = { l: W < 340 ? 40 : 50, r: 58, t: 14, b: 28 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b, n = c.labels.length;
  const all = c.series.flatMap(s => s.vals).filter(v => v != null);
  if (!all.length) return emptyMsg(host);
  let mn = Math.min(...all), mx = Math.max(...all);
  if (c.ref) { mn = Math.min(mn, c.ref.v); mx = Math.max(mx, c.ref.v); }
  if (c.zero) mn = 0; else { const pd = (mx - mn) * .15 || 1; mn -= pd; mx += pd; }
  if (c.cap != null) mx = Math.min(mx, c.cap);
  const sc = scale(mn, mx); if (c.cap != null) { sc.hi = Math.min(sc.hi, c.cap); sc.t = sc.t.filter(v => v <= c.cap + 1e-9); }
  const X = i => m.l + (n === 1 ? iw / 2 : i * iw / (n - 1)), Y = v => m.t + ih - (v - sc.lo) / (sc.hi - sc.lo) * ih;
  const id = 'lg' + (++uid), fy = c.yfmt || n0;
  let s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(c.aria || 'Gráfico de linhas') + '"><defs>';
  c.series.forEach((se, k) => { s += '<linearGradient id="' + id + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + se.color + '" stop-opacity=".25"/><stop offset="1" stop-color="' + se.color + '" stop-opacity="0"/></linearGradient>'; });
  s += '</defs>';
  if (c.hl) { const w = n === 1 ? iw : iw / (n - 1); c.hl.forEach((h, i) => { if (h) s += '<rect x="' + (X(i) - w / 2) + '" y="' + m.t + '" width="' + w + '" height="' + ih + '" fill="#5b86e8" opacity=".12"/>'; }); }
  sc.t.forEach(v => { const y = Y(v); s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y + '" y2="' + y + '" stroke="rgba(120,160,240,.14)"/><text class="axis" x="' + (m.l - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + fy(v) + '</text>'; });
  const st = xStep(n, iw);
  c.labels.forEach((l, i) => { if (i % st === 0) s += '<text class="axis" x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + '</text>'; });
  if (c.ref) { const y = Y(c.ref.v); s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y + '" y2="' + y + '" stroke="#fff" stroke-opacity=".55" stroke-dasharray="5 4"/><text class="axis" x="' + (W - m.r + 6) + '" y="' + (y + 4) + '" style="fill:#cfdcf7">' + esc(c.ref.label) + '</text>'; }
  const bub = [];
  c.series.forEach((se, k) => {
    let d = '', ad = '', seg = [];
    const flush = () => { if (seg.length > 1) { d += 'M' + seg.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'); ad += 'M' + seg[0][0] + ' ' + (m.t + ih) + 'L' + seg.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'L' + seg[seg.length - 1][0] + ' ' + (m.t + ih) + 'Z'; } seg = []; };
    se.vals.forEach((v, i) => { if (v == null) flush(); else seg.push([X(i), Y(v)]); }); flush();
    if (se.area !== false) s += '<path d="' + ad + '" fill="url(#' + id + k + ')"/>';
    s += '<path d="' + d + '" fill="none" stroke="' + se.color + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"' + (se.dash ? ' stroke-dasharray="6 4"' : '') + '/>';
    se.vals.forEach((v, i) => { if (v != null && n <= 16) s += '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="3.5" fill="' + se.color + '" stroke="#0a1b3f" stroke-width="1.5"/>'; });
    let li = -1; se.vals.forEach((v, i) => { if (v != null) li = i; });
    if (li >= 0) bub.push({ y: Y(se.vals[li]), x: X(li), t: (se.fmt || fy)(se.vals[li]), color: se.color });
  });
  bub.sort((a, b) => a.y - b.y); for (let i = 1; i < bub.length; i++) if (bub[i].y - bub[i - 1].y < 20) bub[i].y = bub[i - 1].y + 20;
  bub.forEach(b => { s += '<circle cx="' + b.x + '" cy="' + (b.y) + '" r="0"/><rect x="' + (W - m.r + 4) + '" y="' + (b.y - 10) + '" width="52" height="20" rx="6" fill="' + b.color + '"/><text x="' + (W - m.r + 30) + '" y="' + (b.y + 4) + '" text-anchor="middle" style="fill:#fff;font-size:11px;font-weight:800;font-family:var(--font)">' + esc(b.t) + '</text>'; });
  s += '<line id="' + id + 'g" x1="0" x2="0" y1="' + m.t + '" y2="' + (m.t + ih) + '" stroke="#9db8ee" stroke-opacity=".6" style="display:none"/>';
  s += '<rect id="' + id + 'o" x="' + m.l + '" y="' + m.t + '" width="' + iw + '" height="' + ih + '" fill="transparent"/></svg>';
  host.innerHTML = s;
  const ov = host.querySelector('#' + id + 'o'), gl = host.querySelector('#' + id + 'g');
  const at = ev => { const r = ov.getBoundingClientRect(); return Math.max(0, Math.min(n - 1, Math.round((ev.clientX - r.left) / r.width * (n - 1)))); };
  ov.addEventListener('mousemove', ev => {
    const i = at(ev); gl.setAttribute('x1', X(i)); gl.setAttribute('x2', X(i)); gl.style.display = '';
    showTip(tipRows(c.labels[i] + (c.subs ? ' · ' + c.subs[i] : ''), c.series.map(se => ({ n: se.name, c: se.color, v: se.vals[i] == null ? null : (se.fmt || fy)(se.vals[i]) }))), ev);
  });
  ov.addEventListener('mouseleave', () => { gl.style.display = 'none'; hideTip(); });
}

/* ---------- gráfico de barras (simples, empilhado, com linha no eixo direito) ---------- */
function barChart(host, c) {
  const W = Math.max(180, host.clientWidth || 600), H = c.h || 230, nar = W < 340, m = { l: nar ? 40 : 50, r: c.line ? 54 : (nar ? 8 : 16), t: 16, b: 28 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b, n = c.labels.length;
  const tot = c.labels.map((_, i) => c.stacked ? c.series.reduce((a, s) => a + (s.vals[i] || 0), 0) : Math.max(0, ...c.series.map(s => s.vals[i] || 0)));
  if (!tot.some(v => v > 0) && !(c.line && c.line.vals.some(v => v != null))) return emptyMsg(host);
  let mx = Math.max(...tot, c.ref ? c.ref.v : 0, 0.0001); if (c.cap != null) mx = Math.min(mx, c.cap);
  const sc = scale(0, mx * (c.cap != null ? 1 : 1.08)); if (c.cap != null) { sc.hi = Math.min(sc.hi, c.cap); sc.t = sc.t.filter(v => v <= c.cap + 1e-9); }
  const Y = v => m.t + ih - v / sc.hi * ih, fy = c.yfmt || n0;
  let sr = null;
  if (c.line) { const lv = c.line.vals.filter(v => v != null); sr = scale(0, Math.max(...lv, 1) * 1.1); if (c.line.cap != null) { sr.hi = Math.min(sr.hi, c.line.cap); sr.t = sr.t.filter(v => v <= c.line.cap + 1e-9); } }
  const YR = v => m.t + ih - v / sr.hi * ih, slot = iw / n, bw = Math.min(slot * .64, 44), id = 'bc' + (++uid);
  let s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(c.aria || 'Gráfico de barras') + '">';
  sc.t.forEach(v => { const y = Y(v); s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y + '" y2="' + y + '" stroke="rgba(120,160,240,.14)"/><text class="axis" x="' + (m.l - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + fy(v) + '</text>'; });
  if (sr) sr.t.forEach(v => { s += '<text class="axis" x="' + (W - m.r + 8) + '" y="' + (YR(v) + 4) + '" style="fill:' + c.line.color + '">' + (c.line.yfmt || n0)(v) + '</text>'; });
  const st = xStep(n, iw, n <= 6 ? 40 : 58);
  c.labels.forEach((l, i) => {
    const cx = m.l + slot * i + slot / 2, dim = c.hl && !c.hl[i] ? .38 : 1; let acc = 0;
    c.series.forEach((se, k) => {
      const v = se.vals[i] || 0; if (v <= 0) return;
      const col = c.colorFn ? c.colorFn(i, v, k) : se.color, y0 = Y(acc + v), h = Y(acc) - y0;
      s += '<rect x="' + (cx - bw / 2) + '" y="' + y0 + '" width="' + bw + '" height="' + Math.max(1, h) + '" rx="' + (c.stacked ? 2 : 4) + '" fill="' + col + '" opacity="' + dim + '"/>';
      if (c.stacked) acc += v;
    });
    if (!c.stacked && !c.line && n <= 14 && c.series[0].vals[i] != null) s += '<text x="' + cx + '" y="' + (Y(c.series[0].vals[i] || 0) - 6) + '" text-anchor="middle" style="fill:#e5edff;font-size:11px;font-weight:700;font-family:var(--font)">' + (c.vfmt || fy)(c.series[0].vals[i]) + '</text>';
    if (i % st === 0) s += '<text class="axis" x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + '</text>';
  });
  if (c.ref) { const y = Y(c.ref.v); s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y + '" y2="' + y + '" stroke="#fff" stroke-opacity=".6" stroke-dasharray="5 4"/><rect x="' + (W - m.r - 70) + '" y="' + (y - 19) + '" width="70" height="16" rx="5" fill="#0b1a3a" opacity=".92"/><text class="axis" x="' + (W - m.r - 6) + '" y="' + (y - 7) + '" text-anchor="end" style="fill:#e0e9ff;font-weight:700">' + esc(c.ref.label) + '</text>'; }
  if (c.line) {
    let d = '', seg = []; const fl = () => { if (seg.length > 1) d += 'M' + seg.join('L'); seg = []; };
    c.line.vals.forEach((v, i) => { if (v == null) fl(); else seg.push((m.l + slot * i + slot / 2).toFixed(1) + ' ' + YR(v).toFixed(1)); }); fl();
    s += '<path d="' + d + '" fill="none" stroke="' + c.line.color + '" stroke-width="2.6" stroke-linejoin="round"/>';
    c.line.vals.forEach((v, i) => { if (v != null && n <= 16) s += '<circle cx="' + (m.l + slot * i + slot / 2) + '" cy="' + YR(v) + '" r="3.8" fill="' + c.line.color + '" stroke="#0a1b3f" stroke-width="1.5"/>'; if (v != null && n <= 8) s += '<text x="' + (m.l + slot * i + slot / 2) + '" y="' + (YR(v) - 9) + '" text-anchor="middle" style="fill:' + c.line.color + ';font-size:11px;font-weight:800;font-family:var(--font)">' + (c.line.fmt || n1)(v) + '</text>'; });
  }
  s += '<rect id="' + id + '" x="' + m.l + '" y="' + m.t + '" width="' + iw + '" height="' + ih + '" fill="transparent"/></svg>';
  host.innerHTML = s;
  const ov = host.querySelector('#' + id);
  ov.addEventListener('mousemove', ev => {
    const r = ov.getBoundingClientRect(), i = Math.max(0, Math.min(n - 1, Math.floor((ev.clientX - r.left) / r.width * n)));
    const rows = c.series.map(se => ({ n: se.name, c: se.color, v: se.vals[i] ? (se.fmt || c.vfmt || fy)(se.vals[i]) : (c.stacked ? null : (se.vals[i] == null ? null : (se.fmt || c.vfmt || fy)(se.vals[i]))) }));
    if (c.stacked && c.series.length > 1) rows.push({ n: 'Total', v: (c.vfmt || fy)(tot[i]) });
    if (c.line) rows.push({ n: c.line.name, c: c.line.color, v: c.line.vals[i] == null ? '—' : (c.line.fmt || n1)(c.line.vals[i]) });
    showTip(tipRows(c.labels[i] + (c.subs ? ' · ' + c.subs[i] : ''), rows), ev);
  });
  ov.addEventListener('mouseleave', hideTip);
}

/* ---------- barras horizontais (HTML) ---------- */
function hbars(host, c) {
  if (!c.rows.length) return emptyMsg(host);
  const lo = c.min || 0, hi = c.max != null ? c.max : Math.max(...c.rows.map(r => r.v), 0.0001);
  host.innerHTML = c.rows.map(r => {
    const w = Math.max(0, Math.min(100, (r.v - lo) / (hi - lo) * 100)), col = r.color || (c.colorFn ? c.colorFn(r.v) : c.color || COL.blue);
    return '<div class="hb" title="' + esc(r.label + ': ' + (c.fmt || n0)(r.v)) + '"><div class="lb">' + esc(r.label) + '</div><div class="tr"><div class="fi" style="width:' + w + '%;background:' + col + '"></div>' +
      (c.ref != null ? '<div class="rf" style="left:' + ((c.ref - lo) / (hi - lo) * 100) + '%"></div>' : '') + '</div><div class="vl">' + (c.fmt || n0)(r.v) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</div></div>';
  }).join('');
}

/* ---------- rosca ---------- */
function donut(host, c) {
  const total = c.items.reduce((a, b) => a + b.v, 0);
  if (!total) return emptyMsg(host);
  const R = 60, SW = 20, C = 2 * Math.PI * R; let off = 0, arcs = '';
  c.items.forEach((it, i) => {
    if (it.v <= 0) return; const len = it.v / total * C;
    arcs += '<circle data-i="' + i + '" cx="80" cy="80" r="' + R + '" fill="none" stroke="' + it.color + '" stroke-width="' + SW + '" stroke-dasharray="' + Math.max(0, len - 1.5) + ' ' + (C - len + 1.5) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 80 80)"/>';
    off += len;
  });
  const svg = '<svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="' + esc(c.aria || 'Gráfico de rosca') + '">' + arcs +
    '<text x="80" y="82" text-anchor="middle" style="fill:#fff;font-size:26px;font-weight:800;font-family:var(--font)">' + esc(c.big != null ? c.big : n0(total)) + '</text><text x="80" y="102" text-anchor="middle" class="axis" style="font-size:12px">' + esc(c.small || '') + '</text></svg>';
  const lg = c.items.map(it => '<li><i style="background:' + it.color + '"></i><b>' + esc(it.name) + '</b><span>' + n0(it.v) + ' · ' + pc(it.v / total * 100) + '</span></li>').join('');
  host.innerHTML = '<div class="dn">' + svg + '<ul>' + lg + '</ul></div>';
  host.querySelectorAll('circle[data-i]').forEach(ci => {
    const it = c.items[+ci.dataset.i];
    ci.addEventListener('mousemove', ev => showTip(tipRows(it.name, [{ n: 'Quantidade', v: n0(it.v), c: it.color }, { n: 'Participação', v: pc(it.v / total * 100) }]), ev));
    ci.addEventListener('mouseleave', hideTip);
  });
}

/* ---------- sparkline ---------- */
function spark(vals, color) {
  const v = vals.filter(x => x != null); if (v.length < 2) return '';
  const mn = Math.min(...v), mx = Math.max(...v), W = 120, H = 40, rg = (mx - mn) || 1, id = 'sp' + (++uid);
  const pts = []; vals.forEach((x, i) => { if (x != null) pts.push([i * W / (vals.length - 1), H - 5 - (x - mn) / rg * (H - 12)]); });
  const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'), last = pts[pts.length - 1];
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".3"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs><path d="' + d + 'L' + W + ' ' + H + 'L0 ' + H + 'Z" fill="url(#' + id + ')"/><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="2.6" fill="' + color + '"/></svg>';
}

/* ---------- blocos de layout ---------- */
function kpi(o) {
  const dl = o.delta ? '<div class="dl ' + (o.delta.good ? 'pos' : 'neg') + '">' + o.delta.txt + '<span>' + o.delta.lb + '</span></div>' : '<div class="dl">' + (o.sub || '&nbsp;') + '</div>';
  return '<div class="kpi"><div class="hd"><span class="ico" style="background:' + o.color + '">' + ic(o.icon) + '</span><span class="lb">' + esc(o.label) + '</span></div><div class="vl">' + o.value + (o.unit ? '<small>' + o.unit + '</small>' : '') + '</div><div class="sp">' + (o.spark || '') + '</div>' + dl + '</div>';
}
function panel(o) {
  return '<section class="panel ' + (o.cls || '') + '"><header><span class="pi" style="background:' + (o.color || COL.blue) + '">' + ic(o.icon || 'bars') + '</span><h3>' + esc(o.title) + '</h3>' + (o.right || '') + '</header>' + (o.hint ? '<div class="hint">' + o.hint + '</div>' : '') + (o.legend ? '<div class="legend">' + o.legend.map(l => '<span><i style="background:' + l[1] + '"></i>' + esc(l[0]) + '</span>').join('') + '</div>' : '') + '<div class="chart" id="' + o.id + '">' + (o.body || '') + '</div></section>';
}
const seg = (key, cur) => '<div class="seg" role="group" aria-label="Granularidade">' + [['month', 'Mês'], ['week', 'Semana']].map(g => '<button data-seg="' + key + '" data-v="' + g[0] + '" class="' + (cur === g[0] ? 'on' : '') + '" aria-pressed="' + (cur === g[0]) + '">' + g[1] + '</button>').join('') + '</div>';
function table(cols, rows) {
  if (!rows.length) return '<div class="empty">Nenhum registro para os filtros selecionados</div>';
  return '<div class="tw"><table><thead><tr>' + cols.map(c => '<th class="' + (c.r ? 'r' : '') + '">' + esc(c.h) + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map(r => '<tr>' + cols.map(c => '<td class="' + (c.r ? 'r ' : '') + (c.wrap ? 'wrap' : '') + '">' + c.f(r) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
}
const pill = (t, k) => '<span class="pill ' + k + '">' + esc(t) + '</span>';

/* ---------- estado ---------- */
const SCREENS = {
  'visao-geral': { nav: 'Visão Geral', icon: 'home', h1: 'Gestão da Manutenção', sub: 'Indicadores estratégicos para uma operação mais confiável' },
  'confiabilidade': { nav: 'Confiabilidade', icon: 'activity', h1: 'Confiabilidade', sub: 'MTBF, MTTR e disponibilidade dos equipamentos' },
  'aderencia': { nav: 'Aderência', icon: 'calcheck', h1: 'Aderência à Programação Semanal', sub: 'Preventivas e preditivas executadas na semana em que foram programadas' },
  'backlog': { nav: 'Backlog', icon: 'layers', h1: 'Backlog de Manutenção', sub: 'Ordens abertas, tempo em aberto e situação' },
  'fora-programacao': { nav: 'Fora da Programação', icon: 'alert', h1: 'Corretivas Fora da Programação', sub: 'Ocorrências executadas sem programação prévia' },
};
const S = { screen: 'visao-geral', F: defaultF(), gran: { vg: 'month', rel: 'month', ad: 'week', fp: 'week' } };

const SKY = '<svg class="skyline" viewBox="0 0 208 230" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="skg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a3d86" stop-opacity="0"/><stop offset="1" stop-color="#2b63c9" stop-opacity=".55"/></linearGradient><radialGradient id="glw"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs><rect width="208" height="230" fill="url(#skg)"/><g fill="#0b2150"><rect x="0" y="196" width="208" height="34"/><rect x="14" y="150" width="34" height="46" rx="3"/><rect x="56" y="162" width="26" height="34" rx="3"/><rect x="92" y="108" width="9" height="88"/><rect x="108" y="126" width="9" height="70"/><rect x="128" y="88" width="14" height="108"/><rect x="150" y="140" width="40" height="56" rx="4"/><rect x="172" y="70" width="8" height="126"/><rect x="40" y="130" width="8" height="20"/></g><g fill="#12306e"><rect x="18" y="156" width="26" height="40" rx="2"/><rect x="154" y="146" width="32" height="50" rx="2"/><rect x="130" y="96" width="10" height="100"/></g><g stroke="#0b2150" stroke-width="3" fill="none"><path d="M82 175H92M117 170H128M48 190H92"/></g><g fill="url(#glw)"><circle cx="97" cy="104" r="9"/><circle cx="176" cy="66" r="9"/><circle cx="135" cy="84" r="8"/></g><g fill="#ffd9a0"><circle cx="97" cy="104" r="1.6"/><circle cx="176" cy="66" r="1.6"/><circle cx="135" cy="84" r="1.6"/><circle cx="30" cy="170" r="1.2"/><circle cx="36" cy="178" r="1.2"/><circle cx="165" cy="160" r="1.2"/><circle cx="175" cy="170" r="1.2"/><circle cx="66" cy="176" r="1.2"/></g></svg>';
const LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="#fff"><rect x="12" y="40" width="8" height="14" rx="2"/><rect x="24" y="32" width="8" height="22" rx="2"/><rect x="36" y="24" width="8" height="30" rx="2"/><path d="M46 12h10v10l-3.6-3.6L43 27.8l-5.4-5.4 9.4-9.4z"/></g><circle cx="20" cy="20" r="8" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="3.6 3.1"/><circle cx="20" cy="20" r="3" fill="#fff"/></svg>';

function buildShell() {
  document.getElementById('app').innerHTML =
    '<aside class="side"><div class="brand">' + LOGO + '<b>Manutenção<br>Industrial</b></div><nav class="nav" aria-label="Telas">' +
    Object.entries(SCREENS).map(([k, v]) => '<button data-nav="' + k + '">' + ic(v.icon) + '<span>' + v.nav + '</span></button>').join('') +
    '</nav><div class="slogan">Manutenção eficiente, produção sustentável.</div>' + SKY + '</aside>' +
    '<main class="main" id="main"><div class="top"><div><h1 id="h1"></h1><p id="sub"></p></div><div class="topr"><button type="button" class="btn pri" id="btn-load">' + ic('upload') + 'Carregar planilha</button><div class="upd">' + ic('clock') + '<div><b id="upd-d"></b>Última atualização<span id="src-chip" class="chip"></span></div></div></div></div>' +
    '<div class="filters" id="filters"></div><div class="scope" id="scope"></div><div id="content"></div></main>';
}

function selHtml(id, label, opts, cur, cls) {
  return '<div class="fl ' + (cls || '') + '"><label for="' + id + '">' + label + '</label><select id="' + id + '">' + opts.map(o => '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></div>';
}
function renderFilters() {
  const F = S.F, noCt = S.screen === 'confiabilidade';
  const wk = WEEKS.map((w, i) => [i, w.label + ' · ' + w.range]).filter(([i]) => F.month < 0 || (WEEKS[i].a <= MONTHS[F.month].b && WEEKS[i].b >= MONTHS[F.month].a));
  const m0 = maskOf(F), m1 = maskOf({ ...F, eq: -1 });
  if (F.eq >= 0 && !m1[F.eq]) F.eq = -1;
  const eqs = EQ.filter(e => m1[e.i]).map(e => [e.i, e.tag + ' · ' + e.tipo]);
  document.getElementById('filters').innerHTML =
    selHtml('f-mes', 'Período', [[-1, 'Todo o período'], ...MONTHS.map((m, i) => [i, m.long])], F.month, 'wide') +
    selHtml('f-sem', 'Semana do ano', [[-1, 'Todas'], ...wk], F.week, 'wide') +
    selHtml('f-area', 'Área', [['', 'Todas'], ...AREAS.map(a => [a, a])], F.area) +
    selHtml('f-ct', noCt ? 'Equipe (n/a)' : 'Equipe', [[-1, 'Todas'], ...CT_NAMES.map((n, i) => [i, n])], noCt ? -1 : F.ct, noCt ? 'off' : '') +
    selHtml('f-crit', 'Criticidade', [['', 'Todas'], ...CRITS.map(c => [c, 'Classe ' + c])], F.crit) +
    selHtml('f-tipo', 'Tipo de equipamento', [['', 'Todos'], ...TIPOS_EQ.map(t => [t, t])], F.tipo, 'wide') +
    selHtml('f-eq', 'Equipamento', [[-1, 'Todos'], ...eqs], F.eq, 'wide') +
    '<button class="reset" id="f-reset" type="button">Limpar filtros</button>';
  if (noCt) document.getElementById('f-ct').disabled = true;
  const on = (id, fn) => document.getElementById(id).addEventListener('change', e => { fn(e.target.value); renderAll(); });
  on('f-mes', v => { F.month = +v; F.week = -1; });
  on('f-sem', v => { F.week = +v; if (F.week >= 0) F.month = -1; });
  on('f-area', v => { F.area = v; });
  on('f-ct', v => { F.ct = +v; });
  on('f-crit', v => { F.crit = v; });
  on('f-tipo', v => { F.tipo = v; });
  on('f-eq', v => { F.eq = +v; });
  document.getElementById('f-reset').addEventListener('click', () => { S.F = defaultF(); renderAll(); });
}
function scopeText() {
  const r = rangeOf(S.F), F = S.F;
  const bits = ['<b>Período analisado:</b> ' + fmtD(r.a) + ' a ' + fmtD(r.b)];
  if (S.screen === 'backlog') bits.push('<b>Posição do backlog em:</b> ' + fmtD(r.b));
  const f = []; if (F.area) f.push(F.area); if (F.ct >= 0 && S.screen !== 'confiabilidade') f.push(CT_NAMES[F.ct]); if (F.crit) f.push('Classe ' + F.crit); if (F.tipo) f.push(F.tipo); if (F.eq >= 0) f.push(EQ[F.eq].tag);
  if (f.length) bits.push('<b>Filtros:</b> ' + esc(f.join(' · ')));
  const nEq = countMask(maskOf(F)); bits.push(nEq + ' equipamento' + (nEq === 1 ? '' : 's'));
  return bits.join(' &nbsp;·&nbsp; ');
}

/* ---------- cálculos compartilhados entre telas ---------- */
function ctx() {
  const F = S.F, r = rangeOf(F), mask = maskOf(F), ct = F.ct, all = F.week < 0 && F.month < 0;
  let prev = null, lb = '';
  if (F.week > 0) { prev = { a: WEEKS[F.week - 1].a, b: WEEKS[F.week - 1].b }; lb = 'vs. semana ant.'; }
  else if (F.month > 0) { prev = { a: MONTHS[F.month - 1].a, b: MONTHS[F.month - 1].b }; lb = 'vs. mês ant.'; }
  return { F, r, mask, ct, all, prev, lb };
}
function delta(cur, prev, o, lb) {
  if (cur == null || prev == null) return null;
  const d = o.pp ? cur - prev : (prev ? (cur - prev) / prev * 100 : null); if (d == null) return null;
  const good = o.goodUp ? d >= 0 : d <= 0;
  return { good, lb, txt: (d >= 0 ? '▲ +' : '▼ −') + nf(Math.abs(d), 1) + (o.pp ? ' p.p.' : '%') };
}
function granInfo(g, c) {
  const P = periods(g), sel = c.all ? null : P.map(p => inSel(p, c.r, false));
  return { P, labels: P.map(p => p.label), subs: P.map(p => p.sub), hl: sel };
}
function relTrend(g, c) { return granInfo(g, c).P.map(p => relStats(p.a, p.b, c.mask)); }
function aderTrend(g, c) { return granInfo(g, c).P.map(p => aderStats(p.a, p.b, c.mask, c.ct)); }
const dispCol = d => d >= 99.3 ? COL.green : d >= 98.5 ? COL.amber : COL.red;
const aderCol = v => v >= META_ADER ? COL.green : v >= META_ADER - 10 ? COL.amber : COL.red;

/* ---------- Visão Geral ---------- */
function screenVG() {
  const c = ctx(), g = S.gran.vg, cur = relStats(c.r.a, c.r.b, c.mask), pr = c.prev ? relStats(c.prev.a, c.prev.b, c.mask) : null;
  const ad = aderStats(c.r.a, c.r.b, c.mask, c.ct), adp = c.prev ? aderStats(c.prev.a, c.prev.b, c.mask, c.ct) : null;
  const bk = backlogAt(c.r.b, c.mask, c.ct), bkp = c.prev ? backlogAt(c.prev.b, c.mask, c.ct) : null;
  const fp = foraStats(c.r.a, c.r.b, c.mask, c.ct), fpp = c.prev ? foraStats(c.prev.a, c.prev.b, c.mask, c.ct) : null;
  const mR = MONTHS.map(m => relStats(m.a, m.b, c.mask)), mA = MONTHS.map(m => aderStats(m.a, m.b, c.mask, c.ct)), mB = MONTHS.map(m => backlogAt(m.b, c.mask, c.ct)), mF = MONTHS.map(m => foraStats(m.a, m.b, c.mask, c.ct));
  const sub = c.all ? 'Todo o período' : null;
  const K = [
    kpi({ icon: 'shield', color: '#16a34a', label: 'Disponibilidade', value: n2(cur.disp), unit: '%', delta: delta(cur.disp, pr && pr.disp, { pp: true, goodUp: true }, c.lb), sub, spark: spark(mR.map(x => x.disp), COL.green) }),
    kpi({ icon: 'clock', color: '#ea6a0c', label: 'MTBF', value: n0(cur.mtbf), unit: 'h', delta: delta(cur.mtbf, pr && pr.mtbf, { goodUp: true }, c.lb), sub, spark: spark(mR.map(x => x.mtbf), COL.orange) }),
    kpi({ icon: 'hourglass', color: '#7c4dff', label: 'MTTR', value: n1(cur.mttr), unit: 'h', delta: delta(cur.mttr, pr && pr.mttr, { goodUp: false }, c.lb), sub, spark: spark(mR.map(x => x.mttr), COL.purple) }),
    kpi({ icon: 'check', color: '#16a34a', label: 'Aderência à programação', value: n1(ad.pct), unit: '%', delta: delta(ad.pct, adp && adp.pct, { pp: true, goodUp: true }, c.lb), sub, spark: spark(mA.map(x => x.pct), COL.green) }),
    kpi({ icon: 'layers', color: '#0891b2', label: 'Backlog (ordens)', value: n0(bk.n), delta: delta(bk.n, bkp && bkp.n, { goodUp: false }, c.lb), sub: sub ? 'Em ' + fmtD(c.r.b) : null, spark: spark(mB.map(x => x.n), COL.cyan) }),
    kpi({ icon: 'alert', color: '#dc2626', label: 'Corretivas fora da programação', value: n1(fp.pct), unit: '%', delta: delta(fp.pct, fpp && fpp.pct, { pp: true, goodUp: false }, c.lb), sub, spark: spark(mF.map(x => x.pct), COL.red) }),
  ].join('');
  const types = execTypes(c.r.a, c.r.b, c.mask, c.ct);
  const rank = perEquip(c.r.a, c.r.b, c.mask).filter(x => x.f > 0).sort((a, b) => b.hp - a.hp).slice(0, 7);
  const ap = ad.byCt;
  /* pontos de atenção */
  const al = [];
  if (rank.length) { const t = rank[0]; al.push({ k: t.disp < 98.5 ? 'red' : 'amber', t: 'Equipamento com mais horas de parada', x: t.e.tag + ': ' + t.f + ' falhas e ' + n0(t.hp) + ' h parado (disponibilidade ' + pc(t.disp, 2) + ').' }); }
  if (ad.pct != null) al.push(ad.pct >= META_ADER ? { k: 'green', t: 'Aderência dentro da meta', x: pc(ad.pct) + ' das preventivas foram executadas na semana programada (meta ' + META_ADER + '%).' } : { k: ad.pct < META_ADER - 10 ? 'red' : 'amber', t: 'Aderência abaixo da meta', x: pc(ad.pct) + ' contra meta de ' + META_ADER + '%. ' + n0(ad.p - ad.e) + ' ordens fora da semana, ' + n0(ad.nao) + ' ainda não executadas.' });
  if (bk.a90 > 0) al.push({ k: 'amber', t: 'Backlog antigo', x: n0(bk.a90) + ' ordens abertas há mais de 90 dias, ' + n0(bk.mat + bk.par) + ' aguardando material ou parada.' });
  if (fp.pct != null && fp.pct >= 55) al.push({ k: 'amber', t: 'Muitas corretivas sem programação', x: n0(fp.fora) + ' de ' + n0(fp.ex) + ' corretivas (' + pc(fp.pct) + '); ' + n0(fp.prog) + ' não eram emergência e poderiam ter sido programadas.' });
  const gi = granInfo(g, c), tr = relTrend(g, c), ta = aderTrend(g, c);
  const html = '<div class="kpis">' + K + '</div><div class="g">' +
    panel({ id: 'vg-ev', cls: 'c6', title: 'Evolução dos indicadores', icon: 'chart', right: seg('vg', g), legend: [['Disponibilidade', COL.blue], ['Aderência à programação', COL.green]] }) +
    panel({ id: 'vg-tp', cls: 'c3', title: 'Tipos de manutenção', icon: 'pie', color: COL.cyan, hint: 'Ordens executadas no período' }) +
    panel({ id: 'vg-ar', cls: 'c3', title: 'Horas de parada por área', icon: 'bars', color: COL.orange }) + '</div><div class="g">' +
    panel({ id: 'vg-eq', cls: 'c4', title: 'Equipamentos críticos', icon: 'star', color: COL.amber, hint: 'Maior tempo parado no período' }) +
    panel({ id: 'vg-mt', cls: 'c4', title: 'MTBF e MTTR', icon: 'clock', color: COL.orange, legend: [['MTBF (h)', COL.blue], ['MTTR (h)', COL.orange]] }) +
    panel({ id: 'vg-al', cls: 'c4', title: 'Pontos de atenção', icon: 'alert', color: COL.red }) + '</div>' +
    '<p class="note">O filtro Equipe vale para aderência, backlog e corretivas fora da programação. Disponibilidade, MTBF e MTTR consideram todos os equipamentos filtrados.</p>';
  return { html, after() {
    const dispV = tr.map(x => x.disp), adV = ta.map(x => x.pct);
    lineChart(q('vg-ev'), { labels: gi.labels, subs: gi.subs, hl: gi.hl, h: 232, series: [{ name: 'Disponibilidade', color: COL.blue, vals: dispV, fmt: v => pc(v, 2) }, { name: 'Aderência', color: COL.green, vals: adV, fmt: v => pc(v) }], yfmt: v => nf(v, 0) + '%', cap: 100, ref: { v: META_ADER, label: 'Meta ' + META_ADER + '%' }, aria: 'Evolução da disponibilidade e da aderência' });
    donut(q('vg-tp'), { items: [{ name: 'Preventiva', v: types[1], color: COL.blue }, { name: 'Corretiva', v: types[0], color: COL.green }, { name: 'Preditiva', v: types[2], color: COL.orange }], small: 'Ordens' });
    barChart(q('vg-ar'), { labels: hpByArea(c.r.a, c.r.b, c.mask).map(x => x.k.replace('Processo ', 'Proc. ').replace(' e Expedição', '').replace('Tancagem', 'Tanque').replace('Utilidades', 'Utilid.')), series: [{ name: 'Horas de parada', color: COL.blue, vals: hpByArea(c.r.a, c.r.b, c.mask).map(x => x.v) }], colorFn: i => [COL.blue, COL.green, COL.orange, COL.purple][i], h: 210, vfmt: v => n0(v), yfmt: n0, aria: 'Horas de parada por área' });
    q('vg-eq').innerHTML = table([
      { h: 'Equipamento', f: r => '<span class="dot" style="background:' + dispCol(r.disp) + '"></span>' + esc(r.e.tag) },
      { h: 'Falhas', r: 1, f: r => n0(r.f) }, { h: 'MTBF (h)', r: 1, f: r => n0(r.mtbf) }, { h: 'Disp.', r: 1, f: r => pc(r.disp, 2) }], rank);
    barChart(q('vg-mt'), { labels: gi.labels, subs: gi.subs, hl: gi.hl, h: 232, series: [{ name: 'MTBF (h)', color: COL.blue, vals: tr.map(x => x.mtbf) }], line: { name: 'MTTR (h)', color: COL.orange, vals: tr.map(x => x.mttr), fmt: n1, yfmt: n0 }, vfmt: n0, aria: 'MTBF e MTTR' });
    q('vg-al').innerHTML = '<div class="al">' + (al.length ? al.map(a => '<div><i style="background:' + COL[a.k] + '"></i><p style="margin:0"><b>' + esc(a.t) + '</b><span>' + esc(a.x) + '</span></p></div>').join('') : '<div class="empty">Sem pontos de atenção para os filtros selecionados</div>') + '</div>';
  } };
}
const q = id => document.getElementById(id);

/* ---------- Confiabilidade ---------- */
function screenRel() {
  const c = ctx(), g = S.gran.rel, cur = relStats(c.r.a, c.r.b, c.mask), pr = c.prev ? relStats(c.prev.a, c.prev.b, c.mask) : null;
  const mR = MONTHS.map(m => relStats(m.a, m.b, c.mask)), sub = c.all ? 'Todo o período' : null;
  const K = [
    kpi({ icon: 'shield', color: '#16a34a', label: 'Disponibilidade', value: n2(cur.disp), unit: '%', delta: delta(cur.disp, pr && pr.disp, { pp: true, goodUp: true }, c.lb), sub, spark: spark(mR.map(x => x.disp), COL.green) }),
    kpi({ icon: 'clock', color: '#ea6a0c', label: 'MTBF', value: n0(cur.mtbf), unit: 'h', delta: delta(cur.mtbf, pr && pr.mtbf, { goodUp: true }, c.lb), sub, spark: spark(mR.map(x => x.mtbf), COL.orange) }),
    kpi({ icon: 'hourglass', color: '#7c4dff', label: 'MTTR', value: n1(cur.mttr), unit: 'h', delta: delta(cur.mttr, pr && pr.mttr, { goodUp: false }, c.lb), sub, spark: spark(mR.map(x => x.mttr), COL.purple) }),
    kpi({ icon: 'zap', color: '#dc2626', label: 'Falhas com parada', value: n0(cur.f), delta: delta(cur.f, pr && pr.f, { goodUp: false }, c.lb), sub, spark: spark(mR.map(x => x.f), COL.red) }),
    kpi({ icon: 'wrench', color: '#2563eb', label: 'Horas de parada', value: n0(cur.hp), unit: 'h', delta: delta(cur.hp, pr && pr.hp, { goodUp: false }, c.lb), sub, spark: spark(mR.map(x => x.hp), COL.blue) }),
  ].join('');
  const gi = granInfo(g, c), tr = relTrend(g, c), pe = perEquip(c.r.a, c.r.b, c.mask), top = pe.filter(x => x.f > 0).sort((a, b) => b.hp - a.hp);
  const dn = danoCounts(c.r.a, c.r.b, c.mask).slice(0, 8), mc = mttrByCt(c.r.a, c.r.b, c.mask), dg = dispGroup(c.r.a, c.r.b, c.mask, e => e.tipo).sort((a, b) => a.disp - b.disp);
  const html = '<div class="kpis">' + K + '</div><div class="g">' +
    panel({ id: 'rl-dp', cls: 'c6', title: 'Disponibilidade', icon: 'shield', color: '#16a34a', right: seg('rel', g) }) +
    panel({ id: 'rl-mt', cls: 'c6', title: 'MTBF e MTTR', icon: 'clock', color: COL.orange, legend: [['MTBF (h)', COL.blue], ['MTTR (h)', COL.orange]] }) + '</div><div class="g">' +
    panel({ id: 'rl-pe', cls: 'c4', title: 'Horas de parada por equipamento', icon: 'bars', color: COL.red, hint: 'Os 10 que mais ficaram parados' }) +
    panel({ id: 'rl-dn', cls: 'c4', title: 'Falhas por tipo de dano', icon: 'list', color: COL.amber, hint: 'Falhas com parada, principais danos' }) +
    panel({ id: 'rl-gr', cls: 'c4', title: 'MTTR e disponibilidade por grupo', icon: 'pie', color: COL.purple }) + '</div><div class="g">' +
    panel({ id: 'rl-tb', cls: 'c12', title: 'Ranking de equipamentos', icon: 'star', color: COL.amber, hint: 'Ordenado por horas de parada no período. Disponibilidade: verde a partir de 99,3%, amarelo a partir de 98,5%.' }) + '</div>';
  return { html, after() {
    lineChart(q('rl-dp'), { labels: gi.labels, subs: gi.subs, hl: gi.hl, h: 240, series: [{ name: 'Disponibilidade', color: COL.green, vals: tr.map(x => x.disp), fmt: v => pc(v, 2) }], yfmt: v => nf(v, 1) + '%', cap: 100, aria: 'Disponibilidade ao longo do tempo' });
    barChart(q('rl-mt'), { labels: gi.labels, subs: gi.subs, hl: gi.hl, h: 240, series: [{ name: 'MTBF (h)', color: COL.blue, vals: tr.map(x => x.mtbf) }], line: { name: 'MTTR (h)', color: COL.orange, vals: tr.map(x => x.mttr), fmt: n1, yfmt: n0 }, vfmt: n0, aria: 'MTBF e MTTR ao longo do tempo' });
    hbars(q('rl-pe'), { rows: top.slice(0, 10).map(x => ({ label: x.e.tag, v: x.hp, sub: x.f + ' falhas' })), color: COL.red, fmt: v => n0(v) + ' h' });
    hbars(q('rl-dn'), { rows: dn.map(x => ({ label: x.k, v: x.v })), color: COL.amber, fmt: n0 });
    q('rl-gr').innerHTML = '<div class="hint" style="margin-top:0">MTTR por equipe (h)</div><div id="rl-g1"></div><div class="hint" style="margin-top:12px">Disponibilidade por tipo de equipamento</div><div id="rl-g2"></div>';
    hbars(q('rl-g1'), { rows: mc.filter(x => x.v != null).map((x, i) => ({ label: x.k, v: x.v, sub: x.n + ' ordens', color: CT_COL[CT_NAMES.indexOf(x.k)] })), fmt: v => n1(v) + ' h' });
    const lo = dg.length ? Math.max(0, Math.floor(Math.min(...dg.map(x => x.disp))) - 1) : 0;
    hbars(q('rl-g2'), { rows: dg.map(x => ({ label: x.k, v: x.disp, sub: x.f + ' falhas' })), min: lo, max: 100, colorFn: dispCol, fmt: v => pc(v, 2) });
    q('rl-tb').innerHTML = table([
      { h: 'Equipamento', f: r => '<span class="dot" style="background:' + dispCol(r.disp) + '"></span>' + esc(r.e.tag) },
      { h: 'Tipo', f: r => esc(r.e.tipo) }, { h: 'Área', f: r => esc(r.e.area) }, { h: 'Crit.', f: r => esc(r.e.crit) },
      { h: 'Falhas', r: 1, f: r => n0(r.f) }, { h: 'Horas parado', r: 1, f: r => n0(r.hp) }, { h: 'MTBF (h)', r: 1, f: r => n0(r.mtbf) }, { h: 'MTTR (h)', r: 1, f: r => n1(r.mttr) }, { h: 'Disponibilidade', r: 1, f: r => pc(r.disp, 2) }], top.slice(0, 12));
  } };
}

/* ---------- Aderência ---------- */
function screenAd() {
  const c = ctx(), g = S.gran.ad, cur = aderStats(c.r.a, c.r.b, c.mask, c.ct), pr = c.prev ? aderStats(c.prev.a, c.prev.b, c.mask, c.ct) : null;
  const mA = MONTHS.map(m => aderStats(m.a, m.b, c.mask, c.ct)), sub = c.all ? 'Todo o período' : null;
  const K = [
    kpi({ icon: 'check', color: '#16a34a', label: 'Aderência', value: n1(cur.pct), unit: '%', delta: delta(cur.pct, pr && pr.pct, { pp: true, goodUp: true }, c.lb), sub: sub ? 'Meta ' + META_ADER + '%' : null, spark: spark(mA.map(x => x.pct), COL.green) }),
    kpi({ icon: 'list', color: '#2563eb', label: 'Programadas', value: n0(cur.p), delta: delta(cur.p, pr && pr.p, { goodUp: true }, c.lb), sub, spark: spark(mA.map(x => x.p), COL.blue) }),
    kpi({ icon: 'calcheck', color: '#16a34a', label: 'Executadas na semana', value: n0(cur.e), delta: delta(cur.e, pr && pr.e, { goodUp: true }, c.lb), sub, spark: spark(mA.map(x => x.e), COL.green) }),
    kpi({ icon: 'alert', color: '#dc2626', label: 'Fora da semana', value: n0(cur.p - cur.e), delta: delta(cur.p - cur.e, pr && (pr.p - pr.e), { goodUp: false }, c.lb), sub, spark: spark(mA.map(x => x.p - x.e), COL.red) }),
    kpi({ icon: 'clock', color: '#ea6a0c', label: 'Aderência em horas (HH)', value: n1(cur.pctHH), unit: '%', delta: delta(cur.pctHH, pr && pr.pctHH, { pp: true, goodUp: true }, c.lb), sub, spark: spark(mA.map(x => x.pctHH), COL.orange) }),
  ].join('');
  const gi = granInfo(g, c), ta = aderTrend(g, c);
  const byArea = AREAS.map(a => ({ k: a, s: aderStats(c.r.a, c.r.b, maskOf({ ...S.F, area: a }), c.ct) })).filter(x => x.s.p);
  const byTipo = Object.entries(cur.byTipo).map(([k, v]) => ({ k, p: v.p, pct: v.e / v.p * 100 })).sort((a, b) => a.pct - b.pct);
  const late = cur.rows.slice().sort((a, b) => (a.o.fd < 0 ? 1 : 0) - (b.o.fd < 0 ? 1 : 0) || 0).sort((a, b) => {
    const da = a.cls === 'nao' ? Math.min(c.r.b, P1) - a.g.dp : a.o.fd - a.g.dp, db = b.cls === 'nao' ? Math.min(c.r.b, P1) - b.g.dp : b.o.fd - b.g.dp;
    return (b.cls === 'nao') - (a.cls === 'nao') || db - da;
  }).slice(0, 12);
  const html = '<div class="kpis">' + K + '</div><div class="g">' +
    panel({ id: 'ad-tr', cls: 'c8', title: 'Aderência à programação', icon: 'calcheck', color: '#16a34a', right: seg('ad', g), hint: 'Verde: na meta de ' + META_ADER + '% ou acima. Amarelo: até 10 pontos abaixo. Vermelho: mais de 10 pontos abaixo.' }) +
    panel({ id: 'ad-mt', cls: 'c4', title: 'Motivo da não aderência', icon: 'pie', color: COL.amber, hint: 'Ordens que não foram executadas na semana programada' }) + '</div><div class="g">' +
    panel({ id: 'ad-ct', cls: 'c4', title: 'Por equipe', icon: 'bars', color: COL.blue }) +
    panel({ id: 'ad-ar', cls: 'c4', title: 'Por área', icon: 'bars', color: COL.cyan }) +
    panel({ id: 'ad-tp', cls: 'c4', title: 'Por tipo de equipamento', icon: 'bars', color: COL.purple }) + '</div><div class="g">' +
    panel({ id: 'ad-tb', cls: 'c12', title: 'Ordens fora da semana programada', icon: 'list', color: COL.red, hint: 'Primeiro as não executadas, depois as executadas com mais atraso' }) + '</div>';
  return { html, after() {
    barChart(q('ad-tr'), { labels: gi.labels, subs: gi.subs, hl: gi.hl, h: 250, series: [{ name: 'Aderência', color: COL.green, vals: ta.map(x => x.pct) }], colorFn: (i, v) => aderCol(v), cap: 100, yfmt: v => nf(v, 0) + '%', vfmt: v => nf(v, 0) + '%', ref: { v: META_ADER, label: 'Meta ' + META_ADER + '%' }, aria: 'Aderência por período' });
    donut(q('ad-mt'), { items: [{ name: 'Executada depois da semana', v: cur.atras, color: COL.amber }, { name: 'Não executada', v: cur.nao, color: COL.red }, { name: 'Executada antes da semana', v: cur.ant, color: COL.blue }], small: 'Ordens' });
    const mk = (rows, col) => ({ rows, max: 100, min: Math.max(0, Math.floor(Math.min(...rows.map(r => r.v), 100) / 10) * 10 - 10), colorFn: aderCol, ref: META_ADER, fmt: v => pc(v) });
    hbars(q('ad-ct'), mk([0, 1, 2].filter(i => cur.byCt[i].p).map(i => ({ label: CT_NAMES[i], v: cur.byCt[i].e / cur.byCt[i].p * 100, sub: cur.byCt[i].p + ' ordens' }))));
    hbars(q('ad-ar'), mk(byArea.map(x => ({ label: x.k, v: x.s.pct, sub: x.s.p + ' ordens' }))));
    hbars(q('ad-tp'), mk(byTipo.map(x => ({ label: x.k, v: x.pct, sub: x.p + ' ordens' }))));
    q('ad-tb').innerHTML = table([
      { h: 'Ordem', f: r => r.o.id }, { h: 'Equipamento', f: r => esc(EQ[r.o.eq].tag) }, { h: 'Atividade', wrap: 1, f: r => esc(r.o.tx.split(' - ')[0]) },
      { h: 'Equipe', f: r => esc(CT_NAMES[r.o.ct]) }, { h: 'Semana programada', f: r => esc(WEEKS.find(w => w.s === r.g.ws).label) },
      { h: 'Situação', f: r => r.cls === 'nao' ? pill('Não executada', 'red') : r.cls === 'atras' ? pill('Executada depois', 'amber') : pill('Executada antes', 'blue') },
      { h: 'Dias de atraso', r: 1, f: r => r.cls === 'ant' ? '—' : n0((r.cls === 'nao' ? Math.min(c.r.b, P1) : r.o.fd) - (r.g.ws + 6)) }], late);
  } };
}

/* ---------- Backlog ---------- */
function backSeries(c) {
  const { a, b } = c.r; let pts = [];
  if (b - a <= 40) for (let d = a; d <= b; d++) pts.push({ d, l: fmtDM(d) });
  else WEEKS.forEach(w => { if (w.b >= a && w.b <= b) pts.push({ d: w.b, l: w.label }); });
  return pts;
}
function screenBk() {
  const c = ctx(), d0 = c.r.b, cur = backlogAt(d0, c.mask, c.ct, true), pr = c.prev ? backlogAt(c.prev.b, c.mask, c.ct) : null;
  const mB = MONTHS.map(m => backlogAt(m.b, c.mask, c.ct)), sub = c.all ? 'Em ' + fmtD(d0) : null;
  const K = [
    kpi({ icon: 'layers', color: '#0891b2', label: 'Backlog (ordens)', value: n0(cur.n), delta: delta(cur.n, pr && pr.n, { goodUp: false }, c.lb), sub, spark: spark(mB.map(x => x.n), COL.cyan) }),
    kpi({ icon: 'clock', color: '#2563eb', label: 'Backlog em horas (HH)', value: n0(cur.hh), unit: 'h', delta: delta(cur.hh, pr && pr.hh, { goodUp: false }, c.lb), sub, spark: spark(mB.map(x => x.hh), COL.blue) }),
    kpi({ icon: 'alert', color: '#dc2626', label: 'Atrasadas', value: n0(cur.venc), delta: delta(cur.venc, pr && pr.venc, { goodUp: false }, c.lb), sub: sub ? 'Passaram da data programada' : null, spark: spark(mB.map(x => x.venc), COL.red) }),
    kpi({ icon: 'hourglass', color: '#ea6a0c', label: 'Abertas há mais de 90 dias', value: n0(cur.a90), delta: delta(cur.a90, pr && pr.a90, { goodUp: false }, c.lb), sub, spark: spark(mB.map(x => x.a90), COL.orange) }),
    kpi({ icon: 'wrench', color: '#7c4dff', label: 'Aguardando material ou parada', value: n0(cur.mat + cur.par), delta: delta(cur.mat + cur.par, pr && (pr.mat + pr.par), { goodUp: false }, c.lb), sub, spark: spark(mB.map(x => x.mat + x.par), COL.purple) }),
  ].join('');
  const pts = backSeries(c), ser = pts.map(p => backlogAt(p.d, c.mask, c.ct));
  const AG = ['0 a 30 dias', '31 a 60 dias', '61 a 90 dias', 'Mais de 90 dias'];
  const old = cur.list.slice().sort((a, b) => b.age - a.age).slice(0, 12);
  const SIT = { teco: ['Aguardando TECO', 'blue'], mat: ['Aguardando material', 'amber'], par: ['Aguardando parada', 'amber'], venc: ['Atrasada', 'red'], prazo: ['No prazo', 'green'] };
  const html = '<div class="kpis">' + K + '</div><div class="g">' +
    panel({ id: 'bk-ev', cls: 'c8', title: 'Evolução do backlog', icon: 'chart', color: COL.cyan, legend: [['Total de ordens abertas', COL.cyan], ['Atrasadas', COL.red]] }) +
    panel({ id: 'bk-st', cls: 'c4', title: 'Situação das ordens', icon: 'pie', color: COL.amber, hint: 'Posição em ' + fmtD(d0) }) + '</div><div class="g">' +
    panel({ id: 'bk-ag', cls: 'c6', title: 'Tempo em aberto', icon: 'bars', color: COL.orange, legend: [['Preventiva', COL.blue], ['Preditiva', COL.orange], ['Corretiva', COL.green]], hint: 'Quantidade de ordens por faixa de dias desde a criação' }) +
    panel({ id: 'bk-ct', cls: 'c6', title: 'Backlog por equipe', icon: 'bars', color: COL.blue, hint: 'Ordens abertas e horas planejadas' }) + '</div><div class="g">' +
    panel({ id: 'bk-tb', cls: 'c12', title: 'Ordens mais antigas em aberto', icon: 'list', color: COL.red }) + '</div>';
  return { html, after() {
    lineChart(q('bk-ev'), { labels: pts.map(p => p.l), subs: pts.map(p => fmtD(p.d)), h: 250, zero: true, series: [{ name: 'Total de ordens abertas', color: COL.cyan, vals: ser.map(x => x.n) }, { name: 'Atrasadas', color: COL.red, vals: ser.map(x => x.venc), area: false }], yfmt: n0, aria: 'Evolução do backlog' });
    donut(q('bk-st'), { items: Object.keys(SIT).map(k => ({ name: SIT[k][0], v: cur[k], color: { teco: COL.blue, mat: COL.amber, par: COL.orange, venc: COL.red, prazo: COL.green }[k] })), small: 'Ordens' });
    barChart(q('bk-ag'), { labels: AG, h: 230, stacked: true, series: [{ name: 'Preventiva', color: COL.blue, vals: cur.ag[1] }, { name: 'Preditiva', color: COL.orange, vals: cur.ag[2] }, { name: 'Corretiva', color: COL.green, vals: cur.ag[0] }], yfmt: n0, vfmt: n0, aria: 'Ordens abertas por faixa de idade' });
    q('bk-ct').innerHTML = '<div id="bk-c1"></div><div class="hint" style="margin:16px 0 6px">Por tipo de ordem</div><div id="bk-c2"></div>';
    hbars(q('bk-c1'), { rows: [0, 1, 2].filter(i => cur.byCt[i].n).map(i => ({ label: CT_NAMES[i], v: cur.byCt[i].n, sub: n0(cur.byCt[i].hh) + ' h', color: CT_COL[i] })), fmt: n0 });
    hbars(q('bk-c2'), { rows: [1, 2, 0].map(t => { const l = cur.list.filter(x => x.o.t === t); return { label: TIPO_ORD[t], v: l.length, sub: n0(l.reduce((a, x) => a + x.o.hhp, 0)) + ' h', color: [COL.green, COL.blue, COL.orange][t] }; }).filter(r => r.v), fmt: n0 });
    q('bk-tb').innerHTML = table([
      { h: 'Ordem', f: r => r.o.id }, { h: 'Tipo', f: r => TIPO_ORD[r.o.t] }, { h: 'Equipamento', f: r => esc(EQ[r.o.eq].tag) }, { h: 'Descrição', wrap: 1, f: r => esc(r.o.tx) },
      { h: 'Equipe', f: r => esc(CT_NAMES[r.o.ct]) }, { h: 'Criada em', f: r => fmtD(r.o.crd) }, { h: 'Dias em aberto', r: 1, f: r => n0(r.age) },
      { h: 'Situação', f: r => pill(SIT[r.sit][0], SIT[r.sit][1]) }], old);
  } };
}

/* ---------- Fora da programação ---------- */
function screenFp() {
  const c = ctx(), g = S.gran.fp, cur = foraStats(c.r.a, c.r.b, c.mask, c.ct, true), pr = c.prev ? foraStats(c.prev.a, c.prev.b, c.mask, c.ct) : null;
  const mF = MONTHS.map(m => foraStats(m.a, m.b, c.mask, c.ct)), sub = c.all ? 'Todo o período' : null;
  const K = [
    kpi({ icon: 'wrench', color: '#2563eb', label: 'Corretivas executadas', value: n0(cur.ex), delta: delta(cur.ex, pr && pr.ex, { goodUp: false }, c.lb), sub, spark: spark(mF.map(x => x.ex), COL.blue) }),
    kpi({ icon: 'alert', color: '#dc2626', label: 'Fora da programação', value: n0(cur.fora), delta: delta(cur.fora, pr && pr.fora, { goodUp: false }, c.lb), sub, spark: spark(mF.map(x => x.fora), COL.red) }),
    kpi({ icon: 'pie', color: '#ea6a0c', label: '% fora da programação', value: n1(cur.pct), unit: '%', delta: delta(cur.pct, pr && pr.pct, { pp: true, goodUp: false }, c.lb), sub, spark: spark(mF.map(x => x.pct), COL.orange) }),
    kpi({ icon: 'zap', color: '#b91c1c', label: 'Emergências', value: n0(cur.emerg), delta: delta(cur.emerg, pr && pr.emerg, { goodUp: false }, c.lb), sub: sub ? 'Não programáveis' : null, spark: spark(mF.map(x => x.emerg), COL.red) }),
    kpi({ icon: 'calcheck', color: '#7c4dff', label: 'Poderiam ser programadas', value: n0(cur.prog), delta: delta(cur.prog, pr && pr.prog, { goodUp: false }, c.lb), sub: sub ? 'Rota de inspeção e operação' : null, spark: spark(mF.map(x => x.prog), COL.purple) }),
  ].join('');
  const P = periods(g), gi = granInfo(g, c), ser = P.map(p => foraStats(p.a, p.b, c.mask, c.ct));
  const eqTop = Object.entries(cur.byEq).map(([k, v]) => ({ label: EQ[k].tag, v, sub: EQ[k].tipo })).sort((a, b) => b.v - a.v).slice(0, 10);
  const areaC = {}; cur.list.forEach(o => { const a = EQ[o.eq].area; areaC[a] = (areaC[a] || 0) + 1; });
  const rec = cur.list.slice().sort((a, b) => b.fim - a.fim).slice(0, 12);
  const html = '<div class="kpis">' + K + '</div><div class="g">' +
    panel({ id: 'fp-tr', cls: 'c8', title: 'Ocorrências fora da programação', icon: 'alert', color: COL.red, right: seg('fp', g), legend: [['Emergência', COL.red], ['Rota de inspeção', COL.blue], ['Solicitação da operação', COL.amber], ['% sobre as corretivas', COL.purple]] }) +
    panel({ id: 'fp-og', cls: 'c4', title: 'Origem das ocorrências', icon: 'pie', color: COL.amber, hint: 'Rota de inspeção e solicitação da operação podem ser levadas à programação' }) + '</div><div class="g">' +
    panel({ id: 'fp-eq', cls: 'c4', title: 'Equipamentos com mais ocorrências', icon: 'bars', color: COL.red }) +
    panel({ id: 'fp-ct', cls: 'c4', title: 'Por equipe', icon: 'bars', color: COL.blue, hint: 'Ocorrências e horas trabalhadas' }) +
    panel({ id: 'fp-ar', cls: 'c4', title: 'Por área', icon: 'bars', color: COL.cyan }) + '</div><div class="g">' +
    panel({ id: 'fp-tb', cls: 'c12', title: 'Últimas ocorrências fora da programação', icon: 'list', color: COL.red }) + '</div>';
  return { html, after() {
    barChart(q('fp-tr'), { labels: gi.labels, subs: gi.subs, hl: gi.hl, h: 260, stacked: true, series: [1, 2, 3].map(og => ({ name: ORIG[og], color: OG_COL[og], vals: ser.map(s => s.byOg[og]) })), line: { name: '% sobre as corretivas', color: COL.purple, vals: ser.map(s => s.pct), fmt: v => nf(v, 0) + '%', yfmt: v => nf(v, 0) + '%', cap: 100 }, yfmt: n0, vfmt: n0, aria: 'Ocorrências fora da programação por origem' });
    donut(q('fp-og'), { items: [1, 2, 3].map(og => ({ name: ORIG[og], v: cur.byOg[og], color: OG_COL[og] })), small: 'Ocorrências' });
    hbars(q('fp-eq'), { rows: eqTop, color: COL.red, fmt: n0 });
    q('fp-ct').innerHTML = '<div id="fp-c1"></div><div class="hint" style="margin:16px 0 6px">Por prioridade</div><div id="fp-c2"></div>';
    hbars(q('fp-c1'), { rows: [0, 1, 2].filter(i => cur.byCt[i].n).map(i => ({ label: CT_NAMES[i], v: cur.byCt[i].n, sub: n0(cur.byCt[i].hh) + ' h', color: CT_COL[i] })), fmt: n0 });
    const PRI = ['', '1 · Emergência', '2 · Urgente', '3 · Normal', '4 · Programável'];
    hbars(q('fp-c2'), { rows: [1, 2, 3, 4].map(p => ({ label: PRI[p], v: cur.list.filter(o => o.pr === p).length, color: [COL.gray, COL.red, COL.amber, COL.blue, COL.green][p] })).filter(r => r.v), fmt: n0 });
    const hpA = {}; cur.list.forEach(o => { if (o.pa) { const a = EQ[o.eq].area; hpA[a] = (hpA[a] || 0) + o.hp; } });
    q('fp-ar').innerHTML = '<div id="fp-a1"></div><div class="hint" style="margin:16px 0 6px">Horas de parada geradas</div><div id="fp-a2"></div>';
    hbars(q('fp-a1'), { rows: Object.entries(areaC).map(([k, v]) => ({ label: k, v })).sort((a, b) => b.v - a.v), color: COL.cyan, fmt: n0 });
    hbars(q('fp-a2'), { rows: Object.entries(hpA).map(([k, v]) => ({ label: k, v })).sort((a, b) => b.v - a.v), color: COL.orange, fmt: v => n0(v) + ' h' });
    q('fp-tb').innerHTML = table([
      { h: 'Data', f: r => fmtD(Math.floor(r.fim / DAYM)) }, { h: 'Ordem', f: r => r.id }, { h: 'Equipamento', f: r => esc(EQ[r.eq].tag) }, { h: 'Descrição', wrap: 1, f: r => esc(r.tx) },
      { h: 'Origem', f: r => pill(ORIG[r.og], r.og === 1 ? 'red' : r.og === 2 ? 'blue' : 'amber') }, { h: 'Equipe', f: r => esc(CT_NAMES[r.ct]) },
      { h: 'Prioridade', r: 1, f: r => r.pr }, { h: 'Parada (h)', r: 1, f: r => r.pa ? n1(r.hp) : '—' }, { h: 'HH', r: 1, f: r => n1(r.hhr) }], rec);
  } };
}

/* ---------- ciclo de renderização ---------- */
function renderScreen() {
  const meta = SCREENS[S.screen];
  document.getElementById('h1').textContent = meta.h1; document.getElementById('sub').textContent = meta.sub;
  document.getElementById('scope').innerHTML = scopeText();
  const sc = { 'visao-geral': screenVG, 'confiabilidade': screenRel, 'aderencia': screenAd, 'backlog': screenBk, 'fora-programacao': screenFp }[S.screen]();
  document.getElementById('content').innerHTML = sc.html; sc.after();
  document.querySelectorAll('[data-seg]').forEach(b => b.addEventListener('click', () => { S.gran[b.dataset.seg] = b.dataset.v; renderScreen(); }));
  document.querySelectorAll('.nav button').forEach(b => { b.classList.toggle('on', b.dataset.nav === S.screen); b.setAttribute('aria-current', b.dataset.nav === S.screen ? 'page' : 'false'); });
}
function renderAll() { hideTip(); renderFilters(); renderScreen(); }
function go(name, push) {
  if (!SCREENS[name]) name = 'visao-geral';
  S.screen = name; if (push) { try { location.hash = name; } catch (e) { } }
  renderAll(); document.getElementById('main').scrollTop = 0;
}
buildShell();
document.querySelectorAll('.nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.nav, true)));
window.addEventListener('hashchange', () => { const n = location.hash.replace('#', ''); if (n && n !== S.screen) go(n, false); });
let rzT; new ResizeObserver(() => { clearTimeout(rzT); rzT = setTimeout(renderScreen, 120); }).observe(document.getElementById('main'));
go(location.hash.replace('#', '') || 'visao-geral', false);
