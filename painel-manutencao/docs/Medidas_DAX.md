# Dashboard de Manutenção (SAP PM) — Modelo e medidas DAX

Base: `Base_Manutencao_SAP_PM.xlsx` (importar as tabelas `tbl*`, **sem** as abas `Validacao_*`).

## 1. Preparação no Power Query

- Desative *Auto date/time* (Arquivo > Opções > Carregamento de dados).
- Tipos: colunas de data/hora (`Data_Criacao`, `Data_Inicio_Real`, `Data_Fim_Real`, `Inicio_Avaria`, `Fim_Avaria`) = **Data/Hora**; `Data_TECO`, `Data_Inicio_Programada`, `Data_Planejada`, `Data_Confirmacao` = **Data**.
- Chaves (`Ordem`, `Equipamento`, `Matricula`, `Notificacao`) = **Número inteiro**.
- `Executada_na_Semana` = Texto (vazio = semana futura, ainda sem resultado).
- `tblCalendario`: marcar como **tabela de datas** (coluna `Data`).

## 2. Relacionamentos (muitos → um, filtro em uma direção)

| Muitos | Um |
|---|---|
| Ordens[Equipamento] | Equipamentos[Equipamento] |
| Notificacoes[Equipamento] | Equipamentos[Equipamento] |
| Notificacoes[Ordem] | Ordens[Ordem] |
| Confirmacoes[Ordem] | Ordens[Ordem] |
| Confirmacoes[Matricula] | Tecnicos[Matricula] |
| Confirmacoes[Data_Confirmacao] | Calendario[Data] |
| Programacao_Semanal[Ordem] | Ordens[Ordem] |
| Programacao_Semanal[Data_Planejada] | Calendario[Data] |
| Notificacoes[Cod_Dano] | CatalogoFalhas[Cod_Dano] |
| Notificacoes[Cod_Causa] | CatalogoCausas[Cod_Causa] |

**`Calendario` não se relaciona com `Ordens` nem com `Notificacoes` de propósito.** Essas tabelas têm data e hora, e várias datas possíveis por linha (criação, fim real, TECO). As medidas usam o intervalo selecionado no calendário (`[Data Ini]` a `[Data Fim]`) e filtram a data certa de cada indicador.

Para filtrar por equipe nas ordens, use `Ordens[Especialidade]`. `Tecnicos[Equipe]` filtra só as confirmações (HH).

## 3. Medidas — período e parâmetros

Crie uma tabela de medidas (`_Medidas`) e cole os blocos abaixo.

```dax
Data Extracao = DATE(2026, 11, 1)

Meta Aderencia = 0.90

Data Ini =
CALCULATE ( MIN ( Calendario[Data] ), Calendario[No_Periodo_Analise] = "S" )

Data Fim =
CALCULATE ( MAX ( Calendario[Data] ), Calendario[No_Periodo_Analise] = "S" )

Data Corte =
MIN ( [Data Fim], [Data Extracao] - 1 )

Dias Periodo =
CALCULATE ( COUNTROWS ( Calendario ), Calendario[No_Periodo_Analise] = "S" )
```

Use também o filtro `Calendario[No_Periodo_Analise] = "S"` no painel de filtros de todas as páginas.

## 4. Confiabilidade: MTBF, MTTR e Disponibilidade

```dax
Horas Operacao =
SUMX ( Equipamentos, Equipamentos[Horas_Op_Dia] ) * [Dias Periodo]

Falhas com Parada =
VAR ini = [Data Ini]
VAR fim = [Data Fim]
RETURN
    CALCULATE (
        COUNTROWS ( Notificacoes ),
        Notificacoes[Parada_Equipamento] = "S",
        Notificacoes[Inicio_Avaria] >= ini,
        Notificacoes[Inicio_Avaria] < fim + 1
    )

Horas Parada =
VAR ini = [Data Ini]
VAR fim = [Data Fim]
RETURN
    CALCULATE (
        SUM ( Notificacoes[Horas_Parada] ),
        Notificacoes[Parada_Equipamento] = "S",
        Notificacoes[Inicio_Avaria] >= ini,
        Notificacoes[Inicio_Avaria] < fim + 1
    )

MTBF (h) =
DIVIDE ( [Horas Operacao] - [Horas Parada], [Falhas com Parada] )

MTTR (h) =
VAR ini = [Data Ini]
VAR fim = [Data Fim]
RETURN
    CALCULATE (
        AVERAGE ( Ordens[Duracao_Execucao_h] ),
        Ordens[Tipo_Ordem] = "PM01",
        Ordens[Parada_Equipamento] = "S",
        Ordens[Data_Fim_Real] >= ini,
        Ordens[Data_Fim_Real] < fim + 1
    )

Disponibilidade % =
DIVIDE ( [Horas Operacao] - [Horas Parada], [Horas Operacao] )

Tempo Medio de Parada (h) =
DIVIDE ( [Horas Parada], [Falhas com Parada] )
```

