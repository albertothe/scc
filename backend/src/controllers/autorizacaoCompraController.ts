import type { Request, Response } from "express"
import { AutorizacaoCompraService } from "../services/autorizacaoCompraService"

const autorizacaoCompraService = new AutorizacaoCompraService()

export const criarAutorizacao = async (req: Request, res: Response): Promise<void> => {
    try {
        const autorizacao = {
            ...req.body,
            usuario: req.user?.usuario, // Pega o usuário do token
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
        const usuario = req.user?.usuario
        const nivel = req.user?.nivel

        if (!usuario || !nivel) {
            res.status(401).json({ error: "Usuário não autenticado" })
            return
        }

        const autorizacoes = await autorizacaoCompraService.listarAutorizacoes(usuario, nivel)
        res.json(autorizacoes)
    } catch (error) {
        console.error("Erro ao listar autorizações:", error)
        res.status(500).json({ error: "Erro interno do servidor" })
    }
}

export const autorizarControladoria = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const usuarioControladoria = req.user?.usuario

        // Verificar se o usuário tem nível 06 (controladoria)
        if (req.user?.nivel !== "06") {
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
        const usuarioDiretoria = req.user?.usuario

        // Verificar se o usuário tem nível 00 (diretoria)
        if (req.user?.nivel !== "00") {
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
        const usuario = req.user?.usuario
        const nivel = req.user?.nivel

        if (!usuario || !nivel) {
            res.status(401).json({ error: "Usuário não autenticado" })
            return
        }

        // Verificar se pode editar (só o próprio usuário ou níveis 00/06)
        if (nivel !== "00" && nivel !== "06") {
            // Verificar se é o próprio usuário que criou
            const autorizacaoExistente = await autorizacaoCompraService.obterAutorizacao(Number.parseInt(id))
            if (!autorizacaoExistente || autorizacaoExistente.usuario !== usuario) {
                res.status(403).json({ error: "Sem permissão para editar esta autorização" })
                return
            }
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
        const usuario = req.user?.usuario
        const nivel = req.user?.nivel

        if (!usuario || !nivel) {
            res.status(401).json({ error: "Usuário não autenticado" })
            return
        }

        const sucesso = await autorizacaoCompraService.excluirAutorizacao(Number.parseInt(id), usuario, nivel)

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
