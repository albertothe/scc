import { Router } from "express"
import { getCompradoresHistorico } from "../controllers/compradoresHistoricoController"
import { verificarAutenticacao } from "../middlewares/authMiddleware"

const router = Router()

router.use(verificarAutenticacao)
router.get("/historico", getCompradoresHistorico)

export default router
