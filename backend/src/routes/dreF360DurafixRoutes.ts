import { Router } from "express"
import { getDreF360Durafix, getLojasF360Durafix, putDreF360Durafix } from "../controllers/dreF360DurafixController"
import { verificarAutenticacao, verificarPermissao } from "../middlewares/authMiddleware"

const router = Router()

router.use(verificarAutenticacao)
router.get("/lojas", verificarPermissao("dre", "visualizar"), getLojasF360Durafix)
router.get("/",      verificarPermissao("dre", "visualizar"), getDreF360Durafix)
router.put("/:sequencial/:codloja/:ano/:mes", verificarPermissao("dre", "editar"), putDreF360Durafix)

export default router
