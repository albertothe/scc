import express from "express"
import dotenv from "dotenv"
import produtoRoutes from "./routes/produtoRoutes"
import promocaoRoutes from "./routes/promocaoRoutes"
import comissaoRoutes from "./routes/comissaoRoutes"
import authRoutes from "./routes/authRoutes"
import vendedorMetaRoutes from "./routes/vendedorMetaRoutes"
import { corsMiddleware } from "./config/cors"

// Carrega as variáveis de ambiente antes de qualquer outra operação
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8001

// Middleware para CORS
app.use(corsMiddleware)
app.use(express.json())

// Rotas da API
app.use("/api/produtos", produtoRoutes)
app.use("/api/promocoes", promocaoRoutes)
app.use("/api/comissoes", comissaoRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/vendedor-metas", vendedorMetaRoutes)

// Rota de teste para verificar se o servidor está funcionando
app.get("/", (req, res) => {
  res.json({ message: "API do Sistema de Produtos está funcionando!" })
})

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`)
})

export default app
