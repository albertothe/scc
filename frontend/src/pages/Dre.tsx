"use client"

import { useCallback, useState } from "react"
import { Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material"
import type { DreRegistro } from "../types"
import { atualizarDre, getDre } from "../services/dreService"
import { useAuth } from "../contexts/AuthContext"

const Dre: React.FC = () => {
  const [registros, setRegistros] = useState<DreRegistro[]>([])
  const [filtros, setFiltros] = useState({ ano: "", mes: "", descricao: "" })
  const [carregando, setCarregando] = useState(false)
  const [filtroAplicado, setFiltroAplicado] = useState(false)
  const { temPermissaoModulo } = useAuth()
  const podeEditar = temPermissaoModulo("dre", "editar")

  const carregar = useCallback(async () => {
    if (!filtros.ano || !filtros.mes) {
      setFiltroAplicado(false)
      setRegistros([])
      return
    }

    setCarregando(true)
    try {
      const data = await getDre({
        ano: filtros.ano || undefined,
        mes: filtros.mes || undefined,
        descricao: filtros.descricao || undefined,
      })
      setRegistros(data)
      setFiltroAplicado(true)
    } catch (error) {
      console.error("Erro ao carregar DRE", error)
    } finally {
      setCarregando(false)
    }
  }, [filtros.ano, filtros.descricao, filtros.mes])

  const alterarValor = (index: number, campo: "realizado" | "orcado", valor: string) => {
    setRegistros((prev) =>
      prev.map((registro, i) =>
        i === index
          ? {
              ...registro,
              [campo]: valor === "" ? null : Number(valor),
            }
          : registro,
      ),
    )
  }

  const salvarLinha = async (registro: DreRegistro) => {
    try {
      await atualizarDre(registro.sequencial, {
        ano: registro.ano,
        mes: registro.mes,
        realizado: registro.realizado,
        orcado: registro.orcado,
      })
    } catch (error) {
      console.error("Erro ao salvar linha DRE", error)
    }
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        DRE
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField label="Ano" value={filtros.ano} onChange={(e) => setFiltros((prev) => ({ ...prev, ano: e.target.value }))} />
          <TextField label="Mês" value={filtros.mes} onChange={(e) => setFiltros((prev) => ({ ...prev, mes: e.target.value }))} />
          <TextField
            label="Descrição"
            value={filtros.descricao}
            onChange={(e) => setFiltros((prev) => ({ ...prev, descricao: e.target.value }))}
          />
          <Button variant="contained" onClick={carregar} disabled={carregando || !filtros.ano || !filtros.mes}>
            Filtrar
          </Button>
        </Box>
      </Paper>

      <Paper>
        {!filtroAplicado && (
          <Box p={2}>
            <Typography variant="body2" color="text.secondary">
              Informe ano e mês e clique em filtrar para carregar os dados da DRE.
            </Typography>
          </Box>
        )}

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Sequencial</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Subdescrição</TableCell>
              <TableCell>Ano</TableCell>
              <TableCell>Mês</TableCell>
              <TableCell>Realizado</TableCell>
              <TableCell>Orçado</TableCell>
              {podeEditar && <TableCell>Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {registros.map((registro, index) => (
              <TableRow key={`${registro.sequencial}-${registro.ano}-${registro.mes}`}>
                <TableCell>{registro.sequencial}</TableCell>
                <TableCell>{registro.descricao}</TableCell>
                <TableCell>{registro.subdescricao || "-"}</TableCell>
                <TableCell>{registro.ano}</TableCell>
                <TableCell>{registro.mes}</TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={registro.realizado ?? ""}
                    onChange={(e) => alterarValor(index, "realizado", e.target.value)}
                    disabled={!podeEditar}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={registro.orcado ?? ""}
                    onChange={(e) => alterarValor(index, "orcado", e.target.value)}
                    disabled={!podeEditar}
                  />
                </TableCell>
                {podeEditar && (
                  <TableCell>
                    <Button variant="outlined" onClick={() => salvarLinha(registro)}>
                      Salvar
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}

export default Dre
