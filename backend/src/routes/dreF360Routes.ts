import { Router } from "express"
import { getDreF360, getLojasF360, putDreF360 } from "../controllers/dreF360Controller"
import { verificarAutenticacao, verificarPermissao } from "../middlewares/authMiddleware"

const router = Router()

router.use(verificarAutenticacao)
router.get("/lojas", verificarPermissao("dre", "visualizar"), getLojasF360)
router.get("/", verificarPermissao("dre", "visualizar"), getDreF360)
router.put("/:sequencial/:codloja/:ano/:mes", verificarPermissao("dre", "editar"), putDreF360)

export default router
