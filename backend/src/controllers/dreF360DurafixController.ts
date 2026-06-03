import type { Request, Response } from "express"
import { atualizarDreF360Durafix, listarDreF360Durafix, listarLojasF360Durafix } from "../services/dreF360DurafixService"

export const getDreF360Durafix = async (req: Request, res: Response) => {
  try {
    const ano       = req.query.ano       ? String(req.query.ano)       : undefined
    const mes       = req.query.mes       ? String(req.query.mes)       : undefined
    const codloja   = req.query.codloja   ? String(req.query.codloja)   : undefined
    const descricao = req.query.descricao ? String(req.query.descricao) : undefined

    const data = await listarDreF360Durafix({ ano, mes, codloja, descricao })
    res.json(data)
  } catch (error) {
    console.error("Erro ao buscar DRE F360 Durafix:", error)
    res.status(500).json({ message: "Erro ao buscar dados DRE F360 Durafix" })
  }
}

export const getLojasF360Durafix = async (_req: Request, res: Response) => {
  try {
    const lojas = await listarLojasF360Durafix()
    res.json(lojas)
  } catch (error) {
    console.error("Erro ao buscar lojas DRE F360 Durafix:", error)
    res.status(500).json({ message: "Erro ao buscar lojas DRE F360 Durafix" })
  }
}

export const putDreF360Durafix = async (req: Request, res: Response) => {
  try {
    const sequencial = String(req.params.sequencial)
    const codloja    = String(req.params.codloja)
    const ano        = Number(req.params.ano  ?? req.body.ano)
    const mes        = Number(req.params.mes  ?? req.body.mes)

    if (!sequencial || !codloja || Number.isNaN(ano) || Number.isNaN(mes)) {
      return res.status(400).json({ message: "Sequencial, codloja, ano e mês são obrigatórios" })
    }

    const realizado = req.body.realizado === null || req.body.realizado === "" ? null : Number(req.body.realizado)
    const orcado    = req.body.orcado    === null || req.body.orcado    === "" ? null : Number(req.body.orcado)

    if ((realizado !== null && Number.isNaN(realizado)) || (orcado !== null && Number.isNaN(orcado))) {
      return res.status(400).json({ message: "Valores de realizado e orçado devem ser numéricos" })
    }

    await atualizarDreF360Durafix(sequencial, codloja, ano, mes, { realizado, orcado })
    return res.status(204).send()
  } catch (error) {
    console.error("Erro ao atualizar DRE F360 Durafix:", error)
    if (error instanceof Error && error.message.includes("não encontrado")) {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: "Erro ao atualizar dados DRE F360 Durafix" })
  }
}
