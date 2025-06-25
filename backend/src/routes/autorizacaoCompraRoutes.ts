import { Router } from "express"
import { verificarAutenticacao, verificarPermissao } from "../middlewares/authMiddleware"
import * as autorizacaoCompraController from "../controllers/autorizacaoCompraController"

const router = Router()

// Rotas para autorização de compra
router.post(
    "/",
    verificarAutenticacao,
    verificarPermissao("autorizacao-compra", "incluir"),
    autorizacaoCompraController.criarAutorizacao,
)
router.get(
    "/",
    verificarAutenticacao,
    autorizacaoCompraController.listarAutorizacoes,
)
router.get(
    "/:id",
    verificarAutenticacao,
    autorizacaoCompraController.obterAutorizacao,
)
router.put(
    "/:id",
    verificarAutenticacao,
    verificarPermissao("autorizacao-compra", "editar"),
    autorizacaoCompraController.atualizarAutorizacao,
)
router.patch(
    "/:id",
    verificarAutenticacao,
    verificarPermissao("autorizacao-compra", "editar"),
    autorizacaoCompraController.atualizarAutorizacao,
)
router.put(
    "/:id/autorizar-controladoria",
    verificarAutenticacao,
    verificarPermissao("autorizacao-compra", "editar"),
    autorizacaoCompraController.autorizarControladoria,
)
router.put(
    "/:id/reverter-controladoria",
    verificarAutenticacao,
    verificarPermissao("autorizacao-compra", "editar"),
    autorizacaoCompraController.reverterControladoria,
)
router.put(
    "/:id/autorizar-diretoria",
    verificarAutenticacao,
    verificarPermissao("autorizacao-compra", "editar"),
    autorizacaoCompraController.autorizarDiretoria,
)
router.delete(
    "/:id",
    verificarAutenticacao,
    verificarPermissao("autorizacao-compra", "excluir"),
    autorizacaoCompraController.excluirAutorizacao,
)

export default router
