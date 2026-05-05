import { useEffect, useState } from "react"
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  Typography,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
} from "@mui/material"
import {
  AttachMoney,
  BarChart as BarChartIcon,
  LocalShipping,
  TrackChanges,
  Inventory2,
  Warning,
  Refresh as RefreshIcon,
  CalendarToday,
  AccessTime,
} from "@mui/icons-material"
import { getDashboardTvCompras } from "../services/dashboardTvComprasService"

// ── Utilitários ──────────────────────────────────────────────────────────────

const safe = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0)

const fmtMoeda = (v: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

const fmtPct = (v: number, casas = 1) => `${v.toFixed(casas).replace(".", ",")}%`

// ── Sparkline SVG simples ────────────────────────────────────────────────────

function Sparkline({
  data,
  color,
  width = 80,
  height = 40,
}: {
  data: number[]
  color: string
  width?: number
  height?: number
}) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = height * 0.1
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - pad - ((v - min) / range) * (height - 2 * pad)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BarSparkline({
  data,
  color,
  width = 80,
  height = 40,
}: {
  data: number[]
  color: string
  width?: number
  height?: number
}) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data) || 1
  const barW = Math.max(1, Math.floor(width / data.length) - 2)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ flexShrink: 0 }}>
      {data.map((v, i) => {
        const bh = Math.max(2, (v / max) * (height * 0.85))
        return (
          <rect
            key={i}
            x={i * (barW + 2)}
            y={height - bh}
            width={barW}
            height={bh}
            fill={color}
            opacity={i === data.length - 1 ? 1 : 0.55}
            rx="1"
          />
        )
      })}
    </svg>
  )
}

// ── Card KPI ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string
  icon: React.ReactNode
  value: string
  meta: string
  trend: number | null
  trendSuffix: string
  /** true = subir é bom (verde), false = subir é ruim (vermelho) */
  trendUpGood: boolean
  sparkData?: number[]
  sparkType?: "line" | "bar"
  color: string
  /** true quando o valor está fora da meta — realça borda */
  alertMode?: boolean
}

