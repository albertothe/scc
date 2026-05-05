require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false,
})

async function test() {
  const client = await pool.connect()

  // 1. Verifica estrutura da tabela scc_metas_compradores
  console.log('\n=== Colunas de scc_metas_compradores ===')
  try {
    const r = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'scc_metas_compradores'
      ORDER BY ordinal_position
    `)
    r.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type}`))
  } catch(e) { console.error('ERRO:', e.message) }

  // 2. Verifica colunas da view vs_scc_vendas_devolucoes
  console.log('\n=== Colunas de vs_scc_vendas_devolucoes ===')
  try {
    const r = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'vs_scc_vendas_devolucoes'
      ORDER BY ordinal_position
    `)
    r.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type}`))
  } catch(e) { console.error('ERRO:', e.message) }

  // 3. Verifica colunas de scc_comprador_grupo
  console.log('\n=== Colunas de scc_comprador_grupo ===')
  try {
    const r = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'scc_comprador_grupo'
      ORDER BY ordinal_position
    `)
    r.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type}`))
  } catch(e) { console.error('ERRO:', e.message) }

  // 4. Testa a query completa e captura o erro
  console.log('\n=== Testando query completa ===')
  try {
    const r = await client.query(`
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
                       AND (date_trunc('month', CURRENT_DATE - interval '1 year') + interval '1 month' - interval '1 day')::date
        GROUP BY TRIM(codgrp)
      ),
      vendas_atual AS (
        SELECT
          TRIM(codgrp) AS codgrp,
          SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)) AS venda,
          SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_custos_vendas, 0) - COALESCE(vlr_impostos_vendas, 0)) AS lb,
          SUM(CASE WHEN tipo IN ('FORA','ENCO') THEN COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0) ELSE 0 END) AS venda_fora
        FROM vs_scc_vendas_devolucoes
        WHERE data BETWEEN date_trunc('month', CURRENT_DATE)::date AND CURRENT_DATE
        GROUP BY TRIM(codgrp)
      ),
      vendas_ano_passado AS (
        SELECT TRIM(codgrp) AS codgrp,
               SUM(COALESCE(vlr_total_vendas_bruta, 0) - COALESCE(vlr_total_devolucoes, 0)) AS venda
        FROM vs_scc_vendas_devolucoes
        WHERE data BETWEEN date_trunc('month', CURRENT_DATE - interval '1 year')::date
                       AND (CURRENT_DATE - interval '1 year')::date
        GROUP BY TRIM(codgrp)
      )
      SELECT ga.comprador, ga.codgrp,
        COALESCE(m.meta_vendas, 0) AS meta_vendas,
        COALESCE(m.meta_lb, 0) AS meta_lb,
        COALESCE(m.meta_produtos_fora, 0) AS meta_produtos_fora,
        COALESCE(va.venda, 0) AS venda,
        da.qtd AS dias_atual, db.qtd AS dias_base
      FROM grupos_ativos ga
      LEFT JOIN vendas_atual va ON va.codgrp = ga.codgrp
      LEFT JOIN vendas_ano_passado vap ON vap.codgrp = ga.codgrp
      LEFT JOIN dias_atual da ON da.codgrp = ga.codgrp
      LEFT JOIN dias_mes_base db ON db.codgrp = ga.codgrp
      LEFT JOIN scc_metas_compradores m
        ON m.comprador_id = ga.comprador_id
        AND TRIM(m.codgrp) = ga.codgrp
        AND m.mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
        AND m.ano = EXTRACT(YEAR FROM CURRENT_DATE)::int
      LIMIT 5
    `)
    console.log('SUCESSO! Linhas retornadas:', r.rows.length)
    console.log(JSON.stringify(r.rows, null, 2))
  } catch(e) {
    console.error('ERRO NA QUERY COMPLETA:', e.message)
    if (e.detail) console.error('DETALHE:', e.detail)
    if (e.hint) console.error('DICA:', e.hint)
    if (e.position) console.error('POSIÇÃO:', e.position)
    if (e.where) console.error('ONDE:', e.where)
  }

  client.release()
  await pool.end()
}

test().catch(e => { console.error('ERRO FATAL:', e); process.exit(1) })