- **MTTR** usa as horas de execução das confirmações, como combinado.
- **Disponibilidade** usa as horas de parada da notificação, que incluem a espera por material.
- Por equipamento (ex.: `Equipamentos[Tag]` no eixo), as mesmas medidas funcionam e geram o ranking de "bad actors".

## 5. Backlog

Backlog = ordens criadas até a data de corte e ainda sem TECO naquela data.

```dax
Backlog Qtd =
VAR corte = [Data Corte]
RETURN
    COUNTROWS (
        FILTER (
            Ordens,
            Ordens[Data_Criacao] < corte + 1
                && ( ISBLANK ( Ordens[Data_TECO] ) || Ordens[Data_TECO] > corte )
        )
    )

Backlog HH =
VAR corte = [Data Corte]
RETURN
    SUMX (
        FILTER (
            Ordens,
            Ordens[Data_Criacao] < corte + 1
                && ( ISBLANK ( Ordens[Data_TECO] ) || Ordens[Data_TECO] > corte )
        ),
        Ordens[HH_Planejado]
    )

Backlog Vencido Qtd =
VAR corte = [Data Corte]
RETURN
    COUNTROWS (
        FILTER (
            Ordens,
            Ordens[Data_Criacao] < corte + 1
                && ( ISBLANK ( Ordens[Data_TECO] ) || Ordens[Data_TECO] > corte )
                && Ordens[Data_Inicio_Programada] < corte
        )
    )

Backlog 0-30 d =
VAR corte = [Data Corte]
RETURN
    COUNTROWS (
        FILTER (
            Ordens,
            Ordens[Data_Criacao] < corte + 1
                && ( ISBLANK ( Ordens[Data_TECO] ) || Ordens[Data_TECO] > corte )
                && corte - INT ( Ordens[Data_Criacao] ) <= 30
        )
    )

Backlog 31-60 d =
VAR corte = [Data Corte]
RETURN
    COUNTROWS (
        FILTER (
            Ordens,
            Ordens[Data_Criacao] < corte + 1
                && ( ISBLANK ( Ordens[Data_TECO] ) || Ordens[Data_TECO] > corte )
                && corte - INT ( Ordens[Data_Criacao] ) > 30
                && corte - INT ( Ordens[Data_Criacao] ) <= 60
        )
    )

Backlog 61-90 d =
VAR corte = [Data Corte]
RETURN
    COUNTROWS (
        FILTER (
            Ordens,
            Ordens[Data_Criacao] < corte + 1
                && ( ISBLANK ( Ordens[Data_TECO] ) || Ordens[Data_TECO] > corte )
                && corte - INT ( Ordens[Data_Criacao] ) > 60
                && corte - INT ( Ordens[Data_Criacao] ) <= 90
        )
    )

Backlog >90 d =
VAR corte = [Data Corte]
RETURN
    COUNTROWS (
        FILTER (
            Ordens,
            Ordens[Data_Criacao] < corte + 1
                && ( ISBLANK ( Ordens[Data_TECO] ) || Ordens[Data_TECO] > corte )
                && corte - INT ( Ordens[Data_Criacao] ) > 90
        )
    )
```

Para ver o backlog mês a mês, coloque `Calendario[Ano_Mes]` no eixo: a data de corte vira o último dia de cada mês.

## 6. Aderência à programação semanal (preventivas e preditivas)

Semana de segunda a domingo, sem tolerância. O flag `Executada_na_Semana` já vem calculado na base; semanas futuras ficam vazias e não entram.

