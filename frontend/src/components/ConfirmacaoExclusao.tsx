"use client"

import type React from "react"
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Typography,
} from "@mui/material"
import WarningIcon from "@mui/icons-material/Warning"

interface ConfirmacaoExclusaoProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    titulo?: string
    mensagem?: string
    itemNome?: string
}

const ConfirmacaoExclusao: React.FC<ConfirmacaoExclusaoProps> = ({
    open,
    onClose,
    onConfirm,
    titulo = "Confirmar Exclusão",
    mensagem = "Tem certeza que deseja excluir este item?",
    itemNome,
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WarningIcon color="warning" />
                <Typography component="span">{titulo}</Typography>
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {mensagem}
                    {itemNome && (
                        <Typography component="span" fontWeight="bold">
                            {" "}
                            "{itemNome}"
                        </Typography>
                    )}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancelar
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
                    Excluir
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ConfirmacaoExclusao
