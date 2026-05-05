import pool from "../config/database"

const safe = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0)

export const getDashboardTvCompras = async () => {
  // ── Query 1: compradores (inclui valores absolutos para agregação) ─────────
  const queryCompradores = `
    WITH
    grupos_ativos AS (
      SELECT TRIM(cg.codgrp) AS codgrp, c.nome AS comprador, cg.comprador_id
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
        SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0))          AS venda,
        SUM(COALESCE(vlr_total_vendas_bruta, 0)
          - COALESCE(vlr_custos_vendas, 0)
          - COALESCE(vlr_impostos_vendas, 0))                                                  AS lb,
        SUM(CASE WHEN tipo IN ('FORA','ENCO')
                 THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)
                 ELSE 0 END)                                                                    AS venda_fora
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
      ga.comprador_id,
      -- valores absolutos para agregação no TypeScript
      COALESCE(va.venda, 0)      AS venda_realizado,
      COALESCE(va.lb, 0)         AS lb_realizado,
      COALESCE(va.venda_fora, 0) AS venda_fora_realizado,
      COALESCE(vap.venda, 0)     AS venda_ano_passado,
      -- meta ajustada por pro-rata
      ROUND(
        CASE WHEN COALESCE(db.qtd, 0) = 0 THEN COALESCE(m.meta_vendas, 0)
             ELSE COALESCE(m.meta_vendas, 0) * COALESCE(da.qtd, 0)::numeric / NULLIF(db.qtd, 0)
        END, 0) AS meta_vendas_ajustada,
      COALESCE(m.meta_lb, 0) AS meta_lb,
      ROUND(
        CASE WHEN COALESCE(db.qtd, 0) = 0 THEN COALESCE(m.meta_produtos_fora, 0)
             ELSE COALESCE(m.meta_produtos_fora, 0) * COALESCE(da.qtd, 0)::numeric / NULLIF(db.qtd, 0)
        END, 0) AS meta_produtos_fora_ajustada
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
    ORDER BY ga.comprador, ga.codgrp
  `

  // ── Query 2: KPIs globais ─────────────────────────────────────────────────
  const queryGlobal = `
    WITH
    va AS (
      SELECT
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)), 0)   AS venda,
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta, 0)
                   - COALESCE(vlr_custos_vendas, 0)
                   - COALESCE(vlr_impostos_vendas, 0)), 0)                                           AS lb,
        COALESCE(SUM(CASE WHEN tipo IN ('FORA','ENCO')
                     THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)
                     ELSE 0 END), 0)                                                                 AS venda_fora,
        COALESCE(SUM(COALESCE(vlr_custos_vendas, 0)), 0)                                             AS custo_total,
        COUNT(DISTINCT data)                                                                         AS dias_com_venda
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE)::date AND CURRENT_DATE
    ),
    vant AS (
      SELECT
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)), 0)   AS venda,
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta, 0)
                   - COALESCE(vlr_custos_vendas, 0)
                   - COALESCE(vlr_impostos_vendas, 0)), 0)                                           AS lb,
        COALESCE(SUM(CASE WHEN tipo IN ('FORA','ENCO')
                     THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)
                     ELSE 0 END), 0)                                                                 AS venda_fora
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN
        date_trunc('month', CURRENT_DATE - interval '1 month')::date
        AND (CURRENT_DATE - interval '1 month')::date
    ),
    metas AS (
      SELECT
        COALESCE(SUM(m.meta_vendas), 0)        AS meta_vendas,
        COALESCE(SUM(m.meta_produtos_fora), 0) AS meta_produtos_fora,
        COALESCE(AVG(m.meta_lb), 0)            AS meta_lb_media
      FROM scc_comprador_grupo cg
      JOIN scc_compradores c ON c.id = cg.comprador_id
      JOIN scc_metas_compradores m
        ON  m.comprador_id = cg.comprador_id
        AND TRIM(m.codgrp) = TRIM(cg.codgrp)
        AND m.mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND m.ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
      WHERE cg.dt_fim IS NULL
    ),
    ns AS (
      SELECT ROUND(COUNT(CASE WHEN saldo_estoque > 0 THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS nivel_servico
      FROM vs_scc_festoques
    ),
    est AS (
      SELECT COALESCE(SUM(GREATEST(saldo_estoque, 0) * COALESCE(NULLIF(prc_custo_medio, 0), prc_custo, 0)), 0) AS valor_estoque
      FROM vs_scc_festoques
    )
    SELECT
      ns.nivel_servico,
      ROUND(est.valor_estoque / NULLIF(va.custo_total::numeric / NULLIF(va.dias_com_venda, 0), 0), 0) AS dias_estoque,
      va.venda       AS vendas_valor,
      va.lb          AS lb_valor,
      va.venda_fora  AS produtos_fora_valor,
      vant.venda     AS vendas_ant_valor,
      vant.lb        AS lb_ant_valor,
      vant.venda_fora AS produtos_fora_ant_valor,
      ROUND(va.lb   / NULLIF(va.venda,   0) * 100, 1) AS lb_pct,
      ROUND(vant.lb / NULLIF(vant.venda, 0) * 100, 1) AS lb_ant_pct,
      metas.meta_vendas,
      metas.meta_produtos_fora,
      metas.meta_lb_media
    FROM va, vant, metas, ns, est
  `

  // ── Query 3: série diária mês atual ──────────────────────────────────────
  const querySeries = `
    SELECT
      data::date AS dia,
      SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0))               AS venda,
      SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_custos_vendas, 0) - COALESCE(vlr_impostos_vendas, 0)) AS lb,
      SUM(CASE WHEN tipo IN ('FORA','ENCO')
               THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)
               ELSE 0 END)                                                                        AS produtos_fora
    FROM vs_scc_vendas_devolucoes
    WHERE data >= date_trunc('month', CURRENT_DATE)::date AND data <= CURRENT_DATE
    GROUP BY data::date ORDER BY data::date
  `

  // ── Query 4: série diária mês anterior (mesmo período) ───────────────────
  const querySeriesAnt = `
    SELECT
      data::date AS dia,
      SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0))               AS venda,
      SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_custos_vendas, 0) - COALESCE(vlr_impostos_vendas, 0)) AS lb,
      SUM(CASE WHEN tipo IN ('FORA','ENCO')
               THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)
               ELSE 0 END)                                                                        AS produtos_fora
    FROM vs_scc_vendas_devolucoes
    WHERE data BETWEEN
      date_trunc('month', CURRENT_DATE - interval '1 month')::date
      AND (CURRENT_DATE - interval '1 month')::date
    GROUP BY data::date ORDER BY data::date
  `

  // ── Query 5: nível de serviço e dias de estoque por grupo ─────────────────
  const queryMetricsGrupo = `
    WITH custo_grupo AS (
      SELECT TRIM(codgrp) AS codgrp,
             SUM(COALESCE(vlr_custos_vendas, 0)) / NULLIF(COUNT(DISTINCT data), 0) AS custo_por_dia
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE)::date AND CURRENT_DATE
      GROUP BY TRIM(codgrp)
    ),
    est_grupo AS (
      SELECT
        TRIM(codgrupo) AS codgrupo,
        ROUND(COUNT(CASE WHEN saldo_estoque > 0 THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS nivel_servico,
        COALESCE(SUM(GREATEST(saldo_estoque, 0) * COALESCE(NULLIF(prc_custo_medio, 0), prc_custo, 0)), 0) AS valor_estoque
      FROM vs_scc_festoques
      GROUP BY TRIM(codgrupo)
    )
    SELECT eg.codgrupo, eg.nivel_servico,
           ROUND(eg.valor_estoque / NULLIF(cg.custo_por_dia, 0), 0) AS dias_estoque
    FROM est_grupo eg
    LEFT JOIN custo_grupo cg ON cg.codgrp = eg.codgrupo
  `

  // ── Query 6: produtos em ruptura (saldo <= 0) ─────────────────────────────
  const queryRuptura = `
    SELECT
      pro.c_descricao AS produto,
      TRIM(pro.c_class) AS codgrupo,
      COUNT(DISTINCT est.c_fil) AS lojas_sem_estoque
    FROM a_estfil est
    JOIN a_produt pro ON pro.c_codigo = est.c_codprod
      AND pro.c_status = 'A' AND pro.c_especie = 'P'
    WHERE (est.c_estloja - est.c_resloja) <= 0
      AND est.c_fil = ANY (ARRAY['00','01','02','03','04','05','06','07','08','09','10','11','12','15'])
    GROUP BY pro.c_descricao, TRIM(pro.c_class)
    HAVING COUNT(DISTINCT est.c_fil) >= 1
    ORDER BY COUNT(DISTINCT est.c_fil) DESC
    LIMIT 10
  `

  // ── Query 7: situação do estoque ──────────────────────────────────────────
  const querySituacao = `
    SELECT
      ROUND(COUNT(CASE WHEN saldo_estoque > 0
                       AND qtde_estoque_minimo > 0
                       AND saldo_estoque >= qtde_estoque_minimo
                       AND (qtde_estoque_maximo = 0 OR saldo_estoque <= qtde_estoque_maximo)
                  THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 0) AS ideal_pct,
      ROUND(COUNT(CASE WHEN saldo_estoque > 0
                       AND (qtde_estoque_minimo = 0 OR saldo_estoque < qtde_estoque_minimo)
                  THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 0) AS baixo_pct,
      ROUND(COUNT(CASE WHEN qtde_estoque_maximo > 0
                       AND saldo_estoque > qtde_estoque_maximo
                  THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 0) AS alto_pct
    FROM vs_scc_festoques
  `

  const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
    pool.query(queryCompradores),
    pool.query(queryGlobal),
    pool.query(querySeries),
    pool.query(querySeriesAnt),
    pool.query(queryMetricsGrupo),
    pool.query(queryRuptura),
    pool.query(querySituacao),
  ])

  // ── Agrupa compradores (múltiplos grupos → 1 linha por comprador) ─────────
  const metricsGrupoMap = new Map<string, { nivelServico: number; diasEstoque: number }>()
  for (const row of r5.rows) {
    metricsGrupoMap.set(String(row.codgrupo).trim(), {
      nivelServico: safe(row.nivel_servico),
      diasEstoque:  safe(row.dias_estoque),
    })
  }

  interface CompRow {
    comprador: string
    grupos: string[]
    vendaRealizado: number
    lbRealizado: number
    vendaForaRealizado: number
    vendaAnoPassado: number
    metaVendasAjustada: number
    metaLb: number
    metaProdutosForaAjustada: number
    nivelServico: number | null
    diasEstoque: number | null
  }

  const compMap = new Map<string, CompRow>()
  for (const row of r1.rows) {
    const key = row.comprador
    if (compMap.has(key)) {
      const c = compMap.get(key)!
      c.grupos.push(String(row.codgrp).trim())
      c.vendaRealizado       += safe(row.venda_realizado)
      c.lbRealizado          += safe(row.lb_realizado)
      c.vendaForaRealizado   += safe(row.venda_fora_realizado)
      c.vendaAnoPassado      += safe(row.venda_ano_passado)
      c.metaVendasAjustada   += safe(row.meta_vendas_ajustada)
      c.metaProdutosForaAjustada += safe(row.meta_produtos_fora_ajustada)
      // meta_lb: média simples entre grupos
      c.metaLb = (c.metaLb + safe(row.meta_lb)) / 2
    } else {
      const codgrp = String(row.codgrp).trim()
      const mg = metricsGrupoMap.get(codgrp)
      compMap.set(key, {
        comprador: row.comprador,
        grupos: [codgrp],
        vendaRealizado:         safe(row.venda_realizado),
        lbRealizado:            safe(row.lb_realizado),
        vendaForaRealizado:     safe(row.venda_fora_realizado),
        vendaAnoPassado:        safe(row.venda_ano_passado),
        metaVendasAjustada:     safe(row.meta_vendas_ajustada),
        metaLb:                 safe(row.meta_lb),
        metaProdutosForaAjustada: safe(row.meta_produtos_fora_ajustada),
        nivelServico: mg ? mg.nivelServico : null,
        diasEstoque:  mg ? mg.diasEstoque  : null,
      })
    }
  }

  const compradores = Array.from(compMap.values()).map((c) => {
    const vendaMeta    = c.metaVendasAjustada > 0 ? (c.vendaRealizado / c.metaVendasAjustada) * 100 : 0
    const lbPct        = c.vendaRealizado > 0 ? (c.lbRealizado / c.vendaRealizado) * 100 : 0
    const evolucao     = c.vendaAnoPassado > 0 ? (c.vendaRealizado / c.vendaAnoPassado - 1) * 100 : 0
    const produtosForaPct = c.metaProdutosForaAjustada > 0 ? (c.vendaForaRealizado / c.metaProdutosForaAjustada) * 100 : 0

    const status =
      vendaMeta >= 105 ? "ACIMA DA META" :
        vendaMeta >= 100 ? "DENTRO DA META" :
          vendaMeta >= 90 ? "ATENÇÃO" : "ABAIXO DA META"

    // Para múltiplos grupos: média ponderada de NS e dias
    let nsMedia = c.nivelServico
    let diasMedia = c.diasEstoque
    if (c.grupos.length > 1) {
      const vals = c.grupos.map((g) => metricsGrupoMap.get(g)).filter(Boolean)
      if (vals.length) {
        nsMedia   = vals.reduce((s, v) => s + v!.nivelServico, 0) / vals.length
        diasMedia = vals.reduce((s, v) => s + v!.diasEstoque,  0) / vals.length
      }
    }

    return {
      comprador: c.comprador,
      grupos: c.grupos.join(", "),
      vendaRealizado:     Math.round(c.vendaRealizado),
      metaVendasAjustada: Math.round(c.metaVendasAjustada),
      vendaPercentualMeta: Number(vendaMeta.toFixed(1)),
      lbPercentual:       Number(lbPct.toFixed(1)),
      metaLb:             Number(c.metaLb.toFixed(1)),
      nivelServico:       nsMedia !== null ? Number(nsMedia!.toFixed(1)) : null,
      nivelServicoMeta:   97,
      diasEstoque:        diasMedia !== null ? Math.round(diasMedia!) : null,
      diasEstoqueMeta:    45,
      evolucaoPercentual: Number(evolucao.toFixed(1)),
      vendaForaRealizado: Math.round(c.vendaForaRealizado),
      metaProdutosFora:   Math.round(c.metaProdutosForaAjustada),
      produtosForaPercentual: Number(produtosForaPct.toFixed(1)),
      status,
    }
  }).sort((a, b) => a.vendaPercentualMeta - b.vendaPercentualMeta)

  // ── Global metrics ────────────────────────────────────────────────────────
  const gm = r2.rows[0] ?? {}
  const vendasValor       = safe(gm.vendas_valor)
  const vendasAnt         = safe(gm.vendas_ant_valor)
  const lbPct             = safe(gm.lb_pct)
  const lbAntPct          = safe(gm.lb_ant_pct)
  const produtosForaValor = safe(gm.produtos_fora_valor)
  const produtosForaAnt   = safe(gm.produtos_fora_ant_valor)

  // ── Séries diárias ────────────────────────────────────────────────────────
  const toSeries = (rows: any[]) =>
    rows.map((r) => ({ dia: r.dia, venda: safe(r.venda), lb: safe(r.lb), produtosFora: safe(r.produtos_fora) }))

  const series    = toSeries(r3.rows)
  const seriesAnt = toSeries(r4.rows)

  // ── Ruptura e situação ────────────────────────────────────────────────────
  const ruptura = r6.rows.map((r) => ({
    produto:          r.produto,
    codgrupo:         String(r.codgrupo).trim(),
    lojasSemEstoque:  safe(r.lojas_sem_estoque),
  }))

  const sit = r7.rows[0] ?? {}
  const situacaoEstoque = {
    idealPct:   safe(sit.ideal_pct),
    baixoPct:   safe(sit.baixo_pct),
    altoPct:    safe(sit.alto_pct),
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const n   = compradores.length || 1
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / n

  const kpis = {
    vendasValor,
    metaVendas:  safe(gm.meta_vendas),
    vendasVsMesAnterior: vendasAnt > 0
      ? Number(((vendasValor / vendasAnt - 1) * 100).toFixed(1)) : null as number | null,

    lbPercentual: lbPct,
    metaLb:       safe(gm.meta_lb_media),
    lbVsMesAnterior: lbAntPct > 0
      ? Number((lbPct - lbAntPct).toFixed(1)) : null as number | null,

    nivelServico:              safe(gm.nivel_servico),
    nivelServicoMeta:          98,
    nivelServicoVsMesAnterior: null as number | null,

    evolucao:              Number(avg(compradores.map((c) => c.evolucaoPercentual)).toFixed(1)),
    evolucaoMeta:          100,
    evolucaoVsMesAnterior: null as number | null,

    diasEstoque:              safe(gm.dias_estoque),
    diasEstoqueMeta:          45,
    diasEstoqueVsMesAnterior: null as number | null,

    produtosForaValor,
    metaProdutosFora:          safe(gm.meta_produtos_fora),
    produtosForaVsMesAnterior: produtosForaAnt > 0
      ? Number(((produtosForaValor / produtosForaAnt - 1) * 100).toFixed(1)) : null as number | null,

    // Legacy
    vendasAtingimento: Number(avg(compradores.map((c) => c.vendaPercentualMeta)).toFixed(2)),
    lbRealizado:       lbPct,
    produtosFora:      safe(gm.meta_produtos_fora) > 0
      ? Number((produtosForaValor / safe(gm.meta_produtos_fora) * 100).toFixed(2)) : 0,
  }

  // ── Alertas ───────────────────────────────────────────────────────────────
  const alertas: string[] = []
  compradores.forEach((c) => {
    if (c.vendaPercentualMeta > 0 && c.vendaPercentualMeta < 90)
      alertas.push(`${c.comprador}: Venda abaixo de 90% da meta (${c.vendaPercentualMeta}%)`)
    if (c.lbPercentual > 0 && c.lbPercentual < c.metaLb)
      alertas.push(`${c.comprador}: LB abaixo da meta (${c.lbPercentual}% vs ${c.metaLb}%)`)
    if (c.nivelServico !== null && c.nivelServico < c.nivelServicoMeta)
      alertas.push(`${c.comprador}: Nível de serviço abaixo da meta (${c.nivelServico}%)`)
    if (c.evolucaoPercentual < 0)
      alertas.push(`${c.comprador}: Queda de ${Math.abs(c.evolucaoPercentual)}% vs mesmo período do ano anterior`)
  })
  if (ruptura.length > 0)
    alertas.push(`${ruptura.length} produto(s) em ruptura de estoque`)

  return {
    kpis,
    compradores,
    series,
    seriesAnt,
    ruptura,
    situacaoEstoque,
    graficos: {
      evolucaoVendas: compradores.map((c) => ({ label: c.comprador, valor: c.vendaPercentualMeta })),
      evolucaoLb:     compradores.map((c) => ({ label: c.comprador, valor: c.lbPercentual })),
    },
    alertas,
  }
}
