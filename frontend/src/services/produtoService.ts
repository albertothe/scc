import api from "./api"
import type { Produto } from "../types"

// Função auxiliar para lidar com erros de API
const handleApiError = (error: any, message: string) => {
  console.error(`${message}:`, error)

  // Se for um erro de timeout, forneça uma mensagem mais específica
  if (error.code === "ECONNABORTED") {
    throw new Error("Tempo limite de conexão excedido. Verifique sua conexão com a internet.")
  }

  // Se for um erro de resposta do servidor, forneça detalhes
  if (error.response) {
    throw new Error(`Erro ${error.response.status}: ${error.response.data?.error || "Erro desconhecido"}`)
  }

  // Para outros erros, apenas repasse
  throw error
}

export const getProdutos = async (mesAno: string): Promise<Produto[]> => {
  try {
    console.log("Frontend - Consultando produtos para mesAno:", mesAno)

    // Adicionar timeout para evitar espera infinita
    const response = await api.get("/produtos/fora", {
      params: { mesAno },
      timeout: 10000, // 10 segundos de timeout
    })

    console.log(`Frontend - Recebidos ${response.data.length} produtos`)

    if (response.data.length === 0) {
      console.log("Frontend - Nenhum produto recebido do backend")
    } else {
      console.log("Frontend - Primeiro produto recebido:", response.data[0])
    }

    // Converter produto para maiúsculas
    const produtos = response.data.map((produto: Produto) => ({
      ...produto,
      produto: produto.produto ? produto.produto.toUpperCase() : "",
    }))

    return produtos
  } catch (error) {
    console.error("Frontend - Erro ao consultar produtos:", error)
    throw error
  }
}

export const getProdutosEtiquetas = async (mesAno: string): Promise<Produto[]> => {
  try {
    console.log("Frontend - Consultando produtos etiquetas para mesAno:", mesAno)

    const response = await api.get("/produtos/etiquetas", {
      params: { mesAno },
      timeout: 10000,
    })

    console.log(`Frontend - Recebidos ${response.data.length} produtos etiquetas`)

    if (response.data.length === 0) {
      console.log("Frontend - Nenhum produto etiqueta recebido do backend")
    } else {
      console.log("Frontend - Primeiro produto etiqueta recebido:", response.data[0])
    }

    // Converter produto para maiúsculas
    const produtos = response.data.map((produto: Produto) => ({
      ...produto,
      produto: produto.produto ? produto.produto.toUpperCase() : "",
    }))

    return produtos
  } catch (error) {
    console.error("Frontend - Erro ao consultar produtos etiquetas:", error)
    throw error
  }
}

export const adicionarProdutoFora = async (codproduto: string, mesAno: string): Promise<void> => {
  try {
    await api.post("/produtos/fora", { codproduto, mesAno })
  } catch (error) {
    handleApiError(error, "Erro ao adicionar produto fora")
  }
}

export const removerProdutoFora = async (codproduto: string, mesAno: string): Promise<void> => {
  try {
    await api.delete(`/produtos/fora/${codproduto}/${mesAno}`)
  } catch (error) {
    handleApiError(error, "Erro ao remover produto fora")
  }
}

export const adicionarProdutoBandeira = async (codproduto: string, mesAno: string, etiqueta: string): Promise<void> => {
  try {
    await api.post("/produtos/etiqueta", { codproduto, mesAno, etiqueta })
  } catch (error) {
    handleApiError(error, "Erro ao adicionar produto com etiqueta")
  }
}

export const removerProdutoBandeira = async (codproduto: string, mesAno: string): Promise<void> => {
  try {
    await api.delete(`/produtos/etiqueta/${codproduto}/${mesAno}`)
  } catch (error) {
    handleApiError(error, "Erro ao remover produto com etiqueta")
  }
}

export const buscarProdutos = async (termo: string): Promise<Produto[]> => {
  try {
    const response = await api.get("/produtos/buscar", {
      params: { termo },
      timeout: 10000,
    })
    return response.data
  } catch (error) {
    handleApiError(error, "Erro ao buscar produtos")
    return []
  }
}

export const importarProdutosFora = async (
  codigos: string[],
  mesAno: string,
): Promise<{ success: string[]; errors: { codigo: string; motivo: string }[] }> => {
  try {
    const response = await api.post("/produtos/fora/importar", { codigos, mesAno })
    return response.data
  } catch (error) {
    handleApiError(error, "Erro ao importar produtos fora")
    // Esta linha nunca será executada devido ao throw no handleApiError, mas é necessária para o TypeScript
    return { success: [], errors: [{ codigo: "", motivo: "Erro desconhecido" }] }
  }
}

export const importarProdutosEtiquetas = async (
  produtos: { codproduto: string; etiqueta: string }[],
  mesAno: string,
): Promise<{ success: string[]; errors: { codigo: string; motivo: string }[] }> => {
  try {
    const response = await api.post("/produtos/etiqueta/importar", { produtos, mesAno })
    return response.data
  } catch (error) {
    handleApiError(error, "Erro ao importar produtos com etiquetas")
    // Esta linha nunca será executada devido ao throw no handleApiError, mas é necessária para o TypeScript
    return { success: [], errors: [{ codigo: "", motivo: "Erro desconhecido" }] }
  }
}
