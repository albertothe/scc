import type React from "react"
import { Typography, Chip } from "@mui/material"

interface ContadorItensProps {
    quantidade: number
    label?: string
}

const ContadorItens: React.FC<ContadorItensProps> = ({ quantidade, label = "itens encontrados" }) => {
    return (
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
            <Typography variant="subtitle1" style={{ marginRight: 8 }}>
                {label}:
            </Typography>
            <Chip label={quantidade} color="primary" />
        </div>
    )
}

export default ContadorItens
