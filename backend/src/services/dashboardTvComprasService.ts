import pool from "../config/database"

const safe = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0)

export const getDashboardTvCompras = async () => {
  /**
   * REGRAS DE NEGÓCIO:
   * 1. Período atual  : date_trunc('month', CURRENT_DATE) → CURRENT_DATE
   * 2. Período base   : mesmo intervalo do ano anterior (dia a dia)
   * 3. Dias faturados : COUNT(DISTINCT data)
   * 4. Meta ajustada  : meta_mensal × (dias_faturados_atual / dias_mes_base)
   * 5. Nível serviço  : % itens (produto×loja) com saldo_estoque > 0 — via vs_scc_festoques
   * 6. Dias estoque   : valor_estoque_custo / custo_médio_diário do mês atual
   * 7. Vs mês ant.    : mesmo n° de dias desde o início do mês (ex: mai 1-5 vs abr 1-5)
   */

  // ── Query 1: métricas por comprador ────────────────────────────────────────
  const queryCompradores = `
    WITH
    grupos_ativos AS (
      SELECT
        TRIM(cg.codgrp)   AS codgrp,
        c.nome            AS comprador,
        cg.comprador_id
      FROM scc_comprador_grupo cg
      JOIN scc_compradores c ON c.id = cg.comprador_id
      WHERE cg.dt_fim IS NULL
    ),
    dias_atual AS (
      SELECT TRIM(codgrp) AS codgrp, COUNT(DISTINCT data) AS qtd
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE)::date AND CURRENT_DATE
      GROUP BY TRIM(codgrp)
    ),
    dias_mes_base AS (
      SELECT TRIM(codgrp) AS codgrp, COUNT(DISTINCT data) AS qtd
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE - interval '1 year')::date
                     AND (date_trunc('month', CURRENT_DATE - interval '1 year')
                          + interval '1 month' - interval '1 day')::date
      GROUP BY TRIM(codgrp)
    ),
    vendas_atual AS (
      SELECT
        TRIM(codgrp) AS codgrp,
        SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0))              AS venda,
        SUM(COALESCE(vlr_total_vendas_bruta, 0)
          - COALESCE(vlr_custos_vendas,       0)
          - COALESCE(vlr_impostos_vendas,     0))                                                  AS lb,
        SUM(CASE WHEN tipo IN ('FORA','ENCO')
                 THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)
                 ELSE 0 END)                                                                        AS venda_fora
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE)::date AND CURRENT_DATE
      GROUP BY TRIM(codgrp)
    ),
    vendas_ano_passado AS (
      SELECT
        TRIM(codgrp) AS codgrp,
        SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)) AS venda
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE - interval '1 year')::date
                     AND (CURRENT_DATE - interval '1 year')::date
      GROUP BY TRIM(codgrp)
    )
    SELECT
      ga.comprador,
      ga.codgrp,
      ROUND(
        CASE
          WHEN COALESCE(db.qtd, 0) = 0 THEN COALESCE(m.meta_vendas, 0)
          ELSE COALESCE(m.meta_vendas, 0) * COALESCE(da.qtd, 0)::numeric / NULLIF(db.qtd, 0)
        END,
      2) AS meta_vendas_ajustada,
      ROUND(
        CASE
          WHEN COALESCE(m.meta_vendas, 0) = 0 THEN 0
          WHEN COALESCE(db.qtd, 0) = 0 THEN
            COALESCE(va.venda, 0) / NULLIF(m.meta_vendas, 0) * 100
          ELSE
            COALESCE(va.venda, 0) / NULLIF(m.meta_vendas * COALESCE(da.qtd, 0)::numeric / db.qtd, 0) * 100
        END,
      2) AS venda_percentual_meta,
      ROUND(COALESCE(va.lb, 0) / NULLIF(va.venda, 0) * 100, 2) AS lb_percentual,
      COALESCE(m.meta_lb, 0) AS meta_lb,
      ROUND((COALESCE(va.venda, 0) / NULLIF(vap.venda, 0) - 1) * 100, 2) AS evolucao_percentual,
      ROUND(
        CASE
          WHEN COALESCE(m.meta_produtos_fora, 0) = 0 THEN 0
          WHEN COALESCE(db.qtd, 0) = 0 THEN
            COALESCE(va.venda_fora, 0) / NULLIF(m.meta_produtos_fora, 0) * 100
          ELSE
            COALESCE(va.venda_fora, 0) / NULLIF(
              m.meta_produtos_fora * COALESCE(da.qtd, 0)::numeric / db.qtd, 0) * 100
        END,
      2) AS produtos_fora_percentual
    FROM grupos_ativos ga
    LEFT JOIN vendas_atual       va  ON va.codgrp  = ga.codgrp
    LEFT JOIN vendas_ano_passado vap ON vap.codgrp = ga.codgrp
    LEFT JOIN dias_atual         da  ON da.codgrp  = ga.codgrp
    LEFT JOIN dias_mes_base      db  ON db.codgrp  = ga.codgrp
    LEFT JOIN scc_metas_compradores m
      ON  m.comprador_id = ga.comprador_id
      AND TRIM(m.codgrp) = ga.codgrp
      AND m.mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
      AND m.ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
    ORDER BY venda_percentual_meta ASC, ga.comprador
  `

  // ── Query 2: métricas globais (nível de serviço, dias de estoque, totais) ──
  const queryGlobal = `
    WITH
    -- Vendas período atual
    va AS (
      SELECT
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)), 0)   AS venda,
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta, 0)
                   - COALESCE(vlr_custos_vendas,       0)
                   - COALESCE(vlr_impostos_vendas,     0)), 0)                                       AS lb,
        COALESCE(SUM(CASE WHEN tipo IN ('FORA','ENCO')
                     THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)
                     ELSE 0 END), 0)                                                                 AS venda_fora,
        COALESCE(SUM(COALESCE(vlr_custos_vendas, 0)), 0)                                             AS custo_total,
        COUNT(DISTINCT data)                                                                         AS dias_com_venda
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE)::date AND CURRENT_DATE
    ),
    -- Vendas mês anterior (mesmo n° de dias desde o início do mês)
    vant AS (
      SELECT
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)), 0)   AS venda,
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta, 0)
                   - COALESCE(vlr_custos_vendas,       0)
                   - COALESCE(vlr_impostos_vendas,     0)), 0)                                       AS lb,
        COALESCE(SUM(CASE WHEN tipo IN ('FORA','ENCO')
                     THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)
                     ELSE 0 END), 0)                                                                 AS venda_fora
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN
        date_trunc('month', CURRENT_DATE - interval '1 month')::date
        AND (CURRENT_DATE - interval '1 month')::date
    ),
    -- Meta total dos compradores ativos no mês atual
    metas AS (
      SELECT
        COALESCE(SUM(m.meta_vendas),       0) AS meta_vendas,
        COALESCE(SUM(m.meta_produtos_fora), 0) AS meta_produtos_fora,
        COALESCE(AVG(m.meta_lb),           0) AS meta_lb_media
      FROM scc_comprador_grupo cg
      JOIN scc_compradores c ON c.id = cg.comprador_id
      JOIN scc_metas_compradores m
        ON  m.comprador_id = cg.comprador_id
        AND TRIM(m.codgrp) = TRIM(cg.codgrp)
        AND m.mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND m.ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
      WHERE cg.dt_fim IS NULL
    ),
    -- Nível de serviço: % de itens produto×loja com saldo_estoque > 0
    ns AS (
      SELECT
        ROUND(
          COUNT(CASE WHEN saldo_estoque > 0 THEN 1 END)::numeric /
          NULLIF(COUNT(*), 0) * 100,
        1) AS nivel_servico
      FROM vs_scc_festoques
    ),
    -- Valor do estoque a custo médio
    est AS (
      SELECT
        COALESCE(SUM(GREATEST(saldo_estoque, 0) *
                     COALESCE(NULLIF(prc_custo_medio, 0), prc_custo, 0)), 0) AS valor_estoque
      FROM vs_scc_festoques
    )
    SELECT
      ns.nivel_servico,
      -- Dias de estoque = valor estoque / custo médio diário
      ROUND(
        est.valor_estoque /
        NULLIF(va.custo_total::numeric / NULLIF(va.dias_com_venda, 0), 0),
      0) AS dias_estoque,
      va.venda         AS vendas_valor,
      va.lb            AS lb_valor,
      va.venda_fora    AS produtos_fora_valor,
      vant.venda       AS vendas_ant_valor,
      vant.lb          AS lb_ant_valor,
      vant.venda_fora  AS produtos_fora_ant_valor,
      ROUND(va.lb   / NULLIF(va.venda,   0) * 100, 1) AS lb_pct,
      ROUND(vant.lb / NULLIF(vant.venda, 0) * 100, 1) AS lb_ant_pct,
      metas.meta_vendas,
      metas.meta_produtos_fora,
      metas.meta_lb_media
    FROM va, vant, metas, ns, est
  `

  // ── Query 3: série diária para sparklines ──────────────────────────────────
  const querySeries = `
    SELECT
      data::date AS dia,
      SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0))           AS venda,
      SUM(COALESCE(vlr_total_vendas_bruta, 0)
        - COALESCE(vlr_custos_vendas,       0)
        - COALESCE(vlr_impostos_vendas,     0))                                               AS lb,
      SUM(CASE WHEN tipo IN ('FORA','ENCO')
               THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)
               ELSE 0 END)                                                                    AS produtos_fora
    FROM vs_scc_vendas_devolucoes
    WHERE data >= date_trunc('month', CURRENT_DATE)::date
      AND data <= CURRENT_DATE
    GROUP BY data::date
    ORDER BY data::date
  `

  const [r1, r2, r3] = await Promise.all([
    pool.query(queryCompradores),
    pool.query(queryGlobal),
    pool.query(querySeries),
  ])

  // ── Compradores ────────────────────────────────────────────────────────────
  const compradores = r1.rows.map((row) => {
    const vendaMeta    = safe(row.venda_percentual_meta)
    const lbPct        = safe(row.lb_percentual)
    const metaLb       = safe(row.meta_lb)
    const evolucao     = safe(row.evolucao_percentual)
    const produtosForaPct = safe(row.produtos_fora_percentual)

    const status =
      vendaMeta >= 100 ? "ACIMA DA META" :
        vendaMeta >= 95 ? "ATENÇÃO" :
          "ABAIXO"

    return {
      comprador: row.comprador,
      grupo: row.codgrp,
      vendaPercentualMeta: Number(vendaMeta.toFixed(2)),
      lbPercentual: Number(lbPct.toFixed(2)),
      metaLb: Number(metaLb.toFixed(2)),
      evolucaoPercentual: Number(evolucao.toFixed(2)),
      produtosForaPercentual: Number(produtosForaPct.toFixed(2)),
      status,
    }
  })

  // ── Global metrics ─────────────────────────────────────────────────────────
  const gm = r2.rows[0] ?? {}

  const vendasValor      = safe(gm.vendas_valor)
  const vendasAnt        = safe(gm.vendas_ant_valor)
  const lbPct            = safe(gm.lb_pct)
  const lbAntPct         = safe(gm.lb_ant_pct)
  const produtosForaValor = safe(gm.produtos_fora_valor)
  const produtosForaAnt  = safe(gm.produtos_fora_ant_valor)

  // ── Série diária ───────────────────────────────────────────────────────────
  const series = r3.rows.map((row) => ({
    dia: row.dia,
    venda: safe(row.venda),
    lb: safe(row.lb),
    produtosFora: safe(row.produtos_fora),
  }))

  // ── KPIs consolidados ──────────────────────────────────────────────────────
  const n = compradores.length || 1
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / n

  const kpis = {
    // VENDAS (R$)
    vendasValor,
    metaVendas:           safe(gm.meta_vendas),
    vendasVsMesAnterior:  vendasAnt > 0
      ? Number(((vendasValor / vendasAnt - 1) * 100).toFixed(1))
      : null as number | null,

    // LB (%)
    lbPercentual: lbPct,
    metaLb:       safe(gm.meta_lb_media),
    lbVsMesAnterior: lbAntPct > 0
      ? Number((lbPct - lbAntPct).toFixed(1))
      : null as number | null,

    // NÍVEL DE SERVIÇO (%)
    nivelServico:              safe(gm.nivel_servico),
    nivelServicoMeta:          98,
    nivelServicoVsMesAnterior: null as number | null,

    // EVOLUÇÃO (%)
    evolucao:               Number(avg(compradores.map((c) => c.evolucaoPercentual)).toFixed(1)),
    evolucaoMeta:           100,
    evolucaoVsMesAnterior:  null as number | null,

    // DIAS DE ESTOQUE
    diasEstoque:              safe(gm.dias_estoque),
    diasEstoqueMeta:          45,
    diasEstoqueVsMesAnterior: null as number | null,

    // PRODUTOS FORA
    produtosForaValor,
    metaProdutosFora:          safe(gm.meta_produtos_fora),
    produtosForaVsMesAnterior: produtosForaAnt > 0
      ? Number(((produtosForaValor / produtosForaAnt - 1) * 100).toFixed(1))
      : null as number | null,

    // Legacy (mantido para compatibilidade)
    vendasAtingimento: Number(avg(compradores.map((c) => c.vendaPercentualMeta)).toFixed(2)),
    lbRealizado:       lbPct,
    evolucaoLegacy:    Number(avg(compradores.map((c) => c.evolucaoPercentual)).toFixed(2)),
    nivelServico2:     null,
    diasEstoque2:      null,
    produtosFora:      safe(gm.meta_produtos_fora) > 0
      ? Number((produtosForaValor / safe(gm.meta_produtos_fora) * 100).toFixed(2))
      : 0,
  }

  // ── Alertas ────────────────────────────────────────────────────────────────
  const alertas: string[] = []
  compradores.forEach((c) => {
    if (c.lbPercentual > 0 && c.lbPercentual < c.metaLb)
      alertas.push(`${c.comprador}: LB abaixo da meta (${c.lbPercentual}% vs ${c.metaLb}%).`)
    if (c.vendaPercentualMeta > 0 && c.vendaPercentualMeta < 90)
      alertas.push(`${c.comprador}: Venda abaixo de 90% da meta (${c.vendaPercentualMeta}%).`)
    if (c.evolucaoPercentual < 0)
      alertas.push(`${c.comprador}: Queda de ${Math.abs(c.evolucaoPercentual)}% vs mesmo período do ano anterior.`)
    if (c.produtosForaPercentual > 0 && c.produtosForaPercentual < 100)
      alertas.push(`${c.comprador}: Produtos fora abaixo da meta (${c.produtosForaPercentual}%).`)
  })

  return {
    kpis,
    compradores,
    series,
    graficos: {
      evolucaoVendas: compradores.map((c) => ({ label: c.comprador, valor: c.vendaPercentualMeta })),
      evolucaoLb:     compradores.map((c) => ({ label: c.comprador, valor: c.lbPercentual })),
      produtosFora:   compradores.map((c) => ({ label: c.comprador, valor: c.produtosForaPercentual })),
    },
    alertas,
  }
}
