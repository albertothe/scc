import type { Request, Response } from "express"
import * as acessoService from "../services/controleAcessoService"

export const listarModulos = async (req: Request, res: Response): Promise<void> => {
    try {
        const modulos = await acessoService.getModulos()
        res.json(modulos)
    } catch (error) {
        console.error("Erro ao listar módulos:", error)
        res.status(500).json({ error: "Erro ao listar módulos" })
    }
}

export const criarModulo = async (req: Request, res: Response): Promise<void> => {
    try {
        const modulo = await acessoService.criarModulo(req.body)
        res.status(201).json(modulo)
    } catch (error) {
        console.error("Erro ao criar módulo:", error)
        res.status(500).json({ error: "Erro ao criar módulo" })
    }
}

export const atualizarModulo = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number.parseInt(req.params.id, 10)
        const modulo = await acessoService.atualizarModulo(id, req.body)
        res.json(modulo)
    } catch (error) {
        console.error("Erro ao atualizar módulo:", error)
        res.status(500).json({ error: "Erro ao atualizar módulo" })
    }
}

export const excluirModulo = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number.parseInt(req.params.id, 10)
        const sucesso = await acessoService.excluirModulo(id)
        if (sucesso) {
            res.json({ message: "Módulo excluído" })
        } else {
            res.status(404).json({ error: "Módulo não encontrado" })
        }
    } catch (error) {
        console.error("Erro ao excluir módulo:", error)
        res.status(500).json({ error: "Erro ao excluir módulo" })
    }
}

export const listarNiveis = async (req: Request, res: Response): Promise<void> => {
    try {
        const niveis = await acessoService.getNiveisAcesso()
        res.json(niveis)
    } catch (error) {
        console.error("Erro ao listar níveis:", error)
        res.status(500).json({ error: "Erro ao listar níveis" })
    }
}

export const criarNivel = async (req: Request, res: Response): Promise<void> => {
    try {
        const nivel = await acessoService.criarNivelAcesso(req.body)
        res.status(201).json(nivel)
    } catch (error) {
        console.error("Erro ao criar nível:", error)
        res.status(500).json({ error: "Erro ao criar nível" })
    }
}

export const atualizarNivel = async (req: Request, res: Response): Promise<void> => {
    try {
        const codigo = req.params.codigo
        const nivel = await acessoService.atualizarNivelAcesso(codigo, req.body)
        res.json(nivel)
    } catch (error) {
        console.error("Erro ao atualizar nível:", error)
        res.status(500).json({ error: "Erro ao atualizar nível" })
    }
}

export const excluirNivel = async (req: Request, res: Response): Promise<void> => {
    try {
        const codigo = req.params.codigo
        const sucesso = await acessoService.excluirNivelAcesso(codigo)
        if (sucesso) {
            res.json({ message: "Nível excluído" })
        } else {
            res.status(404).json({ error: "Nível não encontrado" })
        }
    } catch (error) {
        console.error("Erro ao excluir nível:", error)
        res.status(500).json({ error: "Erro ao excluir nível" })
    }
}

export const listarPermissoes = async (req: Request, res: Response): Promise<void> => {
    try {
        const codigo = req.params.codigo
        const permissoes = await acessoService.getPermissoesNivel(codigo)
        res.json(permissoes)
    } catch (error) {
        console.error("Erro ao listar permissões:", error)
        res.status(500).json({ error: "Erro ao listar permissões" })
    }
}

export const salvarPermissoes = async (req: Request, res: Response): Promise<void> => {
    try {
        const codigo = req.params.codigo
        const permissoes = Array.isArray(req.body) ? req.body : null
        if (!permissoes) {
            res.status(400).json({ error: "Formato de permissões inválido" })
            return
        }
        await acessoService.salvarPermissoesNivel(codigo, permissoes)
        res.json({ message: "Permissões salvas" })
    } catch (error) {
        console.error("Erro ao salvar permissões:", error)
        res.status(500).json({ error: "Erro ao salvar permissões" })
    }
}
