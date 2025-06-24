import { Router } from "express"
import { verificarAutenticacao, verificarPermissao } from "../middlewares/authMiddleware"
import * as controleAcessoController from "../controllers/controleAcessoController"

const router = Router()

router.use(verificarAutenticacao)

router.get("/modulos", controleAcessoController.listarModulos)
router.post("/modulos", verificarPermissao("controle-acesso", "incluir"), controleAcessoController.criarModulo)
router.put(
    "/modulos/:id",
    verificarPermissao("controle-acesso", "editar"),
    controleAcessoController.atualizarModulo,
)
router.delete(
    "/modulos/:id",
    verificarPermissao("controle-acesso", "excluir"),
    controleAcessoController.excluirModulo,
)

router.get("/niveis", controleAcessoController.listarNiveis)
router.post(
    "/niveis",
    verificarPermissao("controle-acesso", "incluir"),
    controleAcessoController.criarNivel,
)
router.put(
    "/niveis/:codigo",
    verificarPermissao("controle-acesso", "editar"),
    controleAcessoController.atualizarNivel,
)
router.delete(
    "/niveis/:codigo",
    verificarPermissao("controle-acesso", "excluir"),
    controleAcessoController.excluirNivel,
)

router.get("/permissoes/:codigo", controleAcessoController.listarPermissoes)
router.put(
    "/permissoes/:codigo",
    verificarPermissao("controle-acesso", "editar"),
    controleAcessoController.salvarPermissoes,
)

export default router
