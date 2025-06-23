"use client"

import type React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

interface ProtectedRouteProps {
    children: React.ReactNode
    niveisPermitidos: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, niveisPermitidos }) => {
    const { isAuthenticated, loading, temPermissao, usuario } = useAuth()

    console.log("ProtectedRoute renderizando", {
        isAuthenticated,
        loading,
        niveisPermitidos,
        usuario,
        temPermissao: usuario ? temPermissao(niveisPermitidos) : false,
    })

    if (loading) {
        console.log("ProtectedRoute: Carregando...")
        return <div>Carregando...</div>
    }

    if (!isAuthenticated) {
        console.log("ProtectedRoute: Não autenticado, redirecionando para /login")
        return <Navigate to="/login" replace />
    }

    if (!temPermissao(niveisPermitidos)) {
        console.log("ProtectedRoute: Sem permissão, redirecionando para /home")
        return <Navigate to="/home" replace />
    }

    console.log("ProtectedRoute: Renderizando children")
    return <>{children}</>
}

export default ProtectedRoute
