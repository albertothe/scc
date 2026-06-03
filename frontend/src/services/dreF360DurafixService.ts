import api from "./api"
import type { DreF360Registro } from "../types"

interface DreF360Filtros {
  ano?: string
  mes?: string
  codloja?: string
  descricao?: string
}

export const getDreF360Durafix = async (filtros: DreF360Filtros): Promise<DreF360Registro[]> => {
  const response = await api.get("/dre-f360-durafix", { params: filtros })
  return response.data
}

export const getLojasF360Durafix = async (): Promise<string[]> => {
  const response = await api.get("/dre-f360-durafix/lojas")
  return response.data
}

export const atualizarDreF360Durafix = async (
  sequencial: string,
  codloja: string,
  payload: { ano: number; mes: number; realizado: number | null; orcado: number | null },
): Promise<void> => {
  await api.put(`/dre-f360-durafix/${encodeURIComponent(sequencial)}/${codloja}/${payload.ano}/${payload.mes}`, payload)
}
