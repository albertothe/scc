import type { Request, Response } from "express"
import { getDashboardHistorico } from "../services/compradoresHistoricoService"

export const getCompradoresHistorico = async (req: Request, res: Response) => {
  try {
    const ano = req.query.ano ? Number(req.query.ano) : null
    const mes = req.query.mes ? Number(req.query.mes) : null

    if (!ano || !mes || Number.isNaN(ano) || Number.isNaN(mes) || mes < 1 || mes > 12) {
      return res.status(400).json({ message: "Parâmetros ano e mes são obrigatórios (ex: ?ano=2025&mes=4)" })
    }

    const data = await getDashboardHistorico(ano, mes)
    return res.json(data)
  } catch (error) {
    console.error("Erro ao buscar histórico de compradores:", error)
    return res.status(500).json({ message: "Erro ao buscar histórico de compradores." })
  }
}
