import * as vendedorMetaService from "../services/vendedorMetaService"
import type { Request, Response } from "express"

// Verificar estrutura do banco
export const verificarEstruturaBanco = async (req: Request, res: Response): Promise<void> => {
    try {
        const estrutura = await vendedorMetaService.verificarEstruturaBanco()
        res.status(200).json(estrutura)
    } catch (error) {
        console.error("Erro ao verificar estrutura do banco:", error)
        res.status(500).json({ error: "Erro ao verificar estrutura do banco" })
    }
}

// Obter todos os vendedores ativos
export const getVendedores = async (req: Request, res: Response): Promise<void> => {
    try {
        const vendedores = await vendedorMetaService.getVendedores()
        res.status(200).json(vendedores)
    } catch (error) {
        console.error("Erro ao buscar vendedores:", error)
        res.status(500).json({ error: "Erro ao buscar vendedores" })
    }
}

// Obter metas de vendedores por competência (mês/ano)
export const getMetasPorCompetencia = async (req: Request, res: Response): Promise<void> => {
    try {
        const { competencia } = req.params
        const metas = await vendedorMetaService.getMetasPorCompetencia(competencia)
        res.status(200).json(metas)
    } catch (error) {
        console.error(`Erro ao buscar metas para competência ${req.params.competencia}:`, error)
        res.status(500).json({ error: `Erro ao buscar metas para competência ${req.params.competencia}` })
    }
}

// Obter meta específica de um vendedor
export const getMetaVendedor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { codvendedor, competencia } = req.params
        const meta = await vendedorMetaService.getMetaVendedor(codvendedor, competencia)

        if (!meta) {
            res.status(404).json({ error: `Meta não encontrada para vendedor ${codvendedor} na competência ${competencia}` })
            return
        }

        res.status(200).json(meta)
    } catch (error) {
        console.error(`Erro ao buscar meta para vendedor ${req.params.codvendedor}:`, error)
        res.status(500).json({ error: `Erro ao buscar meta para vendedor ${req.params.codvendedor}` })
    }
}

// Salvar meta de vendedor (criar ou atualizar)
export const salvarMetaVendedor = async (req: Request, res: Response): Promise<void> => {
    try {
        const meta = req.body
        const metaSalva = await vendedorMetaService.salvarMetaVendedor(meta)
        res.status(200).json(metaSalva)
    } catch (error) {
        console.error("Erro ao salvar meta de vendedor:", error)
        res.status(500).json({ error: "Erro ao salvar meta de vendedor" })
    }
}

// Excluir meta de vendedor
export const excluirMetaVendedor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { codvendedor, competencia } = req.params
        const metaExcluida = await vendedorMetaService.excluirMetaVendedor(codvendedor, competencia)

        if (!metaExcluida) {
            res.status(404).json({ error: `Meta não encontrada para vendedor ${codvendedor} na competência ${competencia}` })
            return
        }

        res.status(200).json(metaExcluida)
    } catch (error) {
        console.error(`Erro ao excluir meta para vendedor ${req.params.codvendedor}:`, error)
        res.status(500).json({ error: `Erro ao excluir meta para vendedor ${req.params.codvendedor}` })
    }
}

// Copiar metas de uma competência para outra
export const copiarMetas = async (req: Request, res: Response): Promise<void> => {
    try {
        const { competenciaOrigem, competenciaDestino } = req.body
        const resultado = await vendedorMetaService.copiarMetas(competenciaOrigem, competenciaDestino)
        res.status(200).json(resultado)
    } catch (error) {
        console.error("Erro ao copiar metas:", error)
        res.status(500).json({ error: "Erro ao copiar metas" })
    }
}

// Importar metas em lote
export const importarMetas = async (req: Request, res: Response): Promise<void> => {
    try {
        const { metas } = req.body

        if (!Array.isArray(metas) || metas.length === 0) {
            res.status(400).json({ mensagem: "Nenhuma meta para importar" })
            return
        }

        const resultado = await vendedorMetaService.importarMetas(metas)

        res.status(200).json(resultado)
    } catch (erro) {
        console.error("Erro ao importar metas:", erro)
        res.status(500).json({ mensagem: "Erro ao importar metas", erro })
    }
}
