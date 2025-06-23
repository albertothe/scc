import api from "./api"
import type { ComissaoRangeCompleta } from "../types"

// Obter todas as faixas de comissão
export const getFaixasComissao = async (): Promise<ComissaoRangeCompleta[]> => {
    try {
        const response = await api.get("/comissoes")
        return response.data
    } catch (error) {
        console.error("Erro ao buscar faixas de comissão:", error)
        throw error
    }
}

// Obter uma faixa específica
export const getFaixaComissao = async (id: number): Promise<ComissaoRangeCompleta> => {
    try {
        const response = await api.get(`/comissoes/${id}`)
        return response.data
    } catch (error) {
        console.error(`Erro ao buscar faixa de comissão com ID ${id}:`, error)
        throw error
    }
}

// Criar uma nova faixa de comissão
export const criarFaixaComissao = async (
    faixa: Omit<ComissaoRangeCompleta, "id" | "percentuais"> & { percentuais: Omit<any, "id" | "id_range">[] },
): Promise<ComissaoRangeCompleta> => {
    try {
        const response = await api.post("/comissoes", faixa)
        return response.data
    } catch (error) {
        console.error("Erro ao criar faixa de comissão:", error)
        throw error
    }
}

// Atualizar uma faixa existente
export const atualizarFaixaComissao = async (
    id: number,
    faixa: Omit<ComissaoRangeCompleta, "id">,
): Promise<ComissaoRangeCompleta> => {
    try {
        const response = await api.put(`/comissoes/${id}`, faixa)
        return response.data
    } catch (error) {
        console.error(`Erro ao atualizar faixa de comissão com ID ${id}:`, error)
        throw error
    }
}

// Excluir uma faixa
export const excluirFaixaComissao = async (id: number): Promise<void> => {
    try {
        await api.delete(`/comissoes/${id}`)
    } catch (error) {
        console.error(`Erro ao excluir faixa de comissão com ID ${id}:`, error)
        throw error
    }
}

// Excluir um percentual específico
export const excluirPercentual = async (id: number): Promise<void> => {
    try {
        await api.delete(`/comissoes/percentual/${id}`)
    } catch (error) {
        console.error(`Erro ao excluir percentual com ID ${id}:`, error)
        throw error
    }
}
