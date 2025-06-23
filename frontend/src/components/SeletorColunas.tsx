"use client"

import type React from "react"
import {
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Tooltip,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material"
import SettingsIcon from "@mui/icons-material/Settings"
import RestoreIcon from "@mui/icons-material/Restore"
import { useState, useEffect } from "react"

export interface ColunasConfig {
    id: string
    label: string
    visible: boolean
    required?: boolean
}

export interface SeletorColunasProps {
    colunas: ColunasConfig[]
    onChange: (colunas: ColunasConfig[]) => void
    storageKey: string
}

const SeletorColunas: React.FC<SeletorColunasProps> = ({ colunas, onChange, storageKey }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [colunasState, setColunasState] = useState<ColunasConfig[]>(colunas)

    // Carregar configurações salvas do localStorage
    useEffect(() => {
        const savedConfig = localStorage.getItem(storageKey)
        if (savedConfig) {
            try {
                const parsedConfig = JSON.parse(savedConfig) as ColunasConfig[]

                // Mesclar configurações salvas com as colunas atuais
                // Isso garante que novas colunas adicionadas ao código também apareçam
                const mergedConfig = colunas.map((coluna) => {
                    const savedColuna = parsedConfig.find((c) => c.id === coluna.id)
                    return savedColuna ? { ...coluna, visible: savedColuna.visible } : coluna
                })

                setColunasState(mergedConfig)
                onChange(mergedConfig)
            } catch (error) {
                console.error("Erro ao carregar configurações de colunas:", error)
            }
        }
    }, [storageKey, colunas, onChange])

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleOpenDialog = () => {
        setDialogOpen(true)
        handleClose()
    }

    const handleCloseDialog = () => {
        setDialogOpen(false)
    }

    const handleToggleColuna = (id: string) => {
        const newColunas = colunasState.map((coluna) =>
            coluna.id === id && !coluna.required ? { ...coluna, visible: !coluna.visible } : coluna,
        )
        setColunasState(newColunas)
    }

    const handleSalvar = () => {
        // Salvar no localStorage
        localStorage.setItem(storageKey, JSON.stringify(colunasState))

        // Notificar o componente pai
        onChange(colunasState)

        handleCloseDialog()
    }

    const handleRestaurarPadrao = () => {
        // Restaurar para configuração padrão (todas visíveis)
        const defaultColunas = colunas.map((coluna) => ({ ...coluna, visible: true }))
        setColunasState(defaultColunas)
    }

    // Verificar se há pelo menos uma coluna visível além das obrigatórias
    const hasVisibleColumns = colunasState.some((coluna) => coluna.visible && !coluna.required)
    const requiredColumns = colunasState.filter((coluna) => coluna.required).length
    const visibleColumns = colunasState.filter((coluna) => coluna.visible).length

    return (
        <>
            <Tooltip title="Configurar colunas">
                <IconButton onClick={handleClick} size="small">
                    <SettingsIcon />
                </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                <MenuItem onClick={handleOpenDialog}>
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Configurar colunas</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleRestaurarPadrao}>
                    <ListItemIcon>
                        <RestoreIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Restaurar padrão</ListItemText>
                </MenuItem>
            </Menu>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Configurar colunas visíveis</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Selecione as colunas que deseja exibir na tabela.
                    </Typography>

                    <FormGroup>
                        {colunasState.map((coluna) => (
                            <FormControlLabel
                                key={coluna.id}
                                control={
                                    <Checkbox
                                        checked={coluna.visible}
                                        onChange={() => handleToggleColuna(coluna.id)}
                                        disabled={coluna.required}
                                    />
                                }
                                label={
                                    <Typography variant="body2">
                                        {coluna.label}{" "}
                                        {coluna.required && <span style={{ color: "gray", fontSize: "0.8em" }}>(obrigatório)</span>}
                                    </Typography>
                                }
                            />
                        ))}
                    </FormGroup>

                    {visibleColumns - requiredColumns === 0 && (
                        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                            Selecione pelo menos uma coluna para exibir.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSalvar} variant="contained" disabled={visibleColumns - requiredColumns === 0}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default SeletorColunas
