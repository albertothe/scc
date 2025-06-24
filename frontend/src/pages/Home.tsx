"use client"

import type React from "react"
import { Box, Typography, Paper } from "@mui/material"
import { useAuth } from "../contexts/AuthContext"

const Home: React.FC = () => {
    const { usuario } = useAuth()

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Bem-vindo, {usuario?.usuario || "Usuário"}!
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Sistema de Gestão J Monte
                </Typography>
                <Typography variant="body1" paragraph>
                    Este é o sistema de gestão de produtos, promoções e comissões da J Monte.
                </Typography>
                <Typography variant="body1" paragraph>
                    Utilize o menu lateral para navegar entre as diferentes funcionalidades do sistema.
                </Typography>
            </Paper>

            {/* Seção de acesso rápido removida conforme solicitação */}
        </Box>
    )
}

export default Home
