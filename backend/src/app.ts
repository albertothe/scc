import express from "express"
import dotenv from "dotenv"
import produtoRoutes from "./routes/produtoRoutes"
import promocaoRoutes from "./routes/promocaoRoutes"
import comissaoRoutes from "./routes/comissaoRoutes"
import authRoutes from "./routes/authRoutes"
import vendedorMetaRoutes from "./routes/vendedorMetaRoutes"
import autorizacaoCompraRoutes from "./routes/autorizacaoCompraRoutes"
import controleAcessoRoutes from "./routes/controleAcessoRoutes"
import dreRoutes from "./routes/dreRoutes"
import dreF360Routes from "./routes/dreF360Routes"
import helpDeskRoutes from "./routes/helpDeskRoutes"
import compradoresRoutes from "./routes/compradoresRoutes"
import dashboardTvComprasRoutes from "./routes/dashboardTvComprasRoutes"
import { corsMiddleware } from "./config/cors"

// Carrega as variáveis de ambiente antes de qualquer outra operação
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8601

// Middleware para CORS
app.use(corsMiddleware)
app.use(express.json())

// Rotas da API
app.use("/api/produtos", produtoRoutes)
app.use("/api/promocoes", promocaoRoutes)
app.use("/api/comissoes", comissaoRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/vendedor-metas", vendedorMetaRoutes)
app.use("/api/autorizacao-compra", autorizacaoCompraRoutes)
app.use("/api/controle-acesso", controleAcessoRoutes)
app.use("/api/dre", dreRoutes)
app.use("/api/dre-f360", dreF360Routes)
app.use("/api/help-desk", helpDeskRoutes)
app.use("/api", compradoresRoutes)
app.use("/", dashboardTvComprasRoutes)

// Rota de teste para verificar se o servidor está funcionando
app.get("/", (req, res) => {
  res.json({ message: "API do Sistema de Produtos está funcionando!" })
})

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`)
})

export default app
