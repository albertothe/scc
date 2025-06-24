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
import ConfirmacaoExclusao from "../components/ConfirmacaoExclusao"
import InfoDialog from "../components/InfoDialog"
import { useAuth } from "../contexts/AuthContext"
import * as acessoService from "../services/controleAcessoService"
import type { NivelAcesso } from "../types"

const ControleAcessoNiveis: React.FC = () => {
  const [niveis, setNiveis] = useState<NivelAcesso[]>([])
  const [codigo, setCodigo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState<{open:boolean,codigo?:string}>({open:false})
  const [sucesso, setSucesso] = useState(false)
  const { temPermissaoModulo } = useAuth()
  const podeEditar = temPermissaoModulo("controle-acesso", "editar")

  const carregar = async () => {
    try {
      const data = await acessoService.getNiveis()
      setNiveis(data)
    } catch (err) {
      console.error("Erro ao carregar níveis", err)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const limpar = () => {
    setCodigo("")
    setDescricao("")
    setAtivo(true)
    setEditando(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editando) {
        await acessoService.atualizarNivel(editando, { descricao, ativo })
      } else {
        await acessoService.criarNivel({ codigo, descricao, ativo })
      }
      limpar()
      await carregar()
      setSucesso(true)
    } catch (err) {
      console.error("Erro ao salvar nível", err)
    }
  }

  const handleEditar = (nivel: NivelAcesso) => {
    setCodigo(nivel.codigo)
    setDescricao(nivel.descricao)
    setAtivo(nivel.ativo)
    setEditando(nivel.codigo)
  }

  const handleExcluir = (codigo: string) => {
    setConfirmacaoExclusao({ open: true, codigo })
  }

  const confirmarExclusao = async () => {
    if (!confirmacaoExclusao.codigo) return
    await acessoService.excluirNivel(confirmacaoExclusao.codigo)
    setConfirmacaoExclusao({ open: false })
    await carregar()
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Níveis de Acesso</Typography>

      {podeEditar && (
        <Paper sx={{ p:2, mb:3 }}>
          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={2}>
              {!editando && (
                <TextField label="Código" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
              )}
              <TextField label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
              <FormControlLabel control={<Switch checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />} label="Ativo" />
              <Box>
                <Button type="submit" variant="contained">{editando ? "Salvar" : "Criar"}</Button>
                {editando && <Button sx={{ ml:2 }} onClick={limpar}>Cancelar</Button>}
              </Box>
            </Box>
          </form>
        </Paper>
      )}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Ativo</TableCell>
              {podeEditar && <TableCell>Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {niveis.map((nivel) => (
              <TableRow key={nivel.codigo}>
                <TableCell>{nivel.codigo}</TableCell>
                <TableCell>{nivel.descricao}</TableCell>
                <TableCell>{nivel.ativo ? "Sim" : "Não"}</TableCell>
                {podeEditar && (
                  <TableCell>
                    <Button onClick={() => handleEditar(nivel)}>Editar</Button>
                    <Button onClick={() => handleExcluir(nivel.codigo)}>Excluir</Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <ConfirmacaoExclusao
        open={confirmacaoExclusao.open}
        onClose={() => setConfirmacaoExclusao({ open: false })}
        onConfirm={confirmarExclusao}
        itemNome="nível"
      />
      <InfoDialog
        open={sucesso}
        onClose={() => setSucesso(false)}
        title="Sucesso"
        message="Registro salvo com sucesso"
      />
    </Box>
  )
}

export default ControleAcessoNiveis
