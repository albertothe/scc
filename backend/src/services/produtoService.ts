import pool from "../config/database"
import type { Produto } from "../models/Produto"

export const getProdutos = async (mesAno: string): Promise<Produto[]> => {
  try {
    // Extrair o ano e mês diretamente da string da data
    // Formato esperado: YYYY-MM-DD
    const [ano, mes] = mesAno.split("-")

    // Formato YYYY-MM para comparação
    const anoMes = `${ano}-${mes}`

    console.log(`Backend - Consultando produtos para: AnoMes=${anoMes} (Ano=${ano}, Mês=${mes})`)

    // Verificar se existem produtos na tabela
    const checkQuery = `SELECT COUNT(*) FROM pwb_produto_fora`
    const checkResult = await pool.query(checkQuery)
    console.log(`Backend - Total de produtos na tabela pwb_produto_fora: ${checkResult.rows[0].count}`)

    // Verificar se existem produtos para qualquer mês/ano
    const checkAnyQuery = `
      SELECT 
        TO_CHAR(mes_ano, 'YYYY-MM') as mes_ano, 
        COUNT(*) 
      FROM pwb_produto_fora 
      GROUP BY TO_CHAR(mes_ano, 'YYYY-MM')
      ORDER BY mes_ano
    `
    const checkAnyResult = await pool.query(checkAnyQuery)
    console.log("Backend - Produtos por mês/ano:", checkAnyResult.rows)

    // Consulta simplificada que retorna apenas produtos para o mês/ano específico
    const query = `
      SELECT 
        p.*, 
        TO_CHAR(f.mes_ano, 'DD/MM/YYYY') as data_competencia,
        f.mes_ano as data_original
      FROM pwb_produto_fora f
      LEFT JOIN vs_pwb_dprodutos p ON f.codproduto = p.codproduto
      WHERE TO_CHAR(f.mes_ano, 'YYYY-MM') = $1
      ORDER BY COALESCE(p.produto, f.codproduto)
    `

    // Executar a consulta com o parâmetro ano-mês
    const result = await pool.query(query, [anoMes])
    console.log(`Backend - Encontrados ${result.rows.length} produtos para AnoMes=${anoMes}`)

    // Log detalhado para depuração
    if (result.rows.length > 0) {
      console.log("Backend - Primeiro produto encontrado:", result.rows[0].codproduto, result.rows[0].produto)
      console.log("Backend - Data original do primeiro produto:", result.rows[0].data_original)
      console.log("Backend - Data formatada do primeiro produto:", result.rows[0].data_competencia)

      // Converter produto para maiúsculas e garantir que todos os campos necessários existam
      result.rows = result.rows.map((row) => ({
        ...row,
        produto: row.produto ? row.produto.toUpperCase() : `Produto ${row.codproduto}`,
        unidade: row.unidade || "UN",
        status: row.status || "ATIVO",
      }))
    } else {
      console.log("Backend - Nenhum produto encontrado para este mês/ano")
    }

    return result.rows
  } catch (error) {
    console.error("Backend - Erro na consulta SQL:", error)
    throw error
  }
}

export const getProdutosEtiquetas = async (mesAno: string): Promise<Produto[]> => {
  try {
    // Extrair o ano e mês diretamente da string da data
    // Formato esperado: YYYY-MM-DD
    const [ano, mes] = mesAno.split("-")

    // Formato YYYY-MM para comparação
    const anoMes = `${ano}-${mes}`

    console.log(`Backend - Consultando produtos etiquetas para: AnoMes=${anoMes} (Ano=${ano}, Mês=${mes})`)

    // Verificar se existem produtos na tabela
    const checkQuery = `SELECT COUNT(*) FROM pwb_produto_etiqueta`
    const checkResult = await pool.query(checkQuery)
    console.log(`Backend - Total de produtos na tabela pwb_produto_etiqueta: ${checkResult.rows[0].count}`)

    // Verificar se existem produtos para qualquer mês/ano
    const checkAnyQuery = `
      SELECT 
        TO_CHAR(mes_ano, 'YYYY-MM') as mes_ano, 
        COUNT(*) 
      FROM pwb_produto_etiqueta 
      GROUP BY TO_CHAR(mes_ano, 'YYYY-MM')
      ORDER BY mes_ano
    `
    const checkAnyResult = await pool.query(checkAnyQuery)
    console.log("Backend - Produtos etiquetas por mês/ano:", checkAnyResult.rows)

    // PROBLEMA IDENTIFICADO: A consulta original pode estar falhando na junção
    // Vamos modificar a consulta para usar LEFT JOIN e verificar se os produtos existem na tabela vs_pwb_dprodutos
    const query = `
      SELECT 
        p.*, 
        e.etiqueta, 
        TO_CHAR(e.mes_ano, 'DD/MM/YYYY') as data_competencia,
        e.mes_ano as data_original
      FROM pwb_produto_etiqueta e
      LEFT JOIN vs_pwb_dprodutos p ON e.codproduto = p.codproduto
      WHERE TO_CHAR(e.mes_ano, 'YYYY-MM') = $1
      ORDER BY COALESCE(p.produto, e.codproduto)
    `

    // Executar a consulta com o parâmetro ano-mês
    const result = await pool.query(query, [anoMes])
    console.log(`Backend - Encontrados ${result.rows.length} produtos etiquetas para AnoMes=${anoMes}`)

    // Log detalhado para depuração
    if (result.rows.length > 0) {
      console.log("Backend - Primeiro produto etiqueta encontrado:", result.rows[0].codproduto, result.rows[0].produto)
      console.log("Backend - Data original do primeiro produto:", result.rows[0].data_original)
      console.log("Backend - Data formatada do primeiro produto:", result.rows[0].data_competencia)

      // Converter produto para maiúsculas e garantir que todos os campos necessários existam
      result.rows = result.rows.map((row) => ({
        ...row,
        produto: row.produto ? row.produto.toUpperCase() : `Produto ${row.codproduto}`,
        unidade: row.unidade || "UN",
        status: row.status || "ATIVO",
      }))
    } else {
      console.log("Backend - Nenhum produto etiqueta encontrado para este mês/ano")
    }

    return result.rows
  } catch (error) {
    console.error("Backend - Erro na consulta SQL:", error)
    throw error
  }
}

