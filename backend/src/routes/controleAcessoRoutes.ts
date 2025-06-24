import { Router } from "express"
import { verificarAutenticacao, verificarNivel } from "../middlewares/authMiddleware"
import * as controleAcessoController from "../controllers/controleAcessoController"

const router = Router()

router.use(verificarAutenticacao)

router.get("/modulos", controleAcessoController.listarModulos)
router.post("/modulos", verificarNivel(["00"]), controleAcessoController.criarModulo)
router.put("/modulos/:id", verificarNivel(["00"]), controleAcessoController.atualizarModulo)
router.delete("/modulos/:id", verificarNivel(["00"]), controleAcessoController.excluirModulo)

router.get("/niveis", controleAcessoController.listarNiveis)
router.post("/niveis", verificarNivel(["00"]), controleAcessoController.criarNivel)
router.put("/niveis/:codigo", verificarNivel(["00"]), controleAcessoController.atualizarNivel)
router.delete("/niveis/:codigo", verificarNivel(["00"]), controleAcessoController.excluirNivel)

router.get("/permissoes/:codigo", controleAcessoController.listarPermissoes)
router.put("/permissoes/:codigo", verificarNivel(["00"]), controleAcessoController.salvarPermissoes)

export default router
