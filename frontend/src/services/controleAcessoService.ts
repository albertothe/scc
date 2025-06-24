import api from "./api"
import type { Modulo, NivelAcesso, PermissaoNivel } from "../types"

export const getModulos = async (): Promise<Modulo[]> => {
  const response = await api.get("/controle-acesso/modulos")
  return response.data
}

export const criarModulo = async (modulo: Omit<Modulo, "id">): Promise<Modulo> => {
  const response = await api.post("/controle-acesso/modulos", modulo)
  return response.data
}

export const atualizarModulo = async (id: number, modulo: Partial<Modulo>): Promise<Modulo> => {
  const response = await api.put(`/controle-acesso/modulos/${id}`, modulo)
  return response.data
}

export const excluirModulo = async (id: number): Promise<void> => {
  await api.delete(`/controle-acesso/modulos/${id}`)
}

export const getNiveis = async (): Promise<NivelAcesso[]> => {
  const response = await api.get("/controle-acesso/niveis")
  return response.data
}

export const criarNivel = async (nivel: NivelAcesso): Promise<NivelAcesso> => {
  const response = await api.post("/controle-acesso/niveis", nivel)
  return response.data
}

export const atualizarNivel = async (codigo: string, nivel: Partial<NivelAcesso>): Promise<NivelAcesso> => {
  const response = await api.put(`/controle-acesso/niveis/${codigo}`, nivel)
  return response.data
}

export const excluirNivel = async (codigo: string): Promise<void> => {
  await api.delete(`/controle-acesso/niveis/${codigo}`)
}

export const getPermissoes = async (codigo: string): Promise<PermissaoNivel[]> => {
  const response = await api.get(`/controle-acesso/permissoes/${codigo}`)
  return response.data
}

export const salvarPermissoes = async (codigo: string, permissoes: PermissaoNivel[]): Promise<void> => {
  await api.put(`/controle-acesso/permissoes/${codigo}`, permissoes)
}