export const adicionarProdutoFora = async (codproduto: string, mesAno: string): Promise<void> => {
  try {
    // Extrair o ano e mês diretamente da string da data
    // Formato esperado: YYYY-MM-DD
    const [ano, mes, dia] = mesAno.split("-")

    // Formato YYYY-MM para comparação
    const anoMes = `${ano}-${mes}`

    // Data formatada para inserção (primeiro dia do mês)
    const dataFormatada = `${ano}-${mes}-01`

    console.log(`Backend - Adicionando produto ${codproduto} para data ${dataFormatada} (AnoMes=${anoMes})`)

    // Verificar se o produto já existe para esta competência
    const checkQuery = `
      SELECT COUNT(*) FROM pwb_produto_fora 
      WHERE codproduto = $1 
      AND TO_CHAR(mes_ano, 'YYYY-MM') = $2
    `
    const checkResult = await pool.query(checkQuery, [codproduto, anoMes])

    if (Number.parseInt(checkResult.rows[0].count) > 0) {
      throw new Error(`Produto ${codproduto} já existe para esta competência`)
    }

    // Verificar se o produto existe na tabela de produtos
    const checkProdutoQuery = `
      SELECT COUNT(*) FROM vs_pwb_dprodutos 
      WHERE codproduto = $1
    `
    const checkProdutoResult = await pool.query(checkProdutoQuery, [codproduto])

    if (Number.parseInt(checkProdutoResult.rows[0].count) === 0) {
      throw new Error(`Produto ${codproduto} não encontrado no cadastro`)
    }

    const query = "INSERT INTO pwb_produto_fora (codproduto, mes_ano) VALUES ($1, $2)"
    await pool.query(query, [codproduto, dataFormatada])
    console.log(`Backend - Produto ${codproduto} adicionado com sucesso para ${dataFormatada}`)
  } catch (error) {
    console.error("Backend - Erro ao adicionar produto:", error)
    throw error
  }
}

export const removerProdutoFora = async (codproduto: string, mesAno: string): Promise<void> => {
  try {
    // Extrair o ano e mês diretamente da string da data
    // Formato esperado: YYYY-MM-DD
    const [ano, mes] = mesAno.split("-")

    // Formato YYYY-MM para comparação
    const anoMes = `${ano}-${mes}`

    console.log(`Backend - Removendo produto ${codproduto} para AnoMes=${anoMes}`)

    const query = `
      DELETE FROM pwb_produto_fora 
      WHERE codproduto = $1 
      AND TO_CHAR(mes_ano, 'YYYY-MM') = $2
    `
    const result = await pool.query(query, [codproduto, anoMes])
    console.log(`Backend - Produto removido: ${result.rowCount} linhas afetadas`)
  } catch (error) {
    console.error("Backend - Erro ao remover produto:", error)
    throw error
  }
}

