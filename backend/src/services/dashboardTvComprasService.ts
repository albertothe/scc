import pool from "../config/database"

const safePercent = (value: number | null | undefined) => Number.isFinite(value as number) ? Number(value) : 0

export const getDashboardTvCompras = async () => {
  const query = `
    WITH periodos AS (
      SELECT
        date_trunc('month', CURRENT_DATE)::date AS inicio_atual,
        CURRENT_DATE::date AS fim_atual,
        date_trunc('month', CURRENT_DATE - interval '1 year')::date AS inicio_ano_passado,
        (CURRENT_DATE - interval '1 year')::date AS fim_ano_passado
    ),
    grupos_ativos AS (
      SELECT
        cg.codgrp,
        c.nome AS comprador
      FROM scc_comprador_grupo cg
      JOIN scc_compradores c ON c.id = cg.comprador_id
      WHERE cg.dt_fim IS NULL
    ),
    vendas AS (
      SELECT
        v.codgrp,
        SUM(COALESCE(v.vlr_total_vendas_bruta, 0) - COALESCE(v.vlr_total_devolucoes, 0)) AS venda,
        SUM(COALESCE(v.vlr_total_vendas_bruta, 0) - COALESCE(v.vlr_custos_vendas, 0) - COALESCE(v.vlr_impostos_vendas, 0)) AS lb,
        SUM(CASE WHEN v.tipo IN ('FORA', 'ENCO') THEN COALESCE(v.vlr_total_vendas_bruta, 0) - COALESCE(v.vlr_total_devolucoes, 0) ELSE 0 END) AS venda_fora
      FROM vs_scc_vendas_devolucoes v
      JOIN periodos p ON true
      WHERE v.data BETWEEN p.inicio_atual AND p.fim_atual
      GROUP BY v.codgrp
    ),
    vendas_ano_ant AS (
      SELECT
        v.codgrp,
        SUM(COALESCE(v.vlr_total_vendas_bruta, 0) - COALESCE(v.vlr_total_devolucoes, 0)) AS venda
      FROM vs_scc_vendas_devolucoes v
      JOIN periodos p ON true
      WHERE v.data BETWEEN p.inicio_ano_passado AND p.fim_ano_passado
      GROUP BY v.codgrp
    )
    SELECT
      ga.codgrp,
      ga.comprador,
      COALESCE(v.venda, 0) AS venda,
      COALESCE(v.lb, 0) AS lb,
      COALESCE(v.venda_fora, 0) AS venda_fora,
      CASE WHEN COALESCE(v.venda, 0) = 0 THEN 0 ELSE (v.lb / v.venda) * 100 END AS lb_percentual,
      CASE WHEN COALESCE(m.meta_vendas, 0) = 0 THEN 0 ELSE (COALESCE(v.venda, 0) / m.meta_vendas) * 100 END AS venda_percentual_meta,
      COALESCE(m.meta_lb, 0) AS meta_lb,
      CASE WHEN COALESCE(va.venda, 0) = 0 THEN 0 ELSE ((COALESCE(v.venda, 0) / va.venda) - 1) * 100 END AS evolucao_percentual,
      CASE WHEN COALESCE(m.meta_produtos_fora, 0) = 0 THEN 0 ELSE (COALESCE(v.venda_fora, 0) / m.meta_produtos_fora) * 100 END AS produtos_fora_percentual
    FROM grupos_ativos ga
    LEFT JOIN vendas v ON v.codgrp = ga.codgrp
    LEFT JOIN vendas_ano_ant va ON va.codgrp = ga.codgrp
    LEFT JOIN periodos p ON true
    LEFT JOIN scc_metas_compradores m ON m.codgrp = ga.codgrp
      AND m.mes = EXTRACT(MONTH FROM p.inicio_atual)::int
      AND m.ano = EXTRACT(YEAR FROM p.inicio_atual)::int
    ORDER BY venda_percentual_meta ASC, ga.comprador;
  `

  const result = await pool.query(query)
  const compradores = result.rows.map((row) => {
    const vendaMeta = safePercent(row.venda_percentual_meta)
    const lbPct = safePercent(row.lb_percentual)
    const metaLb = safePercent(row.meta_lb)
    const evolucao = safePercent(row.evolucao_percentual)
    const produtosForaPct = safePercent(row.produtos_fora_percentual)

    let status = "ABAIXO"
    if (vendaMeta >= 100) status = "ACIMA DA META"
    else if (vendaMeta >= 95) status = "ATENÇÃO"

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

  const total = compradores.length || 1
  const media = (arr: number[]) => arr.reduce((sum, value) => sum + value, 0) / total

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
    if (c.lbPercentual < c.metaLb) alertas.push(`${c.comprador}: LB abaixo da meta.`)
    if (c.vendaPercentualMeta < 90) alertas.push(`${c.comprador}: Venda abaixo de 90%.`)
    if (c.evolucaoPercentual < 0) alertas.push(`${c.comprador}: Queda versus mesmo período do ano anterior.`)
    if (c.produtosForaPercentual < 100) alertas.push(`${c.comprador}: Produtos fora abaixo da meta.`)
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
