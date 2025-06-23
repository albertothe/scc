"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import * as authService from "../services/authService"

interface AuthContextType {
    isAuthenticated: boolean
    usuario: { usuario: string; codusuario: string; nivel: string; id?: number } | null
    login: (username: string, senha: string) => Promise<boolean>
    logout: () => void
    loading: boolean
    temPermissao: (niveisPermitidos: string[]) => boolean
}

export const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    usuario: null,
    login: async () => false,
    logout: () => { },
    loading: true,
    temPermissao: () => false,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    console.log("AuthProvider renderizando")
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [usuario, setUsuario] = useState<{ usuario: string; codusuario: string; nivel: string; id?: number } | null>(
        null,
    )
    const [loading, setLoading] = useState<boolean>(true)
    const navigate = useNavigate()

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

    console.log("AuthProvider: Estado atual", { isAuthenticated, loading, usuario })

    return (
        <AuthContext.Provider value={{ isAuthenticated, usuario, login, logout, loading, temPermissao }}>
            {children}
        </AuthContext.Provider>
    )
}