export const adicionarProdutoBandeira = async (codproduto: string, mesAno: string, etiqueta: string): Promise<void> => {
  try {
    // Extrair o ano e mês diretamente da string da data
    // Formato esperado: YYYY-MM-DD
    const [ano, mes] = mesAno.split("-")

    // Formato YYYY-MM para comparação
    const anoMes = `${ano}-${mes}`

    // Data formatada para inserção (primeiro dia do mês)
    const dataFormatada = `${ano}-${mes}-01`

    console.log(
      `Backend - Adicionando produto ${codproduto} com etiqueta ${etiqueta} para data ${dataFormatada} (AnoMes=${anoMes})`,
    )

    // Verificar se o produto já existe para esta competência
    const checkQuery = `
      SELECT COUNT(*) FROM pwb_produto_etiqueta 
      WHERE codproduto = $1 
      AND TO_CHAR(mes_ano, 'YYYY-MM') = $2
    `
    const checkResult = await pool.query(checkQuery, [codproduto, anoMes])

    if (Number.parseInt(checkResult.rows[0].count) > 0) {
      // Se já existe, atualiza a etiqueta
      const updateQuery = `
        UPDATE pwb_produto_etiqueta 
        SET etiqueta = $3 
        WHERE codproduto = $1 
        AND TO_CHAR(mes_ano, 'YYYY-MM') = $2
      `
      await pool.query(updateQuery, [codproduto, anoMes, etiqueta.toLowerCase()])
      console.log(`Backend - Etiqueta do produto ${codproduto} atualizada para ${etiqueta}`)
    } else {
      // Se não existe, insere novo registro
      const insertQuery = "INSERT INTO pwb_produto_etiqueta (codproduto, mes_ano, etiqueta) VALUES ($1, $2, $3)"
      await pool.query(insertQuery, [codproduto, dataFormatada, etiqueta.toLowerCase()])
      console.log(`Backend - Produto ${codproduto} com etiqueta ${etiqueta} adicionado com sucesso`)
    }
  } catch (error) {
    console.error("Backend - Erro ao adicionar/atualizar produto com etiqueta:", error)
    throw error
  }
}

export const removerProdutoBandeira = async (codproduto: string, mesAno: string): Promise<void> => {
  try {
    // Extrair o ano e mês diretamente da string da data
    // Formato esperado: YYYY-MM-DD
    const [ano, mes] = mesAno.split("-")

    // Formato YYYY-MM para comparação
    const anoMes = `${ano}-${mes}`

    console.log(`Backend - Removendo produto etiqueta ${codproduto} para AnoMes=${anoMes}`)

    const query = `
      DELETE FROM pwb_produto_etiqueta 
      WHERE codproduto = $1 
      AND TO_CHAR(mes_ano, 'YYYY-MM') = $2
    `
    const result = await pool.query(query, [codproduto, anoMes])
    console.log(`Backend - Produto etiqueta removido: ${result.rowCount} linhas afetadas`)
  } catch (error) {
    console.error("Backend - Erro ao remover produto etiqueta:", error)
    throw error
  }
}

export const buscarProdutos = async (termo: string): Promise<Produto[]> => {
  try {
    const query = `
      SELECT * FROM vs_pwb_dprodutos 
      WHERE codproduto LIKE $1 OR produto LIKE $1
      LIMIT 50
    `
    const result = await pool.query(query, [`%${termo}%`])

    // Converter produto para maiúsculas
    result.rows = result.rows.map((row) => ({
      ...row,
      produto: row.produto.toUpperCase(),
    }))

    return result.rows
  } catch (error) {
    console.error("Backend - Erro ao buscar produtos:", error)
    throw error
  }
}

// Nova função para importar produtos em lote
export const importarProdutosFora = async (
  codigos: string[],
  mesAno: string,
): Promise<{ success: string[]; errors: { codigo: string; motivo: string }[] }> => {
  try {
    // Extrair o ano e mês diretamente da string da data
    // Formato esperado: YYYY-MM-DD
    const [ano, mes] = mesAno.split("-")

    // Formato YYYY-MM para comparação
    const anoMes = `${ano}-${mes}`

    // Data formatada para inserção (primeiro dia do mês)
    const dataFormatada = `${ano}-${mes}-01`

    console.log(`Backend - Importando ${codigos.length} produtos para data ${dataFormatada} (AnoMes=${anoMes})`)

    const resultado = {
      success: [] as string[],
      errors: [] as { codigo: string; motivo: string }[],
    }

    // Iniciar uma transação
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      // Para cada código de produto
      for (const codigo of codigos) {
        try {
          // Verificar se o produto já existe para esta competência
          const checkQuery = `
            SELECT COUNT(*) FROM pwb_produto_fora 
            WHERE codproduto = $1 
            AND TO_CHAR(mes_ano, 'YYYY-MM') = $2
          `
          const checkResult = await client.query(checkQuery, [codigo, anoMes])

          if (Number.parseInt(checkResult.rows[0].count) > 0) {
            resultado.errors.push({
              codigo,
              motivo: "Produto já existe para esta competência",
            })
            continue
          }

          // Verificar se o produto existe na tabela de produtos
          const checkProdutoQuery = `
            SELECT COUNT(*) FROM vs_pwb_dprodutos 
            WHERE codproduto = $1
          `
          const checkProdutoResult = await client.query(checkProdutoQuery, [codigo])

          if (Number.parseInt(checkProdutoResult.rows[0].count) === 0) {
            resultado.errors.push({
              codigo,
              motivo: "Produto não encontrado no cadastro",
            })
            continue
          }

          // Inserir o produto
          const insertQuery = "INSERT INTO pwb_produto_fora (codproduto, mes_ano) VALUES ($1, $2)"
          await client.query(insertQuery, [codigo, dataFormatada])

          resultado.success.push(codigo)
        } catch (error) {
          console.error(`Backend - Erro ao processar produto ${codigo}:`, error)
          resultado.errors.push({
            codigo,
            motivo: "Erro interno ao processar produto",
          })
        }
      }

      await client.query("COMMIT")
      console.log(
        `Backend - Importação concluída: ${resultado.success.length} produtos importados com sucesso, ${resultado.errors.length} erros`,
      )
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Backend - Erro na transação de importação:", error)
      throw error
    } finally {
      client.release()
    }

    return resultado
  } catch (error) {
    console.error("Backend - Erro ao importar produtos:", error)
    throw error
  }
}