```dax
Prev Programadas =
CALCULATE (
    COUNTROWS ( Programacao_Semanal ),
    Programacao_Semanal[Tipo_Ordem] <> "PM01",
    Programacao_Semanal[Executada_na_Semana] IN { "S", "N" }
)

Prev Executadas na Semana =
CALCULATE (
    COUNTROWS ( Programacao_Semanal ),
    Programacao_Semanal[Tipo_Ordem] <> "PM01",
    Programacao_Semanal[Executada_na_Semana] = "S"
)

Aderencia % =
DIVIDE ( [Prev Executadas na Semana], [Prev Programadas] )

Aderencia HH % =
DIVIDE (
    CALCULATE (
        SUM ( Programacao_Semanal[HH_Planejado] ),
        Programacao_Semanal[Tipo_Ordem] <> "PM01",
        Programacao_Semanal[Executada_na_Semana] = "S"
    ),
    CALCULATE (
        SUM ( Programacao_Semanal[HH_Planejado] ),
        Programacao_Semanal[Tipo_Ordem] <> "PM01",
        Programacao_Semanal[Executada_na_Semana] IN { "S", "N" }
    )
)
```

Eixo semanal: `Calendario[Semana_ISO]`, com a linha de meta usando `[Meta Aderencia]`.

## 7. Corretivas fora da programação

```dax
Corretivas Executadas =
VAR ini = [Data Ini]
VAR fim = [Data Fim]
RETURN
    CALCULATE (
        COUNTROWS ( Ordens ),
        Ordens[Tipo_Ordem] = "PM01",
        Ordens[Data_Fim_Real] >= ini,
        Ordens[Data_Fim_Real] < fim + 1
    )

Corretivas Fora Programacao =
VAR ini = [Data Ini]
VAR fim = [Data Fim]
RETURN
    CALCULATE (
        COUNTROWS ( Ordens ),
        Ordens[Tipo_Ordem] = "PM01",
        Ordens[Programada] = "N",
        Ordens[Data_Fim_Real] >= ini,
        Ordens[Data_Fim_Real] < fim + 1
    )

Corretivas Fora Programacao % =
DIVIDE ( [Corretivas Fora Programacao], [Corretivas Executadas] )
```

Quebre por `Ordens[Origem]` (Emergência, Rota de inspeção, Solicitação da operação) em barras empilhadas.

## 8. Equipe e HH

```dax
HH Real =
SUM ( Confirmacoes[Horas_Reais] )

Capacidade HH =
CALCULATE (
    COUNTROWS ( Calendario ),
    Calendario[Dia_Util] = "S",
    Calendario[No_Periodo_Analise] = "S"
) * 8 * COUNTROWS ( Tecnicos )

Utilizacao % =
DIVIDE ( [HH Real], [Capacidade HH] )
```

`Utilizacao %` considera 8 h por dia útil e as confirmações em qualquer dia. Por matrícula, use `Tecnicos[Matricula]` no eixo.

Pareto de falhas: `COUNTROWS(Notificacoes)` por `CatalogoFalhas[Descricao_Dano]` ou `CatalogoCausas[Descricao_Causa]`.

## 9. Conferência com a aba Validacao_Mensal

Depois de montar o modelo, confira estes valores (visual de tabela por `Calendario[Ano_Mes]`):

| Mês | Disponibilidade | MTBF (h) | MTTR (h) | % corretivas fora | Backlog (qtd) |
|---|---|---|---|---|---|
| 2025-11 | 99,27% | 1.613,9 | 6,56 | 82,0% | 174 |
| 2026-05 | 99,49% | 1.992,9 | 5,63 | 60,6% | 270 |
| 2026-09 | 98,91% | 1.311,9 | 7,61 | 66,2% | 311 |
| 2026-10 | 99,07% | 1.394,5 | 7,76 | 67,5% | 287 |

Aderência por semana: compare com a aba `Validacao_Semanal`. Nas semanas que cruzam o início ou o fim do período (W44/2025 e W44/2026), o calendário filtrado por `No_Periodo_Analise` pode contar só parte da semana.

## 10. Sugestão de páginas

1. **Visão geral:** cartões de Disponibilidade, MTBF, MTTR, Backlog, Aderência e % fora da programação, com tendência mensal.
2. **Confiabilidade:** ranking de equipamentos por horas de parada e MTBF, Pareto de falhas e causas, filtro por criticidade e área.
3. **Backlog:** evolução mensal, aging, vencido x no prazo, status de usuário (`AGMT`/`AGPA`) e quebra por equipe.
4. **Programação:** aderência semanal com meta, corretivas fora da programação por origem e HH planejado x real.
5. **Equipe:** utilização por matrícula e HH por tipo de ordem.
