import api from "./api"
import type { AtivoHelpDesk, ChamadoHelpDesk, ChamadoHelpDeskDetalhado, InteracaoChamado } from "../types"

export interface ListarChamadosParams {
  status?: string
  prioridade?: string
  responsavel?: string
  busca?: string
}

export interface ListarAtivosParams {
  status?: string
  tipo?: string
  busca?: string
}

export const listarChamados = async (params?: ListarChamadosParams): Promise<ChamadoHelpDesk[]> => {
  const response = await api.get("/help-desk/chamados", { params })
  return response.data
}

export const obterChamado = async (id: number): Promise<ChamadoHelpDeskDetalhado> => {
  const response = await api.get(`/help-desk/chamados/${id}`)
  return response.data
}

export const criarChamado = async (payload: Partial<ChamadoHelpDesk>): Promise<ChamadoHelpDeskDetalhado> => {
  const response = await api.post("/help-desk/chamados", payload)
  return response.data
}

export const atualizarChamado = async (id: number, payload: Partial<ChamadoHelpDesk>): Promise<ChamadoHelpDesk> => {
  const response = await api.put(`/help-desk/chamados/${id}`, payload)
  return response.data
}

export const adicionarInteracao = async (
  idChamado: number,
  payload: Partial<InteracaoChamado>,
): Promise<InteracaoChamado> => {
  const response = await api.post(`/help-desk/chamados/${idChamado}/interacoes`, payload)
  return response.data
}

export const listarAtivos = async (params?: ListarAtivosParams): Promise<AtivoHelpDesk[]> => {
  const response = await api.get("/help-desk/ativos", { params })
  return response.data
}

export const criarAtivo = async (payload: Partial<AtivoHelpDesk>): Promise<AtivoHelpDesk> => {
  const response = await api.post("/help-desk/ativos", payload)
  return response.data
}
