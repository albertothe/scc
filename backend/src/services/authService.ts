import pool from "../config/database"
import type { UsuarioAutenticado } from "../models/Usuario"
import jwt from "jsonwebtoken"
import crypto from "crypto"

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw new Error("JWT_SECRET não definido. Defina a variável de ambiente JWT_SECRET antes de iniciar o servidor.")
    }
    return secret
}

// Mantido para compatibilidade com senhas legadas no banco (MD5).
// Para migrar: obter a tabela subjacente de vs_pwb_usuarios e substituir
// os hashes MD5 por PBKDF2 usando gerarHashSenha() abaixo.
const gerarMD5 = (texto: string): string => {
    return crypto.createHash("md5").update(texto).digest("hex")
}

// Hash seguro para novas senhas (substituto do MD5 quando a migração do banco ocorrer).
export const gerarHashSenha = (senha: string, salt?: string): { hash: string; salt: string } => {
    const s = salt ?? crypto.randomBytes(16).toString("hex")
    const hash = crypto.pbkdf2Sync(senha, s, 310000, 32, "sha256").toString("hex")
    return { hash, salt: s }
}

export const autenticarUsuario = async (usuario: string, senha: string): Promise<UsuarioAutenticado> => {
    try {
        const usuarioUpper = usuario.toUpperCase()
        const senhaMD5 = gerarMD5(usuarioUpper + senha)

        const query = `
      SELECT usuario, codusuario, nivel
      FROM vs_pwb_usuarios
      WHERE usuario = $1 AND senha = $2
    `

        const result = await pool.query(query, [usuarioUpper, senhaMD5])

        if (result.rows.length === 0) {
            throw new Error("Usuário ou senha inválidos")
        }

        const usuarioEncontrado = result.rows[0]

        const token = jwt.sign(
            {
                usuario: usuarioEncontrado.usuario,
                codusuario: usuarioEncontrado.codusuario,
                nivel: usuarioEncontrado.nivel,
            },
            getJwtSecret(),
            { expiresIn: "8h" },
        )

        return {
            usuario: usuarioEncontrado.usuario,
            codusuario: usuarioEncontrado.codusuario,
            nivel: usuarioEncontrado.nivel,
            token,
        }
    } catch (error) {
        console.error("Erro ao autenticar usuário:", error)
        throw error
    }
}

export const verificarToken = (token: string): { usuario: string; codusuario: string; nivel: string } => {
    try {
        const decoded = jwt.verify(token, getJwtSecret())
        return decoded as { usuario: string; codusuario: string; nivel: string }
    } catch (error) {
        throw new Error("Token inválido ou expirado")
    }
}
