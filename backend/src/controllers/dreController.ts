import type { Request, Response } from "express"
import { atualizarDre, listarDre } from "../services/dreService"

export const getDre = async (req: Request, res: Response) => {
  try {
    const ano = req.query.ano ? Number(req.query.ano) : undefined
    const mes = req.query.mes ? Number(req.query.mes) : undefined
    const descricao = req.query.descricao ? String(req.query.descricao) : undefined

    const data = await listarDre({ ano, mes, descricao })
    res.json(data)
  } catch (error) {
    console.error("Erro ao buscar DRE:", error)
    res.status(500).json({ message: "Erro ao buscar dados DRE" })
  }
}

export const putDre = async (req: Request, res: Response) => {
  try {
    const sequencial = Number(req.params.sequencial)
    const ano = Number(req.body.ano)
    const mes = Number(req.body.mes)

    if (Number.isNaN(sequencial) || Number.isNaN(ano) || Number.isNaN(mes)) {
      return res.status(400).json({ message: "Sequencial, ano e mês são obrigatórios" })
    }

    const realizado = req.body.realizado === null || req.body.realizado === "" ? null : Number(req.body.realizado)
    const orcado = req.body.orcado === null || req.body.orcado === "" ? null : Number(req.body.orcado)

    if ((realizado !== null && Number.isNaN(realizado)) || (orcado !== null && Number.isNaN(orcado))) {
      return res.status(400).json({ message: "Valores de realizado e orçado devem ser numéricos" })
    }

    await atualizarDre(sequencial, ano, mes, { realizado, orcado })
    return res.status(204).send()
  } catch (error) {
    console.error("Erro ao atualizar DRE:", error)
    if (error instanceof Error && error.message.includes("não encontrado")) {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: "Erro ao atualizar dados DRE" })
  }
}
