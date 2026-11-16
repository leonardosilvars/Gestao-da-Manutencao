import random, math, datetime as dt
import numpy as np, pandas as pd

rng = np.random.default_rng(42)
random.seed(42)

P_INI = dt.datetime(2025, 11, 1)
P_FIM = dt.datetime(2026, 10, 31, 23, 59)
EXTRACAO = dt.datetime(2026, 11, 1, 0, 0)   # data de extracao do "SAP"
ESP = {"MECAN": "Mecânica", "ELETR": "Elétrica", "INSTR": "Instrumentação"}

# ---------------------------------------------------------------- Equipamentos
areas = {"UTI": "Utilidades", "PRA": "Processo A", "PRB": "Processo B", "TAN": "Tancagem e Expedição"}
tipos = [  # tipo, prefixo, qtd, sistema por area
    ("Bomba centrífuga", "BA", 20), ("Motor elétrico", "ME", 15), ("Compressor", "CP", 8),
    ("Válvula de controle", "FV", 12), ("Transmissor", "PT", 10), ("Painel elétrico", "PN", 5)]
area_w = {"Bomba centrífuga": [.2, .3, .3, .2], "Motor elétrico": [.2, .3, .3, .2],
          "Compressor": [.6, .2, .2, 0], "Válvula de controle": [.1, .4, .4, .1],
          "Transmissor": [.1, .35, .35, .2], "Painel elétrico": [.4, .2, .2, .2]}
CT_PRINC = {"Bomba centrífuga": "MECAN", "Motor elétrico": "ELETR", "Compressor": "MECAN",
            "Válvula de controle": "INSTR", "Transmissor": "INSTR", "Painel elétrico": "ELETR"}
eq = []
n = 0
for tipo, pref, qtd in tipos:
    w = np.array(area_w[tipo]); w = w / w.sum()
    ak = list(areas.keys())
    for i in range(1, qtd + 1):
        n += 1
        a = rng.choice(ak, p=w)
        crit = rng.choice(["A", "B", "C"], p={"Bomba centrífuga": [.3, .5, .2], "Motor elétrico": [.3, .5, .2],
                                              "Compressor": [.8, .2, 0], "Válvula de controle": [.25, .5, .25],
                                              "Transmissor": [.2, .4, .4], "Painel elétrico": [.4, .4, .2]}[tipo])
        tag = f"{pref}-{100 + i}" if tipo != "Transmissor" else f"{['PT','TT','FT','LT'][i % 4]}-{200 + i}"
        eq.append(dict(
            Equipamento=10000000 + n, Tag=tag, Descricao=f"{tipo.upper()} {tag}", Tipo_Equipamento=tipo,
            Centro="1000", Area=areas[a], Local_Instalacao=f"1000-{a}-{tag}",
            Criticidade=crit, Centro_Trabalho_Resp=CT_PRINC[tipo],
            Data_Inicio_Operacao=dt.date(2008 + int(rng.integers(0, 14)), int(rng.integers(1, 13)), 15),
            Horas_Op_Dia=24))
df_eq = pd.DataFrame(eq)
eq_by_id = df_eq.set_index("Equipamento")

# ---------------------------------------------------------------- Tecnicos
tec = []
for ct, base in [("MECAN", 710100), ("ELETR", 720100), ("INSTR", 730100)]:
    for i in range(1, 5):
        tec.append(dict(Matricula=base + i, Equipe=ESP[ct], Centro_Trabalho=ct, Cargo="Técnico de Manutenção",
                        Turno="Administrativo" if i <= 3 else "Sobreaviso/Plantão"))
df_tec = pd.DataFrame(tec)
techs_by_ct = {ct: list(df_tec[df_tec.Centro_Trabalho == ct].Matricula) for ct in ESP}

# ---------------------------------------------------------------- Catalogo de falhas
causas = [("C01", "Desgaste normal", 28), ("C02", "Falha de lubrificação", 12), ("C03", "Operação fora da condição de projeto", 12),
          ("C04", "Falha de montagem / manutenção anterior", 8), ("C05", "Contaminação / sujidade", 10),
          ("C06", "Fim de vida útil", 8), ("C07", "Sobrecarga elétrica", 6), ("C08", "Umidade / corrosão", 6),
          ("C09", "Descalibração / deriva", 6), ("C10", "Causa externa (utilidades)", 4)]
