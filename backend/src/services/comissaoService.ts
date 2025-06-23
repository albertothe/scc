import pool from "../config/database"
import type { ComissaoRange, ComissaoPercentual, ComissaoRangeCompleta } from "../models/Comissao"

// Obter todas as faixas de comissão com seus percentuais
export const getFaixasComissao = async (): Promise<ComissaoRangeCompleta[]> => {
    try {
        // Primeiro, buscar todas as faixas
        const rangeQuery = `
  SELECT id, faixa_min, faixa_max, codloja as loja
  FROM pwb_comissao_range
  ORDER BY faixa_min ASC
`
        const rangeResult = await pool.query(rangeQuery)
        const faixas = rangeResult.rows

        // Para cada faixa, buscar os percentuais
        const faixasCompletas: ComissaoRangeCompleta[] = []

        for (const faixa of faixas) {
            const percentualQuery = `
        SELECT id, id_range, etiqueta, percentual
        FROM pwb_comissao_percentual
        WHERE id_range = $1
        ORDER BY etiqueta
      `
            const percentualResult = await pool.query(percentualQuery, [faixa.id])

            faixasCompletas.push({
                ...faixa,
                percentuais: percentualResult.rows,
            })
        }

        return faixasCompletas
    } catch (error) {
        console.error("Erro ao buscar faixas de comissão:", error)
        throw error
    }
}

// Obter uma faixa específica com seus percentuais
export const getFaixaComissao = async (id: number): Promise<ComissaoRangeCompleta | null> => {
    try {
        const rangeQuery = `
  SELECT id, faixa_min, faixa_max, codloja as loja
  FROM pwb_comissao_range
  WHERE id = $1
`
        const rangeResult = await pool.query(rangeQuery, [id])

        if (rangeResult.rows.length === 0) {
            return null
        }

        const faixa = rangeResult.rows[0]

        const percentualQuery = `
      SELECT id, id_range, etiqueta, percentual
      FROM pwb_comissao_percentual
      WHERE id_range = $1
      ORDER BY etiqueta
    `
        const percentualResult = await pool.query(percentualQuery, [id])

        return {
            ...faixa,
            percentuais: percentualResult.rows,
        }
    } catch (error) {
        console.error(`Erro ao buscar faixa de comissão com ID ${id}:`, error)
        throw error
    }
}

// Criar uma nova faixa de comissão com seus percentuais
export const criarFaixaComissao = async (
    faixa: Omit<ComissaoRange, "id">,
    percentuais: Omit<ComissaoPercentual, "id" | "id_range">[],
): Promise<ComissaoRangeCompleta> => {
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        // Inserir a faixa
        const rangeQuery = `
  INSERT INTO pwb_comissao_range (faixa_min, faixa_max, codloja)
  VALUES ($1, $2, $3)
  RETURNING id, faixa_min, faixa_max, codloja as loja
`
        const rangeResult = await client.query(rangeQuery, [faixa.faixa_min, faixa.faixa_max, faixa.loja])

        const novaFaixa = rangeResult.rows[0]
        const percentuaisInseridos: ComissaoPercentual[] = []

        // Inserir os percentuais
        for (const percentual of percentuais) {
            const percentualQuery = `
        INSERT INTO pwb_comissao_percentual (id_range, etiqueta, percentual)
        VALUES ($1, $2, $3)
        RETURNING id, id_range, etiqueta, percentual
      `
            const percentualResult = await client.query(percentualQuery, [
                novaFaixa.id,
                percentual.etiqueta,
                percentual.percentual,
            ])

            percentuaisInseridos.push(percentualResult.rows[0])
        }

        await client.query("COMMIT")

        return {
            ...novaFaixa,
            percentuais: percentuaisInseridos,
        }
    } catch (error) {
        await client.query("ROLLBACK")
        console.error("Erro ao criar faixa de comissão:", error)
        throw error
    } finally {
        client.release()
    }
}

// Atualizar uma faixa de comissão existente
export const atualizarFaixaComissao = async (
    id: number,
    faixa: Omit<ComissaoRange, "id">,
    percentuais: Omit<ComissaoPercentual, "id_range">[],
): Promise<ComissaoRangeCompleta> => {
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        // Atualizar a faixa
        const rangeQuery = `
  UPDATE pwb_comissao_range
  SET faixa_min = $1, faixa_max = $2, codloja = $3
  WHERE id = $4
  RETURNING id, faixa_min, faixa_max, codloja as loja
`
        const rangeResult = await client.query(rangeQuery, [faixa.faixa_min, faixa.faixa_max, faixa.loja, id])

        if (rangeResult.rows.length === 0) {
            throw new Error(`Faixa de comissão com ID ${id} não encontrada`)
        }

        const faixaAtualizada = rangeResult.rows[0]

        // Para cada percentual, atualizar se existir ou criar se não existir
        const percentuaisAtualizados: ComissaoPercentual[] = []

        for (const percentual of percentuais) {
            if (percentual.id) {
                // Atualizar percentual existente
                const updateQuery = `
          UPDATE pwb_comissao_percentual
          SET etiqueta = $1, percentual = $2
          WHERE id = $3 AND id_range = $4
          RETURNING id, id_range, etiqueta, percentual
        `
                const updateResult = await client.query(updateQuery, [
                    percentual.etiqueta,
                    percentual.percentual,
                    percentual.id,
                    id,
                ])

                if (updateResult.rows.length > 0) {
                    percentuaisAtualizados.push(updateResult.rows[0])
                }
            } else {
                // Criar novo percentual
                const insertQuery = `
          INSERT INTO pwb_comissao_percentual (id_range, etiqueta, percentual)
          VALUES ($1, $2, $3)
          RETURNING id, id_range, etiqueta, percentual
        `
                const insertResult = await client.query(insertQuery, [id, percentual.etiqueta, percentual.percentual])

                percentuaisAtualizados.push(insertResult.rows[0])
            }
        }

        await client.query("COMMIT")

        return {
            ...faixaAtualizada,
            percentuais: percentuaisAtualizados,
        }
    } catch (error) {
        await client.query("ROLLBACK")
        console.error(`Erro ao atualizar faixa de comissão com ID ${id}:`, error)
        throw error
    } finally {
        client.release()
    }
}

// Excluir uma faixa de comissão e seus percentuais
export const excluirFaixaComissao = async (id: number): Promise<boolean> => {
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        // Primeiro excluir os percentuais (devido à chave estrangeira)
        const deletePercentuaisQuery = `
      DELETE FROM pwb_comissao_percentual
      WHERE id_range = $1
    `
        await client.query(deletePercentuaisQuery, [id])

        // Depois excluir a faixa
        const deleteFaixaQuery = `
      DELETE FROM pwb_comissao_range
      WHERE id = $1
      RETURNING id
    `
        const result = await client.query(deleteFaixaQuery, [id])

        await client.query("COMMIT")

        return result.rows.length > 0
    } catch (error) {
        await client.query("ROLLBACK")
        console.error(`Erro ao excluir faixa de comissão com ID ${id}:`, error)
        throw error
    } finally {
        client.release()
    }
}

// Excluir um percentual específico
export const excluirPercentual = async (id: number): Promise<boolean> => {
    try {
        const query = `
      DELETE FROM pwb_comissao_percentual
      WHERE id = $1
      RETURNING id
    `
        const result = await pool.query(query, [id])

        return result.rows.length > 0
    } catch (error) {
        console.error(`Erro ao excluir percentual com ID ${id}:`, error)
        throw error
    }
}
