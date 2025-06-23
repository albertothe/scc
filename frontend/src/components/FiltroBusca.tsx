"use client"

import type React from "react"
import { useState } from "react"
import { TextField, InputAdornment, IconButton } from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"
import ClearIcon from "@mui/icons-material/Clear"

interface FiltroBuscaProps {
    onBuscar: (termo: string) => void
    placeholder?: string
}

const FiltroBusca: React.FC<FiltroBuscaProps> = ({ onBuscar, placeholder = "Buscar por código ou produto..." }) => {
    const [termo, setTermo] = useState("")

    const handleBuscar = () => {
        onBuscar(termo)
    }

    const handleLimpar = () => {
        setTermo("")
        onBuscar("")
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleBuscar()
        }
    }

    return (
        <TextField
            fullWidth
            variant="outlined"
            placeholder={placeholder}
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                ),
                endAdornment: termo ? (
                    <InputAdornment position="end">
                        <IconButton onClick={handleLimpar} edge="end" size="small">
                            <ClearIcon />
                        </IconButton>
                    </InputAdornment>
                ) : null,
            }}
            sx={{ mb: 2 }}
        />
    )
}

export default FiltroBusca
