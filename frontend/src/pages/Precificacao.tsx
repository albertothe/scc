"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
    Typography,
    Paper,
    Box,
    Grid,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    CardHeader,
    Button,
    Tooltip,
    IconButton,
} from "@mui/material"
import {
    Calculate as CalculateIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    HelpOutline as HelpIcon,
} from "@mui/icons-material"

interface CustoItem {
    nome: string
    percentual: number
    valor: number
    operacao: "+" | "-" | "="
    editavel: boolean
    destaque?: boolean
    tooltip?: string
}

interface VendaItem {
    nome: string
    percentual: number
    valor: number
    operacao: "+" | "-" | "="
    editavel: boolean
    destaque?: boolean
    tooltip?: string
}

const Precificacao: React.FC = () => {
    const [precoProduto, setPrecoProduto] = useState<number>(0)
    const [custoItems, setCustoItems] = useState<CustoItem[]>([
        { nome: "Preço de compra", percentual: 0, valor: 0, operacao: "+", editavel: false, destaque: true },
        { nome: "Desc. Progres.1", percentual: 0, valor: 0, operacao: "-", editavel: true },
        { nome: "Desc. Progres.2", percentual: 0, valor: 0, operacao: "-", editavel: true },
        { nome: "Desc. Progres.3", percentual: 0, valor: 0, operacao: "-", editavel: true }, // Transformado de "Preço de compra" para "Desc. Progres.3"
        { nome: "Preço com Desc.", percentual: 0, valor: 0, operacao: "=", editavel: false, destaque: true },
        { nome: "IPI", percentual: 0, valor: 0, operacao: "+", editavel: true },
        { nome: "Sub.Trib Nac.", percentual: 10, valor: 0, operacao: "+", editavel: true },
        { nome: "Sub.Trib Est.", percentual: 0, valor: 0, operacao: "+", editavel: true },
        { nome: "Crédito de ICMS", percentual: 12, valor: 0, operacao: "-", editavel: true },
        { nome: "Frete", percentual: 0, valor: 0, operacao: "+", editavel: true },
        { nome: "Custo financeiro", percentual: 0, valor: 0, operacao: "+", editavel: true },
        { nome: "Outras despesas", percentual: 0, valor: 0, operacao: "+", editavel: true },
        { nome: "Créd.PIS/COFINS", percentual: 9.25, valor: 0, operacao: "-", editavel: true },
        { nome: "ICMS (reg.esp)", percentual: 0, valor: 0, operacao: "+", editavel: true },
        { nome: "Custo Real", percentual: 0, valor: 0, operacao: "=", editavel: false, destaque: true },
    ])

    const [vendaItems, setVendaItems] = useState<VendaItem[]>([
        { nome: "Super Simples", percentual: 0, valor: 0, operacao: "+", editavel: true },
        { nome: "PIS", percentual: 1.65, valor: 0, operacao: "+", editavel: true },
        { nome: "COFINS", percentual: 7.6, valor: 0, operacao: "+", editavel: true },
        { nome: "Débito de ICMS", percentual: 21, valor: 0, operacao: "+", editavel: true },
        { nome: "Contrib. Social", percentual: 2.9, valor: 0, operacao: "+", editavel: true },
        { nome: "Imp. de Renda", percentual: 0, valor: 0, operacao: "+", editavel: true },
        { nome: "Comissão", percentual: 0, valor: 0, operacao: "+", editavel: true },
        { nome: "Desp.Comerciais", percentual: 0, valor: 0, operacao: "+", editavel: true },
        { nome: "Desp.Financeiras", percentual: 0, valor: 0, operacao: "+", editavel: true },
        { nome: "Desp.Administrat.", percentual: 0, valor: 0, operacao: "+", editavel: true },
        { nome: "Menor preço", percentual: 0, valor: 0, operacao: "=", editavel: false },
        { nome: "Lucro líquido", percentual: 18.12, valor: 0, operacao: "+", editavel: true },
        { nome: "Preço final", percentual: 0, valor: 0, operacao: "=", editavel: false },
        { nome: "Desconto", percentual: 0, valor: 0, operacao: "-", editavel: true },
        { nome: "Preço de Venda", percentual: 0, valor: 0, operacao: "=", editavel: false, destaque: true },
    ])

    // Calcular valores quando o preço do produto ou percentuais mudarem
    useEffect(() => {
        calcularPrecos()
    }, [precoProduto])

    const handlePrecoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const valor = Number.parseFloat(event.target.value) || 0
        setPrecoProduto(valor)
    }

    const handlePercentualCustoChange = (index: number, value: number) => {
        const newItems = [...custoItems]
        newItems[index].percentual = value
        setCustoItems(newItems)
        calcularPrecos()
    }

    const handlePercentualVendaChange = (index: number, value: number) => {
        const newItems = [...vendaItems]
        newItems[index].percentual = value
        setVendaItems(newItems)
        calcularPrecos()
    }

    const calcularPrecos = () => {
        // Cálculo dos itens de custo
        let precoComDesconto = precoProduto
        let custoReal = precoProduto

        const newCustoItems = [...custoItems]

        // Atualizar o valor do preço de compra (primeiro item)
        newCustoItems[0].valor = precoProduto

        // Calcular descontos progressivos (agora são 3)
        for (let i = 1; i <= 3; i++) {
            const desconto = (precoProduto * newCustoItems[i].percentual) / 100
            newCustoItems[i].valor = desconto
            precoComDesconto -= desconto
        }

        // Atualizar preço com desconto (agora na posição 4)
        newCustoItems[4].valor = precoComDesconto

        // Calcular demais itens de custo
        for (let i = 5; i < newCustoItems.length - 1; i++) {
            const valor = (precoComDesconto * newCustoItems[i].percentual) / 100
            newCustoItems[i].valor = valor

            if (newCustoItems[i].operacao === "+") {
                custoReal += valor
            } else if (newCustoItems[i].operacao === "-") {
                custoReal -= valor
            }
        }

        // Atualizar custo real
        newCustoItems[newCustoItems.length - 1].valor = custoReal
        setCustoItems(newCustoItems)

        // Cálculo iterativo para o preço de venda
        const newVendaItems = [...vendaItems]

        // Iniciar com uma estimativa do preço de venda baseada no custo + margem de lucro
        const margemLucro = newVendaItems.find((item) => item.nome === "Lucro líquido")?.percentual || 18.12
        let precoVendaEstimado = custoReal * (1 + margemLucro / 100)

        // Número máximo de iterações para evitar loop infinito
        const MAX_ITERACOES = 20
        // Precisão desejada (diferença aceitável entre iterações)
        const PRECISAO = 0.01

        let iteracao = 0
        let precoVendaAnterior = 0

        // Loop iterativo para convergir no preço de venda correto
        while (Math.abs(precoVendaEstimado - precoVendaAnterior) > PRECISAO && iteracao < MAX_ITERACOES) {
            precoVendaAnterior = precoVendaEstimado

            // Calcular o total de impostos e despesas como percentual
            let totalImpostosPct = 0
            for (let i = 0; i < 10; i++) {
                if (newVendaItems[i].operacao === "+") {
                    totalImpostosPct += newVendaItems[i].percentual
                }
            }

            // Calcular o preço de venda considerando que os impostos são calculados sobre ele mesmo
            // Fórmula: PreçoVenda = CustoReal / (1 - (TotalImpostos% + Lucro%) / 100)
            precoVendaEstimado = custoReal / (1 - (totalImpostosPct + margemLucro) / 100)

            iteracao++
        }

        // Agora que temos o preço de venda estimado, calculamos os valores dos impostos
        let menorPreco = custoReal

        // Calcular impostos e despesas com base no preço de venda estimado
        for (let i = 0; i < 10; i++) {
            const valor = (precoVendaEstimado * newVendaItems[i].percentual) / 100
            newVendaItems[i].valor = valor
            menorPreco += valor
        }

        // Atualizar menor preço
        newVendaItems[10].valor = menorPreco

        // Calcular lucro
        const lucro = (precoVendaEstimado * newVendaItems[11].percentual) / 100
        newVendaItems[11].valor = lucro

        // Calcular preço final
        const precoFinal = precoVendaEstimado
        newVendaItems[12].valor = precoFinal

        // Calcular desconto
        const desconto = (precoFinal * newVendaItems[13].percentual) / 100
        newVendaItems[13].valor = desconto

        // Preço de venda final (após desconto)
        const precoVenda = precoFinal - desconto
        newVendaItems[14].valor = precoVenda

        setVendaItems(newVendaItems)
    }

    const limparFormulario = () => {
        setPrecoProduto(0)

        // Resetar percentuais editáveis para valores padrão
        const defaultCustoItems = [...custoItems].map((item) => ({
            ...item,
            valor: 0,
            percentual:
                item.nome === "Sub.Trib Nac."
                    ? 10
                    : item.nome === "Crédito de ICMS"
                        ? 12
                        : item.nome === "Créd.PIS/COFINS"
                            ? 9.25
                            : 0,
        }))

        const defaultVendaItems = [...vendaItems].map((item) => ({
            ...item,
            valor: 0,
            percentual:
                item.nome === "PIS"
                    ? 1.65
                    : item.nome === "COFINS"
                        ? 7.6
                        : item.nome === "Débito de ICMS"
                            ? 21
                            : item.nome === "Contrib. Social"
                                ? 2.9
                                : item.nome === "Lucro líquido"
                                    ? 18.12
                                    : 0,
        }))

        setCustoItems(defaultCustoItems)
        setVendaItems(defaultVendaItems)
    }

    const formatarNumero = (valor: number): string => {
        return valor.toFixed(2)
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Precificação
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Preço de Compra do Produto"
                            type="number"
                            fullWidth
                            value={precoProduto || ""}
                            onChange={handlePrecoChange}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<CalculateIcon />}
                            onClick={calcularPrecos}
                            sx={{ mr: 2 }}
                        >
                            Calcular
                        </Button>
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={limparFormulario}>
                            Limpar
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={3}>
                {/* Coluna de Composição de Custo */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Composição de Custo"
                            sx={{
                                backgroundColor: (theme) => (theme.palette.mode === "dark" ? "#1e293b" : "#e3f2fd"),
                                color: (theme) => (theme.palette.mode === "dark" ? "white" : "inherit"),
                            }}
                        />
                        <CardContent>
                            {custoItems.map((item, index) => (
                                <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                                    <Grid item xs={5}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: item.destaque ? "bold" : "normal",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            {item.nome}
                                            {item.tooltip && (
                                                <Tooltip title={item.tooltip}>
                                                    <IconButton size="small">
                                                        <HelpIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={3}>
                                        {item.editavel ? (
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={item.percentual}
                                                onChange={(e) => handlePercentualCustoChange(index, Number.parseFloat(e.target.value) || 0)}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                                }}
                                                sx={{ width: "100%" }}
                                            />
                                        ) : (
                                            <Typography variant="body2" align="right">
                                                {item.percentual > 0 ? `${item.percentual.toFixed(2)}%` : ""}
                                            </Typography>
                                        )}
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Typography
                                            variant="body2"
                                            align="right"
                                            sx={{
                                                fontWeight: item.destaque ? "bold" : "normal",
                                                backgroundColor: item.destaque
                                                    ? (theme) => (theme.palette.mode === "dark" ? "rgba(144, 202, 249, 0.16)" : "#fff9c4")
                                                    : "transparent",
                                                padding: item.destaque ? "4px" : "0",
                                                borderRadius: "4px",
                                            }}
                                        >
                                            {formatarNumero(item.valor)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={1}>
                                        <Typography variant="body2" align="center">
                                            {item.operacao}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Coluna de Composição de Venda */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Composição de Venda"
                            sx={{
                                backgroundColor: (theme) => (theme.palette.mode === "dark" ? "#1e293b" : "#e3f2fd"),
                                color: (theme) => (theme.palette.mode === "dark" ? "white" : "inherit"),
                            }}
                        />
                        <CardContent>
                            {vendaItems.map((item, index) => (
                                <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                                    <Grid item xs={5}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: item.destaque ? "bold" : "normal",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            {item.nome}
                                            {item.tooltip && (
                                                <Tooltip title={item.tooltip}>
                                                    <IconButton size="small">
                                                        <HelpIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={3}>
                                        {item.editavel ? (
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={item.percentual}
                                                onChange={(e) => handlePercentualVendaChange(index, Number.parseFloat(e.target.value) || 0)}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                                }}
                                                sx={{ width: "100%" }}
                                            />
                                        ) : (
                                            <Typography variant="body2" align="right">
                                                {item.percentual > 0 ? `${item.percentual.toFixed(2)}%` : ""}
                                            </Typography>
                                        )}
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Typography
                                            variant="body2"
                                            align="right"
                                            sx={{
                                                fontWeight: item.destaque ? "bold" : "normal",
                                                backgroundColor:
                                                    item.nome === "Preço de Venda"
                                                        ? (theme) => (theme.palette.mode === "dark" ? "rgba(244, 67, 54, 0.16)" : "#ffcdd2")
                                                        : item.destaque
                                                            ? (theme) => (theme.palette.mode === "dark" ? "rgba(144, 202, 249, 0.16)" : "#fff9c4")
                                                            : "transparent",
                                                padding: item.destaque ? "4px" : "0",
                                                borderRadius: "4px",
                                            }}
                                        >
                                            {formatarNumero(item.valor)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={1}>
                                        <Typography variant="body2" align="center">
                                            {item.operacao}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" color="primary" startIcon={<SaveIcon />} sx={{ mr: 2 }}>
                    Salvar Precificação
                </Button>
            </Box>
        </Box>
    )
}

export default Precificacao
