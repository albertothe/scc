"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, useMemo } from "react"
import { ThemeProvider as MuiThemeProvider, createTheme, type Theme } from "@mui/material/styles"
import { ptBR } from "@mui/material/locale"
import CssBaseline from "@mui/material/CssBaseline"

type ThemeContextType = {
    darkMode: boolean
    toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType>({
    darkMode: false,
    toggleDarkMode: () => {}
})

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Usar preferência salva ou padrão claro
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const savedMode = localStorage.getItem("darkMode")
            if (savedMode !== null) {
                return savedMode === "true"
            }
        }
        return false
    })

    // Criar os temas com base no modo atual
    const theme = useMemo<Theme>(() => {
        return createTheme(
            {
                palette: {
                    mode: darkMode ? "dark" : "light",
                    primary: {
                        main: darkMode ? "#90caf9" : "#1976d2", // Azul mais claro no modo escuro
                    },
                    secondary: {
                        main: darkMode ? "#f48fb1" : "#dc004e", // Rosa mais claro no modo escuro
                    },
                    background: {
                        default: darkMode ? "#121212" : "#f5f5f5",
                        paper: darkMode ? "#1e1e1e" : "#ffffff",
                    },
                    text: {
                        primary: darkMode ? "#ffffff" : "rgba(0, 0, 0, 0.87)",
                        secondary: darkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                    },
                },
                components: {
                    MuiTableRow: {
                        styleOverrides: {
                            root: {
                                "&:nth-of-type(odd)": {
                                    backgroundColor: darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                                },
                            },
                        },
                    },
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                transition: "background-color 0.3s ease",
                            },
                        },
                    },
                },
            },
            ptBR,
        )
    }, [darkMode])

    // Alternar entre temas
    const toggleDarkMode = () => {
        setDarkMode((prevMode) => !prevMode)
    }

    // Salvar preferência quando mudar
    useEffect(() => {
        localStorage.setItem("darkMode", String(darkMode))
    }, [darkMode])

    // Sincronizar com mudanças na preferência do sistema
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleChange = (e: MediaQueryListEvent) => {
            // Só atualizar automaticamente se o usuário não tiver definido uma preferência
            if (localStorage.getItem("darkMode") === null) {
                setDarkMode(e.matches)
            }
        }

        // Adicionar listener para mudanças na preferência do sistema
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleChange)
            return () => mediaQuery.removeEventListener("change", handleChange)
        } else {
            // Fallback para navegadores mais antigos
            mediaQuery.addListener(handleChange)
            return () => mediaQuery.removeListener(handleChange)
        }
    }, [])

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    )
}

export const useThemeMode = () => useContext(ThemeContext)