danos = {  # tipo: [(cod, descricao, CT, peso)]
    "Bomba centrífuga": [("D101", "Vazamento no selo mecânico", "MECAN", 35), ("D102", "Desgaste de rolamento", "MECAN", 20),
                         ("D103", "Cavitação", "MECAN", 10), ("D104", "Alta vibração", "MECAN", 15),
                         ("D105", "Falha de instrumento de proteção", "INSTR", 10), ("D106", "Desarme elétrico", "ELETR", 10)],
    "Motor elétrico": [("D201", "Queima de enrolamento", "ELETR", 25), ("D202", "Baixo isolamento", "ELETR", 25),
                       ("D203", "Aquecimento de rolamento", "MECAN", 30), ("D204", "Falha de ventilação", "MECAN", 20)],
    "Compressor": [("D301", "Falha de válvula de sucção/descarga", "MECAN", 30), ("D302", "Vazamento de óleo", "MECAN", 20),
                   ("D303", "Alta temperatura de descarga", "INSTR", 20), ("D304", "Desarme por proteção", "INSTR", 15),
                   ("D305", "Falha de partida", "ELETR", 15)],
    "Válvula de controle": [("D401", "Emperramento de haste", "MECAN", 25), ("D402", "Falha de posicionador", "INSTR", 40),
                            ("D403", "Vazamento pela gaxeta", "MECAN", 20), ("D404", "Ar de instrumento / atuador", "INSTR", 15)],
    "Transmissor": [("D501", "Indicação incorreta / deriva", "INSTR", 45), ("D502", "Sem sinal / perda de comunicação", "INSTR", 30),
                    ("D503", "Entupimento de tomada de impulso", "INSTR", 25)],
    "Painel elétrico": [("D601", "Aquecimento em conexão", "ELETR", 35), ("D602", "Falha de disjuntor / contator", "ELETR", 35),
                        ("D603", "Falha de relé de proteção", "ELETR", 20), ("D604", "Entrada de umidade/poeira", "ELETR", 10)],
}
cat = [dict(Cod_Dano=c, Descricao_Dano=d, Tipo_Equipamento=t, Centro_Trabalho=ct)
       for t, l in danos.items() for c, d, ct, w in l]
df_cat = pd.DataFrame(cat)
df_causa = pd.DataFrame([dict(Cod_Causa=c, Descricao_Causa=d) for c, d, w in causas])

# ---------------------------------------------------------------- helpers
def monday(d):
    d = d if isinstance(d, dt.date) and not isinstance(d, dt.datetime) else d.date()
    return d - dt.timedelta(days=d.weekday())

def iso_wk(d):
    d = d.date() if isinstance(d, dt.datetime) else d
    y, w, _ = d.isocalendar()
    return f"{y}-W{w:02d}"

def next_workday(d):
    while d.weekday() >= 5:
        d += dt.timedelta(days=1)
    return d

def rnd_q(x, q=0.25):
    return max(q, round(x / q) * q)

load = {}  # (matricula, date) -> horas
def pick_tech(ct, date, n):
    cands = sorted(techs_by_ct[ct], key=lambda m: (load.get((m, date), 0) + rng.random() * 0.5))
    return cands[:n]

confs = []
def add_confs(ordem, ct, ntec, start, dur):
    ts = pick_tech(ct, start.date(), ntec)
    for m in ts:
        rem, day, first = dur, start.date(), True
        while rem > 1e-9:
            h = min(rem, 8.0)
            load[(m, day)] = load.get((m, day), 0) + h
            confs.append(dict(Ordem=ordem, Operacao="0010", Matricula=m, Data_Confirmacao=day,
                              Horas_Reais=round(h, 2),
                              Hora_Inicio=start.time() if first else dt.time(7, 0)))
            rem -= h; first = False
            day = day + dt.timedelta(days=1)
            if rem > 0:
                while day.weekday() >= 5 and start.date().weekday() < 5:
                    day += dt.timedelta(days=1)

# ---------------------------------------------------------------- Corretivas (eventos)
rate = {"Bomba centrífuga": 16, "Motor elétrico": 9, "Compressor": 24, "Válvula de controle": 8,
        "Transmissor": 6, "Painel elétrico": 5}
pstop = {"Bomba centrífuga": .42, "Motor elétrico": .5, "Compressor": .45, "Válvula de controle": .25,
         "Transmissor": .22, "Painel elétrico": .4}
dur_stop = {"Bomba centrífuga": 5, "Motor elétrico": 8, "Compressor": 9, "Válvula de controle": 4,
            "Transmissor": 2.5, "Painel elétrico": 3.5}
