import { useEffect, useState } from "react"
import {
  Alert,
  Box,
  Button,
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
import { Refresh as RefreshIcon } from "@mui/icons-material"
import { getDashboardTvCompras } from "../services/dashboardTvComprasService"

const statusColor = (v: number) => (v >= 100 ? "success" : v >= 95 ? "warning" : "error")
const safe = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0)

export default function TvCompras() {
  const [data, setData] = useState<any>({
    kpis: {},
    compradores: [],
    graficos: { evolucaoVendas: [], evolucaoLb: [] },
    alertas: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchDados = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getDashboardTvCompras()
      setData(response)
      setLastUpdate(new Date())
    } catch (err: any) {
      console.error("Erro ao buscar dashboard TV compras", err)
      const msg =
        err?.response?.status === 0 || err?.code === "ERR_NETWORK"
          ? "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
          : err?.response?.data?.message
          ? `Erro do servidor: ${err.response.data.message}`
          : "Erro ao carregar dados. Tentativa automática em 30 segundos."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDados()
    // Atualiza a cada 30 minutos
    const timer = setInterval(fetchDados, 1800000)
    return () => clearInterval(timer)
  }, [])

  if (loading && !lastUpdate) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="#0b0f14">
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={80} sx={{ color: "#6366F1" }} />
          <Typography color="#94A3B8">Carregando dashboard...</Typography>
        </Stack>
      </Box>
    )
  }

  if (error && !lastUpdate) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="#0b0f14">
        <Stack alignItems="center" spacing={3} sx={{ maxWidth: 480, p: 4 }}>
          <Typography variant="h5" color="#EF4444" fontWeight={700}>Falha ao carregar</Typography>
          <Typography color="#94A3B8" textAlign="center">{error}</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDados}
            sx={{ color: "#818CF8", borderColor: "#818CF8" }}
          >
            Tentar novamente
          </Button>
        </Stack>
      </Box>
    )
  }

  const kpis = [
    { label: "Vendas (% Meta)", value: safe(data.kpis?.vendasAtingimento) },
    { label: "LB (% Realizado)", value: safe(data.kpis?.lbRealizado) },
    { label: "Evolução (%)", value: safe(data.kpis?.evolucao) },
    { label: "Nível de Serviço", value: null },
    { label: "Dias de Estoque", value: null },
    { label: "Produtos Fora (% Meta)", value: safe(data.kpis?.produtosFora) },
  ]

  return (
    <Box sx={{ minHeight: "100vh", background: "#050816", color: "#fff", p: 3 }}>
      {/* Cabeçalho */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h3" fontWeight={700}>Dashboard TV Compras</Typography>
        <Stack alignItems="flex-end" spacing={0.5}>
          {loading && <CircularProgress size={16} sx={{ color: "#94A3B8" }} />}
          {error && (
            <Typography variant="caption" color="#F87171">{error}</Typography>
          )}
          {lastUpdate && (
            <Typography variant="caption" color="#6B7280">
              Atualizado: {lastUpdate.toLocaleTimeString("pt-BR")}
            </Typography>
          )}
        </Stack>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2} mb={2}>
        {kpis.map((kpi) => (
          <Grid item xs={12} md={4} lg={2} key={kpi.label}>
            <Card sx={{ background: "#111827", borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="#9CA3AF">{kpi.label}</Typography>
                <Typography variant="h4" fontWeight={800}>
                  {kpi.value === null ? "--" : `${safe(kpi.value).toFixed(2)}%`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gráficos de evolução */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ background: "#111827", p: 2, borderRadius: 3 }}>
            <Typography variant="h6" mb={1}>Evolução de Vendas (%)</Typography>
            <Stack spacing={1}>
              {data.graficos?.evolucaoVendas?.length ? (
                data.graficos.evolucaoVendas.map((item: any) => (
                  <Box key={item.label}>
                    <Typography variant="body2">
                      {item.label} — {safe(item.valor).toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.max(0, Math.min(100, safe(item.valor)))}
                      color={statusColor(safe(item.valor))}
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="#6B7280">Sem dados de evolução.</Typography>
              )}
            </Stack>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ background: "#111827", p: 2, borderRadius: 3 }}>
            <Typography variant="h6" mb={1}>Evolução de LB (%)</Typography>
            <Stack spacing={1}>
              {data.graficos?.evolucaoLb?.length ? (
                data.graficos.evolucaoLb.map((item: any) => (
                  <Box key={item.label}>
                    <Typography variant="body2">
                      {item.label} — {safe(item.valor).toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.max(0, Math.min(100, safe(item.valor)))}
                      color={statusColor(safe(item.valor))}
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="#6B7280">Sem dados de evolução.</Typography>
              )}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de compradores */}
      <Card sx={{ background: "#111827", borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Typography variant="h6" mb={1}>Performance por Comprador</Typography>
          {data.compradores?.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: "#fff" }}>Comprador</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Grupo</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Venda (% Meta)</TableCell>
                  <TableCell sx={{ color: "#fff" }}>LB (%)</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Meta LB (%)</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Evolução (%)</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Produtos Fora (% Meta)</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.compradores.map((c: any) => (
                  <TableRow key={`${c.grupo}-${c.comprador}`}>
                    <TableCell sx={{ color: "#E5E7EB" }}>{c.comprador}</TableCell>
                    <TableCell sx={{ color: "#E5E7EB" }}>{c.grupo}</TableCell>
                    <TableCell sx={{ color: "#E5E7EB" }}>{safe(c.vendaPercentualMeta).toFixed(2)}%</TableCell>
                    <TableCell sx={{ color: "#E5E7EB" }}>{safe(c.lbPercentual).toFixed(2)}%</TableCell>
                    <TableCell sx={{ color: "#E5E7EB" }}>{safe(c.metaLb).toFixed(2)}%</TableCell>
                    <TableCell sx={{ color: "#E5E7EB" }}>{safe(c.evolucaoPercentual).toFixed(2)}%</TableCell>
                    <TableCell sx={{ color: "#E5E7EB" }}>{safe(c.produtosForaPercentual).toFixed(2)}%</TableCell>
                    <TableCell>
                      <Chip label={c.status} color={statusColor(safe(c.vendaPercentualMeta))} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" color="#6B7280">Nenhum comprador com dados para o período atual.</Typography>
          )}
        </CardContent>
      </Card>

      {/* Alertas */}
      <Card sx={{ background: "#111827", borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={1}>Alertas</Typography>
          <Stack spacing={1}>
            {data.alertas?.length
              ? data.alertas.map((alerta: string, idx: number) => (
                  <Alert key={idx} severity="warning">{alerta}</Alert>
                ))
              : <Alert severity="success">Sem alertas críticos no momento.</Alert>}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
