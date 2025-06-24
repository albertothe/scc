import { Router } from "express"
import * as comissaoController from "../controllers/comissaoController"
import { verificarAutenticacao, verificarPermissao } from "../middlewares/authMiddleware"

const router = Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(verificarAutenticacao)

// Rotas que todos os níveis permitidos podem acessar
router.get("/", comissaoController.getFaixasComissao)
router.get("/:id", comissaoController.getFaixaComissao)

// Rotas que requerem nível específico
router.post("/", verificarPermissao("comissoes", "incluir"), comissaoController.criarFaixaComissao)
router.put(
    "/:id",
    verificarPermissao("comissoes", "editar"),
    comissaoController.atualizarFaixaComissao,
)
router.delete(
    "/:id",
    verificarPermissao("comissoes", "excluir"),
    comissaoController.excluirFaixaComissao,
)
router.delete(
    "/percentual/:id",
    verificarPermissao("comissoes", "excluir"),
    comissaoController.excluirPercentual,
)

export default router
