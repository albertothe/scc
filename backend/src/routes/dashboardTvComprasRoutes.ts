import { Router } from "express"
import cors from "cors"
import { dashboardTvCompras } from "../controllers/dashboardTvComprasController"

const router = Router()

// Rota pública — CORS sem restrição de origem para permitir acesso de TVs e
// qualquer dispositivo na rede, sobrepondo o middleware global restritivo.
const publicCors = cors({ origin: "*", methods: ["GET", "OPTIONS"] })

router.get("/dashboard-tv-compras", publicCors, dashboardTvCompras)
router.options("/dashboard-tv-compras", publicCors) // preflight para navegadores

export default router
