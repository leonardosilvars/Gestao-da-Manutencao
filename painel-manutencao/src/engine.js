/* ===== Motor de cálculo (sem DOM) ===== */
const DAYM = 1440;
const CT_NAMES = ['Mecânica', 'Elétrica', 'Instrumentação'];
const ORIG = ['Plano preventivo', 'Emergência', 'Rota de inspeção', 'Solicitação da operação'];
const TIPO_ORD = ['Corretiva', 'Preventiva', 'Preditiva'];
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const META_ADER = 90;
const BASE_MS = Date.UTC(2020, 0, 1);
const pad = n => String(n).padStart(2, '0');
const dayDate = d => new Date(BASE_MS + d * 86400000);
const fmtD = d => { const x = dayDate(d); return pad(x.getUTCDate()) + '/' + pad(x.getUTCMonth() + 1) + '/' + x.getUTCFullYear(); };
const fmtDM = d => { const x = dayDate(d); return pad(x.getUTCDate()) + '/' + pad(x.getUTCMonth() + 1); };
const dayOf = (y, m, d) => Math.round((Date.UTC(y, m, d) - BASE_MS) / 86400000);
const CRITS = ['A', 'B', 'C'];

/* dados atuais (trocados por loadData) */
let CUR = null, P0, P1, EXTR, EQ, O, NT, PG, DANOS, AREAS, TIPOS_EQ, MONTHS, WEEKS;
function isoWeekOf(d) {
  const x = dayDate(d); const wd = (x.getUTCDay() + 6) % 7;
  const th = new Date(x.getTime() + (3 - wd) * 86400000);
  const y = th.getUTCFullYear();
  return { y, w: Math.floor((th.getTime() - Date.UTC(y, 0, 1)) / 86400000 / 7) + 1 };
}
function loadData(Dn) {
  CUR = Dn; P0 = Dn.p0; P1 = Dn.p1; EXTR = Dn.extr; DANOS = Dn.danos;
  EQ = Dn.eq.map((r, i) => ({ i, tag: r[0], tipo: r[1], area: r[2], crit: r[3], ct: r[4] }));
  O = Dn.o.map(r => ({ id: r[0], t: r[1], eq: r[2], ct: r[3], pr: r[4], su: r[5], og: r[6], pg: r[7], dp: r[8], cr: r[9], ini: r[10], fim: r[11], teco: r[12], hhp: r[13], hhr: r[14], dur: r[15], pa: r[16], tx: r[17], hp: r[18] }));
  O.forEach(o => { o.crd = Math.floor(o.cr / DAYM); o.fd = o.fim >= 0 ? Math.floor(o.fim / DAYM) : -1; });
  NT = Dn.n.map(r => ({ eq: r[0], oi: r[1], ini: r[2], hp: r[3], pa: r[4], dn: r[5] }));
  NT.forEach(n => { n.d = Math.floor(n.ini / DAYM); });
  PG = Dn.p.map(r => ({ oi: r[0], dp: r[1], ws: r[2], fl: r[3] }));
  AREAS = [...new Set(EQ.map(e => e.area))].sort();
  TIPOS_EQ = [...new Set(EQ.map(e => e.tipo))];
  /* meses do período */
  MONTHS = [];
  const s0 = dayDate(P0), e1 = dayDate(P1);
  let y = s0.getUTCFullYear(), m = s0.getUTCMonth();
  while (y < e1.getUTCFullYear() || (y === e1.getUTCFullYear() && m <= e1.getUTCMonth())) {
    const a = dayOf(y, m, 1), b = dayOf(y, m + 1, 1) - 1;
    MONTHS.push({ a: Math.max(a, P0), b: Math.min(b, P1), label: MES[m] + '/' + String(y).slice(2), long: MES[m] + '/' + y, key: y + '-' + pad(m + 1) });
    if (++m > 11) { m = 0; y++; }
  }
  /* semanas ISO do período (segunda a domingo) */
  WEEKS = [];
  const wd0 = (dayDate(P0).getUTCDay() + 6) % 7;
  for (let s = P0 - wd0; s <= P1; s += 7) {
    const iw = isoWeekOf(s);
    WEEKS.push({ s, e: s + 6, a: Math.max(s, P0), b: Math.min(s + 6, P1), w: iw.w, y: iw.y,
      label: 'S' + pad(iw.w) + '/' + String(iw.y).slice(2), id: iw.y + '-W' + pad(iw.w), range: fmtDM(s) + ' a ' + fmtDM(s + 6) });
  }
}
loadData(D);

