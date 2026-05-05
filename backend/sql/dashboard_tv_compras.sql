-- Dashboard TV Compras (somente indicadores percentuais, sem exposição de valores em R$)
WITH params AS (
  SELECT EXTRACT(YEAR FROM CURRENT_DATE)::int AS ano_atual,
         EXTRACT(MONTH FROM CURRENT_DATE)::int AS mes_atual
),
base AS (
  SELECT
    v.codgrp,
    c.nome AS comprador,
    EXTRACT(YEAR FROM v.datamov)::int AS ano,
    EXTRACT(MONTH FROM v.datamov)::int AS mes,
    SUM(COALESCE(v.vlr_total_vendas_bruta,0)) AS venda_bruta,
    SUM(COALESCE(v.vlr_total_devolucoes,0)) AS devolucao,
    SUM(COALESCE(v.vlr_custos_vendas,0)) AS custos,
    SUM(COALESCE(v.vlr_impostos_vendas,0)) AS impostos
  FROM vs_scc_vendas_devolucoes v
  JOIN scc_comprador_grupo cg ON cg.codgrp = v.codgrp AND cg.dt_fim IS NULL
  JOIN scc_compradores c ON c.id = cg.comprador_id
  GROUP BY v.codgrp, c.nome, EXTRACT(YEAR FROM v.datamov), EXTRACT(MONTH FROM v.datamov)
),
curr AS (
  SELECT b.*, (b.venda_bruta - b.devolucao) AS venda,
         (b.venda_bruta - b.custos - b.impostos) AS lb
  FROM base b JOIN params p ON b.ano = p.ano_atual AND b.mes = p.mes_atual
),
prev_year AS (
  SELECT b.codgrp, (b.venda_bruta - b.devolucao) AS venda_prev
  FROM base b JOIN params p ON b.ano = p.ano_atual - 1 AND b.mes = p.mes_atual
),
meta AS (
  SELECT m.codgrp, m.meta_vendas, m.meta_lb
  FROM scc_metas_compradores m
  JOIN params p ON m.ano = p.ano_atual AND m.mes = p.mes_atual
)
SELECT
  c.codgrp,
  c.comprador,
  CASE WHEN COALESCE(m.meta_vendas,0) = 0 THEN 0 ELSE (c.venda / m.meta_vendas) * 100 END AS venda_percentual_meta,
  CASE WHEN c.venda = 0 THEN 0 ELSE (c.lb / c.venda) * 100 END AS lb_percentual,
  COALESCE(m.meta_lb, 0) AS meta_lb,
  CASE WHEN COALESCE(py.venda_prev,0) = 0 THEN 0 ELSE ((c.venda / py.venda_prev) - 1) * 100 END AS evolucao_percentual
FROM curr c
LEFT JOIN prev_year py ON py.codgrp = c.codgrp
LEFT JOIN meta m ON m.codgrp = c.codgrp
ORDER BY venda_percentual_meta ASC, c.comprador;
