import db from "../config/database"
import type { VendedorMeta, VendedorMetaCompleta } from "../models/VendedorMeta"

// Verificar estrutura do banco
export const verificarEstruturaBanco = async (): Promise<any> => {
    try {
        console.log("Backend: Verificando estrutura do banco...")

        // Verificar tabela de vendedores
        const vendedoresResult = await db.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vs_pwb_dvendedores'
      ORDER BY ordinal_position
    `)

        // Verificar tabela de metas
        const metasResult = await db.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pwb_vendedor_metas'
      ORDER BY ordinal_position
    `)

        return {
            vendedores: vendedoresResult.rows,
            metas: metasResult.rows,
        }
    } catch (error) {
        console.error("Backend: Erro ao verificar estrutura do banco:", error)
        throw error
    }
}

// Obter todos os vendedores ativos
export const getVendedores = async (): Promise<any[]> => {
    try {
        console.log("Backend: Buscando vendedores ativos...")

        // Primeiro, vamos verificar quais colunas existem na tabela
        const colunas = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'vs_pwb_dvendedores'
    `)

        console.log(
            "Backend: Colunas disponíveis na tabela vs_pwb_dvendedores:",
            colunas.rows.map((r) => r.column_name),
        )

        // Agora vamos construir uma consulta que funcione com as colunas existentes
        // Vamos verificar se existe uma coluna que indica se o vendedor está ativo
        let query = `
      SELECT 
        codvendedor, 
        vendedor, 
        nome_completo, 
        codloja
      FROM vs_pwb_dvendedores
    `

        // Se existir uma coluna 'ativo', 'status', 'situacao' ou similar, vamos usá-la para filtrar
        const temColunaAtivo = colunas.rows.some((r) =>
            ["ativo", "status", "situacao", "active", "is_active"].includes(r.column_name.toLowerCase()),
        )

        if (temColunaAtivo) {
            const colunaAtivo = colunas.rows.find((r) =>
                ["ativo", "status", "situacao", "active", "is_active"].includes(r.column_name.toLowerCase()),
            )?.column_name

            query += ` WHERE ${colunaAtivo} = 'S' OR ${colunaAtivo} = 'A' OR ${colunaAtivo} = true`
        }

        query += ` ORDER BY vendedor`

        console.log("Backend: Query final:", query)

        const result = await db.query(query)

        console.log(`Backend: Encontrados ${result.rows.length} vendedores`)

        // Log dos primeiros 5 vendedores para diagnóstico
        if (result.rows.length > 0) {
            console.log("Backend: Primeiros 5 vendedores:", result.rows.slice(0, 5))
        }

        return result.rows
    } catch (error) {
        console.error("Backend: Erro ao buscar vendedores ativos:", error)
        throw error
    }
}

// Obter metas de vendedores por competência (mês/ano)
export const getMetasPorCompetencia = async (competencia: string): Promise<VendedorMetaCompleta[]> => {
    try {
        console.log(`Backend: Buscando metas para competência ${competencia}...`)

        // Extrair ano e mês da competência
        const [ano, mes] = competencia.split("-")
        const competenciaFormatada = `${ano}-${mes}`

        console.log(`Backend: Competência formatada: ${competenciaFormatada}`)

        const query = `
      SELECT
        m.codvendedor,
        m.ferias,
        m.competencia,
        m.base_salarial,
        m.meta_faturamento,
        m.meta_lucra,
        m.faturamento_minimo,
        m.incfat90,
        m.incfat100,
        m.incluc90,
        m.incluc100,
        v.vendedor,
        v.nome_completo,
        v.codloja
      FROM pwb_vendedor_metas m
      LEFT JOIN vs_pwb_dvendedores v ON m.codvendedor = v.codvendedor
      WHERE TO_CHAR(m.competencia, 'YYYY-MM') = $1
      ORDER BY v.vendedor
    `

        console.log("Backend: Query:", query)
        console.log("Backend: Parâmetros:", [competenciaFormatada])

        const result = await db.query(query, [competenciaFormatada])

        console.log(`Backend: Encontradas ${result.rows.length} metas para competência ${competencia}`)
        if (result.rows.length > 0) {
            console.log("Backend: Primeira meta:", result.rows[0])
        }

        return result.rows
    } catch (error) {
        console.error(`Backend: Erro ao buscar metas para competência ${competencia}:`, error)
        throw error
    }
}

// Obter meta específica de um vendedor
export const getMetaVendedor = async (
    codvendedor: string,
    competencia: string,
): Promise<VendedorMetaCompleta | null> => {
    try {
        console.log(`Backend: Buscando meta para vendedor ${codvendedor} na competência ${competencia}...`)

        const query = `
      SELECT
        m.codvendedor,
        m.ferias,
        m.competencia,
        m.base_salarial,
        m.meta_faturamento,
        m.meta_lucra,
        m.faturamento_minimo,
        m.incfat90,
        m.incfat100,
        m.incluc90,
        m.incluc100,
        v.vendedor,
        v.nome_completo,
        v.codloja
      FROM pwb_vendedor_metas m
      LEFT JOIN vs_pwb_dvendedores v ON m.codvendedor = v.codvendedor
      WHERE m.codvendedor = $1 AND TO_CHAR(m.competencia, 'YYYY-MM') = $2
    `

        console.log("Backend: Query:", query)
        console.log("Backend: Parâmetros:", [codvendedor, competencia.substring(0, 7)])

        const result = await db.query(query, [codvendedor, competencia.substring(0, 7)])

        if (result.rows.length === 0) {
            console.log(`Backend: Nenhuma meta encontrada para vendedor ${codvendedor} na competência ${competencia}`)
            return null
        }

        console.log(`Backend: Meta encontrada para vendedor ${codvendedor} na competência ${competencia}`)
        return result.rows[0]
    } catch (error) {
        console.error(`Backend: Erro ao buscar meta para vendedor ${codvendedor} na competência ${competencia}:`, error)
        throw error
    }
}

// Salvar meta de vendedor (criar ou atualizar)
export const salvarMetaVendedor = async (meta: VendedorMeta): Promise<VendedorMetaCompleta> => {
    try {
        console.log(`Backend: Salvando meta para vendedor ${meta.codvendedor} na competência ${meta.competencia}...`)

        // Verificar se já existe uma meta para este vendedor nesta competência
        const existingMeta = await getMetaVendedor(meta.codvendedor, meta.competencia)

        if (existingMeta) {
            console.log(`Backend: Atualizando meta existente para vendedor ${meta.codvendedor}...`)

            // Atualizar meta existente
            const result = await db.query(
                `
        UPDATE pwb_vendedor_metas
        SET
          ferias = $1,
          base_salarial = $2,
          meta_faturamento = $3,
          meta_lucra = $4,
          faturamento_minimo = $5,
          incfat90 = $6,
          incfat100 = $7,
          incluc90 = $8,
          incluc100 = $9
        WHERE codvendedor = $10 AND TO_CHAR(competencia, 'YYYY-MM') = $11
        RETURNING *
      `,
                [
                    meta.ferias,
                    meta.base_salarial,
                    meta.meta_faturamento,
                    meta.meta_lucra,
                    meta.faturamento_minimo,
                    meta.incfat90,
                    meta.incfat100,
                    meta.incluc90,
                    meta.incluc100,
                    meta.codvendedor,
                    meta.competencia.substring(0, 7),
                ],
            )

            // Buscar dados completos do vendedor
            const vendedor = await db.query(
                `
        SELECT vendedor, nome_completo, codloja
        FROM vs_pwb_dvendedores
        WHERE codvendedor = $1
      `,
                [meta.codvendedor],
            )

            // Combinar dados da meta com dados do vendedor
            const metaCompleta: VendedorMetaCompleta = {
                ...result.rows[0],
                vendedor: vendedor.rows[0].vendedor,
                nome_completo: vendedor.rows[0].nome_completo,
                codloja: vendedor.rows[0].codloja,
            }

            console.log(`Backend: Meta atualizada com sucesso para vendedor ${meta.codvendedor}`)
            return metaCompleta
        } else {
            console.log(`Backend: Criando nova meta para vendedor ${meta.codvendedor}...`)

            // Criar nova meta
            const result = await db.query(
                `
        INSERT INTO pwb_vendedor_metas (
          codvendedor,
          ferias,
          competencia,
          base_salarial,
          meta_faturamento,
          meta_lucra,
          faturamento_minimo,
          incfat90,
          incfat100,
          incluc90,
          incluc100
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `,
                [
                    meta.codvendedor,
                    meta.ferias,
                    meta.competencia,
                    meta.base_salarial,
                    meta.meta_faturamento,
                    meta.meta_lucra,
                    meta.faturamento_minimo,
                    meta.incfat90,
                    meta.incfat100,
                    meta.incluc90,
                    meta.incluc100,
                ],
            )

            // Buscar dados completos do vendedor
            const vendedor = await db.query(
                `
        SELECT vendedor, nome_completo, codloja
        FROM vs_pwb_dvendedores
        WHERE codvendedor = $1
      `,
                [meta.codvendedor],
            )

            // Combinar dados da meta com dados do vendedor
            const metaCompleta: VendedorMetaCompleta = {
                ...result.rows[0],
                vendedor: vendedor.rows[0].vendedor,
                nome_completo: vendedor.rows[0].nome_completo,
                codloja: vendedor.rows[0].codloja,
            }

            console.log(`Backend: Nova meta criada com sucesso para vendedor ${meta.codvendedor}`)
            return metaCompleta
        }
    } catch (error) {
        console.error(`Backend: Erro ao salvar meta para vendedor ${meta.codvendedor}:`, error)
        throw error
    }
}

// Excluir meta de vendedor
export const excluirMetaVendedor = async (codvendedor: string, competencia: string): Promise<VendedorMeta | null> => {
    try {
        console.log(`Backend: Excluindo meta para vendedor ${codvendedor} na competência ${competencia}...`)

        const result = await db.query(
            `
      DELETE FROM pwb_vendedor_metas
      WHERE codvendedor = $1 AND TO_CHAR(competencia, 'YYYY-MM') = $2
      RETURNING *
    `,
            [codvendedor, competencia.substring(0, 7)],
        )

        if (result.rows.length === 0) {
            console.log(`Backend: Nenhuma meta encontrada para excluir (vendedor ${codvendedor}, competência ${competencia})`)
            return null
        }

        console.log(`Backend: Meta excluída com sucesso para vendedor ${codvendedor} na competência ${competencia}`)
        return result.rows[0]
    } catch (error) {
        console.error(`Backend: Erro ao excluir meta para vendedor ${codvendedor} na competência ${competencia}:`, error)
        throw error
    }
}

// Copiar metas de uma competência para outra
export const copiarMetas = async (
    competenciaOrigem: string,
    competenciaDestino: string,
): Promise<{ message: string; quantidade: number }> => {
    try {
        console.log(`Backend: Copiando metas de ${competenciaOrigem} para ${competenciaDestino}...`)

        // Verificar se já existem metas na competência de destino
        const metasDestino = await getMetasPorCompetencia(competenciaDestino)

        if (metasDestino.length > 0) {
            console.log(`Backend: Já existem ${metasDestino.length} metas na competência de destino. Excluindo...`)

            // Excluir metas existentes na competência de destino
            await db.query(
                `
        DELETE FROM pwb_vendedor_metas
        WHERE TO_CHAR(competencia, 'YYYY-MM') = $1
      `,
                [competenciaDestino.substring(0, 7)],
            )
        }

        // Copiar metas da competência de origem para a de destino
        const result = await db.query(
            `
      INSERT INTO pwb_vendedor_metas (
        codvendedor,
        ferias,
        competencia,
        base_salarial,
        meta_faturamento,
        meta_lucra,
        faturamento_minimo,
        incfat90,
        incfat100,
        incluc90,
        incluc100
      )
      SELECT
        codvendedor,
        ferias,
        $2::date AS competencia,
        base_salarial,
        meta_faturamento,
        meta_lucra,
        faturamento_minimo,
        incfat90,
        incfat100,
        incluc90,
        incluc100
      FROM pwb_vendedor_metas
      WHERE TO_CHAR(competencia, 'YYYY-MM') = $1
      RETURNING *
    `,
            [competenciaOrigem.substring(0, 7), competenciaDestino],
        )

        console.log(
            `Backend: ${result.rows.length} metas copiadas com sucesso de ${competenciaOrigem} para ${competenciaDestino}`,
        )

        return {
            message: `${result.rows.length} metas copiadas com sucesso`,
            quantidade: result.rows.length,
        }
    } catch (error) {
        console.error(`Backend: Erro ao copiar metas de ${competenciaOrigem} para ${competenciaDestino}:`, error)
        throw error
    }
}

// Importar metas em lote
export const importarMetas = async (metas: any[]): Promise<{ importadas: number; erros: number }> => {
    let importadas = 0
    let erros = 0

    for (const meta of metas) {
        try {
            // Verificar se a meta já existe
            const metaExistente = await db.query(
                `
        SELECT * FROM pwb_vendedor_metas
        WHERE codvendedor = $1 AND TO_CHAR(competencia, 'YYYY-MM') = $2
      `,
                [meta.codvendedor, meta.competencia.substring(0, 7)],
            )

            if (metaExistente.rows.length > 0) {
                // Atualizar meta existente
                await db.query(
                    `
          UPDATE pwb_vendedor_metas
          SET
            base_salarial = $1,
            meta_faturamento = $2,
            meta_lucra = $3,
            faturamento_minimo = $4,
            ferias = $5
          WHERE codvendedor = $6 AND TO_CHAR(competencia, 'YYYY-MM') = $7
        `,
                    [
                        meta.base_salarial,
                        meta.meta_faturamento,
                        meta.meta_lucra,
                        meta.faturamento_minimo,
                        meta.ferias,
                        meta.codvendedor,
                        meta.competencia.substring(0, 7),
                    ],
                )
            } else {
                // Criar nova meta
                await db.query(
                    `
          INSERT INTO pwb_vendedor_metas (
            codvendedor,
            ferias,
            competencia,
            base_salarial,
            meta_faturamento,
            meta_lucra,
            faturamento_minimo,
            incfat90,
            incfat100,
            incluc90,
            incluc100
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
                    [
                        meta.codvendedor,
                        meta.ferias,
                        meta.competencia,
                        meta.base_salarial,
                        meta.meta_faturamento,
                        meta.meta_lucra,
                        meta.faturamento_minimo,
                        meta.incfat90,
                        meta.incfat100,
                        meta.incluc90,
                        meta.incluc100,
                    ],
                )
            }

            importadas++
        } catch (erro) {
            console.error(`Erro ao importar meta para vendedor ${meta.codvendedor}:`, erro)
            erros++
        }
    }

    return { importadas, erros }
}
