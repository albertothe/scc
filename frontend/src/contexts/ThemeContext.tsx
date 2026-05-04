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
    toggleDarkMode: () => {},
})

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const savedMode = localStorage.getItem("darkMode")
            if (savedMode !== null) return savedMode === "true"
        }
        return false
    })

    const theme = useMemo<Theme>(() => {
        return createTheme(
            {
                shape: {
                    borderRadius: 8,
                },
                typography: {
                    fontFamily: [
                        "-apple-system",
                        "BlinkMacSystemFont",
                        '"Segoe UI"',
                        "Roboto",
                        '"Helvetica Neue"',
                        "Arial",
                        "sans-serif",
                    ].join(","),
                    h4: { fontWeight: 700 },
                    h5: { fontWeight: 700 },
                    h6: { fontWeight: 600 },
                    subtitle1: { fontWeight: 500 },
                },
                palette: {
                    mode: darkMode ? "dark" : "light",
                    primary: {
                        main: darkMode ? "#818CF8" : "#4F46E5",
                        light: darkMode ? "#A5B4FC" : "#6366F1",
                        dark: darkMode ? "#6366F1" : "#4338CA",
                        contrastText: "#FFFFFF",
                    },
                    secondary: {
                        main: darkMode ? "#38BDF8" : "#0EA5E9",
                        contrastText: "#FFFFFF",
                    },
                    background: {
                        default: darkMode ? "#0F172A" : "#F1F5F9",
                        paper: darkMode ? "#1E293B" : "#FFFFFF",
                    },
                    text: {
                        primary: darkMode ? "#F1F5F9" : "#0F172A",
                        secondary: darkMode ? "#94A3B8" : "#64748B",
                    },
                    divider: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                },
                components: {
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                textTransform: "none",
                                fontWeight: 600,
                                borderRadius: 8,
                            },
                            containedPrimary: {
                                boxShadow: "0 1px 3px rgba(79, 70, 229, 0.3)",
                                "&:hover": {
                                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
                                },
                            },
                        },
                    },
                    MuiOutlinedInput: {
                        styleOverrides: {
                            root: {
                                borderRadius: 8,
                            },
                        },
                    },
                    MuiCard: {
                        styleOverrides: {
                            root: {
                                borderRadius: 12,
                                boxShadow: darkMode
                                    ? "0 1px 3px rgba(0,0,0,0.3)"
                                    : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.08)",
                            },
                        },
                    },
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                transition: "background-color 0.3s ease",
                                backgroundImage: "none",
                            },
                            elevation1: {
                                boxShadow: darkMode
                                    ? "0 1px 3px rgba(0,0,0,0.3)"
                                    : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.08)",
                            },
                            elevation3: {
                                boxShadow: darkMode
                                    ? "0 4px 16px rgba(0,0,0,0.4)"
                                    : "0 4px 16px rgba(0,0,0,0.08)",
                            },
                        },
                    },
                    MuiChip: {
                        styleOverrides: {
                            root: {
                                fontWeight: 500,
                            },
                        },
                    },
                    MuiTableRow: {
                        styleOverrides: {
                            root: {
                                "&:nth-of-type(odd)": {
                                    backgroundColor: darkMode
                                        ? "rgba(255, 255, 255, 0.03)"
                                        : "rgba(0, 0, 0, 0.015)",
                                },
                                "&:hover": {
                                    backgroundColor: darkMode
                                        ? "rgba(255, 255, 255, 0.05) !important"
                                        : "rgba(79, 70, 229, 0.04) !important",
                                },
                            },
                        },
                    },
                    MuiTableHead: {
                        styleOverrides: {
                            root: {
                                "& .MuiTableCell-head": {
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    color: darkMode ? "#94A3B8" : "#64748B",
                                    backgroundColor: darkMode ? "#1E293B" : "#F8FAFC",
                                },
                            },
                        },
                    },
                    MuiAlert: {
                        styleOverrides: {
                            root: {
                                borderRadius: 8,
                            },
                        },
                    },
                    MuiDialog: {
                        styleOverrides: {
                            paper: {
                                borderRadius: 16,
                            },
                        },
                    },
                },
            },
            ptBR,
        )
    }, [darkMode])

    const toggleDarkMode = () => setDarkMode((prev) => !prev)

    useEffect(() => {
        localStorage.setItem("darkMode", String(darkMode))
    }, [darkMode])

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleChange = (e: MediaQueryListEvent) => {
            if (localStorage.getItem("darkMode") === null) setDarkMode(e.matches)
        }
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleChange)
            return () => mediaQuery.removeEventListener("change", handleChange)
        } else {
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
