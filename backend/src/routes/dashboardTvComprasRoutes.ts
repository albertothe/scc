import { Router } from "express"
import { dashboardTvCompras } from "../controllers/dashboardTvComprasController"

const router = Router()

router.get("/dashboard-tv-compras", dashboardTvCompras)

export default router
