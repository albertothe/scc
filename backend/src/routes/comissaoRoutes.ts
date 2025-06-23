import { Router } from "express"
import * as comissaoController from "../controllers/comissaoController"
import { verificarAutenticacao, verificarNivel } from "../middlewares/authMiddleware"

const router = Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(verificarAutenticacao)

// Rotas que todos os níveis permitidos podem acessar
router.get("/", comissaoController.getFaixasComissao)
router.get("/:id", comissaoController.getFaixaComissao)

// Rotas que requerem nível específico
router.post("/", verificarNivel(["00"]), comissaoController.criarFaixaComissao)
router.put("/:id", verificarNivel(["00"]), comissaoController.atualizarFaixaComissao)
router.delete("/:id", verificarNivel(["00"]), comissaoController.excluirFaixaComissao)
router.delete("/percentual/:id", verificarNivel(["00"]), comissaoController.excluirPercentual)

export default router