// Nova função para importar produtos com etiquetas em lote
export const importarProdutosEtiquetas = async (
  produtos: { codproduto: string; etiqueta: string }[],
  mesAno: string,
): Promise<{ success: string[]; errors: { codigo: string; motivo: string }[] }> => {
  try {
    // Extrair o ano e mês diretamente da string da data
    // Formato esperado: YYYY-MM-DD
    const [ano, mes] = mesAno.split("-")

    // Formato YYYY-MM para comparação
    const anoMes = `${ano}-${mes}`

    // Data formatada para inserção (primeiro dia do mês)
    const dataFormatada = `${ano}-${mes}-01`

    console.log(
      `Backend - Importando ${produtos.length} produtos com etiquetas para data ${dataFormatada} (AnoMes=${anoMes})`,
    )

    const resultado = {
      success: [] as string[],
      errors: [] as { codigo: string; motivo: string }[],
    }

    // Iniciar uma transação
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      // Para cada produto com etiqueta
      for (const produto of produtos) {
        try {
          const { codproduto, etiqueta } = produto

          // Verificar se o produto já existe para esta competência
          const checkQuery = `
            SELECT COUNT(*) FROM pwb_produto_etiqueta 
            WHERE codproduto = $1 
            AND TO_CHAR(mes_ano, 'YYYY-MM') = $2
          `
          const checkResult = await client.query(checkQuery, [codproduto, anoMes])

          if (Number.parseInt(checkResult.rows[0].count) > 0) {
            // Se já existe, atualiza a etiqueta
            const updateQuery = `
              UPDATE pwb_produto_etiqueta 
              SET etiqueta = $3 
              WHERE codproduto = $1 
              AND TO_CHAR(mes_ano, 'YYYY-MM') = $2
            `
            await client.query(updateQuery, [codproduto, anoMes, etiqueta])
            resultado.success.push(codproduto)
            continue
          }

          // Verificar se o produto existe na tabela de produtos
          const checkProdutoQuery = `
            SELECT COUNT(*) FROM vs_pwb_dprodutos 
            WHERE codproduto = $1
          `
          const checkProdutoResult = await pool.query(checkProdutoQuery, [codproduto])

          if (Number.parseInt(checkProdutoResult.rows[0].count) === 0) {
            resultado.errors.push({
              codigo: codproduto,
              motivo: "Produto não encontrado no cadastro",
            })
            continue
          }

          // Inserir o produto com etiqueta
          const insertQuery = "INSERT INTO pwb_produto_etiqueta (codproduto, mes_ano, etiqueta) VALUES ($1, $2, $3)"
          await client.query(insertQuery, [codproduto, dataFormatada, etiqueta])

          resultado.success.push(codproduto)
        } catch (error) {
          console.error(`Backend - Erro ao processar produto ${produto.codproduto}:`, error)
          resultado.errors.push({
            codigo: produto.codproduto,
            motivo: "Erro interno ao processar produto",
          })
        }
      }

      await client.query("COMMIT")
      console.log(
        `Backend - Importação de etiquetas concluída: ${resultado.success.length} produtos importados com sucesso, ${resultado.errors.length} erros`,
      )
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Backend - Erro na transação de importação de etiquetas:", error)
      throw error
    } finally {
      client.release()
    }

    return resultado
  } catch (error) {
    console.error("Backend - Erro ao importar produtos com etiquetas:", error)
    throw error
  }
}
