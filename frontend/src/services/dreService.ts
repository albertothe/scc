import api from "./api"
import type { DreRegistro } from "../types"

interface DreFiltros {
  ano?: string
  mes?: string
  descricao?: string
}

export const getDre = async (filtros: DreFiltros): Promise<DreRegistro[]> => {
  const response = await api.get("/dre", { params: filtros })
  return response.data
}

export const atualizarDre = async (
  sequencial: number,
  payload: { ano: number; mes: number; realizado: number | null; orcado: number | null },
): Promise<void> => {
  const { ano, mes, ...dados } = payload
  await api.put(`/dre/${sequencial}/${ano}/${mes}`, dados)
}
