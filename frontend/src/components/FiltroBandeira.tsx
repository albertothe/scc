"use client"

import type React from "react"
import { FormControl, InputLabel, Select, MenuItem, type SelectChangeEvent } from "@mui/material"

interface FiltroBandeiraProps {
    valor: string
    onChange: (valor: string) => void
}

const FiltroBandeira: React.FC<FiltroBandeiraProps> = ({ valor, onChange }) => {
    const handleChange = (event: SelectChangeEvent) => {
        onChange(event.target.value as string)
    }

    return (
        <FormControl fullWidth>
            <InputLabel id="filtro-etiqueta-label">Filtrar por Etiqueta</InputLabel>
            <Select
                labelId="filtro-etiqueta-label"
                id="filtro-etiqueta"
                value={valor}
                label="Filtrar por Etiqueta"
                onChange={handleChange}
            >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="verde">Verde</MenuItem>
                <MenuItem value="vermelha">Vermelha</MenuItem>
            </Select>
        </FormControl>
    )
}

export default FiltroBandeira
