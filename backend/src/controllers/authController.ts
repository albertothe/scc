import type { Request, Response } from "express"
import { autenticarUsuario } from "../services/authService"

export const login = async (req: Request, res: Response) => {
    try {
        const { usuario, senha } = req.body

        if (!usuario || !senha) {
            return res.status(400).json({ mensagem: "Usuário e senha são obrigatórios" })
        }

        const usuarioAutenticado = await autenticarUsuario(usuario, senha)

        return res.status(200).json(usuarioAutenticado)
    } catch (error) {
        console.error("Erro no login:", error)
        return res.status(401).json({ mensagem: "Usuário ou senha inválidos" })
    }
}

export const verificarAutenticacao = (req: Request, res: Response) => {
    // O middleware já verificou o token, então se chegou aqui, está autenticado
    return res.status(200).json({
        autenticado: true,
        usuario: req.usuario?.usuario,
        nivel: req.usuario?.nivel,
    })
}
