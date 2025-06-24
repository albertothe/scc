"use client"

import type React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

interface ProtectedRouteProps {
    children: React.ReactNode
    niveisPermitidos?: string[]
    rota?: string
    acao?: "visualizar" | "incluir" | "editar" | "excluir"
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, niveisPermitidos, rota, acao = "visualizar" }) => {
    const { isAuthenticated, loading, temPermissao, temPermissaoModulo, usuario } = useAuth()

    console.log("ProtectedRoute renderizando", {
        isAuthenticated,
        loading,
        niveisPermitidos,
        rota,
        acao,
        usuario,
        temPermissao: usuario && niveisPermitidos ? temPermissao(niveisPermitidos) : undefined,
        temPermissaoModulo: rota ? temPermissaoModulo(rota, acao) : undefined,
    })

    if (loading) {
        console.log("ProtectedRoute: Carregando...")
        return <div>Carregando...</div>
    }

    if (!isAuthenticated) {
        console.log("ProtectedRoute: Não autenticado, redirecionando para /login")
        return <Navigate to="/login" replace />
    }

    if (rota && !temPermissaoModulo(rota, acao)) {
        console.log("ProtectedRoute: Sem permissão módulo, redirecionando para /home")
        return <Navigate to="/home" replace />
    }

    if (niveisPermitidos && niveisPermitidos.length > 0 && !temPermissao(niveisPermitidos)) {
        console.log("ProtectedRoute: Sem permissão, redirecionando para /home")
        return <Navigate to="/home" replace />
    }

    console.log("ProtectedRoute: Renderizando children")
    return <>{children}</>
}

export default ProtectedRoute
