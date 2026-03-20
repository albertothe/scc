import type { Request, Response } from "express"
import { HelpDeskService } from "../services/helpDeskService"

const helpDeskService = new HelpDeskService()

export const listarChamados = async (req: Request, res: Response): Promise<void> => {
  try {
    const chamados = await helpDeskService.listarChamados({
      status: req.query.status as string | undefined,
      prioridade: req.query.prioridade as string | undefined,
      responsavel: req.query.responsavel as string | undefined,
      busca: req.query.busca as string | undefined,
      nomeUsuario: req.usuario?.usuario,
      nivelUsuario: req.usuario?.nivel,
    })

    res.json(chamados)
  } catch (error) {
    console.error("Erro ao listar chamados:", error)
    res.status(500).json({ error: "Erro ao listar chamados" })
  }
}

export const obterChamado = async (req: Request, res: Response): Promise<void> => {
  try {
    const chamado = await helpDeskService.obterChamado(Number(req.params.id), req.usuario)

    if (!chamado) {
      res.status(404).json({ error: "Chamado não encontrado" })
      return
    }

    res.json(chamado)
  } catch (error) {
    console.error("Erro ao obter chamado:", error)
    res.status(500).json({ error: "Erro ao obter chamado" })
  }
}

export const criarChamado = async (req: Request, res: Response): Promise<void> => {
  try {
    const novoChamado = await helpDeskService.criarChamado({
      ...req.body,
      nome_usuario_abertura: req.usuario?.usuario ?? req.body.nome_usuario_abertura,
    })

    res.status(201).json(novoChamado)
  } catch (error) {
    console.error("Erro ao criar chamado:", error)
    res.status(500).json({ error: "Erro ao criar chamado" })
  }
}

export const atualizarChamado = async (req: Request, res: Response): Promise<void> => {
  try {
    const permitido = await helpDeskService.usuarioPodeAcessarChamado(Number(req.params.id), req.usuario)

    if (!permitido) {
      res.status(403).json({ error: "Acesso negado ao chamado" })
      return
    }

    const chamado = await helpDeskService.atualizarChamado(Number(req.params.id), req.body)

    if (!chamado) {
      res.status(404).json({ error: "Chamado não encontrado" })
      return
    }

    res.json(chamado)
  } catch (error) {
    console.error("Erro ao atualizar chamado:", error)
    res.status(500).json({ error: "Erro ao atualizar chamado" })
  }
}

export const adicionarInteracao = async (req: Request, res: Response): Promise<void> => {
  try {
    const permitido = await helpDeskService.usuarioPodeAcessarChamado(Number(req.params.id), req.usuario)

    if (!permitido) {
      res.status(403).json({ error: "Acesso negado ao chamado" })
      return
    }

    const interacao = await helpDeskService.adicionarInteracao({
      ...req.body,
      id_chamado: Number(req.params.id),
      nome_usuario: req.usuario?.usuario ?? req.body.nome_usuario,
    })

    res.status(201).json(interacao)
  } catch (error) {
    console.error("Erro ao adicionar interação:", error)
    res.status(500).json({ error: "Erro ao adicionar interação" })
  }
}

export const listarAtivos = async (req: Request, res: Response): Promise<void> => {
  try {
    const ativos = await helpDeskService.listarAtivos({
      status: req.query.status as string | undefined,
      tipo: req.query.tipo as string | undefined,
      busca: req.query.busca as string | undefined,
    })

    res.json(ativos)
  } catch (error) {
    console.error("Erro ao listar ativos:", error)
    res.status(500).json({ error: "Erro ao listar ativos" })
  }
}

export const criarAtivo = async (req: Request, res: Response): Promise<void> => {
  try {
    const ativo = await helpDeskService.criarAtivo(req.body)
    res.status(201).json(ativo)
  } catch (error) {
    console.error("Erro ao criar ativo:", error)
    res.status(500).json({ error: "Erro ao criar ativo" })
  }
}

export const atualizarAtivo = async (req: Request, res: Response): Promise<void> => {
  try {
    const ativo = await helpDeskService.atualizarAtivo(Number(req.params.id), req.body)

    if (!ativo) {
      res.status(404).json({ error: "Ativo não encontrado" })
      return
    }

    res.json(ativo)
  } catch (error) {
    console.error("Erro ao atualizar ativo:", error)
    res.status(500).json({ error: "Erro ao atualizar ativo" })
  }
}

export const excluirAtivo = async (req: Request, res: Response): Promise<void> => {
  try {
    const excluido = await helpDeskService.excluirAtivo(Number(req.params.id))

    if (!excluido) {
      res.status(404).json({ error: "Ativo não encontrado" })
      return
    }

    res.status(204).send()
  } catch (error) {
    console.error("Erro ao excluir ativo:", error)
    res.status(500).json({ error: "Erro ao excluir ativo" })
  }
}

export const listarLojas = async (_req: Request, res: Response): Promise<void> => {
  try {
    const lojas = await helpDeskService.listarLojas()
    res.json(lojas)
  } catch (error) {
    console.error("Erro ao listar lojas do help desk:", error)
    res.status(500).json({ error: "Erro ao listar lojas" })
  }
}
