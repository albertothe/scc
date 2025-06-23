import type { Request, Response } from "express"
import * as comissaoService from "../services/comissaoService"

// Obter todas as faixas de comissão
export const getFaixasComissao = async (req: Request, res: Response): Promise<void> => {
    try {
        const faixas = await comissaoService.getFaixasComissao()
        res.json(faixas)
    } catch (error) {
        console.error("Erro ao buscar faixas de comissão:", error)
        res.status(500).json({ error: "Erro ao buscar faixas de comissão", details: (error as Error).message })
    }
}

// Obter uma faixa específica
export const getFaixaComissao = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number.parseInt(req.params.id, 10)

        if (isNaN(id)) {
            res.status(400).json({ error: "ID inválido" })
            return
        }

        const faixa = await comissaoService.getFaixaComissao(id)

        if (!faixa) {
            res.status(404).json({ error: "Faixa de comissão não encontrada" })
            return
        }

        res.json(faixa)
    } catch (error) {
        console.error(`Erro ao buscar faixa de comissão:`, error)
        res.status(500).json({ error: "Erro ao buscar faixa de comissão", details: (error as Error).message })
    }
}

// Criar uma nova faixa de comissão
export const criarFaixaComissao = async (req: Request, res: Response): Promise<void> => {
    try {
        const { faixa_min, faixa_max, loja, percentuais } = req.body

        // Validações básicas
        if (faixa_min === undefined || faixa_max === undefined || !loja) {
            res.status(400).json({ error: "Dados incompletos. faixa_min, faixa_max e loja são obrigatórios" })
            return
        }

        if (faixa_min >= faixa_max) {
            res.status(400).json({ error: "faixa_min deve ser menor que faixa_max" })
            return
        }

        if (!Array.isArray(percentuais) || percentuais.length === 0) {
            res.status(400).json({ error: "É necessário fornecer pelo menos um percentual" })
            return
        }

        // Validar cada percentual
        for (const percentual of percentuais) {
            if (!percentual.etiqueta || percentual.percentual === undefined) {
                res.status(400).json({ error: "Cada percentual deve ter etiqueta e valor" })
                return
            }
        }

        const novaFaixa = await comissaoService.criarFaixaComissao({ faixa_min, faixa_max, loja }, percentuais)

        res.status(201).json(novaFaixa)
    } catch (error) {
        console.error("Erro ao criar faixa de comissão:", error)
        res.status(500).json({ error: "Erro ao criar faixa de comissão", details: (error as Error).message })
    }
}

// Atualizar uma faixa existente
export const atualizarFaixaComissao = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number.parseInt(req.params.id, 10)

        if (isNaN(id)) {
            res.status(400).json({ error: "ID inválido" })
            return
        }

        const { faixa_min, faixa_max, loja, percentuais } = req.body

        // Validações básicas
        if (faixa_min === undefined || faixa_max === undefined || !loja) {
            res.status(400).json({ error: "Dados incompletos. faixa_min, faixa_max e loja são obrigatórios" })
            return
        }

        if (faixa_min >= faixa_max) {
            res.status(400).json({ error: "faixa_min deve ser menor que faixa_max" })
            return
        }

        if (!Array.isArray(percentuais)) {
            res.status(400).json({ error: "percentuais deve ser um array" })
            return
        }

        // Validar cada percentual
        for (const percentual of percentuais) {
            if (!percentual.etiqueta || percentual.percentual === undefined) {
                res.status(400).json({ error: "Cada percentual deve ter etiqueta e valor" })
                return
            }
        }

        const faixaAtualizada = await comissaoService.atualizarFaixaComissao(
            id,
            { faixa_min, faixa_max, loja },
            percentuais,
        )

        res.json(faixaAtualizada)
    } catch (error) {
        console.error("Erro ao atualizar faixa de comissão:", error)
        res.status(500).json({ error: "Erro ao atualizar faixa de comissão", details: (error as Error).message })
    }
}

// Excluir uma faixa
export const excluirFaixaComissao = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number.parseInt(req.params.id, 10)

        if (isNaN(id)) {
            res.status(400).json({ error: "ID inválido" })
            return
        }

        const sucesso = await comissaoService.excluirFaixaComissao(id)

        if (!sucesso) {
            res.status(404).json({ error: "Faixa de comissão não encontrada" })
            return
        }

        res.json({ message: "Faixa de comissão excluída com sucesso" })
    } catch (error) {
        console.error("Erro ao excluir faixa de comissão:", error)
        res.status(500).json({ error: "Erro ao excluir faixa de comissão", details: (error as Error).message })
    }
}

// Excluir um percentual específico
export const excluirPercentual = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number.parseInt(req.params.id, 10)

        if (isNaN(id)) {
            res.status(400).json({ error: "ID inválido" })
            return
        }

        const sucesso = await comissaoService.excluirPercentual(id)

        if (!sucesso) {
            res.status(404).json({ error: "Percentual não encontrado" })
            return
        }

        res.json({ message: "Percentual excluído com sucesso" })
    } catch (error) {
        console.error("Erro ao excluir percentual:", error)
        res.status(500).json({ error: "Erro ao excluir percentual", details: (error as Error).message })
    }
}
