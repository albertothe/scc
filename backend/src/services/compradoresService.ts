import pool from "../config/database"

export const getCompradores = async () => {
  const result = await pool.query(`
    SELECT id, nome, ativo, created_at
    FROM scc_compradores
    ORDER BY nome
  `)
  return result.rows
}

export const criarComprador = async (nome: string, ativo = true) => {
  const result = await pool.query(
    `INSERT INTO scc_compradores (nome, ativo) VALUES ($1, $2) RETURNING id, nome, ativo, created_at`,
    [nome, ativo],
  )
  return result.rows[0]
}

export const atualizarComprador = async (id: number, nome: string, ativo: boolean) => {
  const result = await pool.query(
    `UPDATE scc_compradores SET nome = $1, ativo = $2 WHERE id = $3 RETURNING id, nome, ativo, created_at`,
    [nome, ativo, id],
  )
  return result.rows[0] || null
}

export const excluirComprador = async (id: number) => {
  const result = await pool.query(`DELETE FROM scc_compradores WHERE id = $1 RETURNING id`, [id])
  return result.rows.length > 0
}

export const getCompradorGrupo = async () => {
  const result = await pool.query(`
    SELECT cg.id, cg.codgrp, cg.comprador_id, c.nome as comprador_nome, cg.dt_inicio, cg.dt_fim
    FROM scc_comprador_grupo cg
    INNER JOIN scc_compradores c ON c.id = cg.comprador_id
    ORDER BY cg.codgrp, cg.dt_inicio DESC
  `)
  return result.rows
}

export const criarCompradorGrupo = async (codgrp: string, compradorId: number, dtInicio?: string) => {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await client.query(
      `UPDATE scc_comprador_grupo SET dt_fim = CURRENT_DATE WHERE codgrp = $1 AND dt_fim IS NULL`,
      [codgrp],
    )
    const result = await client.query(
      `INSERT INTO scc_comprador_grupo (codgrp, comprador_id, dt_inicio) VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE))
       RETURNING id, codgrp, comprador_id, dt_inicio, dt_fim`,
      [codgrp, compradorId, dtInicio || null],
    )
    await client.query("COMMIT")
    return result.rows[0]
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export const atualizarCompradorGrupo = async (id: number, codgrp: string, compradorId: number, dtInicio: string, dtFim?: string | null) => {
  const result = await pool.query(
    `UPDATE scc_comprador_grupo
     SET codgrp = $1, comprador_id = $2, dt_inicio = $3, dt_fim = $4
     WHERE id = $5
     RETURNING id, codgrp, comprador_id, dt_inicio, dt_fim`,
    [codgrp, compradorId, dtInicio, dtFim || null, id],
  )
  return result.rows[0] || null
}

export const excluirCompradorGrupo = async (id: number) => {
  const result = await pool.query(`DELETE FROM scc_comprador_grupo WHERE id = $1 RETURNING id`, [id])
  return result.rows.length > 0
}

export const getMetasCompradores = async (filtros: { ano?: number; mes?: number; comprador_id?: number }) => {
  const values: Array<number> = []
  const where: string[] = []
  if (filtros.ano) { values.push(filtros.ano); where.push(`m.ano = $${values.length}`) }
  if (filtros.mes) { values.push(filtros.mes); where.push(`m.mes = $${values.length}`) }
  if (filtros.comprador_id) { values.push(filtros.comprador_id); where.push(`m.comprador_id = $${values.length}`) }

  const query = `
    SELECT m.*, c.nome AS comprador_nome
    FROM scc_metas_compradores m
    INNER JOIN scc_compradores c ON c.id = m.comprador_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY m.ano DESC, m.mes DESC, m.codgrp
  `
  const result = await pool.query(query, values)
  return result.rows
}

export const criarMetaComprador = async (payload: any) => {
  const result = await pool.query(`
    INSERT INTO scc_metas_compradores (
      comprador_id, codgrp, ano, mes, meta_vendas, meta_lb, meta_evolucao, meta_nivel_servico, meta_dias_estoque, meta_produtos_fora
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
  `, [
    payload.comprador_id, payload.codgrp, payload.ano, payload.mes, payload.meta_vendas, payload.meta_lb,
    payload.meta_evolucao, payload.meta_nivel_servico, payload.meta_dias_estoque, payload.meta_produtos_fora,
  ])
  return result.rows[0]
}

export const atualizarMetaComprador = async (id: number, payload: any) => {
  const result = await pool.query(`
    UPDATE scc_metas_compradores SET
      comprador_id=$1, codgrp=$2, ano=$3, mes=$4, meta_vendas=$5, meta_lb=$6, meta_evolucao=$7,
      meta_nivel_servico=$8, meta_dias_estoque=$9, meta_produtos_fora=$10
    WHERE id=$11
    RETURNING *
  `, [
    payload.comprador_id, payload.codgrp, payload.ano, payload.mes, payload.meta_vendas, payload.meta_lb,
    payload.meta_evolucao, payload.meta_nivel_servico, payload.meta_dias_estoque, payload.meta_produtos_fora, id,
  ])
  return result.rows[0] || null
}

export const excluirMetaComprador = async (id: number) => {
  const result = await pool.query(`DELETE FROM scc_metas_compradores WHERE id = $1 RETURNING id`, [id])
  return result.rows.length > 0
}
