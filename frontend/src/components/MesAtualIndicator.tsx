import type React from "react"
import { Typography, Chip } from "@mui/material"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface MesAtualIndicatorProps {
    dataCompetencia: Date
}

const MesAtualIndicator: React.FC<MesAtualIndicatorProps> = ({ dataCompetencia }) => {
    // Formatar a data para exibir o nome do mês e o ano
    const mesFormatado = format(dataCompetencia, "MMMM 'de' yyyy", { locale: ptBR })

    return (
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
            <Typography variant="subtitle1" style={{ marginRight: 8 }}>
                Competência atual:
            </Typography>
            <Chip label={mesFormatado.charAt(0).toUpperCase() + mesFormatado.slice(1)} color="primary" variant="outlined" />
        </div>
    )
}

export default MesAtualIndicator
