"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  Menu,
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
import MoreVertIcon from "@mui/icons-material/MoreVert"
import * as XLSX from "xlsx"
import type { DreF360Registro } from "../types"
import { atualizarDreF360, getDreF360, getLojasF360 } from "../services/dreF360Service"
import { useAuth } from "../contexts/AuthContext"

const DreF360: React.FC = () => {
  const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const [registros, setRegistros] = useState<DreF360Registro[]>([])
  const [registrosBase, setRegistrosBase] = useState<DreF360Registro[]>([])
  const [opcoesDescricao, setOpcoesDescricao] = useState<string[]>([])
  const [lojas, setLojas] = useState<string[]>([])
  const [filtros, setFiltros] = useState({ ano: "", mes: "", codloja: "", descricao: "" })
  const [carregando, setCarregando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: "success" | "error"; texto: string } | null>(null)
  const [filtroAplicado, setFiltroAplicado] = useState(false)
  const [valoresEditando, setValoresEditando] = useState<Record<string, string>>({})
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const { temPermissaoModulo } = useAuth()
  const podeEditar = temPermissaoModulo("dre", "editar")
  const menuAberto = Boolean(menuAnchorEl)

  // Carrega lista de lojas disponíveis ao montar
  useEffect(() => {
    getLojasF360()
      .then(setLojas)
      .catch(() => setLojas([]))
  }, [])

  const getRegistroKey = (registro: DreF360Registro, campo: "realizado" | "orcado") =>
    `${registro.sequencial}-${registro.codloja}-${registro.ano}-${registro.mes}-${campo}`

  const converterParaNumero = (valor: number | string | null) => {
    if (valor === null || valor === "") return null
    if (typeof valor === "number") return Number.isNaN(valor) ? null : valor
    const n = Number(valor)
    return Number.isNaN(n) ? null : n
  }

  const normalizarCabecalho = (cabecalho: string) =>
    cabecalho
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "")

  const formatarParaEdicao = (valor: number | string | null) => {
    const numero = converterParaNumero(valor)
    if (numero === null) return ""
    return numero.toFixed(2).replace(".", ",")
  }

  const normalizarEntradaMoeda = (valor: string) => {
    const apenasPermitidos = valor.replace(/[^\d,]/g, "")
    const [parteInteira, ...partesDecimais] = apenasPermitidos.split(",")
    const parteDecimal = partesDecimais.join("").slice(0, 2)
    if (partesDecimais.length === 0) return parteInteira
    return `${parteInteira},${parteDecimal}`
  }

  const aplicarFiltroDescricao = useCallback((dados: DreF360Registro[], descricao: string) => {
    if (!descricao) return dados
    return dados.filter((r) => r.descricao === descricao)
  }, [])

  const carregar = useCallback(async () => {
    if (!filtros.ano || !filtros.mes || !filtros.codloja) {
      setFiltroAplicado(false)
      setRegistros([])
      return
    }

    setCarregando(true)
    try {
      const data = await getDreF360({
        ano: filtros.ano,
        mes: filtros.mes,
        codloja: filtros.codloja,
      })
      const descricoes = [...new Set(data.map((r) => r.descricao))].sort((a, b) => a.localeCompare(b))
      setRegistrosBase(data)
      setOpcoesDescricao(descricoes)
      setRegistros(aplicarFiltroDescricao(data, filtros.descricao))
      setValoresEditando({})
      setMensagem(null)
      setFiltroAplicado(true)
    } catch (error) {
      console.error("Erro ao carregar DRE F360", error)
      setMensagem({ tipo: "error", texto: "Erro ao carregar dados." })
    } finally {
      setCarregando(false)
    }
  }, [aplicarFiltroDescricao, filtros.ano, filtros.codloja, filtros.descricao, filtros.mes])

  const alterarDescricao = (descricao: string) => {
    setFiltros((prev) => ({ ...prev, descricao }))
    if (filtroAplicado) setRegistros(aplicarFiltroDescricao(registrosBase, descricao))
  }

  const alterarValor = (index: number, campo: "realizado" | "orcado", valor: string) => {
    const valorNormalizado = normalizarEntradaMoeda(valor)
    const valorSemMascara = valorNormalizado.replace(",", ".")
    const valorConvertido = valorSemMascara === "" ? null : Number(valorSemMascara)

    if (valorSemMascara !== "" && Number.isNaN(valorConvertido)) return

    setValoresEditando((prev) => {
      const registro = registros[index]
      if (!registro) return prev
      return { ...prev, [getRegistroKey(registro, campo)]: valorNormalizado }
    })

    setRegistros((prev) =>
      prev.map((registro, i) =>
        i === index ? { ...registro, [campo]: valorConvertido } : registro,
      ),
    )
  }

  const iniciarEdicaoValor = (registro: DreF360Registro, campo: "realizado" | "orcado") => {
    setValoresEditando((prev) => ({
      ...prev,
      [getRegistroKey(registro, campo)]: formatarParaEdicao(registro[campo]),
    }))
  }

  const finalizarEdicaoValor = (registro: DreF360Registro, campo: "realizado" | "orcado") => {
    const chave = getRegistroKey(registro, campo)
    setValoresEditando((prev) => {
      if (!(chave in prev)) return prev
      const next = { ...prev }
      delete next[chave]
      return next
    })
  }

  const formatarValor = (valor: number | string | null) => {
    const numero = converterParaNumero(valor)
    if (numero === null) return ""
    return formatadorMoeda.format(numero)
  }

  const getValorCampo = (registro: DreF360Registro, campo: "realizado" | "orcado") => {
    const chave = getRegistroKey(registro, campo)
    return valoresEditando[chave] ?? formatarValor(registro[campo])
  }

  const salvarLinha = async (registro: DreF360Registro) => {
    try {
      await atualizarDreF360(registro.sequencial, registro.codloja, {
        ano: registro.ano,
        mes: registro.mes,
        realizado: registro.realizado,
        orcado: registro.orcado,
      })
      setMensagem({ tipo: "success", texto: "Registro salvo com sucesso." })
    } catch (error) {
      console.error("Erro ao salvar linha DRE F360", error)
      setMensagem({ tipo: "error", texto: "Erro ao salvar registro." })
    }
  }

  const exportarFiltrado = () => {
    if (!registros.length) {
      setMensagem({ tipo: "error", texto: "Não há registros filtrados para exportar." })
      return
    }

    const dadosExportacao = registros.map((r) => ({
      sequencial: r.sequencial,
      codloja: r.codloja,
      ano: r.ano,
      mes: r.mes,
      descricao: r.descricao,
      subdescricao: r.subdescricao ?? "",
      detalhamento: r.detalhamento ?? "",
      realizado: r.realizado,
      orcado: r.orcado,
      rlr: r.rlr,
      rlo: r.rlo,
    }))

    const planilha = XLSX.utils.json_to_sheet(dadosExportacao)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, planilha, "DRE_F360")
    const nomeArquivo = `dre_f360_${filtros.codloja}_${filtros.ano || "todos"}_${filtros.mes || "todos"}.xlsx`
    XLSX.writeFile(workbook, nomeArquivo)
    setMensagem({ tipo: "success", texto: "Exportação concluída com sucesso." })
  }

  const exportarLayoutImportacao = () => {
    if (!registros.length) {
      setMensagem({ tipo: "error", texto: "Filtre os dados antes de baixar o layout de importação." })
      return
    }

    const dadosLayout = registros.map((r) => ({
      sequencial: r.sequencial,
      codloja: r.codloja,
      ano: r.ano,
      mes: r.mes,
      valor: "",
    }))

    const planilha = XLSX.utils.json_to_sheet(dadosLayout)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, planilha, "Layout_Importacao_DRE_F360")
    XLSX.writeFile(workbook, `layout_importacao_dre_f360_${filtros.codloja}_${filtros.ano || "todos"}_${filtros.mes || "todos"}.xlsx`)
    setMensagem({ tipo: "success", texto: "Layout de importação baixado com sucesso." })
  }

  const processarImportacao = async (arquivo: File, campo: "realizado" | "orcado") => {
    if (!registros.length) {
      setMensagem({ tipo: "error", texto: "Filtre os dados antes de importar uma planilha." })
      return
    }

    setImportando(true)
    setMensagem(null)

    try {
      const buffer = await arquivo.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const primeiraAba = workbook.SheetNames[0]

      if (!primeiraAba) throw new Error("Planilha sem abas válidas.")

      const worksheet = workbook.Sheets[primeiraAba]
      const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        raw: false,
        defval: "",
      })

      if (!linhas.length) throw new Error("A planilha está vazia.")

      // Índice: chave = "sequencial-codloja-ano-mes"
      const indiceRegistros = new Map(
        registros.map((item) => [`${String(item.sequencial).trim()}-${item.codloja}-${item.ano}-${item.mes}`, item]),
      )

      let atualizados = 0

      for (const linha of linhas) {
        const linhaNorm = Object.entries(linha).reduce<Record<string, unknown>>((acc, [k, v]) => {
          acc[normalizarCabecalho(k)] = v
          return acc
        }, {})

        const sequencial = String(linhaNorm.sequencial ?? "").trim()
        const codloja = String(linhaNorm.codloja ?? "").trim()
        const ano = Number(linhaNorm.ano)
        const mes = Number(linhaNorm.mes)

        const valorImportacao =
          linhaNorm.valor ??
          linhaNorm[campo] ??
          (campo === "orcado" ? linhaNorm.orcado : linhaNorm.realizado)

        const valorBruto = String(valorImportacao ?? "")
          .trim()
          .replace(/\./g, "")
          .replace(",", ".")
        const valor = valorBruto === "" ? null : Number(valorBruto)

        if (
          !sequencial ||
          !codloja ||
          Number.isNaN(ano) ||
          Number.isNaN(mes) ||
          (valor !== null && Number.isNaN(valor))
        ) {
          continue
        }

        const registroAtual = indiceRegistros.get(`${sequencial}-${codloja}-${ano}-${mes}`)
        if (!registroAtual) continue

        await atualizarDreF360(sequencial, codloja, {
          ano,
          mes,
          realizado: campo === "realizado" ? valor : registroAtual.realizado,
          orcado: campo === "orcado" ? valor : registroAtual.orcado,
        })
        atualizados++
      }

      await carregar()
      setMensagem({
        tipo: atualizados > 0 ? "success" : "error",
        texto:
          atualizados > 0
            ? `${atualizados} registro(s) importado(s) para ${campo === "realizado" ? "Realizado" : "Orçado"}.`
            : "Nenhum registro correspondente foi encontrado para importar.",
      })
    } catch (error) {
      console.error("Erro ao importar planilha DRE F360", error)
      setMensagem({ tipo: "error", texto: "Erro ao importar planilha. Verifique o formato (sequencial, codloja, ano, mes, valor)." })
    } finally {
      setImportando(false)
    }
  }

  const abrirImportacao = (campo: "realizado" | "orcado") => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".xlsx,.xls"
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement
      const arquivo = target.files?.[0]
      if (arquivo) await processarImportacao(arquivo, campo)
    }
    input.click()
  }

  const abrirMenuOpcoes = (event: React.MouseEvent<HTMLElement>) => setMenuAnchorEl(event.currentTarget)
  const fecharMenuOpcoes = () => setMenuAnchorEl(null)
  const acaoMenuOpcoes = (acao: () => void) => { fecharMenuOpcoes(); acao() }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        DRE F360
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-end">
          <TextField
            label="Ano"
            value={filtros.ano}
            onChange={(e) => setFiltros((prev) => ({ ...prev, ano: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
            sx={{ width: 90 }}
          />
          <TextField
            label="Mês"
            value={filtros.mes}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                mes: e.target.value.replace(/\D/g, "").slice(0, 2),
              }))
            }
            sx={{ width: 70 }}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="dre-f360-loja-label">Loja</InputLabel>
            <Select
              labelId="dre-f360-loja-label"
              value={filtros.codloja}
              label="Loja"
              onChange={(e) => setFiltros((prev) => ({ ...prev, codloja: e.target.value }))}
            >
              <MenuItem value="">Selecione</MenuItem>
              {lojas.map((loja) => (
                <MenuItem key={loja} value={loja}>
                  {loja}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel id="dre-f360-descricao-label">Descrição</InputLabel>
            <Select
              labelId="dre-f360-descricao-label"
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
          <Button
            variant="contained"
            onClick={carregar}
            disabled={carregando || !filtros.ano || !filtros.mes || !filtros.codloja}
          >
            Filtrar
          </Button>
          <Button
            variant="outlined"
            startIcon={<MoreVertIcon />}
            onClick={abrirMenuOpcoes}
            disabled={!filtroAplicado || carregando || importando}
            sx={{ minWidth: 120 }}
          >
            Opções
          </Button>
          <Menu id="opcoes-dre-f360" anchorEl={menuAnchorEl} open={menuAberto} onClose={fecharMenuOpcoes}>
            <MenuItem onClick={() => acaoMenuOpcoes(exportarFiltrado)} disabled={!registros.length || importando}>
              Exportar filtrado
            </MenuItem>
            {podeEditar && (
              <MenuItem onClick={() => acaoMenuOpcoes(exportarLayoutImportacao)} disabled={!registros.length || importando}>
                Baixar layout de importação
              </MenuItem>
            )}
            {podeEditar && (
              <MenuItem onClick={() => acaoMenuOpcoes(() => abrirImportacao("realizado"))} disabled={importando || carregando}>
                Importar Realizado
              </MenuItem>
            )}
            {podeEditar && (
              <MenuItem onClick={() => acaoMenuOpcoes(() => abrirImportacao("orcado"))} disabled={importando || carregando}>
                Importar Orçado
              </MenuItem>
            )}
          </Menu>
        </Box>
        {mensagem && (
          <Box mt={2}>
            <Alert severity={mensagem.tipo}>{mensagem.texto}</Alert>
          </Box>
        )}
      </Paper>

      <Paper>
        {!filtroAplicado && (
          <Box p={2}>
            <Typography variant="body2" color="text.secondary">
              Informe ano, mês e loja e clique em Filtrar para carregar os dados.
            </Typography>
          </Box>
        )}

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Sequencial</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Subdescrição</TableCell>
              <TableCell>Detalhamento</TableCell>
              <TableCell>Loja</TableCell>
              <TableCell>Ano</TableCell>
              <TableCell>Mês</TableCell>
              <TableCell>Realizado</TableCell>
              <TableCell>Orçado</TableCell>
              <TableCell>RLR</TableCell>
              <TableCell>RLO</TableCell>
              {podeEditar && <TableCell>Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {registros.map((registro, index) => (
              <TableRow key={`${registro.sequencial}-${registro.codloja}-${registro.ano}-${registro.mes}`}>
                <TableCell>{registro.sequencial}</TableCell>
                <TableCell>{registro.descricao}</TableCell>
                <TableCell>{registro.subdescricao || "-"}</TableCell>
                <TableCell>{registro.detalhamento || "-"}</TableCell>
                <TableCell>{registro.codloja}</TableCell>
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
                <TableCell sx={{ color: "text.secondary" }}>
                  {registro.rlr !== null ? formatarValor(registro.rlr) : "-"}
                </TableCell>
                <TableCell sx={{ color: "text.secondary" }}>
                  {registro.rlo !== null ? formatarValor(registro.rlo) : "-"}
                </TableCell>
                {podeEditar && (
                  <TableCell>
                    <Button variant="outlined" size="small" onClick={() => salvarLinha(registro)}>
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

export default DreF360

