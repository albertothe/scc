import { Router } from "express"
import { getCompradoresHistorico } from "../controllers/compradoresHistoricoController"
import { verificarAutenticacao, verificarPermissao } from "../middlewares/authMiddleware"

const router = Router()

router.use(verificarAutenticacao)
router.get("/historico", verificarPermissao("compradores", "visualizar"), getCompradoresHistorico)

export default router
