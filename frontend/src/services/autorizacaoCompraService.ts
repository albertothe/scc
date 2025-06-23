import api from "./api"
import type { AutorizacaoCompra } from "../types"

export const getAutorizacoes = async (usuarioId?: number): Promise<AutorizacaoCompra[]> => {
    const response = await api.get("/autorizacao-compra", {
        params: { usuarioId },
    })
    return response.data
}

export const listarAutorizacoes = async (): Promise<AutorizacaoCompra[]> => {
    const response = await api.get("/autorizacao-compra")
    return response.data
}

export const getAutorizacao = async (id: number): Promise<AutorizacaoCompra> => {
    const response = await api.get(`/autorizacao-compra/${id}`)
    return response.data
}

export const obterAutorizacao = async (id: number): Promise<AutorizacaoCompra> => {
    const response = await api.get(`/autorizacao-compra/${id}`)
    return response.data
}

export const criarAutorizacao = async (
    autorizacao: Omit<AutorizacaoCompra, "id" | "data_criacao" | "hora_criacao">,
): Promise<AutorizacaoCompra> => {
    const response = await api.post("/autorizacao-compra", autorizacao)
    return response.data
}

export const atualizarAutorizacao = async (
    id: number,
    autorizacao: Partial<AutorizacaoCompra>,
): Promise<AutorizacaoCompra> => {
    const response = await api.put(`/autorizacao-compra/${id}`, autorizacao)
    return response.data
}

export const excluirAutorizacao = async (id: number): Promise<void> => {
    await api.delete(`/autorizacao-compra/${id}`)
}

export const autorizarControladoria = async (id: number): Promise<AutorizacaoCompra> => {
    const response = await api.put(`/autorizacao-compra/${id}/autorizar-controladoria`)
    return response.data
}

export const reverterControladoria = async (id: number): Promise<AutorizacaoCompra> => {
    const response = await api.put(`/autorizacao-compra/${id}/reverter-controladoria`)
    return response.data
}

export const autorizarDiretoria = async (id: number): Promise<AutorizacaoCompra> => {
    const response = await api.put(`/autorizacao-compra/${id}/autorizar-diretoria`)
    return response.data
}
