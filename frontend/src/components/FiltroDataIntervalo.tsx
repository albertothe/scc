"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Grid, Typography, Button } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { ptBR } from "date-fns/locale"
import { isValid, isAfter, addDays } from "date-fns"

interface FiltroDataIntervaloProps {
    onFiltrar: (dataInicio: Date | null, dataFim: Date | null) => void
    label?: string
    showQuickFilters?: boolean
}

const FiltroDataIntervalo: React.FC<FiltroDataIntervaloProps> = ({
    onFiltrar,
    label = "Filtrar por data de validade:",
    showQuickFilters = true,
}) => {
    const [dataInicio, setDataInicio] = useState<Date | null>(null)
    const [dataFim, setDataFim] = useState<Date | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Validar datas quando mudarem
    useEffect(() => {
        if (dataInicio && dataFim && isValid(dataInicio) && isValid(dataFim)) {
            if (isAfter(dataInicio, dataFim)) {
                setError("A data inicial não pode ser posterior à data final")
            } else {
                setError(null)
            }
        } else {
            setError(null)
        }
    }, [dataInicio, dataFim])

    const handleFiltrar = () => {
        if (error) return
        onFiltrar(dataInicio, dataFim)
    }

    const handleLimpar = () => {
        setDataInicio(null)
        setDataFim(null)
        onFiltrar(null, null)
    }

    // Filtros rápidos
    const aplicarFiltroRapido = (dias: number) => {
        const hoje = new Date()
        const dataFutura = addDays(hoje, dias)

        setDataInicio(hoje)
        setDataFim(dataFutura)

        // Aplicar filtro imediatamente
        onFiltrar(hoje, dataFutura)
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                        {label}
                    </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                    <DatePicker
                        label="Data inicial"
                        value={dataInicio}
                        onChange={(newValue) => setDataInicio(newValue)}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                variant: "outlined",
                                size: "small",
                                error: !!error,
                                helperText: error,
                            },
                        }}
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <DatePicker
                        label="Data final"
                        value={dataFim}
                        onChange={(newValue) => setDataFim(newValue)}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                variant: "outlined",
                                size: "small",
                            },
                        }}
                    />
                </Grid>

                <Grid item xs={12} md={4} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleFiltrar}
                        disabled={!!error}
                    >
                        Aplicar Filtro
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={handleLimpar}>
                        Limpar
                    </Button>
                </Grid>

                <Grid item xs={12}>
                    {showQuickFilters && (
                        <>
                            <Typography variant="caption" sx={{ mr: 1 }}>
                                Filtros rápidos:
                            </Typography>
                            <Button size="small" variant="outlined" onClick={() => aplicarFiltroRapido(7)} sx={{ mr: 1, mt: 1 }}>
                                Próximos 7 dias
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => aplicarFiltroRapido(15)} sx={{ mr: 1, mt: 1 }}>
                                Próximos 15 dias
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => aplicarFiltroRapido(30)} sx={{ mr: 1, mt: 1 }}>
                                Próximos 30 dias
                            </Button>
                        </>
                    )}
                </Grid>
            </Grid>
        </LocalizationProvider>
    )
}

export default FiltroDataIntervalo
