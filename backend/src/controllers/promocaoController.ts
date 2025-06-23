import type { Request, Response } from "express"
import * as promocaoService from "../services/promocaoService"

export const getProdutosPromocao = async (req: Request, res: Response): Promise<void> => {
    try {
        const produtos = await promocaoService.getProdutosPromocao()
        res.json(produtos)
    } catch (error) {
        console.error("Erro ao buscar produtos em promoção:", error)
        res.status(500).json({ error: "Erro ao buscar produtos", details: (error as Error).message })
    }
}

export const buscarProdutosPromocao = async (req: Request, res: Response): Promise<void> => {
    try {
        const { termo } = req.query
        if (!termo) {
            res.status(400).json({ error: "Parâmetro termo é obrigatório" })
            return
        }
        const produtos = await promocaoService.buscarProdutosPromocao(termo as string)
        res.json(produtos)
    } catch (error) {
        console.error("Erro ao buscar produtos em promoção:", error)
        res.status(500).json({ error: "Erro ao buscar produtos", details: (error as Error).message })
    }
}

// Novo endpoint para importação de produtos em promoção
export const importarProdutosPromocao = async (req: Request, res: Response): Promise<void> => {
    try {
        const { produtos } = req.body

        if (!produtos || !Array.isArray(produtos)) {
            res.status(400).json({ error: "Parâmetro produtos (array) é obrigatório" })
            return
        }

        // Obter o código do usuário logado
        const codusuario = req.usuario?.codusuario || ""

        if (!codusuario) {
            res.status(400).json({ error: "Usuário não identificado" })
            return
        }

        const resultado = await promocaoService.importarProdutosPromocao(produtos, codusuario)
        res.status(200).json(resultado)
    } catch (error) {
        console.error("Erro ao importar produtos em promoção:", error)
        res.status(500).json({ error: "Erro ao importar produtos", details: (error as Error).message })
    }
}
