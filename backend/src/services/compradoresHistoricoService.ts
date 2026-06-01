import pool from "../config/database"

const safe = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0)

/**
 * Retorna desempenho de compradores para um mês/ano histórico.
 * Executa apenas as 2 queries essenciais (compradores + KPIs globais)
 * para evitar lentidão com views de estoque e vendas por loja.
 * NS e dias de estoque não são exibidos (são dados atuais, não históricos).
 */
export const getDashboardHistorico = async (ano: number, mes: number) => {
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const dataFim   = `${ano}-${String(mes).padStart(2, "0")}-${String(diasNoMes).padStart(2, "0")}`
  const p         = [dataFim] // $1 = último dia do mês solicitado

  // ── Query 1: desempenho por comprador/grupo ──────────────────────────────
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
    metas AS (
      SELECT
        COALESCE(SUM(meta_vendas), 0)         AS meta_vendas,
        COALESCE(SUM(meta_produtos_fora), 0)  AS meta_produtos_fora,
        COALESCE(AVG(meta_lb), 0)             AS meta_lb_media
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM $1::date)::int
        AND ano = EXTRACT(YEAR  FROM $1::date)::int
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
    )
    SELECT
      va.venda               AS vendas_valor,
      va.venda_bruta,
      va.lb_valor,
      va.venda_fora          AS produtos_fora_valor,
      metas.meta_vendas,
      metas.meta_produtos_fora,
      metas.meta_lb_media,
      dm.dias_decorridos,
      dm.total_dias
    FROM va, metas
    CROSS JOIN dias_mes dm
  `

  const [r1, r2] = await Promise.all([
    pool.query(queryCompradores, p),
    pool.query(queryGlobal, p),
  ])

  // ── Agrega por comprador ──────────────────────────────────────────────────
  interface CompRow {
    comprador: string; grupos: string[]; grupoNomes: string[]
    vendaRealizado: number; vendaBruta: number; lbRealizado: number
    vendaForaRealizado: number; vendaAnoPassado: number
    metaVendasAjustada: number; metaLbSum: number; metaProdutosForaAjustada: number
    metaNivelServicoSum: number; metaDiasEstoqueSum: number; groupCount: number
  }

  const compMap = new Map<string, CompRow>()
  for (const row of r1.rows) {
    const key    = row.comprador
    const codgrp = String(row.codgrp).trim()
    if (compMap.has(key)) {
      const c = compMap.get(key)!
      c.grupos.push(codgrp)
      c.grupoNomes.push(String(row.grupo_nome || row.codgrp).trim())
      c.vendaRealizado           += safe(row.venda_realizado)
      c.vendaBruta               += safe(row.venda_bruta)
      c.lbRealizado              += safe(row.lb_realizado)
      c.vendaForaRealizado       += safe(row.venda_fora_realizado)
      c.vendaAnoPassado          += safe(row.venda_ano_passado)
      c.metaVendasAjustada       += safe(row.meta_vendas_ajustada)
      c.metaLbSum                += safe(row.meta_lb)
      c.metaProdutosForaAjustada += safe(row.meta_produtos_fora_ajustada)
      c.metaNivelServicoSum      += safe(row.meta_nivel_servico)
      c.metaDiasEstoqueSum       += safe(row.meta_dias_estoque)
      c.groupCount++
    } else {
      compMap.set(key, {
        comprador: row.comprador, grupos: [codgrp],
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
        groupCount: 1,
      })
    }
  }

  const compradores = Array.from(compMap.values()).map((c) => {
    const gc              = c.groupCount || 1
    const metaLb          = c.metaLbSum / gc
    const metaNS          = c.metaNivelServicoSum / gc
    const metaDias        = c.metaDiasEstoqueSum / gc
    const vendaMeta       = c.metaVendasAjustada > 0 ? (c.vendaRealizado / c.metaVendasAjustada) * 100 : 0
    const lbPct           = c.vendaBruta > 0 ? (c.lbRealizado / c.vendaBruta) * 100 : 0
    const produtosForaPct = c.metaProdutosForaAjustada > 0 ? (c.vendaForaRealizado / c.metaProdutosForaAjustada) * 100 : 0
    return {
      comprador:              c.comprador,
      grupos:                 c.grupoNomes.join(", "),
      vendaRealizado:         Math.round(c.vendaRealizado),
      metaVendasAjustada:     Math.round(c.metaVendasAjustada),
      vendaPercentualMeta:    Number(vendaMeta.toFixed(1)),
      lbPercentual:           Number(lbPct.toFixed(1)),
      metaLb:                 Number(metaLb.toFixed(1)),
      nivelServico:           null,
      nivelServicoLojas:      null,
      nivelServicoMeta:       Math.round(metaNS),
      diasEstoque:            null,
      diasEstoqueMeta:        Math.round(metaDias),
      produtosForaPercentual: Number(produtosForaPct.toFixed(1)),
    }
  }).sort((a, b) => safe(b.vendaRealizado) - safe(a.vendaRealizado))

  // ── compradoresGrupos (linhas da tabela) ──────────────────────────────────
  const compradoresGrupos = r1.rows.map((row: any) => {
    const vendaBruta          = safe(row.venda_bruta)
    const lbRealizado         = safe(row.lb_realizado)
    const lbPct               = vendaBruta > 0 ? (lbRealizado / vendaBruta) * 100 : 0
    const metaVendasAjustada  = safe(row.meta_vendas_ajustada)
    const vendaRealizado      = safe(row.venda_realizado)
    const vendaPct            = metaVendasAjustada > 0 ? (vendaRealizado / metaVendasAjustada) * 100 : 0
    const metaProdFora        = safe(row.meta_produtos_fora_ajustada)
    const vendaFora           = safe(row.venda_fora_realizado)
    const prodForaPct         = metaProdFora > 0 ? (vendaFora / metaProdFora) * 100 : 0
    return {
      comprador:              row.comprador,
      codgrp:                 String(row.codgrp).trim(),
      grupoNome:              String(row.grupo_nome || row.codgrp).trim(),
      vendaPercentualMeta:    Number(vendaPct.toFixed(1)),
      lbPercentual:           Number(lbPct.toFixed(1)),
      metaLb:                 Number(safe(row.meta_lb).toFixed(1)),
      nivelServico:           null,
      nivelServicoLojas:      null,
      nsPorLoja:              [],
      diasPorLoja:            [],
      evolPorLoja:            [],
      nivelServicoMeta:       safe(row.meta_nivel_servico) || 97,
      diasEstoque:            null,
      diasEstoqueMeta:        safe(row.meta_dias_estoque) || 45,
      produtosForaPercentual: Number(prodForaPct.toFixed(1)),
    }
  })

  // ── KPIs globais ──────────────────────────────────────────────────────────
  const gm              = r2.rows[0] ?? {}
  const vendasValor     = safe(gm.vendas_valor)
  const vendaBruta      = safe(gm.venda_bruta)
  const lbValor         = safe(gm.lb_valor)
  const produtosForaValor = safe(gm.produtos_fora_valor)
  const lbPct           = vendaBruta > 0 ? lbValor / vendaBruta * 100 : 0
  const totalDias       = safe(gm.total_dias)
  const diasDecorridos  = safe(gm.dias_decorridos)
  const metaVendasAj    = totalDias > 0 ? Math.round(safe(gm.meta_vendas) * diasDecorridos / totalDias) : safe(gm.meta_vendas)
  const metaProdForaAj  = totalDias > 0 ? Math.round(safe(gm.meta_produtos_fora) * diasDecorridos / totalDias) : safe(gm.meta_produtos_fora)

  const kpis = {
    lbPercentual:      Number(lbPct.toFixed(1)),
    metaLb:            Number(safe(gm.meta_lb_media).toFixed(1)),
    nivelServico:      null,
    nivelServicoLojas: null,
    nivelServicoMeta:  98,
    diasEstoque:       null,
    diasEstoqueMeta:   45,
    vendasAtingimento: metaVendasAj > 0 ? Number((vendasValor / metaVendasAj * 100).toFixed(2)) : 0,
    lbRealizado:       Number(lbPct.toFixed(1)),
    produtosFora:      metaProdForaAj > 0 ? Number((produtosForaValor / metaProdForaAj * 100).toFixed(2)) : 0,
  }

  return { kpis, compradores, compradoresGrupos }
}
