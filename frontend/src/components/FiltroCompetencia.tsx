"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button, Grid, Paper, Typography, Box } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { ptBR } from "date-fns/locale"
import { format, startOfMonth, parse } from "date-fns"

interface FiltroCompetenciaProps {
  onFiltrar?: (mesAno: string, dataExibicao: Date) => void
  onChange?: (mesAno: string) => void
  dataInicial?: Date
  competencia?: string
  label?: string
  sx?: React.CSSProperties | any
}

const FiltroCompetencia: React.FC<FiltroCompetenciaProps> = ({
  onFiltrar,
  onChange,
  dataInicial,
  competencia,
  label = "Selecione a competência",
  sx,
}) => {
  // Inicializar com a competência fornecida, ou maio de 2025 como padrão
  const [data, setData] = useState<Date | null>(() => {
    // Se competencia for fornecida, use-a
    if (competencia) {
      return parse(competencia, "yyyy-MM-dd", new Date())
    }

    // Se dataInicial for fornecida, use-a
    if (dataInicial) return dataInicial

    // Caso contrário, use maio de 2025 como padrão
    const dataPadrao = new Date(2025, 4, 1) // Maio é mês 4 (0-indexed)
    return dataPadrao
  })

  // Efeito para atualizar o filtro quando a data inicial ou competência mudar
  useEffect(() => {
    if (competencia) {
      const parsedDate = parse(competencia, "yyyy-MM-dd", new Date())
      setData(parsedDate)
    } else if (dataInicial) {
      setData(dataInicial)
    }
  }, [dataInicial, competencia])

  // Efeito para aplicar o filtro inicial automaticamente quando o componente montar
  useEffect(() => {
    if (data) {
      handleFiltrar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFiltrar = () => {
    if (data) {
      // Garantir que estamos usando o primeiro dia do mês
      const primeiroDiaDoMes = startOfMonth(data)

      // Formatamos a data para o backend (YYYY-MM-DD)
      const mesAnoFormatado = format(primeiroDiaDoMes, "yyyy-MM-dd")

      console.log("FiltroCompetencia - Aplicando filtro para:", mesAnoFormatado)
      console.log("FiltroCompetencia - Data objeto:", primeiroDiaDoMes)
      console.log("FiltroCompetencia - Mês selecionado:", primeiroDiaDoMes.getMonth() + 1) // +1 porque getMonth() retorna 0-11
      console.log("FiltroCompetencia - Ano selecionado:", primeiroDiaDoMes.getFullYear())

      // Passamos tanto a string formatada quanto o objeto Date para o componente pai
      if (onFiltrar) {
        onFiltrar(mesAnoFormatado, primeiroDiaDoMes)
      }

      // Se tiver o callback onChange, chama ele também
      if (onChange) {
        onChange(mesAnoFormatado)
      }
    }
  }

  // Se for usado com sx prop, renderiza uma versão mais compacta
  if (sx) {
    return (
      <Box sx={sx}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <DatePicker
            label={label}
            value={data}
            onChange={(newValue) => {
              if (newValue) {
                setData(newValue)
                // Atualiza imediatamente quando usado com sx prop
                setTimeout(() => {
                  if (newValue) {
                    const primeiroDiaDoMes = startOfMonth(newValue)
                    const mesAnoFormatado = format(primeiroDiaDoMes, "yyyy-MM-dd")
                    if (onChange) {
                      onChange(mesAnoFormatado)
                    }
                    if (onFiltrar) {
                      onFiltrar(mesAnoFormatado, primeiroDiaDoMes)
                    }
                  }
                }, 0)
              }
            }}
            views={["year", "month"]}
            slotProps={{
              textField: {
                fullWidth: true,
                variant: "outlined",
                size: "small",
              },
            }}
          />
        </LocalizationProvider>
      </Box>
    )
  }

  // Versão original com Paper e botão
  return (
    <Paper elevation={3} style={{ padding: 16, marginBottom: 16 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>
            {label}:
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <DatePicker
              label="Competência (Mês/Ano)"
              value={data}
              onChange={(newValue) => {
                if (newValue) {
                  console.log("FiltroCompetencia - Data selecionada:", newValue)
                  console.log("FiltroCompetencia - Mês selecionado:", newValue.getMonth() + 1) // +1 porque getMonth() retorna 0-11
                  console.log("FiltroCompetencia - Ano selecionado:", newValue.getFullYear())
                  setData(newValue)
                }
              }}
              views={["year", "month"]}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "outlined",
                },
              }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={6}>
          <Button variant="contained" color="primary" onClick={handleFiltrar} fullWidth style={{ marginTop: "24px" }}>
            Filtrar
          </Button>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default FiltroCompetencia