function KpiCard({
  title,
  icon,
  value,
  meta,
  trend,
  trendSuffix,
  trendUpGood,
  sparkData,
  sparkType = "line",
  color,
  alertMode = false,
}: KpiCardProps) {
  const trendPositive = trend === null ? null : trendUpGood ? trend >= 0 : trend <= 0
  const trendColor = trendPositive === null ? "#9CA3AF" : trendPositive ? "#22C55E" : "#EF4444"
  const trendArrow = trend === null ? "" : trend >= 0 ? "↑" : "↓"
  const trendStr =
    trend === null
      ? null
      : `${trendArrow} ${trend >= 0 ? "+" : ""}${trend.toFixed(1).replace(".", ",")}${trendSuffix}`

  return (
    <Card
      sx={{
        background: "linear-gradient(135deg, #0D1117 0%, #0F1923 100%)",
        border: `1px solid ${alertMode ? color : color + "44"}`,
        borderTop: `2px solid ${color}`,
        borderRadius: 2,
        height: "100%",
        position: "relative",
        overflow: "hidden",
        boxShadow: alertMode ? `0 0 12px ${color}55` : "none",
      }}
    >
      <CardContent sx={{ p: "12px !important" }}>
        {/* Título */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: `1.5px solid ${color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: color,
                "& svg": { fontSize: "0.9rem" },
              }}
            >
              {icon}
            </Box>
            <Typography
              sx={{
                color: color,
                fontWeight: 700,
                fontSize: "0.6rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
          </Box>
          {/* Sparkline */}
          {sparkData && sparkData.length > 1 && (
            <Box sx={{ opacity: 0.85 }}>
              {sparkType === "line" ? (
                <Sparkline data={sparkData} color={color} />
              ) : (
                <BarSparkline data={sparkData} color={color} />
              )}
            </Box>
          )}
        </Box>

        {/* Valor principal */}
        <Typography
          sx={{
            fontSize: "1.65rem",
            fontWeight: 800,
            color: "#F9FAFB",
            lineHeight: 1,
            mb: 0.4,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </Typography>

        {/* Meta */}
        <Typography sx={{ fontSize: "0.7rem", color: "#6B7280", mb: 0.5 }}>
          Meta: {meta}
        </Typography>

        {/* Tendência vs mês anterior */}
        {trendStr && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <Typography sx={{ fontSize: "0.72rem", color: trendColor, fontWeight: 600 }}>
              {trendStr}
            </Typography>
            <Typography sx={{ fontSize: "0.65rem", color: "#4B5563" }}>
              vs mês anterior
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// ── Status da tabela ─────────────────────────────────────────────────────────

const statusColor = (v: number) => (v >= 100 ? "success" : v >= 95 ? "warning" : "error")

// ── Componente principal ─────────────────────────────────────────────────────

export default function TvCompras() {
  const [data, setData] = useState<any>({
    kpis: {},
    compradores: [],
    series: [],
    graficos: { evolucaoVendas: [], evolucaoLb: [] },
    alertas: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [now, setNow] = useState(new Date())

  // Relógio em tempo real
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

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
        err?.code === "ERR_NETWORK" || err?.response?.status === 0
          ? "Não foi possível conectar ao servidor."
          : err?.response?.data?.message
          ? `Erro do servidor: ${err.response.data.message}`
          : "Erro ao carregar dados."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDados()
    const timer = setInterval(fetchDados, 1800000)
    return () => clearInterval(timer)
  }, [])

  // Tela de carga inicial
  if (loading && !lastUpdate) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="#0b0f14">
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={80} sx={{ color: "#B71C1C" }} />
          <Typography color="#94A3B8">Carregando dashboard...</Typography>
        </Stack>
      </Box>
    )
  }

  if (error && !lastUpdate) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="#0b0f14">
        <Stack alignItems="center" spacing={3} sx={{ maxWidth: 500, p: 4, textAlign: "center" }}>
          <Typography variant="h5" color="#EF4444" fontWeight={700}>Falha ao carregar</Typography>
          <Typography color="#94A3B8">{error}</Typography>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchDados}
            sx={{ color: "#EF9A9A", borderColor: "#EF9A9A" }}>
            Tentar novamente
          </Button>
        </Stack>
      </Box>
    )
  }

  // ── Dados extraídos ──────────────────────────────────────────────────────
  const kpis = data.kpis ?? {}
  const series: { dia: string; venda: number; lb: number; produtosFora: number }[] = data.series ?? []

  const sparkVendas       = series.map((s) => s.venda)
  const sparkLbPct        = series.map((s) => (s.venda > 0 ? (s.lb / s.venda) * 100 : 0))
  const sparkProdutosFora = series.map((s) => s.produtosFora)

  const mesAtual = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase()
  const minUpdate = lastUpdate
    ? Math.round((now.getTime() - lastUpdate.getTime()) / 60000)
    : null

  // ── Definição dos 6 cards ────────────────────────────────────────────────

  const cards: KpiCardProps[] = [
    {
      title: "VENDAS (R$)",
      icon: <AttachMoney />,
      value: `${fmtMoeda(safe(kpis.vendasValor))}`,
      meta: fmtMoeda(safe(kpis.metaVendas)),
      trend: kpis.vendasVsMesAnterior ?? null,
      trendSuffix: "%",
      trendUpGood: true,
      sparkData: sparkVendas,
      sparkType: "line",
      color: "#3B82F6",
      alertMode: safe(kpis.vendasValor) < safe(kpis.metaVendas) * 0.9,
    },
    {
      title: "LB (%)",
      icon: <BarChartIcon />,
      value: fmtPct(safe(kpis.lbPercentual)),
      meta: fmtPct(safe(kpis.metaLb)),
      trend: kpis.lbVsMesAnterior ?? null,
      trendSuffix: " p.p.",
      trendUpGood: true,
      sparkData: sparkLbPct,
      sparkType: "line",
      color: "#22C55E",
      alertMode: safe(kpis.lbPercentual) > 0 && safe(kpis.lbPercentual) < safe(kpis.metaLb),
    },
    {
      title: "NÍVEL DE SERVIÇO (%)",
      icon: <LocalShipping />,
      value: fmtPct(safe(kpis.nivelServico)),
      meta: fmtPct(safe(kpis.nivelServicoMeta) || 98),
      trend: kpis.nivelServicoVsMesAnterior ?? null,
      trendSuffix: " p.p.",
      trendUpGood: true,
      color: "#F97316",
      alertMode: safe(kpis.nivelServico) > 0 && safe(kpis.nivelServico) < (safe(kpis.nivelServicoMeta) || 98),
    },
    {
      title: "EVOLUÇÃO (%)",
      icon: <TrackChanges />,
      value: fmtPct(safe(kpis.evolucao), 0),
      meta: fmtPct(safe(kpis.evolucaoMeta) || 100, 0),
      trend: kpis.evolucaoVsMesAnterior ?? null,
      trendSuffix: "%",
      trendUpGood: true,
      color: "#A855F7",
      alertMode: safe(kpis.evolucao) < (safe(kpis.evolucaoMeta) || 100),
    },
    {
      title: "DIAS DE ESTOQUE",
      icon: <Inventory2 />,
      value: `${Math.round(safe(kpis.diasEstoque))} dias`,
      meta: `${safe(kpis.diasEstoqueMeta) || 45} dias`,
      trend: kpis.diasEstoqueVsMesAnterior ?? null,
      trendSuffix: " dias",
      trendUpGood: false,
      sparkData: sparkVendas.length > 0 ? sparkVendas.map((_, i) => i + 1) : [],
      sparkType: "bar",
      color: "#60A5FA",
      alertMode: safe(kpis.diasEstoque) > (safe(kpis.diasEstoqueMeta) || 45) * 1.1,
    },
    {
      title: "PRODUTOS FORA",
      icon: <Warning />,
      value: `R$ ${fmtMoeda(safe(kpis.produtosForaValor))}`,
      meta: fmtMoeda(safe(kpis.metaProdutosFora)),
      trend: kpis.produtosForaVsMesAnterior ?? null,
      trendSuffix: "%",
      trendUpGood: false,
      sparkData: sparkProdutosFora,
      sparkType: "bar",
      color: "#EF4444",
      alertMode: safe(kpis.produtosForaValor) > safe(kpis.metaProdutosFora) * 1.1,
    },
  ]

  return (
    <Box sx={{ minHeight: "100vh", background: "#050816", color: "#fff", p: "12px 16px" }}>

      {/* ── Cabeçalho ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
          pb: 1,
          borderBottom: "1px solid #1E293B",
        }}
      >
        {/* Esquerda: título */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1E3A5F, #3B82F6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AttachMoney sx={{ color: "#fff", fontSize: "1.3rem" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "0.04em", lineHeight: 1 }}>
              DASHBOARD COMPRAS
            </Typography>
            <Typography sx={{ fontSize: "0.65rem", color: "#64748B", letterSpacing: "0.08em" }}>
              VISÃO GERAL DE DESEMPENHO — {mesAtual}
            </Typography>
          </Box>
        </Box>

        {/* Centro: data e hora */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CalendarToday sx={{ color: "#64748B", fontSize: "0.85rem" }} />
            <Typography sx={{ color: "#CBD5E1", fontSize: "0.85rem" }}>
              {now.toLocaleDateString("pt-BR")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AccessTime sx={{ color: "#64748B", fontSize: "0.85rem" }} />
            <Typography sx={{ color: "#CBD5E1", fontSize: "0.85rem", fontVariantNumeric: "tabular-nums" }}>
              {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </Typography>
          </Box>
        </Box>

        {/* Direita: atualização */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {error && (
            <Typography sx={{ fontSize: "0.7rem", color: "#F87171" }}>{error}</Typography>
          )}
          <Typography sx={{ fontSize: "0.72rem", color: "#4B5563" }}>
            {loading
              ? "Atualizando..."
              : minUpdate !== null
              ? minUpdate === 0
                ? "Atualizado agora"
                : `Atualizado há ${minUpdate} min`
              : ""}
          </Typography>
          <Box
            onClick={fetchDados}
            sx={{
              cursor: "pointer",
              color: loading ? "#64748B" : "#3B82F6",
              display: "flex",
              alignItems: "center",
              "&:hover": { color: "#60A5FA" },
            }}
          >
            <RefreshIcon sx={{ fontSize: "1rem" }} />
          </Box>
        </Box>
      </Box>

      {/* ── 6 Cards KPI ── */}
      <Grid container spacing={1.5} mb={1.5}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.title}>
            <KpiCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* ── Tabela por comprador ── */}
      <Card sx={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 2, mb: 1.5 }}>
        <CardContent sx={{ p: "12px !important" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Performance por Comprador
          </Typography>
          {data.compradores?.length ? (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { borderBottom: "1px solid #1E293B", py: 0.5 } }}>
                  {["Comprador", "Grupo", "Venda (% Meta)", "LB (%)", "Meta LB", "Evolução", "Prod. Fora (%)", "Status"].map((h) => (
                    <TableCell key={h} sx={{ color: "#64748B", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.compradores.map((c: any) => (
                  <TableRow
                    key={`${c.grupo}-${c.comprador}`}
                    sx={{ "&:hover": { background: "#0F1923" }, "& td": { borderBottom: "1px solid #111827", py: 0.6 } }}
                  >
                    <TableCell sx={{ color: "#E5E7EB", fontSize: "0.78rem" }}>{c.comprador}</TableCell>
                    <TableCell sx={{ color: "#94A3B8", fontSize: "0.78rem" }}>{c.grupo}</TableCell>
                    <TableCell sx={{ color: "#E5E7EB", fontSize: "0.78rem" }}>{safe(c.vendaPercentualMeta).toFixed(1)}%</TableCell>
                    <TableCell sx={{ color: "#E5E7EB", fontSize: "0.78rem" }}>{safe(c.lbPercentual).toFixed(1)}%</TableCell>
                    <TableCell sx={{ color: "#6B7280", fontSize: "0.78rem" }}>{safe(c.metaLb).toFixed(1)}%</TableCell>
                    <TableCell sx={{ color: safe(c.evolucaoPercentual) >= 0 ? "#22C55E" : "#EF4444", fontSize: "0.78rem" }}>
                      {safe(c.evolucaoPercentual) >= 0 ? "+" : ""}{safe(c.evolucaoPercentual).toFixed(1)}%
                    </TableCell>
                    <TableCell sx={{ color: "#E5E7EB", fontSize: "0.78rem" }}>{safe(c.produtosForaPercentual).toFixed(1)}%</TableCell>
                    <TableCell>
                      <Chip
                        label={c.status}
                        color={statusColor(safe(c.vendaPercentualMeta))}
                        size="small"
                        sx={{ fontSize: "0.65rem", height: 20 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography sx={{ color: "#4B5563", fontSize: "0.8rem" }}>
              Nenhum comprador com dados para o período atual.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* ── Gráficos de barras (% atingimento) ── */}
      <Grid container spacing={1.5} mb={1.5}>
        {[
          { title: "Atingimento de Vendas (%)", dados: data.graficos?.evolucaoVendas },
          { title: "Atingimento de LB (%)", dados: data.graficos?.evolucaoLb },
        ].map(({ title, dados }) => (
          <Grid item xs={12} md={6} key={title}>
            <Card sx={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 2 }}>
              <CardContent sx={{ p: "12px !important" }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", mb: 1, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {title}
                </Typography>
                <Stack spacing={0.75}>
                  {dados?.length ? (
                    dados.map((item: any) => (
                      <Box key={item.label}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                          <Typography sx={{ fontSize: "0.72rem", color: "#CBD5E1" }}>{item.label}</Typography>
                          <Typography sx={{ fontSize: "0.72rem", color: "#CBD5E1" }}>{safe(item.valor).toFixed(1)}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(0, Math.min(100, safe(item.valor)))}
                          color={statusColor(safe(item.valor))}
                          sx={{ height: 5, borderRadius: 1 }}
                        />
                      </Box>
                    ))
                  ) : (
                    <Typography sx={{ fontSize: "0.75rem", color: "#4B5563" }}>Sem dados para o período.</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Alertas ── */}
      <Card sx={{ background: "#0D1117", border: "1px solid #1E293B", borderRadius: 2 }}>
        <CardContent sx={{ p: "12px !important" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", mb: 1, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Alertas
          </Typography>
          <Stack spacing={0.75}>
            {data.alertas?.length ? (
              data.alertas.map((alerta: string, idx: number) => (
                <Alert key={idx} severity="warning" sx={{ py: 0.25, fontSize: "0.75rem" }}>{alerta}</Alert>
              ))
            ) : (
              <Alert severity="success" sx={{ py: 0.25, fontSize: "0.75rem" }}>Sem alertas críticos no momento.</Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
