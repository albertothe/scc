import type { Request, Response } from "express"
import { getDashboardTvCompras } from "../services/dashboardTvComprasService"

export const dashboardTvCompras = async (_req: Request, res: Response) => {
  try {
    const data = await getDashboardTvCompras()
    res.json(data)
  } catch (error) {
    console.error("Erro ao gerar dashboard TV compras:", error)
    res.status(500).json({ message: "Erro ao gerar dashboard de compras para TV." })
  }
}
