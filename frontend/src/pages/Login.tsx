"use client"

import type React from "react"
import { useState } from "react"
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Container,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
} from "@mui/material"
import { Visibility, VisibilityOff } from "@mui/icons-material"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

const Login: React.FC = () => {
    const [username, setUsername] = useState("")
    const [senha, setSenha] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!username || !senha) {
            setError("Por favor, preencha todos os campos.")
            return
        }

        try {
            setError(null)
            setLoading(true)
            const success = await login(username, senha)

            if (success) {
                // Redirecionar explicitamente para a página home
                navigate("/home")
            } else {
                setError("Usuário ou senha inválidos.")
            }
        } catch (err) {
            console.error("Erro no login:", err)
            setError("Ocorreu um erro durante o login. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    const toggleMostrarSenha = () => {
        setMostrarSenha(!mostrarSenha)
    }

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    <Typography component="h1" variant="h5" gutterBottom>
                        Login
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
                        Sistema de Gestão J Monte
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: "100%" }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Usuário"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="senha"
                            label="Senha"
                            type={mostrarSenha ? "text" : "password"}
                            id="senha"
                            autoComplete="current-password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton aria-label="toggle password visibility" onClick={toggleMostrarSenha} edge="end">
                                            {mostrarSenha ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : "Entrar"}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    )
}

export default Login
