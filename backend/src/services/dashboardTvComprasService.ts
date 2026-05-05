import pool from "../config/database"

const safe = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0)

export const getDashboardTvCompras = async () => {
  /**
   * REGRAS DE NEGÓCIO APLICADAS:
   *
   * 1. Período atual  : date_trunc('month', CURRENT_DATE) → CURRENT_DATE
   * 2. Período base   : mesmo intervalo do ano anterior (dia a dia)
   * 3. Dias faturados : COUNT(DISTINCT data) — apenas dias com movimento real
   * 4. Meta ajustada  : meta_mensal × (dias_faturados_atual / dias_faturados_mes_base)
   *    onde dias_mes_base = mês COMPLETO do ano passado (referência de ritmo)
   * 5. Grupos ativos  : dt_fim IS NULL apenas
   * 6. Metas          : JOIN por comprador_id + codgrp + mes + ano (inteiros)
   * 7. Produtos fora  : tipo IN ('FORA','ENCO'), venda líquida
   * 8. Sem R$         : apenas percentuais expostos
   */

  const query = `
    WITH

    -- Grupos e compradores ativos (apenas registros sem data de encerramento)
    grupos_ativos AS (
      SELECT
        TRIM(cg.codgrp)   AS codgrp,
        c.nome            AS comprador,
        cg.comprador_id
      FROM scc_comprador_grupo cg
      JOIN scc_compradores c ON c.id = cg.comprador_id
      WHERE cg.dt_fim IS NULL
    ),

    -- Dias com faturamento no periodo atual (mes corrente ate hoje)
    dias_atual AS (
      SELECT
        TRIM(codgrp) AS codgrp,
        COUNT(DISTINCT data) AS qtd
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE)::date
                     AND CURRENT_DATE
      GROUP BY TRIM(codgrp)
    ),

    -- Dias com faturamento no mes COMPLETO do ano passado
    --    Usado como denominador para pro-ratear a meta mensal
    dias_mes_base AS (
      SELECT
        TRIM(codgrp) AS codgrp,
        COUNT(DISTINCT data) AS qtd
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE - interval '1 year')::date
                     AND (date_trunc('month', CURRENT_DATE - interval '1 year')
                          + interval '1 month' - interval '1 day')::date
      GROUP BY TRIM(codgrp)
    ),

    -- Vendas do periodo atual
    vendas_atual AS (
      SELECT
        TRIM(codgrp) AS codgrp,
        SUM(COALESCE(vlr_total_vendas_bruta,  0) - COALESCE(vlr_total_devolucoes, 0))              AS venda,
        SUM(COALESCE(vlr_total_vendas_bruta,  0)
          - COALESCE(vlr_custos_vendas,        0)
          - COALESCE(vlr_impostos_vendas,      0))                                                  AS lb,
        SUM(CASE WHEN tipo IN ('FORA','ENCO')
                 THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)
                 ELSE 0 END)                                                                        AS venda_fora
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE)::date
                     AND CURRENT_DATE
      GROUP BY TRIM(codgrp)
    ),

    -- Vendas do mesmo periodo do ano passado (para evolucao)
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

      -- Meta ajustada: meta_mensal * (dias_atual / dias_mes_base)
      -- Se não há base histórica usa a meta cheia como fallback
      ROUND(
        CASE
          WHEN COALESCE(db.qtd, 0) = 0 THEN COALESCE(m.meta_vendas, 0)
          ELSE COALESCE(m.meta_vendas, 0)
               * COALESCE(da.qtd, 0)::numeric
               / NULLIF(db.qtd, 0)
        END,
      2) AS meta_vendas_ajustada,

      -- Venda % da meta ajustada
      ROUND(
        CASE
          WHEN COALESCE(m.meta_vendas, 0) = 0 THEN 0
          WHEN COALESCE(db.qtd, 0) = 0         THEN
            COALESCE(va.venda, 0) / NULLIF(m.meta_vendas, 0) * 100
          ELSE
            COALESCE(va.venda, 0) / NULLIF(
              m.meta_vendas * COALESCE(da.qtd, 0)::numeric / db.qtd,
            0) * 100
        END,
      2) AS venda_percentual_meta,

      -- LB % (lucro bruto sobre venda liquida)
      ROUND(
        COALESCE(va.lb,    0) / NULLIF(va.venda, 0) * 100,
      2) AS lb_percentual,

      -- Meta LB % (percentual-alvo informado no cadastro)
      COALESCE(m.meta_lb, 0) AS meta_lb,

      -- Evolucao vs mesmo periodo do ano passado
      ROUND(
        (COALESCE(va.venda, 0) / NULLIF(vap.venda, 0) - 1) * 100,
      2) AS evolucao_percentual,

      -- Produtos fora % da meta ajustada
      ROUND(
        CASE
          WHEN COALESCE(m.meta_produtos_fora, 0) = 0 THEN 0
          WHEN COALESCE(db.qtd, 0) = 0               THEN
            COALESCE(va.venda_fora, 0) / NULLIF(m.meta_produtos_fora, 0) * 100
          ELSE
            COALESCE(va.venda_fora, 0) / NULLIF(
              m.meta_produtos_fora * COALESCE(da.qtd, 0)::numeric / db.qtd,
            0) * 100
        END,
      2) AS produtos_fora_percentual

    FROM grupos_ativos ga

    -- Vendas do período atual
    LEFT JOIN vendas_atual       va  ON va.codgrp  = ga.codgrp

    -- Vendas do mesmo período do ano passado
    LEFT JOIN vendas_ano_passado vap ON vap.codgrp = ga.codgrp

    -- Dias faturados no período atual
    LEFT JOIN dias_atual         da  ON da.codgrp  = ga.codgrp

    -- Dias faturados no mês completo do ano passado (base para pro-rata da meta)
    LEFT JOIN dias_mes_base      db  ON db.codgrp  = ga.codgrp

    -- Metas: join por comprador_id + codgrp + mês/ano inteiros (sem TO_CHAR)
    LEFT JOIN scc_metas_compradores m
      ON  m.comprador_id = ga.comprador_id
      AND TRIM(m.codgrp) = ga.codgrp
      AND m.mes          = EXTRACT(MONTH FROM CURRENT_DATE)::int
      AND m.ano          = EXTRACT(YEAR  FROM CURRENT_DATE)::int

    ORDER BY venda_percentual_meta ASC, ga.comprador
  `

  const result = await pool.query(query)

  const compradores = result.rows.map((row) => {
    const vendaMeta = safe(row.venda_percentual_meta)
    const lbPct = safe(row.lb_percentual)
    const metaLb = safe(row.meta_lb)
    const evolucao = safe(row.evolucao_percentual)
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

  // KPIs: média ponderada simples entre todos os compradores
  const n = compradores.length || 1
  const media = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / n

  const kpis = {
    vendasAtingimento: Number(media(compradores.map((c) => c.vendaPercentualMeta)).toFixed(2)),
    lbRealizado: Number(media(compradores.map((c) => c.lbPercentual)).toFixed(2)),
    lbMeta: Number(media(compradores.map((c) => c.metaLb)).toFixed(2)),
    evolucao: Number(media(compradores.map((c) => c.evolucaoPercentual)).toFixed(2)),
    nivelServico: null,
    diasEstoque: null,
    produtosFora: Number(media(compradores.map((c) => c.produtosForaPercentual)).toFixed(2)),
  }

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
    graficos: {
      evolucaoVendas: compradores.map((c) => ({ label: c.comprador, valor: c.vendaPercentualMeta })),
      evolucaoLb: compradores.map((c) => ({ label: c.comprador, valor: c.lbPercentual })),
      produtosFora: compradores.map((c) => ({ label: c.comprador, valor: c.produtosForaPercentual })),
    },
    alertas,
  }
}
