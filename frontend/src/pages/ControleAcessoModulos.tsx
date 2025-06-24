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
  Button,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material"
import { useAuth } from "../contexts/AuthContext"
import * as acessoService from "../services/controleAcessoService"
import type { Modulo } from "../types"

const ControleAcessoModulos: React.FC = () => {
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [nome, setNome] = useState("")
  const [rota, setRota] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [editId, setEditId] = useState<number | null>(null)
  const { temPermissaoModulo } = useAuth()
  const podeEditar = temPermissaoModulo("controle-acesso", "editar")

  const carregar = async () => {
    try {
      const data = await acessoService.getModulos()
      setModulos(data)
    } catch (err) {
      console.error("Erro ao carregar módulos", err)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const limpar = () => {
    setNome("")
    setRota("")
    setAtivo(true)
    setEditId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editId) {
        await acessoService.atualizarModulo(editId, { nome, rota, ativo })
      } else {
        await acessoService.criarModulo({ nome, rota, ativo })
      }
      limpar()
      await carregar()
    } catch (err) {
      console.error("Erro ao salvar módulo", err)
    }
  }

  const handleEditar = (m: Modulo) => {
    setNome(m.nome)
    setRota(m.rota)
    setAtivo(m.ativo)
    setEditId(m.id)
  }

  const handleExcluir = async (id: number) => {
    if (!window.confirm("Excluir módulo?")) return
    await acessoService.excluirModulo(id)
    await carregar()
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Módulos</Typography>

      {podeEditar && (
        <Paper sx={{ p:2, mb:3 }}>
          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <TextField label="Rota" value={rota} onChange={(e) => setRota(e.target.value)} required />
              <FormControlLabel control={<Switch checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />} label="Ativo" />
              <Box>
                <Button type="submit" variant="contained">{editId ? "Salvar" : "Criar"}</Button>
                {editId && <Button sx={{ ml:2 }} onClick={limpar}>Cancelar</Button>}
              </Box>
            </Box>
          </form>
        </Paper>
      )}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Rota</TableCell>
              <TableCell>Ativo</TableCell>
              {podeEditar && <TableCell>Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {modulos.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.nome}</TableCell>
                <TableCell>{m.rota}</TableCell>
                <TableCell>{m.ativo ? "Sim" : "Não"}</TableCell>
                {podeEditar && (
                  <TableCell>
                    <Button onClick={() => handleEditar(m)}>Editar</Button>
                    <Button onClick={() => handleExcluir(m.id)}>Excluir</Button>
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

export default ControleAcessoModulos
