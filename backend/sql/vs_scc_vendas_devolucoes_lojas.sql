-- View: vs_scc_vendas_devolucoes_lojas
-- Mesma estrutura de vs_scc_vendas_devolucoes, acrescida da coluna codloja.
-- Ajuste o SELECT interno para apontar para a tabela/fonte real do seu sistema legado.
CREATE OR REPLACE VIEW vs_scc_vendas_devolucoes_lojas AS
SELECT
    TRIM(v.codloja)                 AS codloja,
    v.data,
    TRIM(v.codgrp)                  AS codgrp,
    v.tipo,
    v.vlr_total_vendas_bruta,
    v.vlr_total_devolucoes,
    v.vlr_custos_vendas,
    v.vlr_impostos_vendas
FROM <fonte_legado> v
WHERE v.codloja IS NOT NULL;
-- Exemplo com tabela legada típica:
-- FROM a_vendas_itens v
-- ou
-- FROM a_nf_saidas v
