"use client"

import React from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material"

interface InfoDialogProps {
    open: boolean
    onClose: () => void
    title?: string
    message?: string
}

const InfoDialog: React.FC<InfoDialogProps> = ({ open, onClose, title = "Aviso", message }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained" autoFocus>
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default InfoDialog
