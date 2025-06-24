import type { Request, Response } from "express"
import { AutorizacaoCompraService } from "../services/autorizacaoCompraService"

const autorizacaoCompraService = new AutorizacaoCompraService()

export const criarAutorizacao = async (req: Request, res: Response): Promise<void> => {
    try {
        const autorizacao = {
            ...req.body,
            usuario: req.usuario?.usuario, // Pega o usuário do token
        }

        const novaAutorizacao = await autorizacaoCompraService.criarAutorizacao(autorizacao)
        res.status(201).json(novaAutorizacao)
    } catch (error) {
        console.error("Erro ao criar autorização:", error)
        res.status(500).json({ error: "Erro interno do servidor" })
    }
}

export const listarAutorizacoes = async (req: Request, res: Response): Promise<void> => {
    try {
        const usuario = req.usuario?.usuario
        const nivel = req.usuario?.nivel

        if (!usuario) {
            res.status(401).json({ error: "Usuário não autenticado" })
            return
        }

        const page = Number.parseInt((req.query.page as string) || "1")
        const limit = Number.parseInt((req.query.limit as string) || "10")

        const filtros: {
            loja?: string
            setor?: string
            busca?: string
            dataInicio?: string
            dataFim?: string
        } = {}

        if (nivel === "00" || nivel === "06") {
            if (req.query.loja) filtros.loja = req.query.loja as string
            if (req.query.setor) filtros.setor = req.query.setor as string
            if (req.query.busca) filtros.busca = req.query.busca as string
            if (req.query.dataInicio) filtros.dataInicio = req.query.dataInicio as string
            if (req.query.dataFim) filtros.dataFim = req.query.dataFim as string
        }

        const resultado = await autorizacaoCompraService.listarAutorizacoes(
            usuario,
            nivel ?? "",
            { ...filtros, page, limit },
        )
        res.json(resultado)
    } catch (error) {
        console.error("Erro ao listar autorizações:", error)
        res.status(500).json({ error: "Erro interno do servidor" })
    }
}

export const autorizarControladoria = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const usuarioControladoria = req.usuario?.usuario

        // Verificar se o usuário tem nível 06 (controladoria)
        if (req.usuario?.nivel !== "06") {
            res.status(403).json({ error: "Apenas a controladoria pode autorizar" })
            return
        }

        if (!usuarioControladoria) {
            res.status(401).json({ error: "Usuário não autenticado" })
            return
        }

        const autorizacao = await autorizacaoCompraService.autorizarControladoria(Number.parseInt(id), usuarioControladoria)
        res.json(autorizacao)
    } catch (error) {
        console.error("Erro ao autorizar controladoria:", error)
        const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor"
        res.status(500).json({ error: errorMessage })
    }
}

export const autorizarDiretoria = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const usuarioDiretoria = req.usuario?.usuario

        // Verificar se o usuário tem nível 00 (diretoria)
        if (req.usuario?.nivel !== "00") {
            res.status(403).json({ error: "Apenas a diretoria pode autorizar" })
            return
        }

        if (!usuarioDiretoria) {
            res.status(401).json({ error: "Usuário não autenticado" })
            return
        }

        const autorizacao = await autorizacaoCompraService.autorizarDiretoria(Number.parseInt(id), usuarioDiretoria)
        res.json(autorizacao)
    } catch (error) {
        console.error("Erro ao autorizar diretoria:", error)
        const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor"
        res.status(500).json({ error: errorMessage })
    }
}

export const reverterControladoria = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params

        // Somente nível 06 (controladoria) pode reverter
        if (req.usuario?.nivel !== "06") {
            res.status(403).json({ error: "Apenas a controladoria pode reverter" })
            return
        }

        const autorizacao = await autorizacaoCompraService.reverterControladoria(
            Number.parseInt(id),
        )
        res.json(autorizacao)
    } catch (error) {
        console.error("Erro ao reverter autorização:", error)
        const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor"
        res.status(500).json({ error: errorMessage })
    }
}

export const obterAutorizacao = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const autorizacao = await autorizacaoCompraService.obterAutorizacao(Number.parseInt(id))

        if (!autorizacao) {
            res.status(404).json({ error: "Autorização não encontrada" })
            return
        }

        res.json(autorizacao)
    } catch (error) {
        console.error("Erro ao obter autorização:", error)
        res.status(500).json({ error: "Erro interno do servidor" })
    }
}

export const atualizarAutorizacao = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const usuario = req.usuario?.usuario

        if (!usuario) {
            res.status(401).json({ error: "Usuário não autenticado" })
            return
        }

        const autorizacaoExistente = await autorizacaoCompraService.obterAutorizacao(Number.parseInt(id))

        if (!autorizacaoExistente) {
            res.status(404).json({ error: "Autorização não encontrada" })
            return
        }

        // Somente o usuário que criou pode editar e apenas se ainda não houve liberação
        if (
            autorizacaoExistente.usuario !== usuario ||
            autorizacaoExistente.autorizado_controladoria ||
            autorizacaoExistente.autorizado_diretoria
        ) {
            res.status(403).json({ error: "Sem permissão para editar esta autorização" })
            return
        }

        const autorizacao = await autorizacaoCompraService.atualizarAutorizacao(Number.parseInt(id), req.body)
        res.json(autorizacao)
    } catch (error) {
        console.error("Erro ao atualizar autorização:", error)
        const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor"
        res.status(500).json({ error: errorMessage })
    }
}

export const excluirAutorizacao = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const usuario = req.usuario?.usuario

        if (!usuario) {
            res.status(401).json({ error: "Usuário não autenticado" })
            return
        }

        const sucesso = await autorizacaoCompraService.excluirAutorizacao(Number.parseInt(id), usuario)

        if (!sucesso) {
            res.status(404).json({ error: "Autorização não encontrada ou sem permissão" })
            return
        }

        res.json({ message: "Autorização excluída com sucesso" })
    } catch (error) {
        console.error("Erro ao excluir autorização:", error)
        res.status(500).json({ error: "Erro interno do servidor" })
    }
}
