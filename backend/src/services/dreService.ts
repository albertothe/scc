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
  const conditions: string[] = ["fato.data >= $1"]
  const values: Array<string | number> = ["2025-10-01"]

  if (filtros.ano) {
    values.push(filtros.ano)
    conditions.push(`fato.ano = $${values.length}`)
  }

  if (filtros.mes) {
    values.push(filtros.mes)
    conditions.push(`fato.mes = $${values.length}`)
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
    where
      ${conditions.join(" and ")}
    order by
      dimensao.sequencial
  `

  const result = await drePool.query(query, values)
  return result.rows
}

export const atualizarDre = async (sequencial: number, ano: number, mes: number, dados: AtualizarDreInput): Promise<void> => {
  const query = `
    update fato
    set
      realizado = $1,
      orcado = $2
    where
      sequencial = $3
      and ano = $4
      and mes = $5
      and data >= $6
  `

  const result = await drePool.query(query, [dados.realizado, dados.orcado, sequencial, ano, mes, "2025-10-01"])

  if (result.rowCount === 0) {
    throw new Error("Registro DRE não encontrado para atualização")
  }
}
