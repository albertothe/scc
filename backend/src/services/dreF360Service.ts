import { Pool } from "pg"
import type { AtualizarDreF360Input, DreF360Filtros, DreF360Registro } from "../models/DreF360"

const drePool = new Pool({
  user: process.env.DRE_DB_USER ?? "icomp",
  host: process.env.DRE_DB_HOST ?? "172.20.33.5",
  database: process.env.DRE_DB_NAME ?? "dre",
  password: process.env.DRE_DB_PASSWORD ?? "icompdbpw",
  port: Number.parseInt(process.env.DRE_DB_PORT ?? "5432"),
})

export const listarDreF360 = async (filtros: DreF360Filtros): Promise<DreF360Registro[]> => {
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

  if (filtros.codloja) {
    values.push(filtros.codloja)
    conditions.push(`fato.codloja = $${values.length}`)
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
      dimensao.detalhamento,
      fato.codloja,
      fato.ano,
      fato.mes,
      fato.realizado,
      fato.orcado,
      fato.rlr,
      fato.rlo
    from
      f360_dimensao dimensao
    inner join
      f360_fato fato on fato.sequencial = dimensao.sequencial
    ${conditions.length > 0 ? `where ${conditions.join(" and ")}` : ""}
    order by
      dimensao.ordem, dimensao.sequencial
  `

  const result = await drePool.query(query, values)
  return result.rows
}

export const listarLojasF360 = async (): Promise<string[]> => {
  const query = `
    select distinct codloja
    from f360_fato
    where codloja is not null
    order by codloja
  `
  const result = await drePool.query(query)
  return result.rows.map((r: { codloja: string }) => r.codloja)
}

export const atualizarDreF360 = async (
  sequencial: string,
  codloja: string,
  ano: number,
  mes: number,
  dados: AtualizarDreF360Input,
): Promise<void> => {
  const client = await drePool.connect()

  try {
    await client.query("begin")

    const valorAnteriorQuery = `
      select realizado
      from f360_fato
      where sequencial = $1
        and codloja = $2
        and ano = $3
        and cast(mes as integer) = $4
      for update
    `

    const valorAnteriorResult = await client.query(valorAnteriorQuery, [sequencial, codloja, ano, mes])

    if (valorAnteriorResult.rowCount === 0) {
      throw new Error("Registro DRE F360 não encontrado para atualização")
    }

    const updateQuery = `
      update f360_fato
      set
        realizado = $1,
        orcado = $2
      where
        sequencial = $3
        and codloja = $4
        and ano = $5
        and cast(mes as integer) = $6
    `

    await client.query(updateQuery, [dados.realizado, dados.orcado, sequencial, codloja, ano, mes])

    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }
}
