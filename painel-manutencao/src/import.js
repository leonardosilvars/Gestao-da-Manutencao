/* ===== Carga de planilha (.xlsx) =====
   Lê o arquivo no próprio navegador (nada é enviado a servidor), converte as abas para o formato interno
   do painel e recalcula tudo. Para adaptar a outro layout de colunas, altere somente SPEC e buildD(). */

/* --- leitor mínimo de .xlsx (zip + XML), sem bibliotecas --- */
async function inflateRaw(u8) {
  const out = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(out).arrayBuffer());
}
async function unzip(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(buf); let e = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('O arquivo não é um .xlsx válido. Se for .xls ou .csv, salve como Pasta de Trabalho do Excel (.xlsx).');
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const files = {};
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    files[new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl))] = { method, csz, lo }; p += 46 + nl + el + cl;
  }
  return { get: async name => {
    const f = files[name]; if (!f) return null;
    const s = f.lo + 30 + dv.getUint16(f.lo + 26, true) + dv.getUint16(f.lo + 28, true), raw = u8.subarray(s, s + f.csz);
    return new TextDecoder('utf-8').decode(f.method === 0 ? raw : await inflateRaw(raw));
  } };
}
const colIdx = ref => { let n = 0; for (const ch of ref.replace(/[0-9]/g, '')) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
async function readXlsx(buf) {
  const z = await unzip(buf), dp = new DOMParser(), X = t => dp.parseFromString(t, 'application/xml');
  const wbx = await z.get('xl/workbook.xml'); if (!wbx) throw new Error('O arquivo não parece ser uma planilha do Excel (.xlsx).');
  const wb = X(wbx), rels = X(await z.get('xl/_rels/workbook.xml.rels')), relMap = {};
  rels.querySelectorAll('Relationship').forEach(r => { relMap[r.getAttribute('Id')] = r.getAttribute('Target'); });
  const ss = [], sst = await z.get('xl/sharedStrings.xml');
  if (sst) X(sst).querySelectorAll('si').forEach(si => ss.push([...si.querySelectorAll('t')].map(t => t.textContent).join('')));
  const sheets = {};
  for (const sh of wb.querySelectorAll('sheets > sheet')) {
    const rid = sh.getAttribute('r:id'); let tg = relMap[rid]; if (!tg) continue;
    tg = tg.startsWith('/') ? tg.slice(1) : 'xl/' + tg;
    const xml = await z.get(tg); if (!xml) continue;
    const rows = [];
    X(xml).querySelectorAll('sheetData > row').forEach(r => {
      const arr = [];
      r.querySelectorAll(':scope > c').forEach(c => {
        const t = c.getAttribute('t'), vEl = c.querySelector('v'); let v = null;
        if (t === 'inlineStr') v = [...c.querySelectorAll('is t')].map(x => x.textContent).join('');
        else if (vEl && vEl.textContent !== '') {
          const raw = vEl.textContent;
          v = t === 's' ? ss[+raw] : t === 'str' ? raw : t === 'b' ? raw === '1' : t === 'e' ? null : parseFloat(raw);
        }
        arr[colIdx(c.getAttribute('r'))] = v;
      });
      rows.push(arr);
    });
    sheets[sh.getAttribute('name')] = rows;
  }
  return sheets;
}

/* --- normalização de nomes e valores --- */
const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const toMs = v => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Math.round((v - 25569) * 1440) * 60000;
  const s = String(v).trim(); let m;
  if ((m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?/))) return Date.UTC(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0));
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/))) return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  return null;
};
const toMin = v => { const ms = toMs(v); return ms == null ? -1 : Math.round((ms - BASE_MS) / 60000); };
const toDay = v => { const ms = toMs(v); return ms == null ? -1 : Math.floor((ms - BASE_MS) / 86400000); };
const toNum = v => {
  if (v == null || v === '') return null; if (typeof v === 'number') return v;
  const s = String(v).trim().replace(/\s/g, ''); const n = parseFloat(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
  return isNaN(n) ? null : n;
};
const yes = v => ['s', 'sim', 'x', '1', 'true', 'y'].includes(norm(v));

/* --- layout esperado (editar aqui para outro formato de planilha) --- */
const SPEC = {
  equipamentos: { nomes: ['equipamentos', 'equipamento'], obrig: ['Equipamento', 'Tag', 'Tipo_Equipamento', 'Area', 'Criticidade'], opc: ['Centro_Trabalho_Resp'] },
  ordens: { nomes: ['ordens', 'ordem'], obrig: ['Ordem', 'Tipo_Ordem', 'Equipamento', 'Centro_Trabalho', 'Origem', 'Programada', 'Data_Criacao', 'Texto_Breve'],
    opc: ['Prioridade', 'Status_Usuario', 'Data_Inicio_Programada', 'Data_Inicio_Real', 'Data_Fim_Real', 'Data_TECO', 'HH_Planejado', 'HH_Real', 'Duracao_Execucao_h', 'Parada_Equipamento'] },
  notificacoes: { nomes: ['notificacoes', 'notificacao'], obrig: ['Ordem', 'Equipamento', 'Inicio_Avaria', 'Parada_Equipamento', 'Horas_Parada'], opc: ['Cod_Dano'] },
  programacao: { nomes: ['programacao_semanal', 'programacao'], obrig: ['Ordem', 'Data_Planejada'], opc: [] },
  catalogo: { nomes: ['catalogo_falhas', 'catalogofalhas'], obrig: [], opc: ['Cod_Dano', 'Descricao_Dano'], facultativa: true },
};
const SPEC_TITULOS = { equipamentos: 'Equipamentos', ordens: 'Ordens', notificacoes: 'Notificacoes', programacao: 'Programacao_Semanal', catalogo: 'Catalogo_Falhas (opcional)' };

function tabelaDe(rows) {
  if (!rows || !rows.length) return { cols: [], recs: [] };
  const head = (rows[0] || []).map(norm), recs = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; if (!r || !r.some(x => x != null && x !== '')) continue;
    const o = {}; head.forEach((h, j) => { if (h) o[h] = r[j] == null ? null : r[j]; }); recs.push(o);
  }
  return { cols: head, recs };
}

