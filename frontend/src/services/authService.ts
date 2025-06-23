import api from "./api"

interface UsuarioAutenticado {
    usuario: string
    codusuario: string
    nivel: string
    token: string
}

// Função para fazer login
export const login = async (usuario: string, senha: string): Promise<UsuarioAutenticado> => {
    try {
        const response = await api.post("/auth/login", { usuario, senha })
        const { token } = response.data

        // Armazenar token no localStorage
        localStorage.setItem("auth_token", token)

        // Armazenar dados do usuário no localStorage
        localStorage.setItem(
            "usuario",
            JSON.stringify({
                usuario: response.data.usuario,
                codusuario: response.data.codusuario,
                nivel: response.data.nivel,
            }),
        )

        // Configurar token para todas as requisições futuras
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`

        return response.data
    } catch (error) {
        console.error("Erro ao fazer login:", error)
        throw error
    }
}

// Função para fazer logout
export const logout = (): void => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("usuario")
    delete api.defaults.headers.common["Authorization"]
}

// Função para verificar se o usuário está autenticado
export const verificarAutenticacao = async (): Promise<boolean> => {
    try {
        const token = localStorage.getItem("auth_token")

        if (!token) {
            return false
        }

        // Configurar token para a requisição
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`

        // Verificar se o token é válido
        await api.get("/auth/verificar")

        return true
    } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        logout()
        return false
    }
}

// Função para obter dados do usuário atual
export const getUsuarioAtual = (): { usuario: string; codusuario: string; nivel: string } | null => {
    const usuarioJSON = localStorage.getItem("usuario")

    if (!usuarioJSON) {
        return null
    }

    return JSON.parse(usuarioJSON)
}

// Função para verificar se o usuário tem permissão
export const temPermissao = (niveisPermitidos: string[]): boolean => {
    const usuario = getUsuarioAtual()

    if (!usuario) {
        return false
    }

    return niveisPermitidos.includes(usuario.nivel)
}
