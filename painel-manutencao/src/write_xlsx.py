import pickle, datetime as dt
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

D = pickle.load(open("/home/claude/out/data.pkl", "rb"))
OUT = "/home/claude/out/Base_Manutencao_SAP_PM.xlsx"
F = "Arial"
wb = Workbook()

# ------------------------------------------------------------------ LEIA-ME
ws = wb.active; ws.title = "LEIA-ME"
ws.sheet_view.showGridLines = False
rows = [
 ("BASE DE MANUTENÇÃO — EXTRAÇÃO SAP PM (DADOS FICTÍCIOS)", "t"),
 ("Dados fictícios porém realistas, gerados para alimentar um dashboard em Power BI. Cada aba é uma Tabela do Excel (tblNome) pronta para 'Obter Dados > Pasta de Trabalho do Excel'.", ""),
 ("", ""),
 ("PARÂMETROS DA BASE", "h"),
 ("Período de análise|01/11/2025 a 31/10/2026 (12 meses)", ""),
 ("Data de extração|01/11/2026 00:00 (usada para o backlog e para ordens ainda abertas)", ""),
 ("Planta / Centro|1000 — 70 equipamentos em 4 áreas", ""),
 ("Equipes|Mecânica (MECAN), Elétrica (ELETR), Instrumentação (INSTR) — 4 técnicos cada, identificados só por matrícula", ""),
 ("Seed aleatória|42 (reprodutível)", ""),
 ("", ""),
 ("TABELAS E CHAVES", "h"),
 ("tblEquipamentos|Equipamento (PK). Hierarquia: Centro > Área > Local de Instalação. Criticidade A/B/C. Horas_Op_Dia = 24.", ""),
 ("tblTecnicos|Matricula (PK). 12 técnicos.", ""),
 ("tblOrdens|Ordem (PK). Tipos: PM01 Corretiva, PM02 Preventiva, PM03 Preditiva. FK: Equipamento, Notificacao.", ""),
 ("tblNotificacoes|Notificacao (PK). Uma por ordem corretiva. Traz Inicio_Avaria / Fim_Avaria / Horas_Parada, Cod_Dano e Cod_Causa. FK: Ordem, Equipamento.", ""),
 ("tblConfirmacoes|ID_Confirmacao (PK). Horas reais por técnico e por dia (equivalente a AFRU). FK: Ordem, Matricula.", ""),
 ("tblProgramacaoSemanal|ID_Programacao (PK). Programação semanal (segunda a domingo) das ordens. FK: Ordem.", ""),
 ("tblCalendario|Data (PK). Tabela de datas 01/10/2025 a 31/12/2026, marcar como tabela de datas no Power BI.", ""),
 ("tblCatalogoFalhas / tblCatalogoCausas|Catálogo de códigos de dano e causa.", ""),
 ("Validacao_Mensal / Validacao_Semanal|Valores de REFERÊNCIA calculados em Python para conferir o dashboard. Não importar para o modelo.", ""),
 ("", ""),
 ("DEFINIÇÕES DOS INDICADORES (para as medidas DAX)", "h"),
 ("MTTR (h)|Média de Duracao_Execucao_h das ordens PM01 com Parada_Equipamento = 'S' e Data_Fim_Real no período. Duracao_Execucao_h = horas de execução confirmadas (tabela de confirmações), sem a espera por material/recurso.", ""),
 ("MTBF (h)|(Horas de operação no período − Horas_Parada) ÷ nº de falhas com parada. Horas de operação = nº de equipamentos × Horas_Op_Dia × dias do período. Falha = notificação com Parada_Equipamento = 'S' (data em Inicio_Avaria).", ""),
 ("Disponibilidade (%)|(Horas de operação − Σ Horas_Parada) ÷ Horas de operação. Horas_Parada (notificação) inclui espera por material, execução e liberação, por isso é maior que o MTTR.", ""),
 ("Backlog|Ordens com Data_Criacao ≤ data de corte E (Data_TECO vazia OU > data de corte). Quantidade e HH_Planejado. Aging = data de corte − Data_Criacao (faixas 0-30, 31-60, 61-90, >90).", ""),
 ("Aderência à programação (%)|Das ordens PM02/PM03 em tblProgramacaoSemanal, % com Data_Fim_Real dentro de Inicio_Semana e Fim_Semana (segunda a domingo, sem tolerância). Coluna Executada_na_Semana já traz o flag; semanas futuras ficam vazias.", ""),
 ("Corretivas fora da programação|Ordens PM01 com Programada = 'N' (sem programação prévia), executadas no período. Segmentar por Origem: Emergência, Rota de inspeção, Solicitação da operação.", ""),
 ("", ""),
 ("STATUS", "h"),
 ("Status_Sistema|CRTD criada · REL liberada · CNF confirmada (aguardando TECO) · TECO encerrada tecnicamente · CLSD encerrada comercialmente. Backlog = tudo que não é TECO/CLSD na data de corte.", ""),
 ("Status_Usuario|AGMT aguardando material · AGPA aguardando parada. Em branco = sem restrição.", ""),
 ("", ""),
 ("PREMISSAS DOS DADOS (hardcoded no gerador)", "h"),
 ("Preventivas|Planos por tipo de equipamento (inspeção semanal, lubrificação, revisões, calibração, termografia). Ordem criada 14 dias antes da data planejada.", ""),
 ("Corretivas|Taxa de falhas por tipo de equipamento com variação por equipamento (alguns 'bad actors' como CP-103, BA-107, BA-114). ~40% das corretivas causam parada.", ""),
 ("Aderência|Varia por semana (média ~86%), com algumas semanas ruins e queda quando há muitas emergências.", ""),
]
r = 1
for txt, k in rows:
    if "|" in txt:
        a, b = txt.split("|", 1)
        ws.cell(r, 1, a).font = Font(name=F, bold=True, size=10)
        c = ws.cell(r, 2, b); c.font = Font(name=F, size=10); c.alignment = Alignment(wrap_text=True, vertical="top")
        ws.cell(r, 1).alignment = Alignment(vertical="top", wrap_text=True)
    else:
        c = ws.cell(r, 1, txt)
        if k == "t": c.font = Font(name=F, bold=True, size=14, color="1F3864")
        elif k == "h":
            c.font = Font(name=F, bold=True, size=11, color="FFFFFF")
            for cc in (1, 2): ws.cell(r, cc).fill = PatternFill("solid", fgColor="1F3864")
        else:
            c.font = Font(name=F, size=10);
            if txt: ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2); c.alignment = Alignment(wrap_text=True, vertical="top"); ws.row_dimensions[r].height = 28
    r += 1
