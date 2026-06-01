import pool from "../config/database"

const safe = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0)

/**
 * Retorna o mesmo shape que getDashboardTvCompras(), mas para um mês/ano
 * histórico escolhido. Todas as referências a CURRENT_DATE são substituídas
 * pelo último dia do mês solicitado ($1::date), de forma que dias_decorridos
 * = total_dias (mês completo).
 */
export const getDashboardHistorico = async (ano: number, mes: number) => {
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${String(diasNoMes).padStart(2, "0")}`
  const p = [dataFim] // $1 = último dia do mês solicitado

  // ── Query 1: compradores ────────────────────────────────────────────────
  const queryCompradores = `
    WITH
    grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM $1::date)::int
        AND ano = EXTRACT(YEAR  FROM $1::date)::int
    ),
    dias_mes AS (
      SELECT
        EXTRACT(DAY FROM $1::date)::int AS dias_decorridos,
        EXTRACT(DAY FROM (date_trunc('month', $1::date)
                          + interval '1 month' - interval '1 day')::date)::int AS total_dias
    ),
    grupos_ativos AS (
      SELECT TRIM(cg.codgrp) AS codgrp, c.nome AS comprador, cg.comprador_id
      FROM scc_comprador_grupo cg
      JOIN scc_compradores c ON c.id = cg.comprador_id
      WHERE cg.dt_fim IS NULL
        AND TRIM(cg.codgrp) IN (SELECT codgrp FROM grupos_meta)
    ),
    nomes_grupo AS (
      SELECT TRIM(codgrp) AS codgrp, MIN(grupo) AS grupo
      FROM vs_scc_dgrupos
      GROUP BY TRIM(codgrp)
    ),
    vendas_atual AS (
      SELECT
        TRIM(codgrp) AS codgrp,
        SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0))   AS venda,
        SUM(COALESCE(vlr_total_vendas_bruta, 0))                                         AS venda_bruta,
        SUM(COALESCE(vlr_total_vendas_bruta, 0)
          - COALESCE(vlr_custos_vendas, 0)
          - COALESCE(vlr_impostos_vendas, 0))                                            AS lb_valor,
        SUM(CASE WHEN tipo IN ('Fora','Encomenda')
                 THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)
                 ELSE 0 END)                                                             AS venda_fora
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', $1::date)::date AND $1::date
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
      GROUP BY TRIM(codgrp)
    ),
    vendas_ano_passado AS (
      SELECT
        TRIM(codgrp) AS codgrp,
        SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)) AS venda
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', $1::date - interval '1 year')::date
                     AND ($1::date - interval '1 year')::date
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
      GROUP BY TRIM(codgrp)
    )
    SELECT
      ga.comprador,
      ga.codgrp,
      COALESCE(ng.grupo, ga.codgrp)  AS grupo_nome,
      COALESCE(va.venda, 0)          AS venda_realizado,
      COALESCE(va.venda_bruta, 0)    AS venda_bruta,
      COALESCE(va.lb_valor, 0)       AS lb_realizado,
      COALESCE(va.venda_fora, 0)     AS venda_fora_realizado,
      COALESCE(vap.venda, 0)         AS venda_ano_passado,
      COALESCE(ROUND(m.meta_vendas        * dm.dias_decorridos::numeric / NULLIF(dm.total_dias, 0), 0), 0) AS meta_vendas_ajustada,
      COALESCE(m.meta_lb, 0)         AS meta_lb,
      COALESCE(ROUND(m.meta_produtos_fora * dm.dias_decorridos::numeric / NULLIF(dm.total_dias, 0), 0), 0) AS meta_produtos_fora_ajustada,
      COALESCE(m.meta_nivel_servico, 97) AS meta_nivel_servico,
      COALESCE(m.meta_dias_estoque, 45)  AS meta_dias_estoque
    FROM grupos_ativos ga
    CROSS JOIN dias_mes dm
    LEFT JOIN nomes_grupo ng ON ng.codgrp = ga.codgrp
    LEFT JOIN scc_metas_compradores m
      ON  m.comprador_id = ga.comprador_id
      AND TRIM(m.codgrp) = ga.codgrp
      AND m.mes = EXTRACT(MONTH FROM $1::date)::int
      AND m.ano = EXTRACT(YEAR  FROM $1::date)::int
    LEFT JOIN vendas_atual       va  ON va.codgrp = ga.codgrp
    LEFT JOIN vendas_ano_passado vap ON vap.codgrp = ga.codgrp
    ORDER BY ga.comprador, ga.codgrp
  `

  // ── Query 2: KPIs globais ────────────────────────────────────────────────
  const queryGlobal = `
    WITH
    grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM $1::date)::int
        AND ano = EXTRACT(YEAR  FROM $1::date)::int
    ),
    dias_mes AS (
      SELECT
        EXTRACT(DAY FROM $1::date)::int AS dias_decorridos,
        EXTRACT(DAY FROM (date_trunc('month', $1::date)
                          + interval '1 month' - interval '1 day')::date)::int AS total_dias
    ),
    va AS (
      SELECT
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0)), 0) AS venda,
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta,0)), 0)                                     AS venda_bruta,
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta,0)
                   - COALESCE(vlr_custos_vendas,0)
                   - COALESCE(vlr_impostos_vendas,0)), 0)                                        AS lb_valor,
        COALESCE(SUM(CASE WHEN tipo IN ('Fora','Encomenda')
                     THEN COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0)
                     ELSE 0 END), 0)                                                             AS venda_fora
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', $1::date)::date AND $1::date
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
    ),
    vap AS (
      SELECT
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0)), 0) AS venda,
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta,0)), 0)                                     AS venda_bruta,
        COALESCE(SUM(COALESCE(vlr_total_vendas_bruta,0)
                   - COALESCE(vlr_custos_vendas,0)
                   - COALESCE(vlr_impostos_vendas,0)), 0)                                        AS lb_valor
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', $1::date - interval '1 year')::date
                     AND ($1::date - interval '1 year')::date
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
    ),
    metas AS (
      SELECT
        COALESCE(SUM(meta_vendas), 0)         AS meta_vendas,
        COALESCE(SUM(meta_produtos_fora), 0)  AS meta_produtos_fora,
        COALESCE(AVG(meta_lb), 0)             AS meta_lb_media,
        COALESCE(AVG(meta_dias_estoque), 45)  AS meta_dias_estoque_media,
        COALESCE(AVG(meta_nivel_servico), 98) AS meta_nivel_servico_media
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM $1::date)::int
        AND ano = EXTRACT(YEAR  FROM $1::date)::int
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
    ),
    ns AS (
      SELECT
        ROUND(COUNT(CASE WHEN facing > 0 AND saldoestoque > 0 THEN 1 END)::numeric
              / NULLIF(COUNT(CASE WHEN facing > 0 THEN 1 END), 0) * 100, 1) AS nivel_servico
      FROM vs_scc_estoque_media_facing
      WHERE codgrp IN (SELECT codgrp FROM grupos_meta)
    ),
    dias_est AS (
      SELECT
        ROUND(SUM(CASE WHEN mediadia > 0 THEN saldoestoque ELSE 0 END)
              / NULLIF(SUM(CASE WHEN mediadia > 0 THEN mediadia ELSE 0 END), 0), 0) AS dias_estoque
      FROM vs_scc_estoque_media_facing
      WHERE codgrp IN (SELECT codgrp FROM grupos_meta)
    )
    SELECT
      va.venda               AS vendas_valor,
      va.venda_bruta,
      va.lb_valor,
      va.venda_fora          AS produtos_fora_valor,
      vap.venda              AS vendas_ano_passado,
      ns.nivel_servico,
      dias_est.dias_estoque,
      metas.meta_vendas,
      metas.meta_produtos_fora,
      metas.meta_lb_media,
      metas.meta_dias_estoque_media,
      metas.meta_nivel_servico_media,
      dm.dias_decorridos,
      dm.total_dias
    FROM va, vap, metas, ns, dias_est
    CROSS JOIN dias_mes dm
  `

  // ── Query 3: NS e dias de estoque por grupo ──────────────────────────────
  const queryMetricsGrupo = `
    WITH grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM $1::date)::int
        AND ano = EXTRACT(YEAR  FROM $1::date)::int
    )
    SELECT
      ef.codgrp,
      ROUND(COUNT(CASE WHEN ef.facing > 0 AND ef.saldoestoque > 0 THEN 1 END)::numeric
            / NULLIF(COUNT(CASE WHEN ef.facing > 0 THEN 1 END), 0) * 100, 1) AS nivel_servico,
      ROUND(SUM(CASE WHEN ef.mediadia > 0 THEN ef.saldoestoque ELSE 0 END)
            / NULLIF(SUM(CASE WHEN ef.mediadia > 0 THEN ef.mediadia ELSE 0 END), 0), 0) AS dias_estoque
    FROM vs_scc_estoque_media_facing ef
    WHERE ef.codgrp IN (SELECT codgrp FROM grupos_meta)
    GROUP BY ef.codgrp
  `

  // ── Query 4: NS por loja (produto × loja), por grupo + total global ──────
  const queryNsLojasGrupo = `
    WITH grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM $1::date)::int
        AND ano = EXTRACT(YEAR  FROM $1::date)::int
    )
    SELECT
      TRIM(ef.codgrp) AS codgrp,
      ROUND(
        COUNT(CASE WHEN ef.facing > 0 AND ef.saldoestoque > 0 THEN 1 END)::numeric
        / NULLIF(COUNT(CASE WHEN ef.facing > 0 THEN 1 END), 0) * 100, 1
      ) AS nivel_servico_lojas
    FROM vs_scc_estoque_media_facing_lojas ef
    WHERE TRIM(ef.codgrp) IN (SELECT codgrp FROM grupos_meta)
    GROUP BY TRIM(ef.codgrp)
    UNION ALL
    SELECT
      '__TOTAL__' AS codgrp,
      ROUND(
        COUNT(CASE WHEN ef.facing > 0 AND ef.saldoestoque > 0 THEN 1 END)::numeric
        / NULLIF(COUNT(CASE WHEN ef.facing > 0 THEN 1 END), 0) * 100, 1
      ) AS nivel_servico_lojas
    FROM vs_scc_estoque_media_facing_lojas ef
    WHERE TRIM(ef.codgrp) IN (SELECT codgrp FROM grupos_meta)
  `

  // ── Query 5: NS e dias por loja, detalhado por grupo e por comprador ─────
  const queryNsLojasDetalhe = `
    WITH
    grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM $1::date)::int
        AND ano = EXTRACT(YEAR  FROM $1::date)::int
    ),
    ga AS (
      SELECT TRIM(cg.codgrp) AS codgrp, c.nome AS comprador
      FROM scc_comprador_grupo cg
      JOIN scc_compradores c ON c.id = cg.comprador_id
      WHERE cg.dt_fim IS NULL
        AND TRIM(cg.codgrp) IN (SELECT codgrp FROM grupos_meta)
    )
    SELECT
      'grupo'              AS tipo,
      TRIM(ef.codgrp)      AS codgrp,
      NULL::text           AS comprador,
      TRIM(ef.codloja)     AS codloja,
      ROUND(
        COUNT(CASE WHEN ef.facing > 0 AND ef.saldoestoque > 0 THEN 1 END)::numeric
        / NULLIF(COUNT(CASE WHEN ef.facing > 0 THEN 1 END), 0) * 100, 0
      ) AS nivel_servico,
      ROUND(
        SUM(CASE WHEN ef.mediadia > 0 THEN ef.saldoestoque ELSE 0 END)
        / NULLIF(SUM(CASE WHEN ef.mediadia > 0 THEN ef.mediadia ELSE 0 END), 0), 0
      ) AS dias_estoque
    FROM vs_scc_estoque_media_facing_lojas ef
    WHERE TRIM(ef.codgrp) IN (SELECT codgrp FROM grupos_meta)
    GROUP BY TRIM(ef.codgrp), TRIM(ef.codloja)
    UNION ALL
    SELECT
      'comprador'          AS tipo,
      NULL::text           AS codgrp,
      ga.comprador,
      TRIM(ef.codloja)     AS codloja,
      ROUND(
        COUNT(CASE WHEN ef.facing > 0 AND ef.saldoestoque > 0 THEN 1 END)::numeric
        / NULLIF(COUNT(CASE WHEN ef.facing > 0 THEN 1 END), 0) * 100, 0
      ) AS nivel_servico,
      ROUND(
        SUM(CASE WHEN ef.mediadia > 0 THEN ef.saldoestoque ELSE 0 END)
        / NULLIF(SUM(CASE WHEN ef.mediadia > 0 THEN ef.mediadia ELSE 0 END), 0), 0
      ) AS dias_estoque
    FROM vs_scc_estoque_media_facing_lojas ef
    JOIN ga ON ga.codgrp = TRIM(ef.codgrp)
    GROUP BY ga.comprador, TRIM(ef.codloja)
    ORDER BY tipo, codgrp, comprador, codloja
  `

  // ── Query 6: evolução por loja vs mesmo período ano passado ─────────────
  const queryEvolLojasDetalhe = `
    WITH
    grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM $1::date)::int
        AND ano = EXTRACT(YEAR  FROM $1::date)::int
    ),
    lojas AS (
      SELECT lpad(gs::text, 2, '0') AS codloja
      FROM generate_series(0, 11) gs
    ),
    base AS (
      SELECT gm.codgrp, l.codloja
      FROM grupos_meta gm
      CROSS JOIN lojas l
    ),
    atual AS (
      SELECT
        TRIM(codgrp)  AS codgrp,
        TRIM(codloja) AS codloja,
        SUM(COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0))       AS venda,
        SUM(COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_custos_vendas,0)
              - COALESCE(vlr_impostos_vendas,0))                                          AS lb,
        SUM(COALESCE(vlr_total_vendas_bruta,0))                                           AS venda_bruta,
        SUM(CASE WHEN tipo IN ('Fora','Encomenda','FORA','ENCO')
                 THEN COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0)
                 ELSE 0 END)                                                              AS venda_fora
      FROM vs_scc_vendas_devolucoes_lojas
      WHERE data BETWEEN date_trunc('month', $1::date)::date AND $1::date
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
      GROUP BY TRIM(codgrp), TRIM(codloja)
    ),
    anterior AS (
      SELECT
        TRIM(codgrp)  AS codgrp,
        TRIM(codloja) AS codloja,
        SUM(COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0))       AS venda,
        SUM(COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_custos_vendas,0)
              - COALESCE(vlr_impostos_vendas,0))                                          AS lb,
        SUM(COALESCE(vlr_total_vendas_bruta,0))                                           AS venda_bruta,
        SUM(CASE WHEN tipo IN ('Fora','Encomenda','FORA','ENCO')
                 THEN COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0)
                 ELSE 0 END)                                                              AS venda_fora
      FROM vs_scc_vendas_devolucoes_lojas
      WHERE data BETWEEN date_trunc('month', $1::date - interval '1 year')::date
                     AND ($1::date - interval '1 year')::date
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
      GROUP BY TRIM(codgrp), TRIM(codloja)
    )
    SELECT
      b.codgrp,
      b.codloja,
      ROUND(CASE
        WHEN COALESCE(a.venda,0) = 0 AND COALESCE(ant.venda,0) = 0 THEN NULL
        WHEN COALESCE(ant.venda,0) = 0                              THEN  100.0
        WHEN COALESCE(a.venda,0)   = 0                              THEN -100.0
        ELSE (a.venda / ant.venda - 1) * 100
      END, 1) AS evol_vendas,
      ROUND(CASE
        WHEN COALESCE(a.venda_bruta,0) > 0 AND COALESCE(ant.venda_bruta,0) > 0
          THEN ((a.lb / a.venda_bruta) - (ant.lb / ant.venda_bruta)) * 100
        ELSE NULL
      END, 1) AS evol_lb,
      ROUND(CASE
        WHEN COALESCE(a.venda_fora,0) = 0 AND COALESCE(ant.venda_fora,0) = 0 THEN NULL
        WHEN COALESCE(ant.venda_fora,0) = 0                                   THEN  100.0
        WHEN COALESCE(a.venda_fora,0)   = 0                                   THEN -100.0
        ELSE (a.venda_fora / ant.venda_fora - 1) * 100
      END, 1) AS evol_prod_fora
    FROM base b
    LEFT JOIN atual    a   USING (codgrp, codloja)
    LEFT JOIN anterior ant USING (codgrp, codloja)
    ORDER BY b.codgrp, b.codloja
  `

  const [r1, r2, r3, r4, r5, r6] = await Promise.all([
    pool.query(queryCompradores, p),
    pool.query(queryGlobal, p),
    pool.query(queryMetricsGrupo, p),
    pool.query(queryNsLojasGrupo, p),
    pool.query(queryNsLojasDetalhe, p),
    pool.query(queryEvolLojasDetalhe, p).catch(() => ({ rows: [] })),
  ])

  // ── Mapas auxiliares (mesma lógica do dashboardTvComprasService) ──────────
  const nsLojasMap = new Map<string, number>()
  for (const row of r4.rows)
    nsLojasMap.set(String(row.codgrp).trim(), safe(row.nivel_servico_lojas))
  const nivelServicoLojasGlobal = nsLojasMap.get("__TOTAL__") ?? null

  const nsLojasDetalheGrupoMap   = new Map<string, { codloja: string; nivelServico: number }[]>()
  const diasLojasDetalheGrupoMap = new Map<string, { codloja: string; diasEstoque: number }[]>()
  for (const row of r5.rows) {
    if (row.tipo !== "grupo") continue
    const loja = String(row.codloja).trim()
    const key  = String(row.codgrp).trim()
    if (!nsLojasDetalheGrupoMap.has(key))   nsLojasDetalheGrupoMap.set(key, [])
    if (!diasLojasDetalheGrupoMap.has(key)) diasLojasDetalheGrupoMap.set(key, [])
    nsLojasDetalheGrupoMap.get(key)!.push({ codloja: loja, nivelServico: safe(row.nivel_servico) })
    diasLojasDetalheGrupoMap.get(key)!.push({ codloja: loja, diasEstoque: safe(row.dias_estoque) })
  }

  const evolLojasMap = new Map<string, { codloja: string; evolVendas: number | null; evolLb: number | null; evolProdFora: number | null }[]>()
  for (const row of r6.rows) {
    const key = String(row.codgrp).trim()
    if (!evolLojasMap.has(key)) evolLojasMap.set(key, [])
    evolLojasMap.get(key)!.push({
      codloja:      String(row.codloja).trim(),
      evolVendas:   row.evol_vendas   !== null ? Number(row.evol_vendas)   : null,
      evolLb:       row.evol_lb       !== null ? Number(row.evol_lb)       : null,
      evolProdFora: row.evol_prod_fora !== null ? Number(row.evol_prod_fora) : null,
    })
  }

  const metricsGrupoMap = new Map<string, { nivelServico: number; diasEstoque: number }>()
  for (const row of r3.rows)
    metricsGrupoMap.set(String(row.codgrp).trim(), {
      nivelServico: safe(row.nivel_servico),
      diasEstoque:  safe(row.dias_estoque),
    })

  // ── Agrega por comprador (igual ao dashboardTvComprasService) ─────────────
  interface CompRow {
    comprador: string; grupos: string[]; grupoNomes: string[]
    vendaRealizado: number; vendaBruta: number; lbRealizado: number
    vendaForaRealizado: number; vendaAnoPassado: number
    metaVendasAjustada: number; metaLbSum: number; metaProdutosForaAjustada: number
    metaNivelServicoSum: number; metaDiasEstoqueSum: number; groupCount: number
    nivelServico: number | null; nivelServicoLojasSum: number; nivelServicoLojasCount: number
    diasEstoque: number | null
  }

  const compMap = new Map<string, CompRow>()
  for (const row of r1.rows) {
    const key    = row.comprador
    const codgrp = String(row.codgrp).trim()
    if (compMap.has(key)) {
      const c = compMap.get(key)!
      c.grupos.push(codgrp)
      c.grupoNomes.push(String(row.grupo_nome || row.codgrp).trim())
      c.vendaRealizado          += safe(row.venda_realizado)
      c.vendaBruta              += safe(row.venda_bruta)
      c.lbRealizado             += safe(row.lb_realizado)
      c.vendaForaRealizado      += safe(row.venda_fora_realizado)
      c.vendaAnoPassado         += safe(row.venda_ano_passado)
      c.metaVendasAjustada      += safe(row.meta_vendas_ajustada)
      c.metaLbSum               += safe(row.meta_lb)
      c.metaProdutosForaAjustada += safe(row.meta_produtos_fora_ajustada)
      c.metaNivelServicoSum     += safe(row.meta_nivel_servico)
      c.metaDiasEstoqueSum      += safe(row.meta_dias_estoque)
      c.groupCount++
      const nsLojas = nsLojasMap.get(codgrp)
      if (nsLojas !== undefined) { c.nivelServicoLojasSum += nsLojas; c.nivelServicoLojasCount++ }
    } else {
      const mg      = metricsGrupoMap.get(codgrp)
      const nsLojas = nsLojasMap.get(codgrp)
      compMap.set(key, {
        comprador: row.comprador,
        grupos:    [codgrp],
        grupoNomes: [String(row.grupo_nome || row.codgrp).trim()],
        vendaRealizado:           safe(row.venda_realizado),
        vendaBruta:               safe(row.venda_bruta),
        lbRealizado:              safe(row.lb_realizado),
        vendaForaRealizado:       safe(row.venda_fora_realizado),
        vendaAnoPassado:          safe(row.venda_ano_passado),
        metaVendasAjustada:       safe(row.meta_vendas_ajustada),
        metaLbSum:                safe(row.meta_lb),
        metaProdutosForaAjustada: safe(row.meta_produtos_fora_ajustada),
        metaNivelServicoSum:      safe(row.meta_nivel_servico),
        metaDiasEstoqueSum:       safe(row.meta_dias_estoque),
        groupCount:               1,
        nivelServico:             mg ? mg.nivelServico : null,
        nivelServicoLojasSum:     nsLojas !== undefined ? nsLojas : 0,
        nivelServicoLojasCount:   nsLojas !== undefined ? 1 : 0,
        diasEstoque:              mg ? mg.diasEstoque : null,
      })
    }
  }

  const compradores = Array.from(compMap.values()).map((c) => {
    const gc               = c.groupCount || 1
    const metaLb           = c.metaLbSum / gc
    const metaNivelServico = c.metaNivelServicoSum / gc
    const metaDiasEstoque  = c.metaDiasEstoqueSum / gc
    const vendaMeta        = c.metaVendasAjustada > 0 ? (c.vendaRealizado / c.metaVendasAjustada) * 100 : 0
    const lbPct            = c.vendaBruta > 0 ? (c.lbRealizado / c.vendaBruta) * 100 : 0
    const evolucao         = c.vendaAnoPassado > 0 ? (c.vendaRealizado / c.vendaAnoPassado - 1) * 100 : 0
    const produtosForaPct  = c.metaProdutosForaAjustada > 0 ? (c.vendaForaRealizado / c.metaProdutosForaAjustada) * 100 : 0

    let nsMedia   = c.nivelServico
    let diasMedia = c.diasEstoque
    if (c.grupos.length > 1) {
      const vals = c.grupos.map((g) => metricsGrupoMap.get(g)).filter(Boolean)
      if (vals.length) {
        nsMedia   = vals.reduce((s, v) => s + v!.nivelServico, 0) / vals.length
        diasMedia = vals.reduce((s, v) => s + v!.diasEstoque, 0) / vals.length
      }
    }

    return {
      comprador:            c.comprador,
      grupos:               c.grupoNomes.join(", "),
      vendaRealizado:       Math.round(c.vendaRealizado),
      metaVendasAjustada:   Math.round(c.metaVendasAjustada),
      vendaPercentualMeta:  Number(vendaMeta.toFixed(1)),
      lbPercentual:         Number(lbPct.toFixed(1)),
      metaLb:               Number(metaLb.toFixed(1)),
      nivelServico:         nsMedia !== null ? Number(nsMedia!.toFixed(1)) : null,
      nivelServicoLojas:    c.nivelServicoLojasCount > 0
                              ? Number((c.nivelServicoLojasSum / c.nivelServicoLojasCount).toFixed(1))
                              : null,
      nivelServicoMeta:     Math.round(metaNivelServico),
      diasEstoque:          diasMedia !== null ? Math.round(diasMedia!) : null,
      diasEstoqueMeta:      Math.round(metaDiasEstoque),
      evolucaoPercentual:   Number(evolucao.toFixed(1)),
      produtosForaPercentual: Number(produtosForaPct.toFixed(1)),
    }
  }).sort((a, b) => safe(b.vendaRealizado) - safe(a.vendaRealizado))

  // ── compradoresGrupos (linhas da tabela matriz) ────────────────────────────
  const compradoresGrupos = r1.rows.map((row: any) => {
    const codgrp            = String(row.codgrp).trim()
    const mg                = metricsGrupoMap.get(codgrp)
    const vendaBruta        = safe(row.venda_bruta)
    const lbRealizado       = safe(row.lb_realizado)
    const lbPct             = vendaBruta > 0 ? (lbRealizado / vendaBruta) * 100 : 0
    const metaVendasAjustada = safe(row.meta_vendas_ajustada)
    const vendaRealizado    = safe(row.venda_realizado)
    const vendaPercentualMeta = metaVendasAjustada > 0 ? (vendaRealizado / metaVendasAjustada) * 100 : 0
    const metaProdutosForaAjustada = safe(row.meta_produtos_fora_ajustada)
    const vendaForaRealizado = safe(row.venda_fora_realizado)
    const produtosForaPct   = metaProdutosForaAjustada > 0 ? (vendaForaRealizado / metaProdutosForaAjustada) * 100 : 0
    return {
      comprador:            row.comprador,
      codgrp,
      grupoNome:            String(row.grupo_nome || row.codgrp).trim(),
      vendaPercentualMeta:  Number(vendaPercentualMeta.toFixed(1)),
      lbPercentual:         Number(lbPct.toFixed(1)),
      metaLb:               Number(safe(row.meta_lb).toFixed(1)),
      nivelServico:         mg ? Number(mg.nivelServico.toFixed(1)) : null,
      nivelServicoLojas:    nsLojasMap.has(codgrp) ? Number(nsLojasMap.get(codgrp)!.toFixed(1)) : null,
      nsPorLoja:            nsLojasDetalheGrupoMap.get(codgrp) ?? [],
      diasPorLoja:          diasLojasDetalheGrupoMap.get(codgrp) ?? [],
      evolPorLoja:          evolLojasMap.get(codgrp) ?? [],
      nivelServicoMeta:     safe(row.meta_nivel_servico) || 97,
      diasEstoque:          mg ? Math.round(mg.diasEstoque) : null,
      diasEstoqueMeta:      safe(row.meta_dias_estoque) || 45,
      produtosForaPercentual: Number(produtosForaPct.toFixed(1)),
    }
  })

  // ── KPIs globais ───────────────────────────────────────────────────────────
  const gm          = r2.rows[0] ?? {}
  const vendasValor = safe(gm.vendas_valor)
  const vendaBruta  = safe(gm.venda_bruta)
  const lbValor     = safe(gm.lb_valor)
  const produtosForaValor = safe(gm.produtos_fora_valor)
  const lbPct       = vendaBruta > 0 ? lbValor / vendaBruta * 100 : 0
  const totalDias   = safe(gm.total_dias)
  const diasDecorridos = safe(gm.dias_decorridos)

  const metaVendasAjustada      = totalDias > 0
    ? Math.round(safe(gm.meta_vendas) * diasDecorridos / totalDias) : safe(gm.meta_vendas)
  const metaProdutosForaAjustada = totalDias > 0
    ? Math.round(safe(gm.meta_produtos_fora) * diasDecorridos / totalDias) : safe(gm.meta_produtos_fora)

  const kpis = {
    lbPercentual:    Number(lbPct.toFixed(1)),
    metaLb:          Number(safe(gm.meta_lb_media).toFixed(1)),
    nivelServico:    safe(gm.nivel_servico),
    nivelServicoLojas: nivelServicoLojasGlobal,
    nivelServicoMeta: Math.round(safe(gm.meta_nivel_servico_media)) || 98,
    diasEstoque:     (() => {
      const vals = Array.from(metricsGrupoMap.values()).map(m => m.diasEstoque).filter(d => d > 0)
      return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : safe(gm.dias_estoque)
    })(),
    diasEstoqueMeta: Math.round(safe(gm.meta_dias_estoque_media)) || 45,
    vendasAtingimento: metaVendasAjustada > 0
      ? Number((vendasValor / metaVendasAjustada * 100).toFixed(2)) : 0,
    lbRealizado: Number(lbPct.toFixed(1)),
    produtosFora: metaProdutosForaAjustada > 0
      ? Number((produtosForaValor / metaProdutosForaAjustada * 100).toFixed(2)) : 0,
  }

  return { kpis, compradores, compradoresGrupos }
}
