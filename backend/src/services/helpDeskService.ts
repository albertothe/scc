import type { Pool } from "pg"
import pool from "../config/database"
import type { Ativo, Chamado, ChamadoDetalhado, InteracaoChamado } from "../models/HelpDesk"

export class HelpDeskService {
  private db: Pool

  constructor() {
    this.db = pool
  }

  async listarChamados(filtros: {
    status?: string
    prioridade?: string
    responsavel?: string
    busca?: string
  }): Promise<Chamado[]> {
    let query = `
      SELECT id, titulo, descricao, tipo, status, prioridade, loja, setor,
             nome_usuario_abertura, responsavel, data_abertura, data_atualizacao, data_fechamento
      FROM scc_chamados
    `

    const where: string[] = []
    const values: Array<string> = []

    if (filtros.status) {
      values.push(filtros.status)
      where.push(`status = $${values.length}`)
    }

    if (filtros.prioridade) {
      values.push(filtros.prioridade)
      where.push(`prioridade = $${values.length}`)
    }

    if (filtros.responsavel) {
      values.push(filtros.responsavel)
      where.push(`responsavel = $${values.length}`)
    }

    if (filtros.busca) {
      values.push(`%${filtros.busca}%`)
      where.push(`(
        titulo ILIKE $${values.length}
        OR descricao ILIKE $${values.length}
        OR nome_usuario_abertura ILIKE $${values.length}
        OR COALESCE(loja, '') ILIKE $${values.length}
        OR setor ILIKE $${values.length}
      )`)
    }

    if (where.length > 0) {
      query += ` WHERE ${where.join(" AND ")}`
    }

    query += `
      ORDER BY
        CASE prioridade
          WHEN 'URGENTE' THEN 1
          WHEN 'ALTA' THEN 2
          WHEN 'MÉDIO' THEN 3
          WHEN 'BAIXO' THEN 4
          ELSE 5
        END,
        data_abertura DESC,
        id DESC
    `

    const result = await this.db.query(query, values)
    return result.rows
  }

  async obterChamado(id: number): Promise<ChamadoDetalhado | null> {
    const chamadoResult = await this.db.query(
      `SELECT id, titulo, descricao, tipo, status, prioridade, loja, setor,
              nome_usuario_abertura, responsavel, data_abertura, data_atualizacao, data_fechamento
         FROM scc_chamados
        WHERE id = $1`,
      [id],
    )

    if (chamadoResult.rows.length === 0) {
      return null
    }

    const interacoesResult = await this.db.query(
      `SELECT id, id_chamado, nome_usuario, mensagem, tipo, status_novo, data_criacao
         FROM scc_interacoes
        WHERE id_chamado = $1
        ORDER BY data_criacao ASC, id ASC`,
      [id],
    )

    return {
      ...chamadoResult.rows[0],
      interacoes: interacoesResult.rows,
    }
  }

  async criarChamado(chamado: Chamado): Promise<ChamadoDetalhado> {
    const result = await this.db.query(
      `INSERT INTO scc_chamados (
        titulo, descricao, tipo, status, prioridade, loja, setor,
        nome_usuario_abertura, responsavel, data_abertura, data_atualizacao
      ) VALUES ($1, $2, $3, COALESCE($4, 'ABERTO'), $5, $6, COALESCE($7, 'ADMINISTRATIVO'), $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, titulo, descricao, tipo, status, prioridade, loja, setor,
                nome_usuario_abertura, responsavel, data_abertura, data_atualizacao, data_fechamento`,
      [
        chamado.titulo,
        chamado.descricao ?? null,
        chamado.tipo,
        chamado.status ?? "ABERTO",
        chamado.prioridade,
        chamado.loja ?? null,
        chamado.setor,
        chamado.nome_usuario_abertura,
        chamado.responsavel ?? null,
      ],
    )

    return {
      ...result.rows[0],
      interacoes: [],
    }
  }

  async atualizarChamado(id: number, dados: Partial<Chamado>): Promise<Chamado | null> {
    const campos: string[] = []
    const valores: unknown[] = []

    const adicionarCampo = (campo: string, valor: unknown) => {
      valores.push(valor)
      campos.push(`${campo} = $${valores.length}`)
    }

    if (dados.titulo !== undefined) adicionarCampo("titulo", dados.titulo)
    if (dados.descricao !== undefined) adicionarCampo("descricao", dados.descricao)
    if (dados.tipo !== undefined) adicionarCampo("tipo", dados.tipo)
    if (dados.status !== undefined) adicionarCampo("status", dados.status)
    if (dados.prioridade !== undefined) adicionarCampo("prioridade", dados.prioridade)
    if (dados.loja !== undefined) adicionarCampo("loja", dados.loja)
    if (dados.setor !== undefined) adicionarCampo("setor", dados.setor)
    if (dados.responsavel !== undefined) adicionarCampo("responsavel", dados.responsavel)

    campos.push("data_atualizacao = CURRENT_TIMESTAMP")

    if (dados.status === "FECHADO") {
      campos.push("data_fechamento = CURRENT_TIMESTAMP")
    } else if (dados.status !== undefined) {
      campos.push("data_fechamento = NULL")
    }

    valores.push(id)

    const result = await this.db.query(
      `UPDATE scc_chamados
          SET ${campos.join(", ")}
        WHERE id = $${valores.length}
      RETURNING id, titulo, descricao, tipo, status, prioridade, loja, setor,
                nome_usuario_abertura, responsavel, data_abertura, data_atualizacao, data_fechamento`,
      valores,
    )

    return result.rows[0] ?? null
  }

