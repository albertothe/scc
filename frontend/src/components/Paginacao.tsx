"use client"

import type React from "react"
import {
    Pagination,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    type SelectChangeEvent,
    Box,
} from "@mui/material"

interface PaginacaoProps {
    count: number
    page: number
    rowsPerPage: number
    onPageChange: (page: number) => void
    onRowsPerPageChange: (rowsPerPage: number) => void
}

const Paginacao: React.FC<PaginacaoProps> = ({ count, page, rowsPerPage, onPageChange, onRowsPerPageChange }) => {
    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        onPageChange(value)
    }

    const handleRowsPerPageChange = (event: SelectChangeEvent) => {
        onRowsPerPageChange(Number(event.target.value))
    }

    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, mb: 2 }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="rows-per-page-label">Itens por página</InputLabel>
                <Select
                    labelId="rows-per-page-label"
                    value={rowsPerPage.toString()}
                    onChange={handleRowsPerPageChange}
                    label="Itens por página"
                >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                </Select>
            </FormControl>

            <Stack spacing={2}>
                <Pagination
                    count={Math.ceil(count / rowsPerPage)}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                />
            </Stack>
        </Box>
    )
}

export default Paginacao
