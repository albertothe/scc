import api from "./api"
import type { Vendedor, Loja, ComissaoVendedor } from "../types"

export const getVendedores = async (): Promise<Vendedor[]> => {
  const response = await api.get("/comissoes-vendedores/vendedores")
  return response.data
}

export const getLojas = async (): Promise<Loja[]> => {
  const response = await api.get("/comissoes-vendedores/lojas")
  return response.data
}

export const getComissoesVendedores = async (): Promise<ComissaoVendedor[]> => {
  const response = await api.get("/comissoes-vendedores")
  return response.data
}

export const criarComissaoVendedor = async (
  comissao: Omit<ComissaoVendedor, "id">
): Promise<ComissaoVendedor> => {
  const response = await api.post("/comissoes-vendedores", comissao)
  return response.data
}

export const atualizarComissaoVendedor = async (
  id: number,
  comissao: Omit<ComissaoVendedor, "id">
): Promise<ComissaoVendedor> => {
  const response = await api.put(`/comissoes-vendedores/${id}`, comissao)
  return response.data
}

export const excluirComissaoVendedor = async (id: number): Promise<void> => {
  await api.delete(`/comissoes-vendedores/${id}`)
}

export const getComissaoVendedor = async (id: number): Promise<ComissaoVendedor> => {
  const response = await api.get(`/comissoes-vendedores/${id}`)
  return response.data
}

