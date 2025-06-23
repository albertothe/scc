import pool from "../config/database"
import type { ProdutoPromocao } from "../models/Produto"

export const getProdutosPromocao = async (): Promise<ProdutoPromocao[]> => {
    try {
        const query = `
      SELECT 
        p.c_codprod AS codproduto,
        p.c_fil AS codloja,
        p.c_tab AS tabela,
        p.c_promocao AS valor_promocao,
        p.c_validade AS data_validade,
        p.c_data AS data_inclusao,
        p.c_hora AS hora_inclusao,
        p.c_user AS codusuario,
        d.produto,
        d.unidade,
        d.status,
        d.fornecedor,
        d.categoria,
        d.subcategoria
      FROM 
        a_promoc p
      LEFT JOIN 
        vs_pwb_dprodutos d ON p.c_codprod = d.codproduto
      WHERE 
        p.c_validade >= current_date
      ORDER BY 
        p.c_validade, d.produto
    `

        const result = await pool.query(query)

        // Converter produto para maiúsculas
        result.rows = result.rows.map((row) => ({
            ...row,
            produto: row.produto ? row.produto.toUpperCase() : "",
            fornecedor: row.fornecedor || "",
            categoria: row.categoria || "",
            subcategoria: row.subcategoria || "",
        }))

        return result.rows
    } catch (error) {
        console.error("Erro na consulta SQL:", error)
        throw error
    }
}

export const buscarProdutosPromocao = async (termo: string): Promise<ProdutoPromocao[]> => {
    try {
        const query = `
      SELECT 
        p.c_codprod AS codproduto,
        p.c_fil AS codloja,
        p.c_tab AS tabela,
        p.c_promocao AS valor_promocao,
        p.c_validade AS data_validade,
        p.c_data AS data_inclusao,
        p.c_hora AS hora_inclusao,
        p.c_user AS codusuario,
        d.produto,
        d.unidade,
        d.status,
        d.fornecedor,
        d.categoria,
        d.subcategoria
      FROM 
        a_promoc p
      LEFT JOIN 
        vs_pwb_dprodutos d ON p.c_codprod = d.codproduto
      WHERE 
        p.c_validade >= current_date
        AND (p.c_codprod LIKE $1 OR d.produto LIKE $1)
      ORDER BY 
        p.c_validade, d.produto
      LIMIT 50
    `

        const result = await pool.query(query, [`%${termo}%`])

        // Converter produto para maiúsculas
        result.rows = result.rows.map((row) => ({
            ...row,
            produto: row.produto ? row.produto.toUpperCase() : "",
            fornecedor: row.fornecedor || "",
            categoria: row.categoria || "",
            subcategoria: row.subcategoria || "",
        }))

        return result.rows
    } catch (error) {
        console.error("Erro ao buscar produtos em promoção:", error)
        throw error
    }
}