/* filtros */
const defaultF = () => ({ month: -1, week: -1, area: '', ct: -1, crit: '', tipo: '', eq: -1 });
function maskOf(F, skipArea) {
  const m = new Uint8Array(EQ.length);
  EQ.forEach(e => {
    m[e.i] = ((skipArea || !F.area || e.area === F.area) && (!F.crit || e.crit === F.crit) &&
      (!F.tipo || e.tipo === F.tipo) && (F.eq < 0 || e.i === F.eq)) ? 1 : 0;
  });
  return m;
}
function rangeOf(F) {
  if (F.week >= 0) return { a: WEEKS[F.week].a, b: WEEKS[F.week].b };
  if (F.month >= 0) return { a: MONTHS[F.month].a, b: MONTHS[F.month].b };
  return { a: P0, b: P1 };
}
const countMask = m => { let n = 0; for (let i = 0; i < m.length; i++) n += m[i]; return n; };

/* Confiabilidade */
function relStats(a, b, mask) {
  const nEq = countMask(mask), hOp = nEq * 24 * (b - a + 1);
  let f = 0, hp = 0, ms = 0, mn = 0;
  for (const n of NT) if (n.pa && n.d >= a && n.d <= b && mask[n.eq]) { f++; hp += n.hp; }
  for (const o of O) if (o.t === 0 && o.pa && o.fd >= a && o.fd <= b && mask[o.eq] && o.dur >= 0) { ms += o.dur; mn++; }
  return { f, hp, hOp, nEq, mtbf: f ? (hOp - hp) / f : null, disp: hOp ? (hOp - hp) / hOp * 100 : null, mttr: mn ? ms / mn : null };
}
function perEquip(a, b, mask) {
  const days = b - a + 1;
  const r = EQ.map(e => ({ e, f: 0, hp: 0, ms: 0, mn: 0 }));
  for (const n of NT) if (n.pa && n.d >= a && n.d <= b && mask[n.eq]) { r[n.eq].f++; r[n.eq].hp += n.hp; }
  for (const o of O) if (o.t === 0 && o.pa && o.fd >= a && o.fd <= b && mask[o.eq] && o.dur >= 0) { r[o.eq].ms += o.dur; r[o.eq].mn++; }
  return r.filter(x => mask[x.e.i]).map(x => ({
    e: x.e, f: x.f, hp: x.hp, mtbf: x.f ? (24 * days - x.hp) / x.f : null,
    mttr: x.mn ? x.ms / x.mn : null, disp: (24 * days - x.hp) / (24 * days) * 100 }));
}
function dispGroup(a, b, mask, keyFn) {
  const days = b - a + 1, g = {};
  EQ.forEach(e => { if (mask[e.i]) { const k = keyFn(e); (g[k] = g[k] || { n: 0, hp: 0, f: 0 }).n++; } });
  for (const n of NT) if (n.pa && n.d >= a && n.d <= b && mask[n.eq]) { const k = keyFn(EQ[n.eq]); g[k].hp += n.hp; g[k].f++; }
  return Object.entries(g).map(([k, v]) => ({ k, f: v.f, hp: v.hp, disp: (v.n * 24 * days - v.hp) / (v.n * 24 * days) * 100 }));
}
function mttrByCt(a, b, mask) {
  const s = [0, 0, 0], c = [0, 0, 0];
  for (const o of O) if (o.t === 0 && o.pa && o.fd >= a && o.fd <= b && mask[o.eq] && o.dur >= 0) { s[o.ct] += o.dur; c[o.ct]++; }
  return [0, 1, 2].map(i => ({ k: CT_NAMES[i], v: c[i] ? s[i] / c[i] : null, n: c[i] }));
}
function danoCounts(a, b, mask) {
  const c = {};
  for (const n of NT) if (n.pa && n.d >= a && n.d <= b && mask[n.eq]) c[n.dn] = (c[n.dn] || 0) + 1;
  return Object.entries(c).map(([k, v]) => ({ k: DANOS[k], v })).sort((x, y) => y.v - x.v);
}
function hpByArea(a, b, mask) {
  const c = {}; AREAS.forEach(x => c[x] = 0);
  for (const n of NT) if (n.pa && n.d >= a && n.d <= b && mask[n.eq]) c[EQ[n.eq].area] += n.hp;
  return Object.entries(c).map(([k, v]) => ({ k, v }));
}

