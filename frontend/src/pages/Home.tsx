"use client"

import type React from "react"
import { Box, Typography, Paper, Grid, Button } from "@mui/material"
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

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        Acesso Rápido
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Button variant="contained" color="primary" fullWidth href="/produtos-fora" sx={{ p: 2, height: "100%" }}>
                        Produtos Enco-Fora
                    </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        href="/produtos-etiquetas"
                        sx={{ p: 2, height: "100%" }}
                    >
                        Produtos Etiquetas
                    </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Button variant="contained" color="primary" fullWidth href="/promocao" sx={{ p: 2, height: "100%" }}>
                        Produtos Promoção
                    </Button>
                </Grid>
            </Grid>
        </Box>
    )
}

export default Home
