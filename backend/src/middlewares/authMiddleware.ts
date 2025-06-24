import type { Request, Response, NextFunction } from "express"
import { verificarToken } from "../services/authService"
import { verificarPermissaoModulo } from "../services/controleAcessoService"

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

export const verificarPermissao = (
    rota: string,
    acao: "visualizar" | "incluir" | "editar" | "excluir",
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.usuario) {
            return res.status(401).json({ mensagem: "Usuário não autenticado" })
        }

        try {
            const permitido = await verificarPermissaoModulo(
                req.usuario.nivel,
                rota,
                acao,
            )
            if (!permitido) {
                return res
                    .status(403)
                    .json({ mensagem: "Acesso negado. Permissão insuficiente." })
            }
            next()
        } catch (error) {
            console.error("Erro ao verificar permissão:", error)
            res.status(500).json({ mensagem: "Erro ao verificar permissão" })
        }
    }
}
