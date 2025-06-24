"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material"
import InfoDialog from "../components/InfoDialog"
import { useAuth } from "../contexts/AuthContext"
import * as acessoService from "../services/controleAcessoService"
import type { NivelAcesso, Modulo, PermissaoNivel } from "../types"

const ControleAcessoPermissoes: React.FC = () => {
  const [niveis, setNiveis] = useState<NivelAcesso[]>([])
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [nivelSel, setNivelSel] = useState<string>("")
  const [permissoes, setPermissoes] = useState<Record<number, PermissaoNivel>>({})
  const [sucesso, setSucesso] = useState(false)
  const { temPermissaoModulo } = useAuth()
  const podeEditar = temPermissaoModulo("controle-acesso", "editar")

  useEffect(() => {
    const carregar = async () => {
      setNiveis(await acessoService.getNiveis())
      setModulos(await acessoService.getModulos())
    }
    carregar()
  }, [])

  useEffect(() => {
    const carregarPerm = async () => {
      if (!nivelSel) return
      const lista = await acessoService.getPermissoes(nivelSel)
      const map: Record<number, PermissaoNivel> = {}
      lista.forEach((p) => { map[p.id_modulo] = p })
      setPermissoes(map)
    }
    carregarPerm()
  }, [nivelSel])

  const handleChange = (id: number, campo: keyof PermissaoNivel, valor: boolean) => {
    setPermissoes((prev) => ({
      ...prev,
      [id]: { ...prev[id], id_modulo: id, codigo_nivel: nivelSel, [campo]: valor },
    }))
  }

  const handleSalvar = async () => {
    const lista = Object.values(permissoes)
    await acessoService.salvarPermissoes(nivelSel, lista)
    setSucesso(true)
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Permissões</Typography>

      <FormControl fullWidth sx={{ mb:3 }}>
        <InputLabel id="nivel-label">Nível</InputLabel>
        <Select labelId="nivel-label" value={nivelSel} label="Nível" onChange={(e) => setNivelSel(e.target.value as string)}>
          {niveis.map((n) => (
            <MenuItem key={n.codigo} value={n.codigo}>{n.descricao}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {nivelSel && (
        <Paper sx={{ p:2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Módulo</TableCell>
                <TableCell>Visualizar</TableCell>
                <TableCell>Incluir</TableCell>
                <TableCell>Editar</TableCell>
                <TableCell>Excluir</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {modulos.map((m) => {
                const p = permissoes[m.id] || { codigo_nivel: nivelSel, id_modulo: m.id, visualizar: false, incluir: false, editar: false, excluir: false }
                return (
                  <TableRow key={m.id}>
                    <TableCell>{m.nome}</TableCell>
                    <TableCell><Checkbox checked={p.visualizar} onChange={(e) => handleChange(m.id, "visualizar", e.target.checked)} /></TableCell>
                    <TableCell><Checkbox checked={p.incluir} onChange={(e) => handleChange(m.id, "incluir", e.target.checked)} /></TableCell>
                    <TableCell><Checkbox checked={p.editar} onChange={(e) => handleChange(m.id, "editar", e.target.checked)} /></TableCell>
                    <TableCell><Checkbox checked={p.excluir} onChange={(e) => handleChange(m.id, "excluir", e.target.checked)} /></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {podeEditar && (
            <Box mt={2}>
              <Button variant="contained" onClick={handleSalvar}>Salvar</Button>
            </Box>
          )}
        </Paper>
      )}
      <InfoDialog
        open={sucesso}
        onClose={() => setSucesso(false)}
        title="Sucesso"
        message="Permissões salvas com sucesso"
      />
    </Box>
  )
}

export default ControleAcessoPermissoes
