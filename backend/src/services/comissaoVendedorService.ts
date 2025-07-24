import db from "../config/database"
import type { Vendedor, Loja, ComissaoVendedor, ComissaoVendedorCompleta } from "../models/ComissaoVendedor"

// Obter todos os vendedores ativos
export const getVendedores = async (): Promise<Vendedor[]> => {
    try {
        console.log("Backend: Buscando vendedores ativos...")

        const query = `
      SELECT 
        codvendedor,
        codloja,
        vendedor,
        nome_completo
      FROM vs_pwb_dvendedores
      ORDER BY vendedor
    `

        const result = await db.query(query)
        console.log(`Backend: Encontrados ${result.rows.length} vendedores`)

        return result.rows
    } catch (error) {
        console.error("Backend: Erro ao buscar vendedores:", error)
        throw error
    }
}

// Obter todas as lojas ativas
export const getLojas = async (): Promise<Loja[]> => {
    try {
        console.log("Backend: Buscando lojas ativas...")

        const query = `
      SELECT 
        c_codigo AS codloja,
        c_filial AS loja
      FROM a_filial
      WHERE c_codigo IN ('00','01','02','03','04','05','06','07','08','09','10','11','12')
      ORDER BY c_codigo
    `

        const result = await db.query(query)
        console.log(`Backend: Encontradas ${result.rows.length} lojas`)

        return result.rows
    } catch (error) {
        console.error("Backend: Erro ao buscar lojas:", error)
        throw error
    }
}

// Obter todas as comissões de vendedores
export const getComissoesVendedores = async (): Promise<ComissaoVendedorCompleta[]> => {
    try {
        console.log("Backend: Buscando comissões de vendedores...")

        const query = `
      SELECT 
        cv.id,
        cv.codvendedor,
        v.vendedor,
        v.nome_completo,
        cv.codloja,
        l.loja,
        cv.percentual_base,
        cv.percentual_extra,
        cv.meta_mensal,
        cv.ativo,
        cv.data_inicio,
        cv.data_fim,
        cv.observacoes,
        cv.created_at,
        cv.updated_at
      FROM pwb_comissoes_vendedores cv
      LEFT JOIN vs_pwb_dvendedores v ON cv.codvendedor = v.codvendedor
      LEFT JOIN (
        SELECT 
          c_codigo AS codloja,
          c_filial AS loja
        FROM a_filial
        WHERE c_codigo IN ('00','01','02','03','04','05','06','07','08','09','10','11','12')
      ) l ON cv.codloja = l.codloja
      ORDER BY v.vendedor
    `

        const result = await db.query(query)
        console.log(`Backend: Encontradas ${result.rows.length} comissões`)

        return result.rows
    } catch (error) {
        console.error("Backend: Erro ao buscar comissões de vendedores:", error)
        throw error
    }
}

// Obter comissão específica por ID
export const getComissaoVendedor = async (id: number): Promise<ComissaoVendedorCompleta | null> => {
    try {
        console.log(`Backend: Buscando comissão ID ${id}...`)

        const query = `
      SELECT 
        cv.id,
        cv.codvendedor,
        v.vendedor,
        v.nome_completo,
        cv.codloja,
        l.loja,
        cv.percentual_base,
        cv.percentual_extra,
        cv.meta_mensal,
        cv.ativo,
        cv.data_inicio,
        cv.data_fim,
        cv.observacoes,
        cv.created_at,
        cv.updated_at
      FROM pwb_comissoes_vendedores cv
      LEFT JOIN vs_pwb_dvendedores v ON cv.codvendedor = v.codvendedor
      LEFT JOIN (
        SELECT 
          c_codigo AS codloja,
          c_filial AS loja
        FROM a_filial
        WHERE c_codigo IN ('00','01','02','03','04','05','06','07','08','09','10','11','12')
      ) l ON cv.codloja = l.codloja
      WHERE cv.id = $1
    `

        const result = await db.query(query, [id])

        if (result.rows.length === 0) {
            console.log(`Backend: Comissão ID ${id} não encontrada`)
            return null
        }

        console.log(`Backend: Comissão ID ${id} encontrada`)
        return result.rows[0]
    } catch (error) {
        console.error(`Backend: Erro ao buscar comissão ID ${id}:`, error)
        throw error
    }
}

// Criar nova comissão de vendedor
export const criarComissaoVendedor = async (comissao: ComissaoVendedor): Promise<ComissaoVendedorCompleta> => {
    try {
        console.log(`Backend: Criando comissão para vendedor ${comissao.codvendedor}...`)

        const query = `
      INSERT INTO pwb_comissoes_vendedores (
        codvendedor,
        codloja,
        percentual_base,
        percentual_extra,
        meta_mensal,
        ativo,
        data_inicio,
        observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `

        const result = await db.query(query, [
            comissao.codvendedor,
            comissao.codloja,
            comissao.percentual_base,
            comissao.percentual_extra,
            comissao.meta_mensal,
            comissao.ativo,
            comissao.data_inicio,
            comissao.observacoes,
        ])

        const novoId = result.rows[0].id
        console.log(`Backend: Comissão criada com ID ${novoId}`)

        // Buscar a comissão completa criada
        const comissaoCompleta = await getComissaoVendedor(novoId)
        if (!comissaoCompleta) {
            throw new Error("Erro ao buscar comissão criada")
        }

        return comissaoCompleta
    } catch (error) {
        console.error(`Backend: Erro ao criar comissão para vendedor ${comissao.codvendedor}:`, error)
        throw error
    }
}

// Atualizar comissão de vendedor
export const atualizarComissaoVendedor = async (
    id: number,
    comissao: ComissaoVendedor,
): Promise<ComissaoVendedorCompleta> => {
    try {
        console.log(`Backend: Atualizando comissão ID ${id}...`)

        const query = `
      UPDATE pwb_comissoes_vendedores
      SET
        codvendedor = $1,
        codloja = $2,
        percentual_base = $3,
        percentual_extra = $4,
        meta_mensal = $5,
        ativo = $6,
        data_inicio = $7,
        observacoes = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id
    `

        const result = await db.query(query, [
            comissao.codvendedor,
            comissao.codloja,
            comissao.percentual_base,
            comissao.percentual_extra,
            comissao.meta_mensal,
            comissao.ativo,
            comissao.data_inicio,
            comissao.observacoes,
            id,
        ])

        if (result.rows.length === 0) {
            throw new Error(`Comissão ID ${id} não encontrada`)
        }

        console.log(`Backend: Comissão ID ${id} atualizada`)

        // Buscar a comissão completa atualizada
        const comissaoCompleta = await getComissaoVendedor(id)
        if (!comissaoCompleta) {
            throw new Error("Erro ao buscar comissão atualizada")
        }

        return comissaoCompleta
    } catch (error) {
        console.error(`Backend: Erro ao atualizar comissão ID ${id}:`, error)
        throw error
    }
}

// Excluir comissão de vendedor
export const excluirComissaoVendedor = async (id: number): Promise<boolean> => {
    try {
        console.log(`Backend: Excluindo comissão ID ${id}...`)

        const query = `
      DELETE FROM pwb_comissoes_vendedores
      WHERE id = $1
      RETURNING id
    `

        const result = await db.query(query, [id])

        if (result.rows.length === 0) {
            console.log(`Backend: Comissão ID ${id} não encontrada para exclusão`)
            return false
        }

        console.log(`Backend: Comissão ID ${id} excluída`)
        return true
    } catch (error) {
        console.error(`Backend: Erro ao excluir comissão ID ${id}:`, error)
        throw error
    }
}
