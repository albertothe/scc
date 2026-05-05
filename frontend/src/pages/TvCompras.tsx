import { useEffect, useState } from "react"
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material"
import { getDashboardTvCompras } from "../services/dashboardTvComprasService"

const statusColor = (v: number) => (v >= 100 ? "success" : v >= 95 ? "warning" : "error")

export default function TvCompras() {
  const [data, setData] = useState<any>({ kpis: {}, compradores: [], graficos: { evolucaoVendas: [], evolucaoLb: [] }, alertas: [] })
  const [loading, setLoading] = useState(true)

  const fetchDados = async () => {
    setLoading(true)
    try {
      const response = await getDashboardTvCompras()
      setData(response)
    } catch (error) {
      console.error("Erro ao buscar dashboard TV compras", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDados()
    const timer = setInterval(() => {
      fetchDados()
    }, 1800000)

    return () => clearInterval(timer)
  }, [])


  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        bgcolor="#0b0f14"
      >
        <CircularProgress size={80} />
      </Box>
    )
  }

  const kpis = [
    { label: "Vendas (% Meta)", value: data.kpis?.vendasAtingimento ?? 0 },
    { label: "LB (% Realizado)", value: data.kpis?.lbRealizado ?? 0 },
    { label: "Evolução (%)", value: data.kpis?.evolucao ?? 0 },
    { label: "Nível de Serviço", value: null },
    { label: "Dias de Estoque", value: null },
    { label: "Produtos Fora (% Meta)", value: data.kpis?.produtosFora ?? 0 },
  ]

  return (
    <Box sx={{ minHeight: "100vh", background: "#050816", color: "#fff", p: 3 }}>
      <Typography variant="h3" fontWeight={700} mb={2}>Dashboard TV Compras</Typography>
      <Grid container spacing={2} mb={2}>
        {kpis.map((kpi: any) => (
          <Grid item xs={12} md={4} lg={2} key={kpi.label}>
            <Card sx={{ background: "#111827", borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="#9CA3AF">{kpi.label}</Typography>
                <Typography variant="h4" fontWeight={800}>{kpi.value === null ? "--" : `${Number(kpi.value).toFixed(2)}%`}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ background: "#111827", p: 2, borderRadius: 3 }}>
            <Typography variant="h6" mb={1}>Evolução de Vendas (%)</Typography>
            <Stack spacing={1}>
              {data.graficos?.evolucaoVendas?.map((item: any) => (
                <Box key={item.label}>
                  <Typography variant="body2">{item.label} - {Number(item.valor).toFixed(1)}%</Typography>
                  <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, item.valor))} color={statusColor(item.valor)} />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ background: "#111827", p: 2, borderRadius: 3 }}>
            <Typography variant="h6" mb={1}>Evolução de LB (%)</Typography>
            <Stack spacing={1}>
              {data.graficos?.evolucaoLb?.map((item: any) => (
                <Box key={item.label}>
                  <Typography variant="body2">{item.label} - {Number(item.valor).toFixed(1)}%</Typography>
                  <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, item.valor))} color={statusColor(item.valor)} />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ background: "#111827", borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Typography variant="h6" mb={1}>Performance por Comprador</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "#fff" }}>Comprador</TableCell><TableCell sx={{ color: "#fff" }}>Grupo</TableCell>
                <TableCell sx={{ color: "#fff" }}>Venda (% Meta)</TableCell><TableCell sx={{ color: "#fff" }}>LB (%)</TableCell>
                <TableCell sx={{ color: "#fff" }}>Meta LB (%)</TableCell><TableCell sx={{ color: "#fff" }}>Evolução (%)</TableCell><TableCell sx={{ color: "#fff" }}>Produtos Fora (% Meta)</TableCell><TableCell sx={{ color: "#fff" }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.compradores?.map((c: any) => (
                <TableRow key={`${c.grupo}-${c.comprador}`}>
                  <TableCell sx={{ color: "#E5E7EB" }}>{c.comprador}</TableCell><TableCell sx={{ color: "#E5E7EB" }}>{c.grupo}</TableCell>
                  <TableCell sx={{ color: "#E5E7EB" }}>{c.vendaPercentualMeta.toFixed(2)}%</TableCell><TableCell sx={{ color: "#E5E7EB" }}>{c.lbPercentual.toFixed(2)}%</TableCell>
                  <TableCell sx={{ color: "#E5E7EB" }}>{c.metaLb.toFixed(2)}%</TableCell><TableCell sx={{ color: "#E5E7EB" }}>{c.evolucaoPercentual.toFixed(2)}%</TableCell>
                  <TableCell sx={{ color: "#E5E7EB" }}>{c.produtosForaPercentual.toFixed(2)}%</TableCell><TableCell><Chip label={c.status} color={statusColor(c.vendaPercentualMeta)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ background: "#111827", borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={1}>Alertas</Typography>
          <Stack spacing={1}>
            {data.alertas?.length ? data.alertas.map((alerta: string, idx: number) => <Alert key={idx} severity="warning">{alerta}</Alert>) : <Alert severity="success">Sem alertas críticos no momento.</Alert>}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
