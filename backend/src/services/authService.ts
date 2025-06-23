import pool from "../config/database"
import type { UsuarioAutenticado } from "../models/Usuario"
import jwt from "jsonwebtoken"
import crypto from "crypto"

// Função para gerar hash MD5
const gerarMD5 = (texto: string): string => {
    return crypto.createHash("md5").update(texto).digest("hex")
}

// Função para autenticar usuário
export const autenticarUsuario = async (usuario: string, senha: string): Promise<UsuarioAutenticado> => {
    try {
        // Converter usuário para maiúsculo
        const usuarioUpper = usuario.toUpperCase()

        // Gerar hash MD5 da combinação usuário+senha
        const senhaMD5 = gerarMD5(usuarioUpper + senha)

        // Consultar usuário na view
        const query = `
      SELECT usuario, codusuario, nivel 
      FROM vs_pwb_usuarios 
      WHERE usuario = $1 AND senha = $2 AND nivel IN ('00', '15', '80')
    `

        const result = await pool.query(query, [usuarioUpper, senhaMD5])

        if (result.rows.length === 0) {
            throw new Error("Usuário ou senha inválidos")
        }

        const usuarioEncontrado = result.rows[0]

        // Gerar token JWT
        const token = jwt.sign(
            {
                usuario: usuarioEncontrado.usuario,
                codusuario: usuarioEncontrado.codusuario,
                nivel: usuarioEncontrado.nivel,
            },
            process.env.JWT_SECRET || "secret_temporario",
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

// Update the verificarToken function to include codusuario in the return type
export const verificarToken = (token: string): { usuario: string; codusuario: string; nivel: string } => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_temporario")
        return decoded as { usuario: string; codusuario: string; nivel: string }
    } catch (error) {
        throw new Error("Token inválido ou expirado")
    }
}
