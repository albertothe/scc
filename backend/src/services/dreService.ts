import { Pool } from "pg"
import type { AtualizarDreInput, DreFiltros, DreRegistro } from "../models/Dre"

const drePool = new Pool({
  user: process.env.DRE_DB_USER ?? "icomp",
  host: process.env.DRE_DB_HOST ?? "172.20.33.5",
  database: process.env.DRE_DB_NAME ?? "dre",
  password: process.env.DRE_DB_PASSWORD ?? "icompdbpw",
  port: Number.parseInt(process.env.DRE_DB_PORT ?? "5432"),
})

export const listarDre = async (filtros: DreFiltros): Promise<DreRegistro[]> => {
  const conditions: string[] = []
  const values: Array<string | number> = []

  if (filtros.ano) {
    values.push(filtros.ano)
    conditions.push(`fato.ano = $${values.length}`)
  }

  if (filtros.mes) {
    values.push(filtros.mes)
    conditions.push(`cast(fato.mes as integer) = $${values.length}`)
  }

  if (filtros.descricao) {
    values.push(`%${filtros.descricao}%`)
    conditions.push(`dimensao.descricao ILIKE $${values.length}`)
  }

  const query = `
    select
      dimensao.sequencial,
      dimensao.descricao,
      dimensao.subdescricao,
      fato.ano,
      fato.mes,
      fato.realizado,
      fato.orcado
    from
      dimensao
    inner join
      fato on fato.sequencial = dimensao.sequencial
    ${conditions.length > 0 ? `where ${conditions.join(" and ")}` : ""}
    order by
      dimensao.sequencial
  `

  const result = await drePool.query(query, values)
  return result.rows
}

export const atualizarDre = async (sequencial: number, ano: number, mes: number, dados: AtualizarDreInput): Promise<void> => {
  const client = await drePool.connect()
  const dataReferencia = `${ano}-${String(mes).padStart(2, "0")}-01`

  try {
    await client.query("begin")

    const valorAnteriorQuery = `
      select
        realizado
      from
        fato
      where
        sequencial = $1
        and ano = $2
        and cast(mes as integer) = $3
      for update
    `

    const valorAnteriorResult = await client.query<{ realizado: number | string | null }>(valorAnteriorQuery, [sequencial, ano, mes])

    if (valorAnteriorResult.rowCount === 0) {
      throw new Error("Registro DRE não encontrado para atualização")
    }

    const valorAnteriorRealizadoRaw = valorAnteriorResult.rows[0]?.realizado ?? null
    const valorAnteriorRealizado = valorAnteriorRealizadoRaw === null ? null : Number(valorAnteriorRealizadoRaw)

    const updateFatoQuery = `
      update fato
      set
        realizado = $1,
        orcado = $2
      where
        sequencial = $3
        and ano = $4
        and cast(mes as integer) = $5
    `

    await client.query(updateFatoQuery, [dados.realizado, dados.orcado, sequencial, ano, mes])

    const realizadoFoiAlterado = valorAnteriorRealizado !== dados.realizado

    if (realizadoFoiAlterado) {
      const updateDespesasQuery = `
        update despesas_f360
        set
          realizado = $1
        where
          sequencial = $2
          and date_trunc('month', data::timestamp) = date_trunc('month', $3::date)
      `

      const updateDespesasResult = await client.query(updateDespesasQuery, [dados.realizado, sequencial, dataReferencia])

      if (updateDespesasResult.rowCount === 0) {
        const insertDespesasQuery = `
          insert into despesas_f360 (sequencial, data, realizado)
          values ($1, $2, $3)
        `

        await client.query(insertDespesasQuery, [sequencial, dataReferencia, dados.realizado])
      }
    }

    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }
}
