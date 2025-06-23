import api from "./api"
import type { ProdutoPromocao } from "../types"

// Função para buscar todos os produtos em promoção
export const getProdutosPromocao = async (): Promise<ProdutoPromocao[]> => {
    try {
        const response = await api.get("/promocoes", { timeout: 10000 })

        // Converter produto para maiúsculas
        const produtos = response.data.map((produto: ProdutoPromocao) => ({
            ...produto,
            produto: produto.produto ? produto.produto.toUpperCase() : "",
        }))

        return produtos
    } catch (error) {
        console.error("Erro ao buscar produtos em promoção:", error)
        throw error
    }
}

// Função para buscar produtos em promoção por termo
export const buscarProdutosPromocao = async (termo: string): Promise<ProdutoPromocao[]> => {
    try {
        const response = await api.get("/promocoes/buscar", {
            params: { termo },
            timeout: 10000,
        })

        // Converter produto para maiúsculas
        const produtos = response.data.map((produto: ProdutoPromocao) => ({
            ...produto,
            produto: produto.produto ? produto.produto.toUpperCase() : "",
        }))

        return produtos
    } catch (error) {
        console.error("Erro ao buscar produtos em promoção:", error)
        throw error
    }
}

// Nova função para importar produtos em promoção
export const importarProdutosPromocao = async (
    produtos: {
        codproduto: string
        codloja: string
        tabela: string
        valor_promocao: number
        data_validade: string
    }[],
): Promise<{
    success: string[]
    errors: { codigo: string; motivo: string }[]
}> => {
    try {
        const response = await api.post("/promocoes/importar", { produtos }, { timeout: 30000 })
        return response.data
    } catch (error) {
        console.error("Erro ao importar produtos em promoção:", error)
        throw error
    }
}