span_s = (P_FIM - P_INI).total_seconds()
ev = []
for r in eq:
    mult = float(np.exp(rng.normal(0, 0.4)))
    if r["Tag"] in ("CP-103", "BA-107", "BA-114"):   # "bad actors"
        mult *= 2.2
    k = rng.poisson(rate[r["Tipo_Equipamento"]] * mult)
    for _ in range(k):
        t0 = P_INI + dt.timedelta(seconds=float(rng.random() * span_s))
        ev.append((r, t0.replace(microsecond=0, second=0)))
ev.sort(key=lambda x: x[1])

# emergencias por semana (para afetar aderencia)
# primeiro decidimos origem/parada
corr = []
for r, t0 in ev:
    tipo = r["Tipo_Equipamento"]
    stop = rng.random() < pstop[tipo]
    if stop:
        origem = rng.choice(["Emergência", "Solicitação da operação", "Rota de inspeção"], p=[.8, .15, .05])
    else:
        origem = rng.choice(["Emergência", "Solicitação da operação", "Rota de inspeção"], p=[.10, .40, .50])
    corr.append(dict(r=r, t0=t0, stop=stop, origem=str(origem)))
emerg_w = {}
for c in corr:
    if c["origem"] == "Emergência":
        w = monday(c["t0"]); emerg_w[w] = emerg_w.get(w, 0) + 1
mean_em = np.mean(list(emerg_w.values()))

# ---------------------------------------------------------------- Probabilidade de aderencia por semana
weeks = []
d = monday(dt.date(2025, 11, 3))
while d <= dt.date(2026, 11, 16):
    weeks.append(d); d += dt.timedelta(days=7)
bad_weeks = set(rng.choice(len(weeks[:52]), size=7, replace=False).tolist())
p_week = {}
for i, w in enumerate(weeks):
    base = float(np.clip(rng.normal(0.89, 0.04), 0.78, 0.97))
    if i in bad_weeks:
        base = float(rng.uniform(0.60, 0.74))
    base -= 0.012 * (emerg_w.get(w, 0) - mean_em)
    p_week[w] = float(np.clip(base, 0.5, 0.97))

# ---------------------------------------------------------------- Ordens
orders, notifs, prog = [], [], []
seq_ord = [4000000]
seq_not = [10000000]

def new_ord():
    seq_ord[0] += int(rng.integers(1, 4)); return seq_ord[0]
def new_not():
    seq_not[0] += int(rng.integers(1, 4)); return seq_not[0]

def teco_date(fim, ordem_status_open_ok=True):
    """retorna data TECO (ou None) conforme lag"""
    u = rng.random()
    if u < 0.86: lag = int(rng.integers(1, 6))
    elif u < 0.95: lag = int(rng.integers(8, 25))
    else: lag = int(rng.integers(30, 80))
    return (fim + dt.timedelta(days=lag)).date()

def status_final(fim, teco, open_exec=False, user=None):
    """retorna (status_sistema, status_usuario, backlog?)"""
    if open_exec:
        return None
    if teco <= EXTRACAO.date():
        st = "CLSD" if (EXTRACAO.date() - teco).days > 45 else "TECO"
        return st, "", False
    return "CNF", "", True