ws.column_dimensions["A"].width = 38; ws.column_dimensions["B"].width = 120

# ------------------------------------------------------------------ helper
HDR = PatternFill("solid", fgColor="1F3864")
def add_sheet(name, df, tbl, widths=None, fmt=None, style="TableStyleMedium2"):
    ws = wb.create_sheet(name)
    cols = list(df.columns)
    for j, c in enumerate(cols, 1):
        cell = ws.cell(1, j, c)
        cell.font = Font(name=F, bold=True, color="FFFFFF", size=10); cell.fill = HDR
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = 30
    fmt = fmt or {}
    for i, row in enumerate(df.itertuples(index=False), 2):
        for j, v in enumerate(row, 1):
            if v is None or (isinstance(v, float) and pd.isna(v)) or v is pd.NaT or (hasattr(pd, "isna") and not isinstance(v, (list, tuple)) and pd.isna(v)):
                continue
            if isinstance(v, pd.Timestamp): v = v.to_pydatetime()
            cell = ws.cell(i, j, v); cell.font = Font(name=F, size=10)
            f = fmt.get(cols[j - 1])
            if f: cell.number_format = f
            elif isinstance(v, dt.datetime): cell.number_format = "dd/mm/yyyy hh:mm"
            elif isinstance(v, dt.date): cell.number_format = "dd/mm/yyyy"
            elif isinstance(v, dt.time): cell.number_format = "hh:mm"
    n = len(df) + 1
    t = Table(displayName=tbl, ref=f"A1:{get_column_letter(len(cols))}{n}")
    t.tableStyleInfo = TableStyleInfo(name=style, showRowStripes=True)
    ws.add_table(t)
    ws.freeze_panes = "A2"
    for j, c in enumerate(cols, 1):
        w = (widths or {}).get(c)
        if not w:
            sample = df[c].dropna().astype(str).head(300)
            w = min(48, max(len(c) + 2, sample.str.len().max() + 2 if len(sample) else 10))
        ws.column_dimensions[get_column_letter(j)].width = w
    return ws

for c in ["Data_Fim_Real"]: pass
add_sheet("Equipamentos", D["eq"], "tblEquipamentos", fmt={"Equipamento": "0"})
add_sheet("Tecnicos", D["tec"], "tblTecnicos", fmt={"Matricula": "0"})
add_sheet("Calendario", D["cal"], "tblCalendario")
o = D["ord"].copy()
add_sheet("Ordens", o, "tblOrdens", fmt={"Ordem": "0", "Equipamento": "0", "Notificacao": "0", "HH_Planejado": "0.00", "HH_Real": "0.00", "Duracao_Execucao_h": "0.00"},
          widths={"Texto_Breve": 52, "Local_Instalacao": 18})
add_sheet("Notificacoes", D["notif"], "tblNotificacoes", fmt={"Notificacao": "0", "Ordem": "0", "Equipamento": "0", "Horas_Parada": "0.00"}, widths={"Texto_Breve": 46})
add_sheet("Confirmacoes", D["conf"], "tblConfirmacoes", fmt={"ID_Confirmacao": "0", "Ordem": "0", "Matricula": "0", "Horas_Reais": "0.00"})
add_sheet("Programacao_Semanal", D["prog"], "tblProgramacaoSemanal", fmt={"Ordem": "0", "Equipamento": "0", "HH_Planejado": "0.00"})
add_sheet("Catalogo_Falhas", D["cat"], "tblCatalogoFalhas", widths={"Descricao_Dano": 40})
add_sheet("Catalogo_Causas", D["causa"], "tblCatalogoCausas", widths={"Descricao_Causa": 44})
vm = add_sheet("Validacao_Mensal", D["val_m"], "tblValidacaoMensal",
               fmt={"Disponibilidade": "0.00%", "Pct_Fora_Programacao": "0.0%", "MTBF_h": "#,##0.0", "MTTR_h": "0.00", "Horas_Parada": "#,##0.0", "Horas_Operacao": "#,##0", "Backlog_HH_Fim_Mes": "#,##0.0"},
               style="TableStyleMedium4")
vs = add_sheet("Validacao_Semanal", D["val_s"], "tblValidacaoSemanal", fmt={"Aderencia": "0.0%"}, style="TableStyleMedium4")
for w, nota in ((vm, "Referência para conferir o dashboard (calculado em Python na geração). Não importar para o modelo."),
                (vs, "Referência: aderência = preventivas/preditivas executadas na semana ÷ programadas na semana.")):
    pass
for ws_ in (vm, vs):
    ws_.sheet_properties.tabColor = "7F7F7F"
for name, color in (("Ordens", "1F3864"), ("Notificacoes", "1F3864"), ("Confirmacoes", "1F3864"), ("Programacao_Semanal", "1F3864")):
    wb[name].sheet_properties.tabColor = color
wb.save(OUT)
print("ok", OUT)
