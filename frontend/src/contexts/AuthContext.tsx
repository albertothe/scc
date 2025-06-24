"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import * as authService from "../services/authService"
import * as acessoService from "../services/controleAcessoService"
import type { PermissaoNivel, Modulo } from "../types"

interface AuthContextType {
    isAuthenticated: boolean
    usuario: { usuario: string; codusuario: string; nivel: string; id?: number } | null
    login: (username: string, senha: string) => Promise<boolean>
    logout: () => void
    loading: boolean
    temPermissao: (niveisPermitidos: string[]) => boolean
    temPermissaoModulo: (
        rota: string,
        acao?: "visualizar" | "incluir" | "editar" | "excluir",
    ) => boolean
    permissoesModulo: Record<string, PermissaoNivel>
}

export const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    usuario: null,
    login: async () => false,
    logout: () => { },
    loading: true,
    temPermissao: () => false,
    temPermissaoModulo: () => false,
    permissoesModulo: {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    console.log("AuthProvider renderizando")
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [usuario, setUsuario] = useState<{ usuario: string; codusuario: string; nivel: string; id?: number } | null>(
        null,
    )
    const [loading, setLoading] = useState<boolean>(true)
    const [permissoesModulo, setPermissoesModulo] = useState<Record<string, PermissaoNivel>>({})
    const navigate = useNavigate()

    // Carrega permissões de módulo para o nível informado
    const carregarPermissoesModulo = async (nivel: string) => {
        try {
            const [mods, perms] = await Promise.all([
                acessoService.getModulos(),
                acessoService.getPermissoes(nivel),
            ])
            const rotaMap: Record<number, string> = {}
            mods.forEach((m: Modulo) => {
                rotaMap[m.id] = m.rota
            })
            const map: Record<string, PermissaoNivel> = {}
            perms.forEach((p) => {
                const rota = rotaMap[p.id_modulo]
                if (rota) {
                    map[rota] = p
                }
            })
            setPermissoesModulo(map)
        } catch (error) {
            console.error("Erro ao carregar permissões do módulo:", error)
        }
    }

    // Verificar se o usuário já está autenticado ao carregar a página
    useEffect(() => {
        console.log("AuthProvider: useEffect executando")
        const checkAuth = async () => {
            try {
                console.log("AuthProvider: Verificando autenticação")
                const autenticado = await authService.verificarAutenticacao()
                console.log("AuthProvider: Resultado da verificação", autenticado)

                if (autenticado) {
                    const usuarioAtual = authService.getUsuarioAtual()
                    console.log("AuthProvider: Usuário atual", usuarioAtual)

                    if (usuarioAtual && usuarioAtual.usuario && usuarioAtual.codusuario && usuarioAtual.nivel) {
                        setIsAuthenticated(true)
                        setUsuario({
                            usuario: usuarioAtual.usuario,
                            codusuario: usuarioAtual.codusuario,
                            nivel: usuarioAtual.nivel,
                            id: Number(usuarioAtual.codusuario), // Usar codusuario como id
                        })
                        await carregarPermissoesModulo(usuarioAtual.nivel)

                        // Se estiver na página de login, redirecionar para home
                        if (window.location.pathname === "/login") {
                            console.log("AuthProvider: Redirecionando de /login para /home")
                            navigate("/home")
                        }
                    } else {
                        console.log("AuthProvider: Dados do usuário incompletos")
                        navigate("/login")
                    }
                } else {
                    console.log("AuthProvider: Não autenticado")
                    if (window.location.pathname !== "/login") {
                        console.log("AuthProvider: Redirecionando para /login")
                        navigate("/login")
                    }
                }
            } catch (error) {
                console.error("Erro ao verificar autenticação:", error)
                navigate("/login")
            } finally {
                console.log("AuthProvider: Finalizando verificação, loading = false")
                setLoading(false)
            }
        }

        checkAuth()
    }, [navigate])

    const login = async (username: string, senha: string): Promise<boolean> => {
        console.log("AuthProvider: Tentando login", { username })
        try {
            const usuarioLogado = await authService.login(username, senha)
            console.log("AuthProvider: Login bem-sucedido", usuarioLogado)
            setIsAuthenticated(true)
            setUsuario({
                usuario: usuarioLogado.usuario,
                codusuario: usuarioLogado.codusuario,
                nivel: usuarioLogado.nivel,
                id: Number(usuarioLogado.codusuario), // Usar codusuario como id
            })
            await carregarPermissoesModulo(usuarioLogado.nivel)

            // Não fazemos o redirecionamento aqui, deixamos para o componente Login fazer
            return true
        } catch (error) {
            console.error("Erro no login:", error)
            return false
        }
    }

    const logout = () => {
        console.log("AuthProvider: Fazendo logout")
        authService.logout()
        setIsAuthenticated(false)
        setUsuario(null)
        navigate("/login")
    }

    const temPermissao = (niveisPermitidos: string[]): boolean => {
        console.log("AuthProvider: Verificando permissão", { niveisPermitidos, usuarioNivel: usuario?.nivel })
        if (!usuario) return false
        return niveisPermitidos.includes(usuario.nivel)
    }

    const temPermissaoModulo = (
        rota: string,
        acao: "visualizar" | "incluir" | "editar" | "excluir" = "visualizar",
    ): boolean => {
        const perm = permissoesModulo[rota]
        if (!perm) return false
        return Boolean(perm[acao])
    }

    console.log("AuthProvider: Estado atual", { isAuthenticated, loading, usuario })

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            usuario,
            login,
            logout,
            loading,
            temPermissao,
            temPermissaoModulo,
            permissoesModulo,
        }}>
            {children}
        </AuthContext.Provider>
    )
}
