import type { Request, Response } from "express"
import * as comissaoVendedorService from "../services/comissaoVendedorService"

// Obter todos os vendedores
export const getVendedores = async (req: Request, res: Response): Promise<void> => {
    try {
        const vendedores = await comissaoVendedorService.getVendedores()
        res.status(200).json(vendedores)
    } catch (error) {
        console.error("Erro ao buscar vendedores:", error)
        res.status(500).json({ error: "Erro ao buscar vendedores" })
    }
}

// Obter todas as lojas
export const getLojas = async (req: Request, res: Response): Promise<void> => {
    try {
        const lojas = await comissaoVendedorService.getLojas()
        res.status(200).json(lojas)
    } catch (error) {
        console.error("Erro ao buscar lojas:", error)
        res.status(500).json({ error: "Erro ao buscar lojas" })
    }
}

// Obter todas as comissões de vendedores
export const getComissoesVendedores = async (req: Request, res: Response): Promise<void> => {
    try {
        const comissoes = await comissaoVendedorService.getComissoesVendedores()
        res.status(200).json(comissoes)
    } catch (error) {
        console.error("Erro ao buscar comissões de vendedores:", error)
        res.status(500).json({ error: "Erro ao buscar comissões de vendedores" })
    }
}

// Obter comissão específica
export const getComissaoVendedor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const comissao = await comissaoVendedorService.getComissaoVendedor(Number.parseInt(id))

        if (!comissao) {
            res.status(404).json({ error: "Comissão não encontrada" })
            return
        }

        res.status(200).json(comissao)
    } catch (error) {
        console.error("Erro ao buscar comissão:", error)
        res.status(500).json({ error: "Erro ao buscar comissão" })
    }
}

// Criar nova comissão
export const criarComissaoVendedor = async (req: Request, res: Response): Promise<void> => {
    try {
        const comissao = req.body
        const novaComissao = await comissaoVendedorService.criarComissaoVendedor(comissao)
        res.status(201).json(novaComissao)
    } catch (error) {
        console.error("Erro ao criar comissão:", error)
        res.status(500).json({ error: "Erro ao criar comissão" })
    }
}

// Atualizar comissão
export const atualizarComissaoVendedor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const comissao = req.body
        const comissaoAtualizada = await comissaoVendedorService.atualizarComissaoVendedor(Number.parseInt(id), comissao)
        res.status(200).json(comissaoAtualizada)
    } catch (error) {
        console.error("Erro ao atualizar comissão:", error)
        res.status(500).json({ error: "Erro ao atualizar comissão" })
    }
}

// Excluir comissão
export const excluirComissaoVendedor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const sucesso = await comissaoVendedorService.excluirComissaoVendedor(Number.parseInt(id))

        if (!sucesso) {
            res.status(404).json({ error: "Comissão não encontrada" })
            return
        }

        res.status(200).json({ message: "Comissão excluída com sucesso" })
    } catch (error) {
        console.error("Erro ao excluir comissão:", error)
        res.status(500).json({ error: "Erro ao excluir comissão" })
    }
}
