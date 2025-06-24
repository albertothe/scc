import pool from "../config/database"
import type { Modulo } from "../models/Modulo"
import type { NivelAcesso } from "../models/NivelAcesso"
import type { PermissaoNivel } from "../models/PermissaoNivel"

export const getModulos = async (): Promise<Modulo[]> => {
    const query = `SELECT id, nome, rota, icone, ordem, ativo FROM scc_modulos ORDER BY ordem, nome`
    const result = await pool.query(query)
    return result.rows
}

export const criarModulo = async (modulo: Omit<Modulo, "id">): Promise<Modulo> => {
    const query = `
        INSERT INTO scc_modulos (nome, rota, icone, ordem, ativo)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nome, rota, icone, ordem, ativo
    `
    const values = [modulo.nome, modulo.rota, modulo.icone, modulo.ordem, modulo.ativo ?? true]
    const result = await pool.query(query, values)
    return result.rows[0]
}

export const atualizarModulo = async (id: number, modulo: Partial<Modulo>): Promise<Modulo> => {
    const campos = []
    const valores: any[] = []
    let contador = 1

    if (modulo.nome !== undefined) {
        campos.push(`nome = $${contador}`)
        valores.push(modulo.nome)
        contador++
    }
    if (modulo.rota !== undefined) {
        campos.push(`rota = $${contador}`)
        valores.push(modulo.rota)
        contador++
    }
    if (modulo.icone !== undefined) {
        campos.push(`icone = $${contador}`)
        valores.push(modulo.icone)
        contador++
    }
    if (modulo.ordem !== undefined) {
        campos.push(`ordem = $${contador}`)
        valores.push(modulo.ordem)
        contador++
    }
    if (modulo.ativo !== undefined) {
        campos.push(`ativo = $${contador}`)
        valores.push(modulo.ativo)
        contador++
    }

    if (campos.length === 0) {
        throw new Error("Nenhum campo para atualizar")
    }

    const query = `UPDATE scc_modulos SET ${campos.join(", ")} WHERE id = $${contador} RETURNING id, nome, rota, icone, ordem, ativo`
    valores.push(id)
    const result = await pool.query(query, valores)
    return result.rows[0]
}

export const excluirModulo = async (id: number): Promise<boolean> => {
    const query = `DELETE FROM scc_modulos WHERE id = $1`
    const result = await pool.query(query, [id])
    return (result.rowCount ?? 0) > 0
}

export const getNiveisAcesso = async (): Promise<NivelAcesso[]> => {
    const query = `SELECT codigo, descricao, ativo FROM scc_niveis_acesso ORDER BY codigo`
    const result = await pool.query(query)
    return result.rows
}

export const criarNivelAcesso = async (nivel: NivelAcesso): Promise<NivelAcesso> => {
    const query = `
        INSERT INTO scc_niveis_acesso (codigo, descricao, ativo)
        VALUES ($1, $2, $3)
        RETURNING codigo, descricao, ativo
    `
    const values = [nivel.codigo, nivel.descricao, nivel.ativo ?? true]
    const result = await pool.query(query, values)
    return result.rows[0]
}

export const atualizarNivelAcesso = async (codigo: string, nivel: Partial<NivelAcesso>): Promise<NivelAcesso> => {
    const campos = []
    const valores: any[] = []
    let contador = 1

    if (nivel.descricao !== undefined) {
        campos.push(`descricao = $${contador}`)
        valores.push(nivel.descricao)
        contador++
    }
    if (nivel.ativo !== undefined) {
        campos.push(`ativo = $${contador}`)
        valores.push(nivel.ativo)
        contador++
    }

    if (campos.length === 0) {
        throw new Error("Nenhum campo para atualizar")
    }

    const query = `UPDATE scc_niveis_acesso SET ${campos.join(", ")} WHERE codigo = $${contador} RETURNING codigo, descricao, ativo`
    valores.push(codigo)
    const result = await pool.query(query, valores)
    return result.rows[0]
}

export const excluirNivelAcesso = async (codigo: string): Promise<boolean> => {
    const query = `DELETE FROM scc_niveis_acesso WHERE codigo = $1`
    const result = await pool.query(query, [codigo])
    return (result.rowCount ?? 0) > 0
}

export const getPermissoesNivel = async (codigo: string): Promise<PermissaoNivel[]> => {
    const query = `
        SELECT codigo_nivel, id_modulo, visualizar, incluir, editar, excluir
        FROM scc_permissoes_nivel
        WHERE codigo_nivel = $1
        ORDER BY id_modulo
    `
    const result = await pool.query(query, [codigo])
    return result.rows
}

export const salvarPermissoesNivel = async (codigo: string, permissoes: PermissaoNivel[]): Promise<void> => {
    const client = await pool.connect()
    try {
        await client.query("BEGIN")

        for (const perm of permissoes) {
            const query = `
                INSERT INTO scc_permissoes_nivel (codigo_nivel, id_modulo, visualizar, incluir, editar, excluir)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (codigo_nivel, id_modulo)
                DO UPDATE SET visualizar = EXCLUDED.visualizar, incluir = EXCLUDED.incluir, editar = EXCLUDED.editar, excluir = EXCLUDED.excluir
            `
            await client.query(query, [
                codigo,
                perm.id_modulo,
                perm.visualizar,
                perm.incluir,
                perm.editar,
                perm.excluir,
            ])
        }

        await client.query("COMMIT")
    } catch (error) {
        await client.query("ROLLBACK")
        throw error
    } finally {
        client.release()
    }
}
