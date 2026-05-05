-- Dashboard TV Compras (somente indicadores percentuais, sem exposição de valores em R$)
WITH periodos AS (
  SELECT
    date_trunc('month', CURRENT_DATE)::date AS inicio_atual,
    CURRENT_DATE::date AS fim_atual,
    date_trunc('month', CURRENT_DATE - interval '1 year')::date AS inicio_ano_passado,
    (CURRENT_DATE - interval '1 year')::date AS fim_ano_passado,
    EXTRACT(YEAR FROM CURRENT_DATE)::int AS ano_atual,
    EXTRACT(MONTH FROM CURRENT_DATE)::int AS mes_atual
),
base_atual AS (
  SELECT
    v.codgrp,
    c.nome AS comprador,
    SUM(COALESCE(v.vlr_total_vendas_bruta, 0)) AS venda_bruta,
    SUM(COALESCE(v.vlr_total_devolucoes, 0)) AS devolucao,
    SUM(COALESCE(v.vlr_custos_vendas, 0)) AS custos,
    SUM(COALESCE(v.vlr_impostos_vendas, 0)) AS impostos,
    SUM(CASE WHEN v.tipo IN ('FORA', 'ENCO') THEN COALESCE(v.vlr_total_vendas_bruta, 0) - COALESCE(v.vlr_total_devolucoes, 0) ELSE 0 END) AS venda_fora
  FROM vs_scc_vendas_devolucoes v
  JOIN scc_comprador_grupo cg ON cg.codgrp = v.codgrp AND cg.dt_fim IS NULL
  JOIN scc_compradores c ON c.id = cg.comprador_id
  JOIN periodos p ON true
  WHERE v.data BETWEEN p.inicio_atual AND p.fim_atual
  GROUP BY v.codgrp, c.nome
),
base_ano_passado AS (
  SELECT
    v.codgrp,
    SUM(COALESCE(v.vlr_total_vendas_bruta, 0) - COALESCE(v.vlr_total_devolucoes, 0)) AS venda_prev
  FROM vs_scc_vendas_devolucoes v
  JOIN periodos p ON true
  WHERE v.data BETWEEN p.inicio_ano_passado AND p.fim_ano_passado
  GROUP BY v.codgrp
),
meta AS (
  SELECT m.codgrp, m.meta_vendas, m.meta_lb, m.meta_produtos_fora
  FROM scc_metas_compradores m
  JOIN periodos p ON m.ano = p.ano_atual AND m.mes = p.mes_atual
)
SELECT
  a.codgrp,
  a.comprador,
  CASE WHEN COALESCE(m.meta_vendas, 0) = 0 THEN 0 ELSE ((a.venda_bruta - a.devolucao) / m.meta_vendas) * 100 END AS venda_percentual_meta,
  CASE WHEN (a.venda_bruta - a.devolucao) = 0 THEN 0 ELSE ((a.venda_bruta - a.custos - a.impostos) / (a.venda_bruta - a.devolucao)) * 100 END AS lb_percentual,
  COALESCE(m.meta_lb, 0) AS meta_lb,
  CASE WHEN COALESCE(py.venda_prev, 0) = 0 THEN 0 ELSE (((a.venda_bruta - a.devolucao) / py.venda_prev) - 1) * 100 END AS evolucao_percentual,
  CASE WHEN COALESCE(m.meta_produtos_fora, 0) = 0 THEN 0 ELSE (a.venda_fora / m.meta_produtos_fora) * 100 END AS produtos_fora_percentual
FROM base_atual a
LEFT JOIN base_ano_passado py ON py.codgrp = a.codgrp
LEFT JOIN meta m ON m.codgrp = a.codgrp
ORDER BY venda_percentual_meta ASC, a.comprador;
