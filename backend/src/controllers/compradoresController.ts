import type { Request, Response } from "express"
import * as service from "../services/compradoresService"

export const getCompradores = async (_: Request, res: Response) => res.json(await service.getCompradores())
export const criarComprador = async (req: Request, res: Response) => res.status(201).json(await service.criarComprador(req.body.nome, req.body.ativo))
export const atualizarComprador = async (req: Request, res: Response) => res.json(await service.atualizarComprador(Number(req.params.id), req.body.nome, req.body.ativo))
export const excluirComprador = async (req: Request, res: Response) => res.json({ sucesso: await service.excluirComprador(Number(req.params.id)) })

export const getCompradorGrupo = async (_: Request, res: Response) => res.json(await service.getCompradorGrupo())
export const criarCompradorGrupo = async (req: Request, res: Response) => res.status(201).json(await service.criarCompradorGrupo(req.body.codgrp, req.body.comprador_id, req.body.dt_inicio))
export const atualizarCompradorGrupo = async (req: Request, res: Response) => res.json(await service.atualizarCompradorGrupo(Number(req.params.id), req.body.codgrp, req.body.comprador_id, req.body.dt_inicio, req.body.dt_fim))
export const excluirCompradorGrupo = async (req: Request, res: Response) => res.json({ sucesso: await service.excluirCompradorGrupo(Number(req.params.id)) })

export const getMetasCompradores = async (req: Request, res: Response) => {
  const ano = req.query.ano ? Number(req.query.ano) : undefined
  const mes = req.query.mes ? Number(req.query.mes) : undefined
  const comprador_id = req.query.comprador_id ? Number(req.query.comprador_id) : undefined
  res.json(await service.getMetasCompradores({ ano, mes, comprador_id }))
}
export const criarMetaComprador = async (req: Request, res: Response) => res.status(201).json(await service.criarMetaComprador(req.body))
export const atualizarMetaComprador = async (req: Request, res: Response) => res.json(await service.atualizarMetaComprador(Number(req.params.id), req.body))
export const excluirMetaComprador = async (req: Request, res: Response) => res.json({ sucesso: await service.excluirMetaComprador(Number(req.params.id)) })