  async adicionarInteracao(interacao: InteracaoChamado): Promise<InteracaoChamado> {
    const client = await this.db.connect()

    try {
      await client.query("BEGIN")

      const interacaoResult = await client.query(
        `INSERT INTO scc_interacoes (id_chamado, nome_usuario, mensagem, tipo, status_novo, data_criacao)
         VALUES ($1, $2, $3, COALESCE($4, 'COMENTARIO'), $5, CURRENT_TIMESTAMP)
         RETURNING id, id_chamado, nome_usuario, mensagem, tipo, status_novo, data_criacao`,
        [
          interacao.id_chamado,
          interacao.nome_usuario,
          interacao.mensagem,
          interacao.tipo ?? "COMENTARIO",
          interacao.status_novo ?? null,
        ],
      )

      if (interacao.status_novo) {
        const updateFields = ["status = $1", "data_atualizacao = CURRENT_TIMESTAMP"]
        const updateValues: unknown[] = [interacao.status_novo, interacao.id_chamado]

        if (interacao.status_novo === "FECHADO") {
          updateFields.push("data_fechamento = CURRENT_TIMESTAMP")
        } else {
          updateFields.push("data_fechamento = NULL")
        }

        await client.query(
          `UPDATE scc_chamados
              SET ${updateFields.join(", ")}
            WHERE id = $2`,
          updateValues,
        )
      } else {
        await client.query(
          `UPDATE scc_chamados
              SET data_atualizacao = CURRENT_TIMESTAMP
            WHERE id = $1`,
          [interacao.id_chamado],
        )
      }

      await client.query("COMMIT")
      return interacaoResult.rows[0]
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }

  async listarAtivos(filtros: { status?: string; tipo?: string; busca?: string }): Promise<Ativo[]> {
    let query = `
      SELECT id, nome, nome_pc, nome_estacao_erp, ip, tipo, marca, modelo,
             numero_serie, status, usuario_responsavel, localizacao, data_compra,
             valor, observacoes, data_criacao
      FROM scc_ativos
    `

    const where: string[] = []
    const values: Array<string> = []

    if (filtros.status) {
      values.push(filtros.status)
      where.push(`status = $${values.length}`)
    }

    if (filtros.tipo) {
      values.push(filtros.tipo)
      where.push(`tipo = $${values.length}`)
    }

    if (filtros.busca) {
      values.push(`%${filtros.busca}%`)
      where.push(`(nome ILIKE $${values.length} OR nome_pc ILIKE $${values.length} OR usuario_responsavel ILIKE $${values.length} OR numero_serie ILIKE $${values.length})`)
    }

    if (where.length > 0) {
      query += ` WHERE ${where.join(" AND ")}`
    }

    query += " ORDER BY nome ASC, id DESC"

    const result = await this.db.query(query, values)
    return result.rows
  }

  async criarAtivo(ativo: Ativo): Promise<Ativo> {
    const result = await this.db.query(
      `INSERT INTO scc_ativos (
        nome, nome_pc, nome_estacao_erp, ip, tipo, marca, modelo, numero_serie,
        status, usuario_responsavel, localizacao, data_compra, valor, observacoes, data_criacao
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        COALESCE($9, 'ativo'), $10, $11, $12, $13, $14, CURRENT_TIMESTAMP
      )
      RETURNING id, nome, nome_pc, nome_estacao_erp, ip, tipo, marca, modelo,
                numero_serie, status, usuario_responsavel, localizacao, data_compra,
                valor, observacoes, data_criacao`,
      [
        ativo.nome,
        ativo.nome_pc ?? null,
        ativo.nome_estacao_erp ?? null,
        ativo.ip ?? null,
        ativo.tipo ?? null,
        ativo.marca ?? null,
        ativo.modelo ?? null,
        ativo.numero_serie ?? null,
        ativo.status ?? "ativo",
        ativo.usuario_responsavel ?? null,
        ativo.localizacao ?? null,
        ativo.data_compra ?? null,
        ativo.valor ?? null,
        ativo.observacoes ?? null,
      ],
    )

    return result.rows[0]
  }
}
