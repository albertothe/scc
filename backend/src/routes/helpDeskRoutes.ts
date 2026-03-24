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

router.get("/ativos", verificarAutenticacao, verificarPermissao("ativos", "visualizar"), helpDeskController.listarAtivos)
router.post("/ativos", verificarAutenticacao, verificarPermissao("ativos", "incluir"), helpDeskController.criarAtivo)
router.put("/ativos/:id", verificarAutenticacao, verificarPermissao("ativos", "editar"), helpDeskController.atualizarAtivo)
router.delete("/ativos/:id", verificarAutenticacao, verificarPermissao("ativos", "excluir"), helpDeskController.excluirAtivo)

export default router
