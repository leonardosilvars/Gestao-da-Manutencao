import json, math, datetime as dt
import pandas as pd

SRC = "/home/claude/out/Base_Manutencao_SAP_PM.xlsx"
OUT = "/home/claude/out/painel/data.js"
x = pd.read_excel(SRC, sheet_name=None)
eqs, ords, nots, prog, cat = x["Equipamentos"], x["Ordens"], x["Notificacoes"], x["Programacao_Semanal"], x["Catalogo_Falhas"]

BASE = pd.Timestamp("2020-01-01")
def mins(ts):
    return -1 if pd.isna(ts) else int((pd.Timestamp(ts) - BASE).total_seconds() // 60)
def day(ts):
    return -1 if pd.isna(ts) else int((pd.Timestamp(ts).normalize() - BASE).days)

CT = {"MECAN": 0, "ELETR": 1, "INSTR": 2}
TIPO = {"PM01": 0, "PM02": 1, "PM03": 2}
ORIG = {"Plano preventivo": 0, "Emergência": 1, "Rota de inspeção": 2, "Solicitação da operação": 3}
SU = {"AGMT": 1, "AGPA": 2}

eqs = eqs.reset_index(drop=True)
eq_idx = {e: i for i, e in enumerate(eqs.Equipamento)}
eq_rows = [[r.Tag, r.Tipo_Equipamento, r.Area, r.Criticidade, CT[r.Centro_Trabalho_Resp]] for r in eqs.itertuples()]

ords = ords.sort_values("Ordem").reset_index(drop=True)
o_idx = {o: i for i, o in enumerate(ords.Ordem)}
hp_by_ord = nots.set_index("Ordem").Horas_Parada.fillna(0).to_dict()
o_rows = []
for r in ords.itertuples():
    o_rows.append([
        int(r.Ordem), TIPO[r.Tipo_Ordem], eq_idx[r.Equipamento], CT[r.Centro_Trabalho], int(r.Prioridade),
        SU.get(r.Status_Usuario, 0) if isinstance(r.Status_Usuario, str) else 0,
        ORIG[r.Origem], 1 if r.Programada == "S" else 0, day(r.Data_Inicio_Programada),
        mins(r.Data_Criacao), mins(r.Data_Inicio_Real), mins(r.Data_Fim_Real), day(r.Data_TECO),
        round(float(r.HH_Planejado), 2) if pd.notna(r.HH_Planejado) else 0,
        round(float(r.HH_Real), 2) if pd.notna(r.HH_Real) else 0,
        round(float(r.Duracao_Execucao_h), 2) if pd.notna(r.Duracao_Execucao_h) else -1,
        1 if r.Parada_Equipamento == "S" else 0, r.Texto_Breve,
        round(float(hp_by_ord.get(r.Ordem, 0)), 2),
    ])

danos = list(cat.Descricao_Dano)
dano_idx = {c: i for i, c in enumerate(cat.Cod_Dano)}
n_rows = [[eq_idx[r.Equipamento], o_idx[r.Ordem], mins(r.Inicio_Avaria),
           round(float(r.Horas_Parada), 2) if pd.notna(r.Horas_Parada) else 0,
           1 if r.Parada_Equipamento == "S" else 0, dano_idx[r.Cod_Dano]] for r in nots.itertuples()]

p_rows = [[o_idx[r.Ordem], day(r.Data_Planejada), day(r.Inicio_Semana),
           {"N": 0, "S": 1}.get(r.Executada_na_Semana, 2) if isinstance(r.Executada_na_Semana, str) else 2]
          for r in prog.itertuples()]

D = dict(p0=day("2025-11-01"), p1=day("2026-10-31"), extr=day("2026-11-01"), upd=day("2026-11-01"), src="Dados de exemplo (fictícios)",
         eq=eq_rows, o=o_rows, n=n_rows, p=p_rows, danos=danos)
js = "const D=" + json.dumps(D, ensure_ascii=False, separators=(",", ":")) + ";\n"
open(OUT, "w", encoding="utf-8").write(js)
print(len(js) // 1024, "KB", D["p0"], D["p1"], D["extr"], len(o_rows), len(n_rows), len(p_rows))
