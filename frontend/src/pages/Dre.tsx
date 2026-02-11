"use client"

import { useCallback, useState } from "react"
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material"
import type { DreRegistro } from "../types"
import { atualizarDre, getDre } from "../services/dreService"
import { useAuth } from "../contexts/AuthContext"

const Dre: React.FC = () => {
  const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const [registros, setRegistros] = useState<DreRegistro[]>([])
  const [registrosBase, setRegistrosBase] = useState<DreRegistro[]>([])
  const [opcoesDescricao, setOpcoesDescricao] = useState<string[]>([])
  const [filtros, setFiltros] = useState({ ano: "", mes: "", descricao: "" })
  const [carregando, setCarregando] = useState(false)
  const [filtroAplicado, setFiltroAplicado] = useState(false)
  const [valoresEditando, setValoresEditando] = useState<Record<string, string>>({})
  const { temPermissaoModulo } = useAuth()
  const podeEditar = temPermissaoModulo("dre", "editar")

  const getRegistroKey = (registro: DreRegistro, campo: "realizado" | "orcado") =>
    `${registro.sequencial}-${registro.ano}-${registro.mes}-${campo}`

  const formatarParaEdicao = (valor: number | null) => {
    if (valor === null) {
      return ""
    }

    return valor.toFixed(2).replace(".", ",")
  }

  const normalizarEntradaMoeda = (valor: string) => {
    const apenasPermitidos = valor.replace(/[^\d,]/g, "")
    const [parteInteira, ...partesDecimais] = apenasPermitidos.split(",")
    const parteDecimal = partesDecimais.join("").slice(0, 2)

    if (partesDecimais.length === 0) {
      return parteInteira
    }

    return `${parteInteira},${parteDecimal}`
  }

  const aplicarFiltroDescricao = useCallback((dados: DreRegistro[], descricao: string) => {
    if (!descricao) {
      return dados
    }

    return dados.filter((registro) => registro.descricao === descricao)
  }, [])

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
      })
      const descricoes = [...new Set(data.map((registro) => registro.descricao))].sort((a, b) => a.localeCompare(b))

      setRegistrosBase(data)
      setOpcoesDescricao(descricoes)
      setRegistros(aplicarFiltroDescricao(data, filtros.descricao))
      setValoresEditando({})
      setFiltroAplicado(true)
    } catch (error) {
      console.error("Erro ao carregar DRE", error)
    } finally {
      setCarregando(false)
    }
  }, [aplicarFiltroDescricao, filtros.ano, filtros.descricao, filtros.mes])

  const alterarDescricao = (descricao: string) => {
    setFiltros((prev) => ({ ...prev, descricao }))

    if (filtroAplicado) {
      setRegistros(aplicarFiltroDescricao(registrosBase, descricao))
    }
  }

  const alterarValor = (index: number, campo: "realizado" | "orcado", valor: string) => {
    const valorNormalizado = normalizarEntradaMoeda(valor)
    const valorSemMascara = valorNormalizado.replace(",", ".")
    const valorConvertido = valorSemMascara === "" ? null : Number(valorSemMascara)

    if (valorSemMascara !== "" && Number.isNaN(valorConvertido)) {
      return
    }

    setValoresEditando((prev) => {
      const registro = registros[index]

      if (!registro) {
        return prev
      }

      return {
        ...prev,
        [getRegistroKey(registro, campo)]: valorNormalizado,
      }
    })

    setRegistros((prev) =>
      prev.map((registro, i) =>
        i === index
          ? {
              ...registro,
              [campo]: valorConvertido,
            }
          : registro,
      ),
    )
  }

  const iniciarEdicaoValor = (registro: DreRegistro, campo: "realizado" | "orcado") => {
    setValoresEditando((prev) => ({
      ...prev,
      [getRegistroKey(registro, campo)]: formatarParaEdicao(registro[campo]),
    }))
  }

  const finalizarEdicaoValor = (registro: DreRegistro, campo: "realizado" | "orcado") => {
    const chave = getRegistroKey(registro, campo)

    setValoresEditando((prev) => {
      if (!(chave in prev)) {
        return prev
      }

      const next = { ...prev }
      delete next[chave]
      return next
    })
  }

  const formatarValor = (valor: number | null) => {
    if (valor === null) {
      return ""
    }

    return formatadorMoeda.format(valor)
  }

  const getValorCampo = (registro: DreRegistro, campo: "realizado" | "orcado") => {
    const chave = getRegistroKey(registro, campo)

    return valoresEditando[chave] ?? formatarValor(registro[campo])
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
          <TextField
            label="Mês"
            value={filtros.mes}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                mes: e.target.value.replace(/\D/g, "").slice(0, 2),
              }))
            }
          />
          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel id="dre-descricao-label">Descrição</InputLabel>
            <Select
              labelId="dre-descricao-label"
              value={filtros.descricao}
              label="Descrição"
              onChange={(e) => alterarDescricao(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {opcoesDescricao.map((descricao) => (
                <MenuItem key={descricao} value={descricao}>
                  {descricao}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
                    type="text"
                    inputProps={{ style: { textAlign: "right" } }}
                    value={getValorCampo(registro, "realizado")}
                    onChange={(e) => alterarValor(index, "realizado", e.target.value)}
                    onFocus={() => iniciarEdicaoValor(registro, "realizado")}
                    onBlur={() => finalizarEdicaoValor(registro, "realizado")}
                    disabled={!podeEditar}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="text"
                    inputProps={{ style: { textAlign: "right" } }}
                    value={getValorCampo(registro, "orcado")}
                    onChange={(e) => alterarValor(index, "orcado", e.target.value)}
                    onFocus={() => iniciarEdicaoValor(registro, "orcado")}
                    onBlur={() => finalizarEdicaoValor(registro, "orcado")}
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