/* --- planilha -> formato interno do painel --- */
function buildD(sheets, srcName) {
  const problemas = [], avisos = [], T = {};
  const nomes = Object.keys(sheets);
  for (const [k, sp] of Object.entries(SPEC)) {
    const nm = nomes.find(n => sp.nomes.includes(norm(n)));
    if (!nm) { if (!sp.facultativa) problemas.push('Aba "' + SPEC_TITULOS[k] + '" não encontrada. Abas no arquivo: ' + nomes.join(', ') + '.'); continue; }
    T[k] = tabelaDe(sheets[nm]);
    const falta = sp.obrig.filter(c => !T[k].cols.includes(norm(c)));
    if (falta.length) problemas.push('Aba "' + nm + '": faltam as colunas ' + falta.join(', ') + '.');
  }
  if (problemas.length) { const e = new Error('Planilha fora do formato esperado.'); e.problemas = problemas; throw e; }

  const eqIdx = {}, eq = [];
  T.equipamentos.recs.forEach(r => {
    const id = String(r.equipamento); if (eqIdx[id] != null) return;
    const ct = norm(r.centro_trabalho_resp || '');
    eqIdx[id] = eq.length; eq.push([String(r.tag), String(r.tipo_equipamento), String(r.area), String(r.criticidade), ct.startsWith('ele') ? 1 : ct.startsWith('ins') ? 2 : 0]);
  });
  const danoIdx = {}, danos = [];
  if (T.catalogo) T.catalogo.recs.forEach(r => { if (r.cod_dano != null) { danoIdx[String(r.cod_dano)] = danos.length; danos.push(String(r.descricao_dano || r.cod_dano)); } });
  const getDano = c => { if (c == null) return -1; const k = String(c); if (danoIdx[k] == null) { danoIdx[k] = danos.length; danos.push(k); } return danoIdx[k]; };

  const hpByOrd = {};
  T.notificacoes.recs.forEach(r => { if (yes(r.parada_equipamento)) hpByOrd[String(r.ordem)] = (hpByOrd[String(r.ordem)] || 0) + (toNum(r.horas_parada) || 0); });
  const oIdx = {}, o = []; let semEq = 0, tipoInv = 0, semData = 0;
  T.ordens.recs.forEach(r => {
    const id = String(r.ordem), ei = eqIdx[String(r.equipamento)];
    if (ei == null) { semEq++; return; }
    const tp = norm(r.tipo_ordem), t = tp === 'pm01' || tp.startsWith('corret') ? 0 : tp === 'pm02' || tp.startsWith('prevent') ? 1 : tp === 'pm03' || tp.startsWith('predit') ? 2 : -1;
    if (t < 0) { tipoInv++; return; }
    const cr = toMin(r.data_criacao); if (cr < 0) { semData++; return; }
    const ct = norm(r.centro_trabalho), og = norm(r.origem), su = norm(r.status_usuario);
    const ini = toMin(r.data_inicio_real), fim = toMin(r.data_fim_real);
    let dur = toNum(r.duracao_execucao_h); if (dur == null) dur = (ini >= 0 && fim >= 0) ? (fim - ini) / 60 : -1;
    const pa = yes(r.parada_equipamento) ? 1 : 0, pr = parseInt(r.prioridade, 10);
    oIdx[id] = o.length;
    o.push([Number(r.ordem) || id, t, ei, ct.startsWith('ele') ? 1 : ct.startsWith('ins') ? 2 : 0, isNaN(pr) ? 3 : pr,
      su.includes('agmt') ? 1 : su.includes('agpa') ? 2 : 0, og.startsWith('emerg') ? 1 : og.startsWith('rota') ? 2 : og.startsWith('solic') ? 3 : 0,
      yes(r.programada) ? 1 : 0, toDay(r.data_inicio_programada), cr, ini, fim, toDay(r.data_teco),
      +(toNum(r.hh_planejado) || 0).toFixed(2), +(toNum(r.hh_real) || 0).toFixed(2), dur < 0 ? -1 : +dur.toFixed(2), pa, String(r.texto_breve == null ? '' : r.texto_breve),
      +((hpByOrd[id] || 0)).toFixed(2)]);
  });
  const n = []; let nSem = 0;
  T.notificacoes.recs.forEach(r => {
    const ei = eqIdx[String(r.equipamento)], ini = toMin(r.inicio_avaria);
    if (ei == null || ini < 0) { nSem++; return; }
    n.push([ei, oIdx[String(r.ordem)] == null ? -1 : oIdx[String(r.ordem)], ini, +(toNum(r.horas_parada) || 0).toFixed(2), yes(r.parada_equipamento) ? 1 : 0, getDano(r.cod_dano)]);
  });
  if (!o.length) { const e = new Error('Nenhuma ordem válida foi encontrada.'); e.problemas = ['Verifique se os códigos de equipamento da aba Ordens existem na aba Equipamentos e se Tipo_Ordem e Data_Criacao estão preenchidos.']; throw e; }

  /* período e data da extração a partir dos próprios dados */
  let minD = Infinity, maxD = -Infinity;
  o.forEach(r => { if (r[11] >= 0) { const d = Math.floor(r[11] / DAYM); minD = Math.min(minD, d); maxD = Math.max(maxD, d); } });
  n.forEach(r => { const d = Math.floor(r[2] / DAYM); minD = Math.min(minD, d); maxD = Math.max(maxD, d); });
  if (!isFinite(minD)) { const e = new Error('Sem ordens executadas nem notificações.'); e.problemas = ['É preciso haver ao menos uma ordem com Data_Fim_Real ou uma notificação com Inicio_Avaria.']; throw e; }
  const s0 = dayDate(minD), p0 = dayOf(s0.getUTCFullYear(), s0.getUTCMonth(), 1), p1 = maxD, extr = maxD + 1; /* a extração é considerada feita no dia seguinte ao último evento */

  /* programação semanal: o flag "executada na semana" é calculado aqui (segunda a domingo, sem tolerância) */
  const p = []; let pSem = 0;
  T.programacao.recs.forEach(r => {
    const oi = oIdx[String(r.ordem)], dp = toDay(r.data_planejada);
    if (oi == null || dp < 0) { pSem++; return; }
    const ws = dp - ((dayDate(dp).getUTCDay() + 6) % 7), fim = o[oi][11], fd = fim >= 0 ? Math.floor(fim / DAYM) : -1;
    p.push([oi, dp, ws, ws > p1 ? 2 : (fd >= ws && fd <= ws + 6 ? 1 : 0)]);
  });
  if (semEq) avisos.push(semEq + ' ordens ignoradas: equipamento não encontrado na aba Equipamentos.');
  if (tipoInv) avisos.push(tipoInv + ' ordens ignoradas: Tipo_Ordem diferente de PM01, PM02 ou PM03.');
  if (semData) avisos.push(semData + ' ordens ignoradas: Data_Criacao vazia ou inválida.');
  if (nSem) avisos.push(nSem + ' notificações ignoradas: equipamento não encontrado ou Inicio_Avaria inválido.');
  if (pSem) avisos.push(pSem + ' linhas da programação ignoradas: ordem não encontrada ou Data_Planejada inválida.');
  if (!p.length) avisos.push('A aba de programação não gerou linhas: o painel de aderência ficará vazio.');
  return { D: { p0, p1, extr, upd: extr, src: srcName, eq, o, n, p, danos }, avisos };
}