PLANS = {
 "Bomba centrífuga": [("Inspeção de rota quinzenal", 14, "MECAN", 1.0, 1, "PM02", "INSP"),
                      ("Lubrificação e verificação de selo", 30, "MECAN", 1.0, 1, "PM02", "LUB"),
                      ("Revisão trimestral / alinhamento", 90, "MECAN", 3.0, 2, "PM02", "REV"),
                      ("Análise de vibração", 60, "MECAN", 1.0, 1, "PM03", "VIB"),
                      ("Verificação de instrumentos de proteção", 90, "INSTR", 1.5, 1, "PM02", "PROT")],
 "Motor elétrico": [("Inspeção quinzenal de motor", 14, "ELETR", 1.0, 1, "PM02", "INSP"),
                    ("Termografia e inspeção elétrica", 60, "ELETR", 1.5, 1, "PM03", "TERM"),
                    ("Medição de isolamento (megômetro)", 90, "ELETR", 2.5, 1, "PM02", "MEGA"),
                    ("Lubrificação de rolamentos", 60, "MECAN", 1.0, 1, "PM02", "LUB")],
 "Compressor": [("Inspeção quinzenal de compressor", 14, "MECAN", 1.0, 1, "PM02", "INSP"),
                ("Troca de filtros e óleo", 90, "MECAN", 5.0, 2, "PM02", "FILT"),
                ("Verificação de intertravamentos", 90, "INSTR", 3.0, 1, "PM02", "INTR"),
                ("Verificação mensal de instrumentos", 30, "INSTR", 2.0, 1, "PM02", "INST"),
                ("Inspeção elétrica de compressor", 30, "ELETR", 2.0, 1, "PM02", "ELET")],
 "Válvula de controle": [("Teste de curso e posicionador", 45, "INSTR", 2.0, 1, "PM02", "CURS"),
                         ("Verificação de posicionador e ar", 30, "INSTR", 1.0, 1, "PM02", "POS"),
                         ("Manutenção da válvula", 365, "MECAN", 6.0, 2, "PM02", "MANU")],
 "Transmissor": [("Calibração de transmissor", 90, "INSTR", 2.5, 1, "PM02", "CAL"),
                 ("Inspeção de linha de impulso", 30, "INSTR", 1.0, 1, "PM02", "IMP")],
 "Painel elétrico": [("Inspeção semanal de painel", 7, "ELETR", 1.0, 1, "PM02", "INSP"),
                     ("Termografia de painel", 30, "ELETR", 1.5, 1, "PM03", "TERM"),
                     ("Limpeza e reaperto de conexões", 90, "ELETR", 4.0, 2, "PM02", "LIMP")],
}
TIPO_DESC = {"PM01": "Corretiva", "PM02": "Preventiva", "PM03": "Preditiva"}

def dt_at(date, hmin=7, hmax=14):
    return dt.datetime.combine(date, dt.time(int(rng.integers(hmin, hmax + 1)), int(rng.choice([0, 15, 30, 45]))))

