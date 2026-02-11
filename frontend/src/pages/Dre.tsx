"use client"

import { useCallback, useState } from "react"
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
  const [importando, setImportando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: "success" | "error"; texto: string } | null>(null)
  const [filtroAplicado, setFiltroAplicado] = useState(false)
  const [valoresEditando, setValoresEditando] = useState<Record<string, string>>({})
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const { temPermissaoModulo } = useAuth()
  const podeEditar = temPermissaoModulo("dre", "editar")
  const menuAberto = Boolean(menuAnchorEl)

  const getRegistroKey = (registro: DreRegistro, campo: "realizado" | "orcado") =>
    `${registro.sequencial}-${registro.ano}-${registro.mes}-${campo}`

  const normalizarValorChave = (valor: number | string) => {
    const valorTexto = String(valor).trim()
    const valorNumerico = Number(valorTexto)

    if (!Number.isNaN(valorNumerico)) {
      return String(valorNumerico)
    }

    return valorTexto
  }

  const gerarChaveComposta = (sequencial: number | string, ano: number | string, mes: number | string) =>
    `${normalizarValorChave(sequencial)}-${normalizarValorChave(ano)}-${normalizarValorChave(mes)}`

  const converterParaNumero = (valor: number | string | null) => {
    if (valor === null || valor === "") {
      return null
    }

    if (typeof valor === "number") {
      return Number.isNaN(valor) ? null : valor
    }

    const numeroConvertido = Number(valor)

    return Number.isNaN(numeroConvertido) ? null : numeroConvertido
  }

  const normalizarCabecalho = (cabecalho: string) =>
    cabecalho
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "")

  const formatarParaEdicao = (valor: number | string | null) => {
    const numero = converterParaNumero(valor)

    if (numero === null) {
      return ""
    }

    return numero.toFixed(2).replace(".", ",")
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
      setMensagem(null)
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

  const formatarValor = (valor: number | string | null) => {
    const numero = converterParaNumero(valor)

    if (numero === null) {
      return ""
    }

    return formatadorMoeda.format(numero)
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

  const exportarFiltrado = () => {
    if (!registros.length) {
      setMensagem({ tipo: "error", texto: "Não há registros filtrados para exportar." })
      return
    }

    const dadosExportacao = registros.map((registro) => ({
      sequencial: registro.sequencial,
      ano: registro.ano,
      mes: registro.mes,
      descricao: registro.descricao,
      subdescricao: registro.subdescricao ?? "",
      realizado: registro.realizado,
      orcado: registro.orcado,
    }))

    const planilha = XLSX.utils.json_to_sheet(dadosExportacao)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, planilha, "DRE")
    const nomeArquivo = `dre_filtrado_${filtros.ano || "todos"}_${filtros.mes || "todos"}.xlsx`
    XLSX.writeFile(workbook, nomeArquivo)
    setMensagem({ tipo: "success", texto: "Exportação concluída com sucesso." })
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

      if (!primeiraAba) {
        throw new Error("Planilha sem abas válidas.")
      }

      const worksheet = workbook.Sheets[primeiraAba]
      const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        raw: false,
        defval: "",
      })

      if (!linhas.length) {
        throw new Error("A planilha está vazia.")
      }

      const indiceRegistros = new Map(registros.map((item) => [gerarChaveComposta(item.sequencial, item.ano, item.mes), item]))

      let atualizados = 0

      for (const linha of linhas) {
        const linhaNormalizada = Object.entries(linha).reduce<Record<string, unknown>>((acc, [chave, valor]) => {
          acc[normalizarCabecalho(chave)] = valor
          return acc
        }, {})

        const sequencial = Number(linhaNormalizada.sequencial)
        const ano = Number(linhaNormalizada.ano)
        const mes = Number(linhaNormalizada.mes)

        const valorImportacao =
          linhaNormalizada.valor ??
          linhaNormalizada[campo] ??
          (campo === "orcado" ? linhaNormalizada.orcado : linhaNormalizada.realizado)

        const valorBruto = String(valorImportacao ?? "")
          .trim()
          .replace(/\./g, "")
          .replace(",", ".")
        const valor = valorBruto === "" ? null : Number(valorBruto)

        if (
          Number.isNaN(sequencial) ||
          Number.isNaN(ano) ||
          Number.isNaN(mes) ||
          (valor !== null && Number.isNaN(valor))
        ) {
          continue
        }

        const registroAtual = indiceRegistros.get(gerarChaveComposta(sequencial, ano, mes))

        if (!registroAtual) {
          continue
        }

        const payload = {
          ano,
          mes,
          realizado: campo === "realizado" ? valor : registroAtual.realizado,
          orcado: campo === "orcado" ? valor : registroAtual.orcado,
        }

        await atualizarDre(sequencial, payload)
        atualizados += 1
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
      console.error("Erro ao importar planilha DRE", error)
      setMensagem({ tipo: "error", texto: "Erro ao importar planilha. Verifique o formato (sequencial, ano, mes, valor)." })
    } finally {
      setImportando(false)
    }
  }

  const abrirMenuOpcoes = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget)
  }

  const fecharMenuOpcoes = () => {
    setMenuAnchorEl(null)
  }

  const acaoMenuOpcoes = (acao: () => void) => {
    fecharMenuOpcoes()
    acao()
  }

  const exportarLayoutImportacao = () => {
    if (!registros.length) {
      setMensagem({ tipo: "error", texto: "Filtre os dados antes de baixar o layout de importação." })
      return
    }

    const dadosLayout = registros.map((registro) => ({
      sequencial: registro.sequencial,
      ano: registro.ano,
      mes: registro.mes,
      valor: "",
    }))

    const planilha = XLSX.utils.json_to_sheet(dadosLayout)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, planilha, "Layout_Importacao_DRE")
    XLSX.writeFile(workbook, `layout_importacao_dre_${filtros.ano || "todos"}_${filtros.mes || "todos"}.xlsx`)

    setMensagem({ tipo: "success", texto: "Layout de importação baixado com sucesso." })
  }

  const abrirImportacao = (campo: "realizado" | "orcado") => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".xlsx,.xls"
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement
      const arquivo = target.files?.[0]

      if (arquivo) {
        await processarImportacao(arquivo, campo)
      }
    }

    input.click()
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
          <Button
            variant="outlined"
            startIcon={<MoreVertIcon />}
            onClick={abrirMenuOpcoes}
            disabled={!filtroAplicado || carregando || importando}
            sx={{ minWidth: 120 }}
          >
            Opções
          </Button>
          <Menu id="opcoes-dre" anchorEl={menuAnchorEl} open={menuAberto} onClose={fecharMenuOpcoes}>
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
