import { Router } from "express"
import { getDre, putDre } from "../controllers/dreController"
import { verificarAutenticacao, verificarPermissao } from "../middlewares/authMiddleware"

const router = Router()

router.use(verificarAutenticacao)
router.get("/", verificarPermissao("dre", "visualizar"), getDre)
router.put("/:sequencial", verificarPermissao("dre", "editar"), putDre)

export default router