# ---- Preventivas
for r in eq:
    for (nome, freq, ct, h, nt, tord, cod) in PLANS[r["Tipo_Equipamento"]]:
        due = dt.date(2025, 11, 3) + dt.timedelta(days=int(rng.integers(0, freq)))
        while due <= dt.date(2026, 11, 15):
            plan_d = next_workday(due)
            wk = monday(plan_d)
            if wk not in p_week:
                due += dt.timedelta(days=freq); continue
            created = dt.datetime.combine(plan_d - dt.timedelta(days=14), dt.time(6, 0))
            ordem = new_ord()
            dur_p = h
            # execucao
            if plan_d > EXTRACAO.date():
                exec_date = None; resultado = "futura"
            else:
                u = rng.random()
                if u < p_week[wk]:
                    resultado = "no_prazo"
                    off = int(rng.integers(0, 5 - 0))
                    exec_date = wk + dt.timedelta(days=int(min(4, max(0, plan_d.weekday() + rng.integers(-1, 2)))))
                    if exec_date < wk: exec_date = wk
                else:
                    v = rng.random()
                    if v < 0.07:
                        resultado = "antecipada"; exec_date = wk - dt.timedelta(days=int(rng.integers(3, 8)))
                        exec_date = next_workday(exec_date)
                    elif v < 0.30:
                        resultado = "aberta"; exec_date = None
                    else:
                        resultado = "atrasada"
                        wks = int(rng.choice([1, 2, 3, 4], p=[.55, .25, .12, .08]))
                        exec_date = next_workday(wk + dt.timedelta(days=7 * wks + int(rng.integers(0, 5))))
                if exec_date and dt.datetime.combine(exec_date, dt.time(8)) >= EXTRACAO:
                    exec_date = None; resultado = "aberta" if resultado != "futura" else resultado
            dur_real = rnd_q(dur_p * float(np.exp(rng.normal(0, 0.2))))
            row = dict(Ordem=ordem, Tipo_Ordem=tord, Equipamento=r["Equipamento"],
                       Texto_Breve=f"{nome.upper()} - {r['Tag']}", Centro_Trabalho=ct,
                       Prioridade="3" if r["Criticidade"] == "A" else "4",
                       Notificacao=None, Plano_Manutencao=f"PM-{r['Tag']}-{cod}",
                       Origem="Plano preventivo", Programada="S",
                       Semana_Programada=iso_wk(plan_d), Data_Inicio_Programada=plan_d,
                       Data_Criacao=created, HH_Planejado=round(h * nt, 2), N_Tecnicos=nt,
                       Parada_Equipamento="N", Data_Inicio_Real=None, Data_Fim_Real=None, Data_TECO=None,
                       HH_Real=None, Duracao_Execucao_h=None, Status_Sistema="REL", Status_Usuario="")
            if exec_date:
                start = dt_at(exec_date, 7, 14 if dur_real <= 4 else 7)
                fim = start + dt.timedelta(hours=dur_real + (1 if dur_real > 4 else 0) if dur_real > 4 else dur_real)
                if dur_real > 8: fim = start + dt.timedelta(days=int(dur_real // 8), hours=dur_real % 8)
                add_confs(ordem, ct, nt, start, dur_real)
                row.update(Data_Inicio_Real=start, Data_Fim_Real=fim, Duracao_Execucao_h=round(dur_real, 2))
                td = teco_date(fim)
                if td <= EXTRACAO.date():
                    row.update(Data_TECO=td, Status_Sistema="CLSD" if (EXTRACAO.date() - td).days > 45 else "TECO")
                else:
                    row.update(Status_Sistema="CNF")
            else:
                if resultado == "aberta":
                    row["Status_Usuario"] = str(rng.choice(["AGMT", "AGPA", ""], p=[.25, .25, .5]))
                elif plan_d <= EXTRACAO.date() + dt.timedelta(days=7) and rng.random() < 0.3:
                    row["Status_Usuario"] = ""
                if rng.random() < 0.15 and resultado == "futura":
                    row["Status_Sistema"] = "CRTD"
            orders.append(row)
            prog.append(dict(Ordem=ordem, Semana_ISO=iso_wk(plan_d), Inicio_Semana=wk,
                             Fim_Semana=wk + dt.timedelta(days=6), Data_Planejada=plan_d,
                             Tipo_Ordem=tord, Equipamento=r["Equipamento"], Centro_Trabalho=ct,
                             HH_Planejado=round(h * nt, 2)))
            due += dt.timedelta(days=freq)

# ---- Corretivas
for c in corr:
    r, t0, stop, origem = c["r"], c["t0"], c["stop"], c["origem"]
    tipo = r["Tipo_Equipamento"]
    opts = danos[tipo]
    dano = opts[rng.choice(len(opts), p=np.array([o[3] for o in opts]) / sum(o[3] for o in opts))]
    cod_d, desc_d, ct = dano[0], dano[1], dano[2]
    cod_c = causas[rng.choice(len(causas), p=np.array([x[2] for x in causas]) / 100)][0]
    ordem, notif = new_ord(), new_not()
    ntec = int(rng.choice([1, 2], p=[.55, .45])) if stop else int(rng.choice([1, 2], p=[.8, .2]))
    if stop:
        mean_d = dur_stop[tipo] * (0.8 if ct != CT_PRINC[tipo] else 1.0)
        dur = rnd_q(float(np.exp(rng.normal(math.log(mean_d), 0.55))))
    else:
        dur = rnd_q(float(np.exp(rng.normal(math.log(2.0), 0.5))))
    dur = float(min(dur, 30))
    created = t0 + dt.timedelta(minutes=int(rng.integers(5, 40)))
    prio = {"Emergência": "1"}.get(origem, "2" if stop else str(rng.choice(["3", "4"], p=[.6, .4])))
    programada = "N"; sem_prog = None; dt_prog = None
    status_u = ""
    exec_start = None
    wait = 0.0
    if stop:
        wait = float(rng.choice([0, 0, 0, rng.uniform(1, 6), rng.uniform(6, 30)], p=[.4, .15, .15, .2, .1]))
    if origem == "Emergência" or stop:
        exec_start = created + dt.timedelta(minutes=int(rng.integers(10, 150)) + int(wait * 60))
    else:
        programada = "S" if rng.random() < (0.80 if origem == "Rota de inspeção" else 0.62) else "N"
        if programada == "S":
            plan_d = next_workday((created + dt.timedelta(days=int(rng.integers(4, 13)))).date())
            wk = monday(plan_d)
            dt_prog, sem_prog = plan_d, iso_wk(plan_d)
            u = rng.random()
            pw = p_week.get(wk, 0.88)
            if u < 0.10:
                status_u = "AGMT"; exec_d = plan_d + dt.timedelta(days=int(rng.integers(20, 100)))
            elif u < 0.17:
                status_u = "AGPA"; exec_d = plan_d + dt.timedelta(days=int(rng.integers(30, 150)))
            elif u < 0.17 + 0.83 * pw:
                exec_d = wk + dt.timedelta(days=int(min(4, max(0, plan_d.weekday() + rng.integers(-1, 2)))))
                if exec_d < created.date(): exec_d = plan_d
            else:
                exec_d = next_workday(wk + dt.timedelta(days=7 * int(rng.choice([1, 2, 3])) + int(rng.integers(0, 5))))
            exec_d = next_workday(exec_d)
            exec_start = dt_at(exec_d, 7, 14)
            prog.append(dict(Ordem=ordem, Semana_ISO=sem_prog, Inicio_Semana=wk, Fim_Semana=wk + dt.timedelta(days=6),
                             Data_Planejada=plan_d, Tipo_Ordem="PM01", Equipamento=r["Equipamento"],
                             Centro_Trabalho=ct, HH_Planejado=round(dur * ntec, 2)))
        else:
            delay = int(rng.integers(1, 10))
            if rng.random() < 0.06:
                status_u = "AGMT"; delay = int(rng.integers(15, 80))
            exec_start = dt_at((created + dt.timedelta(days=delay)).date(), 7, 14)
            exec_start = dt.datetime.combine(next_workday(exec_start.date()), exec_start.time()) if origem != "Emergência" else exec_start
    row = dict(Ordem=ordem, Tipo_Ordem="PM01", Equipamento=r["Equipamento"],
               Texto_Breve=f"{desc_d.upper()} - {r['Tag']}", Centro_Trabalho=ct, Prioridade=prio,
               Notificacao=notif, Plano_Manutencao=None, Origem=origem, Programada=programada,
               Semana_Programada=sem_prog, Data_Inicio_Programada=dt_prog, Data_Criacao=created,
               HH_Planejado=round(dur * ntec * float(np.exp(rng.normal(0, 0.2))), 2),
               N_Tecnicos=ntec, Parada_Equipamento="S" if stop else "N", Data_Inicio_Real=None,
               Data_Fim_Real=None, Data_TECO=None, HH_Real=None, Duracao_Execucao_h=None,
               Status_Sistema="REL", Status_Usuario=status_u)
    fim = None
    if exec_start and exec_start < EXTRACAO:
        fim = exec_start + dt.timedelta(hours=dur)
        if fim > EXTRACAO:  # ainda em execucao nao ocorre: empurra para aberta
            exec_start = None; fim = None
    if exec_start and fim:
        add_confs(ordem, ct, ntec, exec_start, dur)
        row.update(Data_Inicio_Real=exec_start, Data_Fim_Real=fim, Duracao_Execucao_h=round(dur, 2), Status_Usuario="")
        td = teco_date(fim)
        if td <= EXTRACAO.date():
            row.update(Data_TECO=td, Status_Sistema="CLSD" if (EXTRACAO.date() - td).days > 45 else "TECO")
        else:
            row.update(Status_Sistema="CNF")
    else:
        row["Status_Sistema"] = "CRTD" if (rng.random() < 0.15 and not status_u) else "REL"
    orders.append(row)
    # notificacao
    ini_av = t0
    fim_av = None
    horas_parada = 0.0
    if stop and row["Data_Fim_Real"] is not None:
        fim_av = row["Data_Fim_Real"] + dt.timedelta(minutes=int(rng.integers(15, 90)))
        # espera por material/recurso ja incluida em exec_start - t0
        horas_parada = round((fim_av - ini_av).total_seconds() / 3600, 2)
    elif stop:
        fim_av = None
        horas_parada = None   # parada ainda em curso nao ocorre (ordem aberta de equipamento parado -> equipamento em stand-by)
    notifs.append(dict(Notificacao=notif, Tipo_Notificacao="M2" if stop else "M1", Equipamento=r["Equipamento"],
                       Ordem=ordem, Data_Notificacao=created, Prioridade=prio, Origem=origem,
                       Cod_Dano=cod_d, Cod_Causa=cod_c, Texto_Breve=f"{desc_d} - {r['Tag']}",
                       Parada_Equipamento="S" if stop else "N", Inicio_Avaria=ini_av,
                       Fim_Avaria=fim_av, Horas_Parada=horas_parada if stop else 0.0))

df_ord = pd.DataFrame(orders)
df_conf = pd.DataFrame(confs)
df_not = pd.DataFrame(notifs)
df_prog = pd.DataFrame(prog)

# Corretivas com parada ainda abertas: para nao distorcer disponibilidade, forca "avaria encerrada" = mantem vazio
# (ordens abertas de equipamento parado ficam sem Fim_Avaria; na pratica sao poucas)
open_stop = df_not[(df_not.Parada_Equipamento == "S") & (df_not.Fim_Avaria.isna())]
# para realismo: avarias com parada sempre estao resolvidas -> executa-as de imediato (reclassifica como sem parada)
idx = open_stop.index
df_not.loc[idx, ["Parada_Equipamento", "Tipo_Notificacao", "Horas_Parada"]] = ["N", "M1", 0.0]
df_ord.loc[df_ord.Ordem.isin(df_not.loc[idx, "Ordem"]), "Parada_Equipamento"] = "N"

# HH_Real
hh = df_conf.groupby("Ordem").Horas_Reais.sum().round(2)
df_ord["HH_Real"] = df_ord.Ordem.map(hh)
df_ord.loc[df_ord.Tipo_Ordem == "PM01", "HH_Planejado"] = df_ord.loc[df_ord.Tipo_Ordem == "PM01", "HH_Planejado"]
# join de atributos do equipamento
df_ord = df_ord.merge(df_eq[["Equipamento", "Local_Instalacao", "Area", "Tipo_Equipamento", "Criticidade"]], on="Equipamento", how="left")
df_ord["Descricao_Tipo"] = df_ord.Tipo_Ordem.map(TIPO_DESC)
df_ord["Especialidade"] = df_ord.Centro_Trabalho.map(ESP)
df_ord["Em_Backlog_Extracao"] = np.where(df_ord.Data_TECO.isna() | (pd.to_datetime(df_ord.Data_TECO) > EXTRACAO), "S", "N")
df_ord = df_ord.sort_values("Ordem").reset_index(drop=True)
cols = ["Ordem", "Tipo_Ordem", "Descricao_Tipo", "Equipamento", "Local_Instalacao", "Area", "Tipo_Equipamento", "Criticidade",
        "Centro_Trabalho", "Especialidade", "Texto_Breve", "Prioridade", "Status_Sistema", "Status_Usuario", "Notificacao",
        "Plano_Manutencao", "Origem", "Programada", "Semana_Programada", "Data_Inicio_Programada", "Data_Criacao",
        "Data_Inicio_Real", "Data_Fim_Real", "Data_TECO", "N_Tecnicos", "HH_Planejado", "HH_Real", "Duracao_Execucao_h",
        "Parada_Equipamento", "Em_Backlog_Extracao"]
df_ord = df_ord[cols]

# programacao: flag executada na semana (derivada)
fim_real = df_ord.set_index("Ordem").Data_Fim_Real
df_prog["Data_Fim_Real"] = df_prog.Ordem.map(fim_real)
def flag(r):
    if pd.Timestamp(r.Inicio_Semana) > EXTRACAO: return ""
    f = r.Data_Fim_Real
    if pd.isna(f): return "N"
    return "S" if (pd.Timestamp(r.Inicio_Semana) <= f < pd.Timestamp(r.Fim_Semana) + pd.Timedelta(days=1)) else "N"
df_prog["Executada_na_Semana"] = df_prog.apply(flag, axis=1)
df_prog = df_prog.merge(df_ord[["Ordem", "Descricao_Tipo", "Especialidade"]], on="Ordem", how="left")
df_prog = df_prog.sort_values(["Inicio_Semana", "Ordem"]).reset_index(drop=True)
df_prog.insert(0, "ID_Programacao", range(1, len(df_prog) + 1))
df_prog = df_prog[["ID_Programacao", "Ordem", "Semana_ISO", "Inicio_Semana", "Fim_Semana", "Data_Planejada", "Tipo_Ordem",
                   "Descricao_Tipo", "Equipamento", "Centro_Trabalho", "Especialidade", "HH_Planejado", "Data_Fim_Real",
                   "Executada_na_Semana"]]

df_conf = df_conf.sort_values(["Data_Confirmacao", "Ordem"]).reset_index(drop=True)
df_conf.insert(0, "ID_Confirmacao", range(900001, 900001 + len(df_conf)))
df_conf = df_conf.merge(df_tec[["Matricula", "Centro_Trabalho"]], on="Matricula", how="left")
df_conf = df_conf[["ID_Confirmacao", "Ordem", "Operacao", "Matricula", "Centro_Trabalho", "Data_Confirmacao", "Hora_Inicio", "Horas_Reais"]]
df_not = df_not.sort_values("Notificacao").reset_index(drop=True)

# ---------------------------------------------------------------- Calendario
dates = pd.date_range("2025-10-01", "2026-12-31")
cal = pd.DataFrame({"Data": dates.date})
cal["Ano"] = dates.year; cal["Mes"] = dates.month
cal["Mes_Nome"] = [["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][m - 1] for m in dates.month]
cal["Ano_Mes"] = dates.strftime("%Y-%m")
cal["Semana_ISO"] = [iso_wk(d.date()) for d in dates]
cal["Inicio_Semana"] = [monday(d.date()) for d in dates]
cal["Fim_Semana"] = [monday(d.date()) + dt.timedelta(days=6) for d in dates]
cal["Dia_Semana"] = [["seg", "ter", "qua", "qui", "sex", "sáb", "dom"][d.weekday()] for d in dates]
cal["Dia_Util"] = ["S" if d.weekday() < 5 else "N" for d in dates]
cal["Horas_Calendario"] = 24
cal["No_Periodo_Analise"] = ["S" if (d >= pd.Timestamp(P_INI) and d <= pd.Timestamp(P_FIM)) else "N" for d in dates]

# ---------------------------------------------------------------- KPIs de validacao
o = df_ord.copy()
for c in ["Data_Criacao", "Data_Inicio_Real", "Data_Fim_Real", "Data_TECO"]:
    o[c] = pd.to_datetime(o[c])
n_eq = len(df_eq)
mens = []
for per in pd.period_range("2025-11", "2026-10", freq="M"):
    ini = per.start_time; fim = per.end_time + pd.Timedelta(seconds=1)
    dias = per.days_in_month
    h_op = n_eq * 24 * dias
    nt = df_not[(df_not.Parada_Equipamento == "S") & (df_not.Inicio_Avaria >= ini) & (df_not.Inicio_Avaria < fim)]
    falhas = len(nt); hp = nt.Horas_Parada.sum()
    ordc = o[(o.Tipo_Ordem == "PM01") & (o.Parada_Equipamento == "S") & (o.Data_Fim_Real >= ini) & (o.Data_Fim_Real < fim)]
    mttr = ordc.Duracao_Execucao_h.mean()
    corr_ex = o[(o.Tipo_Ordem == "PM01") & (o.Data_Fim_Real >= ini) & (o.Data_Fim_Real < fim)]
    fora = (corr_ex.Programada == "N").sum()
    bk = o[(o.Data_Criacao < fim) & (o.Data_TECO.isna() | (o.Data_TECO >= fim.normalize()))]
    mens.append(dict(Mes=str(per), Falhas_com_Parada=falhas, Horas_Parada=round(hp, 1), Horas_Operacao=h_op,
                     Disponibilidade=round((h_op - hp) / h_op, 4), MTBF_h=round((h_op - hp) / falhas, 1) if falhas else None,
                     MTTR_h=round(mttr, 2) if pd.notna(mttr) else None,
                     Corretivas_Executadas=len(corr_ex), Corretivas_Fora_Programacao=int(fora),
                     Pct_Fora_Programacao=round(fora / len(corr_ex), 4) if len(corr_ex) else None,
                     Backlog_Qtd_Fim_Mes=len(bk), Backlog_HH_Fim_Mes=round(bk.HH_Planejado.fillna(0).sum(), 1)))
df_val_m = pd.DataFrame(mens)

sem = []
for w in weeks:
    if pd.Timestamp(w) > EXTRACAO: continue
    if w < dt.date(2025, 11, 3): continue
    p = df_prog[(df_prog.Inicio_Semana == w) & (df_prog.Tipo_Ordem != "PM01")]
    ini = pd.Timestamp(w); fim = ini + pd.Timedelta(days=7)
    corr_ex = o[(o.Tipo_Ordem == "PM01") & (o.Data_Fim_Real >= ini) & (o.Data_Fim_Real < fim)]
    sem.append(dict(Semana_ISO=iso_wk(w), Inicio_Semana=w, Prev_Programadas=len(p),
                    Prev_Executadas_na_Semana=int((p.Executada_na_Semana == "S").sum()),
                    Aderencia=round((p.Executada_na_Semana == "S").sum() / len(p), 4) if len(p) else None,
                    Corretivas_Executadas=len(corr_ex), Corretivas_Fora_Programacao=int((corr_ex.Programada == "N").sum())))
df_val_s = pd.DataFrame(sem)

import pickle
pickle.dump(dict(eq=df_eq, tec=df_tec, cal=cal, ord=df_ord, notif=df_not, conf=df_conf, prog=df_prog, cat=df_cat,
                 causa=df_causa, val_m=df_val_m, val_s=df_val_s), open("/home/claude/out/data.pkl", "wb"))
print(len(df_ord), df_ord.Tipo_Ordem.value_counts().to_dict(), len(df_conf), len(df_not), len(df_prog))
print(df_val_m.to_string())
print(df_val_s.Aderencia.describe())
