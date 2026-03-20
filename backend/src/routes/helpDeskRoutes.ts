import { Router } from "express"
import { verificarAutenticacao, verificarPermissao } from "../middlewares/authMiddleware"
import * as helpDeskController from "../controllers/helpDeskController"

const router = Router()

router.get("/chamados", verificarAutenticacao, helpDeskController.listarChamados)
router.get("/chamados/:id", verificarAutenticacao, helpDeskController.obterChamado)
router.post("/chamados", verificarAutenticacao, helpDeskController.criarChamado)
router.put("/chamados/:id", verificarAutenticacao, helpDeskController.atualizarChamado)
router.post("/chamados/:id/interacoes", verificarAutenticacao, helpDeskController.adicionarInteracao)
router.get("/lojas", verificarAutenticacao, helpDeskController.listarLojas)

router.get("/ativos", verificarPermissao("help-desk", "visualizar"), helpDeskController.listarAtivos)
router.post("/ativos", verificarPermissao("help-desk", "incluir"), helpDeskController.criarAtivo)
router.put("/ativos/:id", verificarPermissao("help-desk", "editar"), helpDeskController.atualizarAtivo)
router.delete("/ativos/:id", verificarPermissao("help-desk", "excluir"), helpDeskController.excluirAtivo)

export default router
