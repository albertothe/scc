import { Router } from "express"
import { verificarAutenticacao, verificarNivel } from "../middlewares/authMiddleware"
import * as autorizacaoCompraController from "../controllers/autorizacaoCompraController"

const router = Router()

// Rotas para autorização de compra
router.post("/", verificarAutenticacao, autorizacaoCompraController.criarAutorizacao)
router.get("/", verificarAutenticacao, autorizacaoCompraController.listarAutorizacoes)
router.get("/:id", verificarAutenticacao, autorizacaoCompraController.obterAutorizacao)
router.put(
    "/:id/autorizar-controladoria",
    verificarAutenticacao,
    verificarNivel(["06"]),
    autorizacaoCompraController.autorizarControladoria,
)
router.put(
    "/:id/autorizar-diretoria",
    verificarAutenticacao,
    verificarNivel(["00"]),
    autorizacaoCompraController.autorizarDiretoria,
)
router.delete("/:id", verificarAutenticacao, autorizacaoCompraController.excluirAutorizacao)

export default router
