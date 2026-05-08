import pool from "../config/database"

const safe = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0)

export const getDashboardTvCompras = async () => {

  // ── Query 1: compradores (apenas grupos com meta no mês/ano atual) ───────────
  const queryCompradores = `
    WITH
    grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
    ),
    dias_mes AS (
      SELECT
        EXTRACT(DAY FROM CURRENT_DATE)::int AS dias_decorridos,
        EXTRACT(DAY FROM (date_trunc('month', CURRENT_DATE)
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
        SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0))              AS venda,
        SUM(COALESCE(vlr_total_vendas_bruta, 0))                                                   AS venda_bruta,
        SUM(COALESCE(vlr_total_vendas_bruta, 0)
          - COALESCE(vlr_custos_vendas, 0)
          - COALESCE(vlr_impostos_vendas, 0))                                                      AS lb_valor,
        SUM(CASE WHEN tipo IN ('Fora','Encomenda')
                 THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)
                 ELSE 0 END)                                                                       AS venda_fora
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE)::date AND CURRENT_DATE
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
      GROUP BY TRIM(codgrp)
    ),
    vendas_ano_passado AS (
      SELECT
        TRIM(codgrp) AS codgrp,
        SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)) AS venda
      FROM vs_scc_vendas_devolucoes
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE - interval '1 year')::date
                     AND (CURRENT_DATE - interval '1 year')::date
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
      COALESCE(m.meta_nivel_servico, 97)  AS meta_nivel_servico,
      COALESCE(m.meta_dias_estoque, 45)   AS meta_dias_estoque
    FROM grupos_ativos ga
    CROSS JOIN dias_mes dm
    LEFT JOIN nomes_grupo ng ON ng.codgrp = ga.codgrp
    LEFT JOIN scc_metas_compradores m
      ON  m.comprador_id = ga.comprador_id
      AND TRIM(m.codgrp) = ga.codgrp
      AND m.mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
      AND m.ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
    LEFT JOIN vendas_atual       va  ON va.codgrp  = ga.codgrp
    LEFT JOIN vendas_ano_passado vap ON vap.codgrp = ga.codgrp
    ORDER BY ga.comprador, ga.codgrp
  `

  // ── Query 2: KPIs globais ─────────────────────────────────────────────────
  const queryGlobal = `
    WITH
    grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
    ),
    dias_mes AS (
      SELECT
        EXTRACT(DAY FROM CURRENT_DATE)::int AS dias_decorridos,
        EXTRACT(DAY FROM (date_trunc('month', CURRENT_DATE)
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
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE)::date AND CURRENT_DATE
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
    ),
    vant AS (
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
      WHERE data BETWEEN
          date_trunc('month', CURRENT_DATE - interval '1 month')::date
          AND (CURRENT_DATE - interval '1 month')::date
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
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE - interval '1 year')::date
                     AND (CURRENT_DATE - interval '1 year')::date
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
    ),
    metas AS (
      SELECT
        COALESCE(SUM(meta_vendas), 0)          AS meta_vendas,
        COALESCE(SUM(meta_produtos_fora), 0)   AS meta_produtos_fora,
        COALESCE(AVG(meta_lb), 0)              AS meta_lb_media,
        COALESCE(AVG(meta_dias_estoque), 45)   AS meta_dias_estoque_media,
        COALESCE(AVG(meta_nivel_servico), 98)  AS meta_nivel_servico_media
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
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
      va.venda                AS vendas_valor,
      va.venda_bruta,
      va.lb_valor,
      va.venda_fora           AS produtos_fora_valor,
      vant.venda              AS vendas_mes_anterior,
      vant.venda_bruta        AS venda_bruta_mes_anterior,
      vant.lb_valor           AS lb_valor_mes_anterior,
      vant.venda_fora         AS produtos_fora_mes_anterior,
      vap.venda               AS vendas_ano_passado,
      ns.nivel_servico,
      dias_est.dias_estoque,
      metas.meta_vendas,
      metas.meta_produtos_fora,
      metas.meta_lb_media,
      metas.meta_dias_estoque_media,
      metas.meta_nivel_servico_media,
      dm.dias_decorridos,
      dm.total_dias
    FROM va, vant, vap, metas, ns, dias_est
    CROSS JOIN dias_mes dm
  `

  // ── Query 3: série diária mês atual ───────────────────────────────────────
  const querySeries = `
    WITH grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
    )
    SELECT
      data::date AS dia,
      SUM(COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0))              AS venda,
      SUM(COALESCE(vlr_total_vendas_bruta,0))                                                   AS venda_bruta,
      SUM(COALESCE(vlr_total_vendas_bruta,0)
        - COALESCE(vlr_custos_vendas,0)
        - COALESCE(vlr_impostos_vendas,0))                                                      AS lb_valor,
      SUM(CASE WHEN tipo IN ('Fora','Encomenda')
               THEN COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0)
               ELSE 0 END)                                                                      AS produtos_fora
    FROM vs_scc_vendas_devolucoes
    WHERE data >= date_trunc('month', CURRENT_DATE)::date AND data <= CURRENT_DATE
      AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
    GROUP BY data::date ORDER BY data::date
  `

  // ── Query 4: série diária mesmo mês ano passado ───────────────────────────
  const querySeriesAnt = `
    WITH grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
    )
    SELECT
      data::date AS dia,
      SUM(COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0))              AS venda,
      SUM(COALESCE(vlr_total_vendas_bruta,0))                                                   AS venda_bruta,
      SUM(COALESCE(vlr_total_vendas_bruta,0)
        - COALESCE(vlr_custos_vendas,0)
        - COALESCE(vlr_impostos_vendas,0))                                                      AS lb_valor,
      SUM(CASE WHEN tipo IN ('Fora','Encomenda')
               THEN COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0)
               ELSE 0 END)                                                                      AS produtos_fora
    FROM vs_scc_vendas_devolucoes
    WHERE data BETWEEN date_trunc('month', CURRENT_DATE - interval '1 year')::date
                   AND (date_trunc('month', CURRENT_DATE - interval '1 year')
                        + interval '1 month' - interval '1 day')::date
      AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
    GROUP BY data::date ORDER BY data::date
  `

  // ── Query 5: NS e dias de estoque por grupo (vs_scc_estoque_media_facing) ──
  const queryMetricsGrupo = `
    WITH grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
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

  // ── Query 6: ruptura por comprador (facing > 0, sem estoque e sem pedido pendente) ──
  const queryRuptura = `
    WITH grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
    )
    SELECT
      c.nome       AS comprador,
      COUNT(*)     AS qtd_ruptura
    FROM vs_scc_estoque_media_facing ef
    JOIN a_produt pro ON pro.c_codigo = ef.codproduto
    JOIN scc_comprador_grupo cg ON TRIM(cg.codgrp) = ef.codgrp AND cg.dt_fim IS NULL
    JOIN scc_compradores c     ON c.id = cg.comprador_id
    WHERE ef.facing > 0
      AND ef.saldoestoque <= 0
      AND ef.codgrp IN (SELECT codgrp FROM grupos_meta)
      AND pro.c_status = 'A' AND pro.c_especie = 'P'
      AND NOT EXISTS (
        SELECT 1 FROM vs_scc_pedidos_compra_pendente pcp
        WHERE pcp.codproduto = ef.codproduto
          AND pcp.qdte_pendente > 0
      )
    GROUP BY c.nome
    ORDER BY COUNT(*) DESC
  `

  // ── Query 7: situação do estoque por faixa de dias ──────────────────────
  const querySituacao = `
    WITH grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
    ),
    dias_produto AS (
      SELECT
        CASE WHEN mediadia > 0 THEN ROUND(saldoestoque::numeric / mediadia, 0) ELSE 0 END AS dias
      FROM vs_scc_estoque_media_facing
      WHERE codgrp IN (SELECT codgrp FROM grupos_meta)
        AND facing > 0
    )
    SELECT
      COUNT(CASE WHEN dias <= 15 THEN 1 END)                                        AS critico_qtd,
      COUNT(CASE WHEN dias > 15 AND dias <= 90 THEN 1 END)                          AS normal_qtd,
      COUNT(CASE WHEN dias > 90 THEN 1 END)                                         AS excesso_qtd,
      ROUND(COUNT(CASE WHEN dias <= 15 THEN 1 END)::numeric
            / NULLIF(COUNT(*), 0) * 100, 0)                                         AS critico_pct,
      ROUND(COUNT(CASE WHEN dias > 15 AND dias <= 90 THEN 1 END)::numeric
            / NULLIF(COUNT(*), 0) * 100, 0)                                         AS normal_pct,
      ROUND(COUNT(CASE WHEN dias > 90 THEN 1 END)::numeric
            / NULLIF(COUNT(*), 0) * 100, 0)                                         AS excesso_pct
    FROM dias_produto
  `

  // ── Query 8: NS histórico do mês corrente (tabela scc_historico_ns_dias_estoque) ──
  const queryNsHistorico = `
    WITH grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
    )
    SELECT
      data,
      ROUND(
        SUM(produtos_com_estoque)::numeric
        / NULLIF(SUM(total_produtos_facing), 0) * 100, 1
      ) AS nivel_servico
    FROM scc_historico_ns_dias_estoque
    WHERE data >= date_trunc('month', CURRENT_DATE)::date
      AND data < CURRENT_DATE
      AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
    GROUP BY data
    ORDER BY data
  `

  // ── Query 10: NS por lojas — vs_scc_estoque_media_facing_lojas ─────────────
  // Retorna NS por grupo E o total global (codgrp = '__TOTAL__')
  // Conta pares (produto × loja) com facing como denominador,
  // e pares com facing + saldoestoque > 0 como numerador
  const queryNsLojasGrupo = `
    WITH grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
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

  // ── Query 11: NS por loja, detalhado por codgrp e por comprador ─────────────
  // Retorna duas séries via UNION:
  //   tipo='grupo'    → codgrp + codloja (para cada linha de grupo na tabela)
  //   tipo='comprador' → comprador + codloja (para a linha de sub-total)
  const queryNsLojasDetalhe = `
    WITH
    grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
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

  // ── Query 12: evolução por loja (vs mesmo período ano passado) ───────────────
  // Usa vs_scc_vendas_devolucoes_lojas — mesma lógica do período atual × ano ant.
  const queryEvolLojasDetalhe = `
    WITH
    grupos_meta AS (
      SELECT DISTINCT TRIM(codgrp) AS codgrp
      FROM scc_metas_compradores
      WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND ano = EXTRACT(YEAR  FROM CURRENT_DATE)::int
    ),
    atual AS (
      SELECT
        TRIM(codgrp)  AS codgrp,
        TRIM(codloja) AS codloja,
        SUM(COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0))        AS venda,
        SUM(COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_custos_vendas,0)
              - COALESCE(vlr_impostos_vendas,0))                                           AS lb,
        SUM(COALESCE(vlr_total_vendas_bruta,0))                                            AS venda_bruta,
        SUM(CASE WHEN tipo IN ('Fora','Encomenda','FORA','ENCO')
                 THEN COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0)
                 ELSE 0 END)                                                               AS venda_fora
      FROM vs_scc_vendas_devolucoes_lojas
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE)::date AND CURRENT_DATE
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
      GROUP BY TRIM(codgrp), TRIM(codloja)
    ),
    anterior AS (
      SELECT
        TRIM(codgrp)  AS codgrp,
        TRIM(codloja) AS codloja,
        SUM(COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0))        AS venda,
        SUM(COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_custos_vendas,0)
              - COALESCE(vlr_impostos_vendas,0))                                           AS lb,
        SUM(COALESCE(vlr_total_vendas_bruta,0))                                            AS venda_bruta,
        SUM(CASE WHEN tipo IN ('Fora','Encomenda','FORA','ENCO')
                 THEN COALESCE(vlr_total_vendas_bruta,0) - COALESCE(vlr_total_devolucoes,0)
                 ELSE 0 END)                                                               AS venda_fora
      FROM vs_scc_vendas_devolucoes_lojas
      WHERE data BETWEEN date_trunc('month', CURRENT_DATE - interval '1 year')::date
                     AND (CURRENT_DATE - interval '1 year')::date
        AND TRIM(codgrp) IN (SELECT codgrp FROM grupos_meta)
      GROUP BY TRIM(codgrp), TRIM(codloja)
    )
    SELECT
      a.codgrp,
      a.codloja,
      ROUND(CASE WHEN COALESCE(ant.venda,0) > 0
                 THEN (a.venda / ant.venda - 1) * 100
                 ELSE NULL END, 1)                                        AS evol_vendas,
      ROUND(CASE WHEN COALESCE(ant.venda_bruta,0) > 0 AND COALESCE(a.venda_bruta,0) > 0
                 THEN ((a.lb / a.venda_bruta) - (ant.lb / ant.venda_bruta)) * 100
                 ELSE NULL END, 1)                                        AS evol_lb,
      ROUND(CASE WHEN COALESCE(ant.venda_fora,0) > 0
                 THEN (a.venda_fora / ant.venda_fora - 1) * 100
                 ELSE NULL END, 1)                                        AS evol_prod_fora
    FROM atual a
    LEFT JOIN anterior ant USING (codgrp, codloja)
    ORDER BY a.codgrp, a.codloja
  `

  // ── Query 9: top 10 dias sem estoque — curva A1 ───────────────────────────
  const queryRupturaCurvaA = `
    SELECT
      r.codproduto,
      COALESCE(d.produto, r.codproduto::text) AS produto,
      r.curva,
      r.dias_zerado,
      r.saldo_total
    FROM vs_scc_ruptura_curva_abcd r
    LEFT JOIN vs_scc_dprodutos d ON d.codproduto = r.codproduto
    ORDER BY r.dias_zerado DESC
    LIMIT 10
  `

  const [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12] = await Promise.all([
    pool.query(queryCompradores),
    pool.query(queryGlobal),
    pool.query(querySeries),
    pool.query(querySeriesAnt),
    pool.query(queryMetricsGrupo),
    pool.query(queryRuptura),
    pool.query(querySituacao),
    pool.query(queryNsHistorico),
    pool.query(queryRupturaCurvaA),
    pool.query(queryNsLojasGrupo),
    pool.query(queryNsLojasDetalhe),
    pool.query(queryEvolLojasDetalhe).catch(() => ({ rows: [] })),
  ])

  // ── Mapa de NS por lojas (produto × loja) por grupo + total global ───────
  const nsLojasMap = new Map<string, number>()
  for (const row of r10.rows) {
    nsLojasMap.set(String(row.codgrp).trim(), safe(row.nivel_servico_lojas))
  }
  const nivelServicoLojasGlobal = nsLojasMap.get('__TOTAL__') ?? null

  // ── Mapas NS e Dias por loja (apenas para linhas de grupo — sub-totais usam AtingBar) ──
  const nsLojasDetalheGrupoMap   = new Map<string, { codloja: string; nivelServico: number }[]>()
  const diasLojasDetalheGrupoMap = new Map<string, { codloja: string; diasEstoque: number }[]>()
  for (const row of r11.rows) {
    if (row.tipo !== 'grupo') continue
    const loja = String(row.codloja).trim()
    const key  = String(row.codgrp).trim()
    if (!nsLojasDetalheGrupoMap.has(key))   nsLojasDetalheGrupoMap.set(key, [])
    if (!diasLojasDetalheGrupoMap.has(key)) diasLojasDetalheGrupoMap.set(key, [])
    nsLojasDetalheGrupoMap.get(key)!.push({ codloja: loja, nivelServico: safe(row.nivel_servico) })
    diasLojasDetalheGrupoMap.get(key)!.push({ codloja: loja, diasEstoque: safe(row.dias_estoque) })
  }

  // ── Mapa de evolução por (codgrp, codloja) ───────────────────────────────
  const evolLojasMap = new Map<string, { codloja: string; evolVendas: number | null; evolLb: number | null; evolProdFora: number | null }[]>()
  for (const row of r12.rows) {
    const key = String(row.codgrp).trim()
    if (!evolLojasMap.has(key)) evolLojasMap.set(key, [])
    evolLojasMap.get(key)!.push({
      codloja:    String(row.codloja).trim(),
      evolVendas: row.evol_vendas  !== null ? Number(row.evol_vendas)   : null,
      evolLb:     row.evol_lb      !== null ? Number(row.evol_lb)       : null,
      evolProdFora: row.evol_prod_fora !== null ? Number(row.evol_prod_fora) : null,
    })
  }

  // ── Mapa de métricas por grupo ────────────────────────────────────────────
  const metricsGrupoMap = new Map<string, { nivelServico: number; diasEstoque: number }>()
  for (const row of r5.rows) {
    metricsGrupoMap.set(String(row.codgrp).trim(), {
      nivelServico: safe(row.nivel_servico),
      diasEstoque: safe(row.dias_estoque),
    })
  }

  // ── Agrega compradores (múltiplos grupos → 1 linha por comprador) ─────────
  interface CompRow {
    comprador: string
    grupos: string[]
    grupoNomes: string[]
    vendaRealizado: number
    vendaBruta: number
    lbRealizado: number
    vendaForaRealizado: number
    vendaAnoPassado: number
    metaVendasAjustada: number
    metaLbSum: number
    metaProdutosForaAjustada: number
    metaNivelServicoSum: number
    metaDiasEstoqueSum: number
    groupCount: number
    nivelServico: number | null
    nivelServicoLojasSum: number
    nivelServicoLojasCount: number
    diasEstoque: number | null
  }

  const compMap = new Map<string, CompRow>()
  for (const row of r1.rows) {
    const key = row.comprador
    const codgrp = String(row.codgrp).trim()
    const grupoNome = String(row.grupo_nome || row.codgrp).trim()

    if (compMap.has(key)) {
      const c = compMap.get(key)!
      c.grupos.push(codgrp)
      c.grupoNomes.push(grupoNome)
      c.vendaRealizado += safe(row.venda_realizado)
      c.vendaBruta += safe(row.venda_bruta)
      c.lbRealizado += safe(row.lb_realizado)
      c.vendaForaRealizado += safe(row.venda_fora_realizado)
      c.vendaAnoPassado += safe(row.venda_ano_passado)
      c.metaVendasAjustada += safe(row.meta_vendas_ajustada)
      c.metaLbSum += safe(row.meta_lb)
      c.metaProdutosForaAjustada += safe(row.meta_produtos_fora_ajustada)
      c.metaNivelServicoSum += safe(row.meta_nivel_servico)
      c.metaDiasEstoqueSum += safe(row.meta_dias_estoque)
      c.groupCount++
      const nsLojas = nsLojasMap.get(codgrp)
      if (nsLojas !== undefined) { c.nivelServicoLojasSum += nsLojas; c.nivelServicoLojasCount++ }
    } else {
      const mg = metricsGrupoMap.get(codgrp)
      const nsLojas = nsLojasMap.get(codgrp)
      compMap.set(key, {
        comprador: row.comprador,
        grupos: [codgrp],
        grupoNomes: [grupoNome],
        vendaRealizado: safe(row.venda_realizado),
        vendaBruta: safe(row.venda_bruta),
        lbRealizado: safe(row.lb_realizado),
        vendaForaRealizado: safe(row.venda_fora_realizado),
        vendaAnoPassado: safe(row.venda_ano_passado),
        metaVendasAjustada: safe(row.meta_vendas_ajustada),
        metaLbSum: safe(row.meta_lb),
        metaProdutosForaAjustada: safe(row.meta_produtos_fora_ajustada),
        metaNivelServicoSum: safe(row.meta_nivel_servico),
        metaDiasEstoqueSum: safe(row.meta_dias_estoque),
        groupCount: 1,
        nivelServico: mg ? mg.nivelServico : null,
        nivelServicoLojasSum: nsLojas !== undefined ? nsLojas : 0,
        nivelServicoLojasCount: nsLojas !== undefined ? 1 : 0,
        diasEstoque: mg ? mg.diasEstoque : null,
      })
    }
  }

  const compradores = Array.from(compMap.values()).map((c) => {
    const gc = c.groupCount || 1
    const metaLb = c.metaLbSum / gc
    const metaNivelServico = c.metaNivelServicoSum / gc
    const metaDiasEstoque = c.metaDiasEstoqueSum / gc

    const vendaMeta = c.metaVendasAjustada > 0 ? (c.vendaRealizado / c.metaVendasAjustada) * 100 : 0
    // LB%: divide por venda_bruta (regra 5)
    const lbPct = c.vendaBruta > 0 ? (c.lbRealizado / c.vendaBruta) * 100 : 0
    // Evolução: vs mesmo período ano passado (regra 6)
    const evolucao = c.vendaAnoPassado > 0 ? (c.vendaRealizado / c.vendaAnoPassado - 1) * 100 : 0
    const produtosForaPct = c.metaProdutosForaAjustada > 0
      ? (c.vendaForaRealizado / c.metaProdutosForaAjustada) * 100 : 0

    const status =
      vendaMeta >= 105 ? "ACIMA DA META" :
        vendaMeta >= 100 ? "DENTRO DA META" :
          vendaMeta >= 90 ? "ATENÇÃO" : "ABAIXO DA META"

    let nsMedia = c.nivelServico
    let diasMedia = c.diasEstoque
    if (c.grupos.length > 1) {
      const vals = c.grupos.map((g) => metricsGrupoMap.get(g)).filter(Boolean)
      if (vals.length) {
        nsMedia = vals.reduce((s, v) => s + v!.nivelServico, 0) / vals.length
        diasMedia = vals.reduce((s, v) => s + v!.diasEstoque, 0) / vals.length
      }
    }

    return {
      comprador: c.comprador,
      grupos: c.grupoNomes.join(", "),
      vendaRealizado: Math.round(c.vendaRealizado),
      metaVendasAjustada: Math.round(c.metaVendasAjustada),
      vendaPercentualMeta: Number(vendaMeta.toFixed(1)),
      lbPercentual: Number(lbPct.toFixed(1)),
      metaLb: Number(metaLb.toFixed(1)),
      nivelServico: nsMedia !== null ? Number(nsMedia!.toFixed(1)) : null,
      nivelServicoLojas: c.nivelServicoLojasCount > 0
        ? Number((c.nivelServicoLojasSum / c.nivelServicoLojasCount).toFixed(1))
        : null,
      nivelServicoMeta: Math.round(metaNivelServico),
      diasEstoque: diasMedia !== null ? Math.round(diasMedia!) : null,
      diasEstoqueMeta: Math.round(metaDiasEstoque),
      evolucaoPercentual: Number(evolucao.toFixed(1)),
      vendaForaRealizado: Math.round(c.vendaForaRealizado),
      metaProdutosFora: Math.round(c.metaProdutosForaAjustada),
      produtosForaPercentual: Number(produtosForaPct.toFixed(1)),
      status,
    }
  }).sort((a, b) => a.vendaPercentualMeta - b.vendaPercentualMeta)

  // ── KPIs globais ──────────────────────────────────────────────────────────
  const gm = r2.rows[0] ?? {}
  const vendasValor = safe(gm.vendas_valor)
  const vendaBruta = safe(gm.venda_bruta)
  const lbValor = safe(gm.lb_valor)
  const produtosForaValor = safe(gm.produtos_fora_valor)
  const vendasMesAnt = safe(gm.vendas_mes_anterior)
  const vendaBrutaAnt = safe(gm.venda_bruta_mes_anterior)
  const lbValorAnt = safe(gm.lb_valor_mes_anterior)
  const produtosForaAnt = safe(gm.produtos_fora_mes_anterior)
  const vendasAnoPassado = safe(gm.vendas_ano_passado)
  const diasDecorridos = safe(gm.dias_decorridos)
  const totalDias = safe(gm.total_dias)

  // LB%: divide por bruta (regra 5)
  const lbPct = vendaBruta > 0 ? lbValor / vendaBruta * 100 : 0
  const lbAntPct = vendaBrutaAnt > 0 ? lbValorAnt / vendaBrutaAnt * 100 : 0

  // Meta pro-rata por dias corridos (regra 4)
  const metaVendasAjustada = totalDias > 0
    ? Math.round(safe(gm.meta_vendas) * diasDecorridos / totalDias) : safe(gm.meta_vendas)
  const metaProdutosForaAjustada = totalDias > 0
    ? Math.round(safe(gm.meta_produtos_fora) * diasDecorridos / totalDias) : safe(gm.meta_produtos_fora)

  // ── Dados por comprador+grupo (para a tabela matriz) ────────────────────
  const compradoresGrupos = r1.rows.map((row: any) => {
    const codgrp = String(row.codgrp).trim()
    const mg = metricsGrupoMap.get(codgrp)
    const vendaBruta = safe(row.venda_bruta)
    const lbRealizado = safe(row.lb_realizado)
    const lbPct = vendaBruta > 0 ? (lbRealizado / vendaBruta) * 100 : 0
    const metaVendasAjustada = safe(row.meta_vendas_ajustada)
    const vendaRealizado = safe(row.venda_realizado)
    const vendaPercentualMeta = metaVendasAjustada > 0 ? (vendaRealizado / metaVendasAjustada) * 100 : 0
    const metaProdutosForaAjustada = safe(row.meta_produtos_fora_ajustada)
    const vendaForaRealizado = safe(row.venda_fora_realizado)
    const produtosForaPct = metaProdutosForaAjustada > 0 ? (vendaForaRealizado / metaProdutosForaAjustada) * 100 : 0
    return {
      comprador: row.comprador,
      codgrp,
      grupoNome: String(row.grupo_nome || row.codgrp).trim(),
      vendaPercentualMeta: Number(vendaPercentualMeta.toFixed(1)),
      lbPercentual: Number(lbPct.toFixed(1)),
      metaLb: Number(safe(row.meta_lb).toFixed(1)),
      nivelServico: mg ? Number(mg.nivelServico.toFixed(1)) : null,
      nivelServicoLojas: nsLojasMap.has(codgrp) ? Number(nsLojasMap.get(codgrp)!.toFixed(1)) : null,
      nsPorLoja:   nsLojasDetalheGrupoMap.get(codgrp) ?? [],
      diasPorLoja: diasLojasDetalheGrupoMap.get(codgrp) ?? [],
      evolPorLoja: evolLojasMap.get(codgrp) ?? [],
      nivelServicoMeta: safe(row.meta_nivel_servico) || 97,
      diasEstoque: mg ? Math.round(mg.diasEstoque) : null,
      diasEstoqueMeta: safe(row.meta_dias_estoque) || 45,
      produtosForaPercentual: Number(produtosForaPct.toFixed(1)),
    }
  })

  // Evolução vs ano passado (regra 6 — sem meta)
  const evolucao = vendasAnoPassado > 0
    ? Number(((vendasValor / vendasAnoPassado - 1) * 100).toFixed(1))
    : (null as number | null)

  // ── Séries diárias ────────────────────────────────────────────────────────
  const toSeries = (rows: any[]) =>
    rows.map((r) => ({
      dia: r.dia,
      venda: safe(r.venda),
      vendaBruta: safe(r.venda_bruta),
      lb: safe(r.lb_valor),
      produtosFora: safe(r.produtos_fora),
    }))

  const series = toSeries(r3.rows)
  const seriesAnt = toSeries(r4.rows)

  // ── Ruptura por comprador ─────────────────────────────────────────────────
  const ruptura = r6.rows.map((r: any) => ({
    comprador:  r.comprador,
    qtdRuptura: safe(r.qtd_ruptura),
  }))

  const sit = r7.rows[0] ?? {}
  const situacaoEstoque = {
    criticoPct: safe(sit.critico_pct),
    normalPct:  safe(sit.normal_pct),
    excessoPct: safe(sit.excesso_pct),
    criticoQtd: safe(sit.critico_qtd),
    normalQtd:  safe(sit.normal_qtd),
    excessoQtd: safe(sit.excesso_qtd),
  }

  // ── NS histórico por dia ──────────────────────────────────────────────────
  const nsHistorico = r8.rows.map((r: any) => ({
    dia: r.data,
    nivelServico: safe(r.nivel_servico),
  }))

  // ── Top 10 ruptura curva A1 ───────────────────────────────────────────────
  const rupturaCurvaA = r9.rows.map((r: any) => ({
    codproduto: String(r.codproduto).trim(),
    produto:    String(r.produto || r.codproduto).trim(),
    curva:      String(r.curva).trim(),
    diasZerado: safe(r.dias_zerado),
    saldoTotal: safe(r.saldo_total),
  }))

  const kpis = {
    vendasValor,
    metaVendas: metaVendasAjustada,
    vendasVsMesAnterior: vendasMesAnt > 0
      ? Number(((vendasValor / vendasMesAnt - 1) * 100).toFixed(1)) : null as number | null,

    lbPercentual: Number(lbPct.toFixed(1)),
    metaLb: Number(safe(gm.meta_lb_media).toFixed(1)),
    lbVsMesAnterior: vendaBrutaAnt > 0
      ? Number((lbPct - lbAntPct).toFixed(1)) : null as number | null,

    nivelServico: safe(gm.nivel_servico),
    nivelServicoLojas: nivelServicoLojasGlobal,
    nivelServicoMeta: Math.round(safe(gm.meta_nivel_servico_media)) || 98,
    nivelServicoVsMesAnterior: null as number | null,

    evolucao,
    // sem evolucaoMeta (regra 6)

    // Média simples dos dias por grupo (evita distorção do SUM/SUM global)
    diasEstoque: (() => {
      const vals = Array.from(metricsGrupoMap.values()).map(m => m.diasEstoque).filter(d => d > 0)
      return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : safe(gm.dias_estoque)
    })(),
    diasEstoqueMeta: Math.round(safe(gm.meta_dias_estoque_media)) || 45,
    diasEstoqueVsMesAnterior: null as number | null,

    produtosForaValor,
    metaProdutosFora: metaProdutosForaAjustada,
    produtosForaVsMesAnterior: produtosForaAnt > 0
      ? Number(((produtosForaValor / produtosForaAnt - 1) * 100).toFixed(1)) : null as number | null,

    vendasAtingimento: metaVendasAjustada > 0
      ? Number((vendasValor / metaVendasAjustada * 100).toFixed(2)) : 0,
    lbRealizado: Number(lbPct.toFixed(1)),
    produtosFora: metaProdutosForaAjustada > 0
      ? Number((produtosForaValor / metaProdutosForaAjustada * 100).toFixed(2)) : 0,
  }

  return {
    kpis,
    compradores,
    compradoresGrupos,
    series,
    seriesAnt,
    ruptura,
    situacaoEstoque,
    nsHistorico,
    rupturaCurvaA,
    graficos: {
      atingimentoVendas: compradores.map((c) => ({ label: c.comprador, valor: c.vendaPercentualMeta, meta: 100 })),
      atingimentoLb: compradores.map((c) => ({ label: c.comprador, valor: c.lbPercentual, meta: c.metaLb })),
    },
    alertas: [] as string[],
  }
}