/* Aderência à programação semanal (preventivas e preditivas) */
function aderStats(a, b, mask, ct) {
  let p = 0, e = 0, hpl = 0, hex = 0, atras = 0, ant = 0, nao = 0;
  const byCt = [0, 1, 2].map(() => ({ p: 0, e: 0 })), byTipo = {}, rows = [];
  for (const g of PG) {
    if (g.fl === 2 || g.dp < a || g.dp > b) continue;
    const o = O[g.oi];
    if (o.t === 0 || !mask[o.eq] || (ct >= 0 && o.ct !== ct)) continue;
    p++; hpl += o.hhp; byCt[o.ct].p++;
    const tk = EQ[o.eq].tipo; (byTipo[tk] = byTipo[tk] || { p: 0, e: 0 }).p++;
    if (g.fl === 1) { e++; hex += o.hhp; byCt[o.ct].e++; byTipo[tk].e++; }
    else {
      let cls;
      if (o.fd < 0) { nao++; cls = 'nao'; } else if (o.fd > g.ws + 6) { atras++; cls = 'atras'; } else { ant++; cls = 'ant'; }
      rows.push({ o, g, cls });
    }
  }
  return { p, e, pct: p ? e / p * 100 : null, hpl, hex, pctHH: hpl ? hex / hpl * 100 : null, atras, ant, nao, byCt, byTipo, rows };
}

/* Backlog em um dia de corte */
function backlogAt(day, mask, ct, withList) {
  let n = 0, hh = 0, a90 = 0, mat = 0, par = 0, teco = 0, venc = 0, prazo = 0;
  const ag = { 0: [0, 0, 0, 0], 1: [0, 0, 0, 0], 2: [0, 0, 0, 0] }, byCt = [0, 0, 0].map(() => ({ n: 0, hh: 0 })), list = [];
  for (const o of O) {
    if (o.crd > day || (o.teco >= 0 && o.teco <= day) || !mask[o.eq] || (ct >= 0 && o.ct !== ct)) continue;
    n++; hh += o.hhp; byCt[o.ct].n++; byCt[o.ct].hh += o.hhp;
    const age = day - o.crd, bk = age <= 30 ? 0 : age <= 60 ? 1 : age <= 90 ? 2 : 3;
    ag[o.t][bk]++; if (bk === 3) a90++;
    let sit;
    if (o.fd >= 0 && o.fd <= day) { sit = 'teco'; teco++; }
    else if (o.su === 1) { sit = 'mat'; mat++; }
    else if (o.su === 2) { sit = 'par'; par++; }
    else if (o.dp >= 0 && o.dp < day) { sit = 'venc'; venc++; }
    else { sit = 'prazo'; prazo++; }
    if (withList) list.push({ o, age, sit });
  }
  return { n, hh, a90, mat, par, teco, venc, prazo, ag, byCt, list };
}

/* Corretivas fora da programação */
function foraStats(a, b, mask, ct, withList) {
  let ex = 0, fora = 0, emerg = 0, prog_ = 0, hhFora = 0;
  const byOg = [0, 0, 0, 0], byCt = [0, 1, 2].map(() => ({ n: 0, hh: 0 })), byEq = {}, list = [];
  for (const o of O) {
    if (o.t !== 0 || o.fd < a || o.fd > b || !mask[o.eq] || (ct >= 0 && o.ct !== ct)) continue;
    ex++;
    if (o.pg === 0) {
      fora++; byOg[o.og]++; hhFora += o.hhr; byCt[o.ct].n++; byCt[o.ct].hh += o.hhr;
      if (o.og === 1) emerg++; else prog_++;
      byEq[o.eq] = (byEq[o.eq] || 0) + 1;
      if (withList) list.push(o);
    }
  }
  return { ex, fora, pct: ex ? fora / ex * 100 : null, emerg, prog: prog_, hhFora, byOg, byCt, byEq, list };
}
function execTypes(a, b, mask, ct) {
  const c = [0, 0, 0];
  for (const o of O) if (o.fd >= a && o.fd <= b && mask[o.eq] && (ct < 0 || o.ct === ct)) c[o.t]++;
  return c;
}

/* séries por mês ou por semana */
function periods(gran) { return gran === 'week' ? WEEKS.map(w => ({ a: w.a, b: w.b, label: w.label, sub: w.range })) : MONTHS.map(m => ({ a: m.a, b: m.b, label: m.label, sub: m.long })); }
function inSel(p, r, isAll) { return isAll ? true : (p.a >= r.a && p.b <= r.b); }