/* --- janela de carga --- */
const ORIGINAL_D = D;
const mEl = () => document.getElementById('modal'), mSt = () => document.getElementById('m-status');
function modalBody() {
  return Object.entries(SPEC).map(([k, sp]) => '<tr><td><b>' + esc(SPEC_TITULOS[k]) + '</b></td><td>' + sp.obrig.map(c => '<b>' + c + '</b>').concat(sp.opc.map(c => '<span>' + c + '</span>')).join(', ') + '</td></tr>').join('');
}
function openModal() {
  const m = mEl(); m.hidden = false; document.getElementById('m-pick').focus();
}
function closeModal() { mEl().hidden = true; document.getElementById('btn-load').focus(); }
function setStatus(html, kind) { const s = mSt(); s.className = 'mst ' + (kind || ''); s.innerHTML = html; }
function updateHeader() {
  document.getElementById('upd-d').textContent = fmtD(CUR.upd);
  const ex = CUR === ORIGINAL_D;
  const ch = document.getElementById('src-chip'); ch.textContent = ex ? 'Dados de exemplo' : CUR.src; ch.className = 'chip ' + (ex ? 'warn' : 'ok'); ch.title = ex ? 'Dados fictícios embutidos no painel' : 'Arquivo carregado: ' + CUR.src;
}
function applyData(Dn) { loadData(Dn); S.F = defaultF(); updateHeader(); renderAll(); }
async function handleFile(file) {
  if (!file) return;
  setStatus('Lendo <b>' + esc(file.name) + '</b>…', '');
  try {
    if (!/\.xlsx$/i.test(file.name)) throw Object.assign(new Error('Formato não suportado.'), { problemas: ['Use um arquivo .xlsx. Para .xls ou .csv, abra no Excel e salve como Pasta de Trabalho do Excel (.xlsx).'] });
    const sheets = await readXlsx(await file.arrayBuffer()), { D: Dn, avisos } = buildD(sheets, file.name);
    applyData(Dn);
    setStatus('<b>Planilha carregada.</b> ' + n0(Dn.o.length) + ' ordens, ' + n0(Dn.n.length) + ' notificações e ' + n0(Dn.p.length) + ' linhas de programação. Período: ' + fmtD(Dn.p0) + ' a ' + fmtD(Dn.p1) + '.' +
      (avisos.length ? '<ul>' + avisos.map(a => '<li>' + esc(a) + '</li>').join('') + '</ul>' : ''), avisos.length ? 'warn' : 'ok');
  } catch (e) {
    setStatus('<b>Não foi possível carregar.</b> ' + esc(e.message) + (e.problemas ? '<ul>' + e.problemas.map(a => '<li>' + esc(a) + '</li>').join('') + '</ul>' : '') + 'Os dados que já estavam no painel foram mantidos.', 'err');
  }
}
function buildModal() {
  const d = document.createElement('div'); d.id = 'modal'; d.className = 'modal'; d.hidden = true;
  d.innerHTML = '<div class="mbox" role="dialog" aria-modal="true" aria-labelledby="m-title"><header><h2 id="m-title">Carregar planilha</h2><button type="button" class="x" id="m-close" aria-label="Fechar">×</button></header>' +
    '<p>Escolha o arquivo <b>.xlsx</b> da semana ou arraste-o para cá. O painel lê e recalcula tudo no seu navegador; o arquivo não é enviado a nenhum servidor.</p>' +
    '<div class="tw"><table><thead><tr><th>Aba</th><th>Colunas (<b>obrigatórias</b> em destaque)</th></tr></thead><tbody>' + modalBody() + '</tbody></table></div>' +
    '<p class="mnote">Datas no formato do Excel ou dd/mm/aaaa hh:mm. Tipo_Ordem: PM01 corretiva, PM02 preventiva, PM03 preditiva. Programada, Parada_Equipamento: S ou N. Equipe (Centro_Trabalho): MECAN, ELETR ou INSTR. A aderência semanal é calculada pelo painel a partir da Data_Planejada e da Data_Fim_Real.</p>' +
    '<div class="mact"><input type="file" id="m-file" accept=".xlsx" hidden><button type="button" class="btn pri" id="m-pick">Escolher arquivo .xlsx</button><button type="button" class="btn" id="m-reset">Voltar aos dados de exemplo</button></div>' +
    '<div id="m-status" class="mst" role="status" aria-live="polite"></div></div>';
  document.body.appendChild(d);
  document.getElementById('m-pick').addEventListener('click', () => document.getElementById('m-file').click());
  document.getElementById('m-file').addEventListener('change', e => { handleFile(e.target.files[0]); e.target.value = ''; });
  document.getElementById('m-close').addEventListener('click', closeModal);
  document.getElementById('m-reset').addEventListener('click', () => { applyData(ORIGINAL_D); setStatus('Painel voltou aos dados de exemplo.', 'ok'); });
  d.addEventListener('click', e => { if (e.target === d) closeModal(); });
  d.addEventListener('dragover', e => { e.preventDefault(); });
  d.addEventListener('drop', e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !d.hidden) closeModal(); });
  document.getElementById('btn-load').addEventListener('click', openModal);
}
buildModal(); updateHeader();
