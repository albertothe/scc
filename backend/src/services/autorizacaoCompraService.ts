import type { Pool } from "pg"
import type { AutorizacaoCompra } from "../models/AutorizacaoCompra"
import pool from "../config/database"

export class AutorizacaoCompraService {
    private db: Pool

    constructor() {
        this.db = pool
    }

    async criarAutorizacao(autorizacao: AutorizacaoCompra): Promise<AutorizacaoCompra> {
        const query = `
      INSERT INTO scc_autorizacao_compra (
        loja, setor, fornecedor, valor, observacao, usuario,
        data_criacao, hora_criacao, autorizado_controladoria, autorizado_diretoria
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, CURRENT_TIME, false, false)
      RETURNING *
    `

        const values = [
            autorizacao.loja,
            autorizacao.setor,
            autorizacao.fornecedor,
            autorizacao.valor,
            autorizacao.observacao,
            autorizacao.usuario,
        ]

        const result = await this.db.query(query, values)
        return result.rows[0]
    }

    async listarAutorizacoes(usuario: string, nivel: string): Promise<AutorizacaoCompra[]> {
        let query = `
      SELECT 
        id, loja, setor, fornecedor, valor, observacao, usuario,
        data_criacao, hora_criacao, autorizado_controladoria, autorizado_diretoria,
        data_autorizacao_controladoria, data_autorizacao_diretoria,
        usuario_controladoria, usuario_diretoria,
        (autorizado_controladoria AND autorizado_diretoria) as liberada
      FROM scc_autorizacao_compra
    `

        let values: any[] = []

        // Se não for nível 00 (diretoria) ou 06 (controladoria), só mostra as próprias autorizações
        if (nivel !== "00" && nivel !== "06") {
            query += " WHERE usuario = $1"
            values = [usuario]
        }

        query += " ORDER BY data_criacao DESC, hora_criacao DESC"

        const result = await this.db.query(query, values)
        return result.rows
    }

    async autorizarControladoria(id: number, usuarioControladoria: string): Promise<AutorizacaoCompra> {
        const query = `
      UPDATE scc_autorizacao_compra 
      SET 
        autorizado_controladoria = true,
        data_autorizacao_controladoria = CURRENT_DATE,
        usuario_controladoria = $2
      WHERE id = $1
      RETURNING *
    `

        const result = await this.db.query(query, [id, usuarioControladoria])

        if (result.rows.length === 0) {
            throw new Error("Autorização não encontrada")
        }

        return result.rows[0]
    }

    async autorizarDiretoria(id: number, usuarioDiretoria: string): Promise<AutorizacaoCompra> {
        // Primeiro verificar se a controladoria já autorizou
        const checkQuery = `
      SELECT autorizado_controladoria 
      FROM scc_autorizacao_compra 
      WHERE id = $1
    `

        const checkResult = await this.db.query(checkQuery, [id])

        if (checkResult.rows.length === 0) {
            throw new Error("Autorização não encontrada")
        }

        if (!checkResult.rows[0].autorizado_controladoria) {
            throw new Error("A controladoria deve autorizar primeiro")
        }

        const query = `
      UPDATE scc_autorizacao_compra 
      SET 
        autorizado_diretoria = true,
        data_autorizacao_diretoria = CURRENT_DATE,
        usuario_diretoria = $2
      WHERE id = $1
      RETURNING *
    `

        const result = await this.db.query(query, [id, usuarioDiretoria])
        return result.rows[0]
    }

    async reverterControladoria(id: number): Promise<AutorizacaoCompra> {
        const query = `
      UPDATE scc_autorizacao_compra
      SET
        autorizado_controladoria = false,
        data_autorizacao_controladoria = NULL,
        usuario_controladoria = NULL
      WHERE id = $1 AND autorizado_diretoria = false
      RETURNING *
    `

        const result = await this.db.query(query, [id])

        if (result.rows.length === 0) {
            throw new Error(
                "Autorização não encontrada ou já liberada pela diretoria",
            )
        }

        return result.rows[0]
    }

    async obterAutorizacao(id: number): Promise<AutorizacaoCompra | null> {
        const query = `
      SELECT 
        id, loja, setor, fornecedor, valor, observacao, usuario,
        data_criacao, hora_criacao, autorizado_controladoria, autorizado_diretoria,
        data_autorizacao_controladoria, data_autorizacao_diretoria,
        usuario_controladoria, usuario_diretoria,
        (autorizado_controladoria AND autorizado_diretoria) as liberada
      FROM scc_autorizacao_compra
      WHERE id = $1
    `

        const result = await this.db.query(query, [id])
        return result.rows.length > 0 ? result.rows[0] : null
    }

    async atualizarAutorizacao(id: number, autorizacao: Partial<AutorizacaoCompra>): Promise<AutorizacaoCompra> {
        const campos = []
        const valores = []
        let contador = 1

        // Construir dinamicamente a query de update
        if (autorizacao.loja !== undefined) {
            campos.push(`loja = $${contador}`)
            valores.push(autorizacao.loja)
            contador++
        }

        if (autorizacao.setor !== undefined) {
            campos.push(`setor = $${contador}`)
            valores.push(autorizacao.setor)
            contador++
        }

        if (autorizacao.fornecedor !== undefined) {
            campos.push(`fornecedor = $${contador}`)
            valores.push(autorizacao.fornecedor)
            contador++
        }

        if (autorizacao.valor !== undefined) {
            campos.push(`valor = $${contador}`)
            valores.push(autorizacao.valor)
            contador++
        }

        if (autorizacao.observacao !== undefined) {
            campos.push(`observacao = $${contador}`)
            valores.push(autorizacao.observacao)
            contador++
        }

        if (campos.length === 0) {
            throw new Error("Nenhum campo para atualizar")
        }

        const query = `
      UPDATE scc_autorizacao_compra 
      SET ${campos.join(", ")}
      WHERE id = $${contador}
      RETURNING *
    `

        valores.push(id)

        const result = await this.db.query(query, valores)

        if (result.rows.length === 0) {
            throw new Error("Autorização não encontrada")
        }

        return result.rows[0]
    }

    async excluirAutorizacao(id: number, usuario: string): Promise<boolean> {
        const query = `
      DELETE FROM scc_autorizacao_compra
      WHERE id = $1
        AND usuario = $2
        AND autorizado_controladoria = false
        AND autorizado_diretoria = false
    `

        const result = await this.db.query(query, [id, usuario])

        return (result.rowCount ?? 0) > 0
    }
}
