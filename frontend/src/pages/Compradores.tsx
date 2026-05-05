import { Box, Button, Switch, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { criarComprador, excluirComprador, listarCompradores } from "../services/compradoresService"

export default function Compradores() {
  const [nome, setNome] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [itens, setItens] = useState<any[]>([])
  const carregar = async () => setItens(await listarCompradores())
  useEffect(() => { carregar() }, [])

  return <Box>
    <Typography variant="h5">Compradores</Typography>
    <Box sx={{ display: "flex", gap: 2, my: 2 }}>
      <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      <Box sx={{ display: "flex", alignItems: "center" }}>Ativo <Switch checked={ativo} onChange={(_, v) => setAtivo(v)} /></Box>
      <Button variant="contained" onClick={async () => { await criarComprador({ nome, ativo }); setNome(""); carregar() }}>Salvar</Button>
    </Box>
    {itens.map((c) => <Box key={c.id} sx={{ display: "flex", gap: 2, py: 1 }}>
      <Typography>{c.nome}</Typography><Typography>{c.ativo ? "Ativo" : "Inativo"}</Typography>
      <Button color="error" onClick={async () => { await excluirComprador(c.id); carregar() }}>Excluir</Button>
    </Box>)}
  </Box>
}
