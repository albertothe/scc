import { Router } from "express"
import * as controller from "../controllers/compradoresController"
import { verificarAutenticacao } from "../middlewares/authMiddleware"

const router = Router()
router.use(verificarAutenticacao)

router.get("/compradores", controller.getCompradores)
router.post("/compradores", controller.criarComprador)
router.put("/compradores/:id", controller.atualizarComprador)
router.delete("/compradores/:id", controller.excluirComprador)

router.get("/comprador-grupo", controller.getCompradorGrupo)
router.post("/comprador-grupo", controller.criarCompradorGrupo)
router.put("/comprador-grupo/:id", controller.atualizarCompradorGrupo)
router.delete("/comprador-grupo/:id", controller.excluirCompradorGrupo)

router.get("/metas-compradores", controller.getMetasCompradores)
router.post("/metas-compradores", controller.criarMetaComprador)
router.put("/metas-compradores/:id", controller.atualizarMetaComprador)
router.delete("/metas-compradores/:id", controller.excluirMetaComprador)

export default router
