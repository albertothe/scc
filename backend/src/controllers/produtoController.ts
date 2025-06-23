import type { Request, Response } from "express"
import * as produtoService from "../services/produtoService"

export const getProdutosFora = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mesAno } = req.query
    if (!mesAno) {
      res.status(400).json({ error: "Parâmetro mesAno é obrigatório" })
      return
    }

    console.log("Backend - Controller recebeu requisição para mesAno:", mesAno)

    // Validar o formato da data
    const dataObj = new Date(mesAno as string)
    if (isNaN(dataObj.getTime())) {
      res.status(400).json({ error: "Formato de data inválido" })
      return
    }

    try {
      // Passar a data diretamente para o serviço
      const produtos = await produtoService.getProdutos(mesAno as string)
      console.log(`Backend - Controller retornando ${produtos.length} produtos`)
      res.json(produtos)
    } catch (error) {
      console.error("Backend - Erro ao buscar produtos fora:", error)
      res.status(500).json({ error: "Erro ao buscar produtos", details: (error as Error).message })
    }
  } catch (error) {
    console.error("Backend - Erro ao processar requisição:", error)
    res.status(500).json({ error: "Erro interno do servidor", details: (error as Error).message })
  }
}

export const getProdutosEtiquetas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mesAno } = req.query
    if (!mesAno) {
      res.status(400).json({ error: "Parâmetro mesAno é obrigatório" })
      return
    }

    console.log("Backend - Controller recebeu requisição para mesAno (etiquetas):", mesAno)

    // Validar o formato da data
    const dataObj = new Date(mesAno as string)
    if (isNaN(dataObj.getTime())) {
      res.status(400).json({ error: "Formato de data inválido" })
      return
    }

    // Passar a data diretamente para o serviço
    const produtos = await produtoService.getProdutosEtiquetas(mesAno as string)
    console.log(`Backend - Controller retornando ${produtos.length} produtos etiquetas`)
    res.json(produtos)
  } catch (error) {
    console.error("Backend - Erro ao buscar produtos etiquetas:", error)
    res.status(500).json({ error: "Erro ao buscar produtos", details: (error as Error).message })
  }
}

export const adicionarProdutoFora = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codproduto, mesAno } = req.body
    if (!codproduto || !mesAno) {
      res.status(400).json({ error: "Parâmetros codproduto e mesAno são obrigatórios" })
      return
    }

    // Formatar o código do produto para ter 5 caracteres
    const codFormatado = codproduto.padStart(5, "0")

    await produtoService.adicionarProdutoFora(codFormatado, mesAno)
    res.status(201).json({ message: "Produto adicionado com sucesso" })
  } catch (error) {
    console.error("Erro ao adicionar produto fora:", error)
    res.status(500).json({ error: "Erro ao adicionar produto", details: (error as Error).message })
  }
}

export const removerProdutoFora = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codproduto, mesAno } = req.params
    if (!codproduto || !mesAno) {
      res.status(400).json({ error: "Parâmetros codproduto e mesAno são obrigatórios" })
      return
    }
    await produtoService.removerProdutoFora(codproduto, mesAno)
    res.json({ message: "Produto removido com sucesso" })
  } catch (error) {
    console.error("Erro ao remover produto fora:", error)
    res.status(500).json({ error: "Erro ao remover produto", details: (error as Error).message })
  }
}

export const adicionarProdutoBandeira = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codproduto, mesAno, etiqueta } = req.body
    if (!codproduto || !mesAno || !etiqueta) {
      res.status(400).json({ error: "Parâmetros codproduto, mesAno e etiqueta são obrigatórios" })
      return
    }

    // Formatar o código do produto para ter 5 caracteres
    const codFormatado = codproduto.padStart(5, "0")

    // Validar a etiqueta
    const etiquetaFormatada = etiqueta.toLowerCase()
    if (etiquetaFormatada !== "verde" && etiquetaFormatada !== "vermelha") {
      res.status(400).json({ error: "Etiqueta deve ser 'verde' ou 'vermelha'" })
      return
    }

    await produtoService.adicionarProdutoBandeira(codFormatado, mesAno, etiquetaFormatada)
    res.status(201).json({ message: "Produto com etiqueta adicionado com sucesso" })
  } catch (error) {
    console.error("Erro ao adicionar produto etiqueta:", error)
    res.status(500).json({ error: "Erro ao adicionar produto", details: (error as Error).message })
  }
}

export const removerProdutoBandeira = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codproduto, mesAno } = req.params
    if (!codproduto || !mesAno) {
      res.status(400).json({ error: "Parâmetros codproduto e mesAno são obrigatórios" })
      return
    }
    await produtoService.removerProdutoBandeira(codproduto, mesAno)
    res.json({ message: "Produto com etiqueta removido com sucesso" })
  } catch (error) {
    console.error("Erro ao remover produto etiqueta:", error)
    res.status(500).json({ error: "Erro ao remover produto", details: (error as Error).message })
  }
}

export const buscarProdutos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { termo } = req.query
    if (!termo) {
      res.status(400).json({ error: "Parâmetro termo é obrigatório" })
      return
    }
    const produtos = await produtoService.buscarProdutos(termo as string)
    res.json(produtos)
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    res.status(500).json({ error: "Erro ao buscar produtos", details: (error as Error).message })
  }
}

// Novo endpoint para importação em lote
export const importarProdutosFora = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codigos, mesAno } = req.body
    if (!codigos || !Array.isArray(codigos) || !mesAno) {
      res.status(400).json({ error: "Parâmetros codigos (array) e mesAno são obrigatórios" })
      return
    }

    // Formatar os códigos de produto para terem 5 caracteres
    const codigosFormatados = codigos.map((codigo) => codigo.padStart(5, "0"))

    const resultado = await produtoService.importarProdutosFora(codigosFormatados, mesAno)
    res.status(200).json(resultado)
  } catch (error) {
    console.error("Erro ao importar produtos:", error)
    res.status(500).json({ error: "Erro ao importar produtos", details: (error as Error).message })
  }
}

// Novo endpoint para importação de produtos com etiquetas em lote
export const importarProdutosEtiquetas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { produtos, mesAno } = req.body
    if (!produtos || !Array.isArray(produtos) || !mesAno) {
      res.status(400).json({ error: "Parâmetros produtos (array) e mesAno são obrigatórios" })
      return
    }

    // Validar e formatar cada produto
    const produtosFormatados = produtos.map((item) => {
      // Formatar o código do produto para ter 5 caracteres
      const codFormatado = item.codproduto.padStart(5, "0")

      // Garantir que a etiqueta esteja em minúsculas
      let etiqueta = item.etiqueta.toLowerCase()

      // Validar a etiqueta
      if (etiqueta !== "verde" && etiqueta !== "vermelha") {
        etiqueta = "verde" // Valor padrão
      }

      return {
        codproduto: codFormatado,
        etiqueta: etiqueta,
      }
    })

    const resultado = await produtoService.importarProdutosEtiquetas(produtosFormatados, mesAno)
    res.status(200).json(resultado)
  } catch (error) {
    console.error("Erro ao importar produtos com etiquetas:", error)
    res.status(500).json({ error: "Erro ao importar produtos com etiquetas", details: (error as Error).message })
  }
}
