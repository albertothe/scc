"use client"

import type React from "react"
import { FormControl, InputLabel, Select, MenuItem, type SelectChangeEvent } from "@mui/material"

interface FiltroSelectProps {
    label: string
    valor: string
    opcoes: string[]
    onChange: (valor: string) => void
}

const FiltroSelect: React.FC<FiltroSelectProps> = ({ label, valor, opcoes, onChange }) => {
    const handleChange = (event: SelectChangeEvent) => {
        onChange(event.target.value)
    }

    return (
        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel id={`filtro-${label.toLowerCase()}-label`}>{label}</InputLabel>
            <Select labelId={`filtro-${label.toLowerCase()}-label`} value={valor} label={label} onChange={handleChange}>
                <MenuItem value="">Todos</MenuItem>
                {opcoes.map((opcao) => (
                    <MenuItem key={opcao} value={opcao}>
                        {opcao}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

export default FiltroSelect
