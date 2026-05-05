import { Box, Button, MenuItem, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { listarCompradores, listarMetasCompradores, salvarMetaComprador } from "../services/compradoresService"

export default function CompradoresMetas() {
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [compradorId, setCompradorId] = useState("")
  const [compradores, setCompradores] = useState<any[]>([])
  const [metas, setMetas] = useState<any[]>([])
  const carregar = async () => {
    setMetas(await listarMetasCompradores({ ano, mes, comprador_id: compradorId || undefined }))
    setCompradores(await listarCompradores())
  }
  useEffect(() => { carregar() }, [])

  return <Box>
    <Typography variant="h5">Metas de Compradores</Typography>
    <Box sx={{ display: "flex", gap: 2, my: 2 }}>
      <TextField label="Ano" type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} />
      <TextField label="Mês" type="number" value={mes} onChange={(e) => setMes(Number(e.target.value))} />
      <TextField select label="Comprador" value={compradorId} onChange={(e) => setCompradorId(e.target.value)} sx={{ minWidth: 250 }}>
        <MenuItem value="">Todos</MenuItem>
        {compradores.map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
      </TextField>
      <Button variant="outlined" onClick={carregar}>Filtrar</Button>
    </Box>
    {metas.map((m) => <Box key={m.id} sx={{ display: "flex", gap: 1, my: 1 }}>
      <Typography sx={{ minWidth: 90 }}>{m.codgrp}</Typography>
      <TextField size="small" label="Vendas" defaultValue={m.meta_vendas} onBlur={async (e) => await salvarMetaComprador({ ...m, meta_vendas: Number(e.target.value) })} />
      <TextField size="small" label="LB" defaultValue={m.meta_lb} onBlur={async (e) => await salvarMetaComprador({ ...m, meta_lb: Number(e.target.value) })} />
      <TextField size="small" label="Evolução" defaultValue={m.meta_evolucao} onBlur={async (e) => await salvarMetaComprador({ ...m, meta_evolucao: Number(e.target.value) })} />
      <TextField size="small" label="Nível Serviço" defaultValue={m.meta_nivel_servico} onBlur={async (e) => await salvarMetaComprador({ ...m, meta_nivel_servico: Number(e.target.value) })} />
      <TextField size="small" label="Dias Estoque" defaultValue={m.meta_dias_estoque} onBlur={async (e) => await salvarMetaComprador({ ...m, meta_dias_estoque: Number(e.target.value) })} />
      <TextField size="small" label="Prod. Fora" defaultValue={m.meta_produtos_fora} onBlur={async (e) => await salvarMetaComprador({ ...m, meta_produtos_fora: Number(e.target.value) })} />
    </Box>)}
  </Box>
}
