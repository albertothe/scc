import type { Request, Response, NextFunction } from "express"
import { verificarToken } from "../services/authService"

// Interface para estender o objeto Request
declare global {
    namespace Express {
        interface Request {
            usuario?: {
                usuario: string
                codusuario: string
                nivel: string
            }
        }
    }
}

// Middleware para verificar autenticação
export const verificarAutenticacao = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader) {
            return res.status(401).json({ mensagem: "Token não fornecido" })
        }

        const [bearer, token] = authHeader.split(" ")

        if (bearer !== "Bearer" || !token) {
            return res.status(401).json({ mensagem: "Token mal formatado" })
        }

        const usuarioDecodificado = verificarToken(token)
        req.usuario = usuarioDecodificado

        next()
    } catch (error) {
        return res.status(401).json({ mensagem: "Token inválido ou expirado" })
    }
}

// Middleware para verificar nível de acesso
export const verificarNivel = (niveisPermitidos: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.usuario) {
            return res.status(401).json({ mensagem: "Usuário não autenticado" })
        }

        if (!niveisPermitidos.includes(req.usuario.nivel)) {
            return res.status(403).json({ mensagem: "Acesso negado. Nível de permissão insuficiente." })
        }

        next()
    }
}
