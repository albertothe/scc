"use client"

import type React from "react"
import { useState } from "react"
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    useTheme,
    useMediaQuery,
} from "@mui/material"
import { Visibility, VisibilityOff, Person, Lock } from "@mui/icons-material"
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
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down("md"))

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

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            {/* ── Painel esquerdo (visível só em desktop) ── */}
            {!isMobile && (
                <Box
                    sx={{
                        width: "45%",
                        flexShrink: 0,
                        background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        p: 6,
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Círculos decorativos */}
                    <Box sx={{
                        position: "absolute",
                        width: 500, height: 500,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.05)",
                        top: -150, left: -150,
                    }} />
                    <Box sx={{
                        position: "absolute",
                        width: 350, height: 350,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.07)",
                        bottom: -100, right: -100,
                    }} />
                    <Box sx={{
                        position: "absolute",
                        width: 200, height: 200,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.05)",
                        bottom: 120, left: 40,
                    }} />

                    {/* Conteúdo de marca */}
                    <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                        {/* Logo */}
                        <Box sx={{
                            width: 80, height: 80,
                            borderRadius: "20px",
                            background: "rgba(255,255,255,0.15)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: 3,
                        }}>
                            <Typography sx={{ color: "white", fontWeight: 800, fontSize: "1.5rem" }}>
                                JM
                            </Typography>
                        </Box>

                        <Typography variant="h3" sx={{ color: "white", fontWeight: 800, mb: 1, letterSpacing: "-0.02em" }}>
                            J Monte
                        </Typography>
                        <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 400, mb: 5 }}>
                            Sistema de Gestão
                        </Typography>

                        {/* Tags de módulos */}
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center" }}>
                            {["Produtos", "Comissões", "Controladoria", "Help Desk", "Controle de Acesso"].map((mod) => (
                                <Box
                                    key={mod}
                                    sx={{
                                        px: 2,
                                        py: 0.75,
                                        borderRadius: "100px",
                                        background: "rgba(255,255,255,0.12)",
                                        border: "1px solid rgba(255,255,255,0.2)",
                                        backdropFilter: "blur(4px)",
                                    }}
                                >
                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 500, fontSize: "0.8rem" }}>
                                        {mod}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ── Painel direito — formulário ── */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: theme.palette.mode === "dark" ? "#0F172A" : "#F8FAFC",
                    p: { xs: 3, sm: 5, md: 6 },
                    minHeight: "100vh",
                }}
            >
                <Box sx={{ width: "100%", maxWidth: 400 }}>
                    {/* Logo para mobile */}
                    {isMobile && (
                        <Box sx={{ textAlign: "center", mb: 5 }}>
                            <Box sx={{
                                width: 64, height: 64,
                                borderRadius: "16px",
                                background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mb: 2,
                                boxShadow: "0 8px 24px rgba(79, 70, 229, 0.4)",
                            }}>
                                <Typography sx={{ color: "white", fontWeight: 800, fontSize: "1.2rem" }}>JM</Typography>
                            </Box>
                            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
                                J Monte
                            </Typography>
                        </Box>
                    )}

                    {/* Cabeçalho */}
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{ mb: 0.5, letterSpacing: "-0.03em", color: "text.primary" }}
                    >
                        Bem-vindo! 👋
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        Faça login para acessar o sistema
                    </Typography>

                    {/* Erro */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* Formulário */}
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Usuário"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            autoFocus
                            autoComplete="username"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person sx={{ color: "text.secondary", fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2.5 }}
                        />

                        <TextField
                            fullWidth
                            label="Senha"
                            type={mostrarSenha ? "text" : "password"}
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            disabled={loading}
                            autoComplete="current-password"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock sx={{ color: "text.secondary", fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setMostrarSenha(!mostrarSenha)}
                                            edge="end"
                                            size="small"
                                        >
                                            {mostrarSenha ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 3.5 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                                py: 1.6,
                                fontSize: "1rem",
                                fontWeight: 700,
                                background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                                borderRadius: 2,
                                boxShadow: "0 4px 15px rgba(79, 70, 229, 0.35)",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)",
                                    boxShadow: "0 6px 20px rgba(79, 70, 229, 0.5)",
                                    transform: "translateY(-1px)",
                                },
                                "&:active": {
                                    transform: "translateY(0)",
                                },
                                transition: "all 0.2s ease",
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Entrar"}
                        </Button>
                    </Box>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", textAlign: "center", mt: 4, opacity: 0.6 }}
                    >
                        Acesso restrito ao Grupo J Monte
                    </Typography>
                </Box>
            </Box>
        </Box>
    )
}

export default Login