// Modificar a função importarProdutosPromocao para garantir que os valores estejam dentro dos limites corretos
export const importarProdutosPromocao = async (
    produtos: {
        codproduto: string
        codloja: string
        tabela: string
        valor_promocao: number
        data_validade: string
    }[],
    codusuario: string,
): Promise<{ success: string[]; errors: { codigo: string; motivo: string }[] }> => {
    const resultado = {
        success: [] as string[],
        errors: [] as { codigo: string; motivo: string }[],
    }

    const dataAtual = new Date()
    const dataFormatada = dataAtual.toISOString().split("T")[0]

    // Limitar a hora para 5 caracteres (HH:MM) para evitar o erro de tamanho
    const horaFormatada = dataAtual.toTimeString().split(" ")[0].substring(0, 5)

    // Limitar o código de usuário para 5 caracteres, se necessário
    const codUsuarioLimitado = codusuario.substring(0, 5)

    // Processar cada produto individualmente
    for (const produto of produtos) {
        const client = await pool.connect()
        try {
            // Garantir que o código do produto tenha exatamente 5 caracteres
            const codProdutoFormatado = produto.codproduto.padStart(5, "0").substring(0, 5)

            // Garantir que o código da loja tenha exatamente 2 caracteres
            const codLojaFormatado = produto.codloja.padStart(2, "0").substring(0, 2)

            // Garantir que o código da tabela tenha exatamente 2 caracteres
            const tabelaFormatada = produto.tabela.padStart(2, "0").substring(0, 2)

            // Verificar se o produto existe no cadastro
            const checkProdutoQuery = `
        SELECT COUNT(*) FROM vs_pwb_dprodutos 
        WHERE codproduto = $1
      `
            const checkProdutoResult = await client.query(checkProdutoQuery, [codProdutoFormatado])

            if (Number.parseInt(checkProdutoResult.rows[0].count) === 0) {
                resultado.errors.push({
                    codigo: produto.codproduto,
                    motivo: "Produto não encontrado no cadastro",
                })
                continue
            }

            // Iniciar transação para este produto
            await client.query("BEGIN")

            try {
                // Verificar se o produto já existe em promoção para esta loja e tabela
                const checkPromocaoQuery = `
          SELECT COUNT(*) FROM a_promoc 
          WHERE c_codprod = $1 AND c_fil = $2 AND c_tab = $3
        `
                const checkPromocaoResult = await client.query(checkPromocaoQuery, [
                    codProdutoFormatado,
                    codLojaFormatado,
                    tabelaFormatada,
                ])

                // Log para debug
                console.log(`Verificando produto ${codProdutoFormatado} na loja ${codLojaFormatado} tabela ${tabelaFormatada}`)
                console.log(`Resultado da verificação: ${checkPromocaoResult.rows[0].count}`)

                if (Number.parseInt(checkPromocaoResult.rows[0].count) > 0) {
                    // Se já existe, atualiza
                    console.log(`Atualizando produto ${codProdutoFormatado}`)
                    const updateQuery = `
            UPDATE a_promoc 
            SET c_promocao = $1, c_validade = $2, c_data = $3, c_hora = $4, c_user = $5
            WHERE c_codprod = $6 AND c_fil = $7 AND c_tab = $8
          `
                    await client.query(updateQuery, [
                        produto.valor_promocao,
                        produto.data_validade,
                        dataFormatada,
                        horaFormatada,
                        codUsuarioLimitado,
                        codProdutoFormatado,
                        codLojaFormatado,
                        tabelaFormatada,
                    ])
                } else {
                    // Se não existe, insere
                    console.log(`Inserindo produto ${codProdutoFormatado}`)
                    const insertQuery = `
            INSERT INTO a_promoc (c_codprod, c_fil, c_tab, c_promocao, c_validade, c_data, c_hora, c_user)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `
                    await client.query(insertQuery, [
                        codProdutoFormatado,
                        codLojaFormatado,
                        tabelaFormatada,
                        produto.valor_promocao,
                        produto.data_validade,
                        dataFormatada,
                        horaFormatada,
                        codUsuarioLimitado,
                    ])
                }

                // Commit da transação
                await client.query("COMMIT")
                resultado.success.push(`${codProdutoFormatado}-${codLojaFormatado}-${tabelaFormatada}`)
            } catch (error) {
                // Rollback em caso de erro
                await client.query("ROLLBACK")
                console.error(`Erro ao processar produto ${codProdutoFormatado}:`, error)
                resultado.errors.push({
                    codigo: `${produto.codproduto}-${produto.codloja}-${produto.tabela}`,
                    motivo: `Erro ao processar: ${(error as Error).message}`,
                })
            }
        } catch (error) {
            console.error(`Erro ao verificar produto ${produto.codproduto}:`, error)
            resultado.errors.push({
                codigo: produto.codproduto,
                motivo: `Erro ao verificar produto: ${(error as Error).message}`,
            })
        } finally {
            client.release()
        }
    }

    console.log(
        `Importação de promoções concluída: ${resultado.success.length} produtos importados com sucesso, ${resultado.errors.length} erros`,
    )
    return resultado
}
