import { Router } from "express"
import { verificarAutenticacao } from "../middlewares/authMiddleware"
import * as helpDeskController from "../controllers/helpDeskController"

const router = Router()

router.get("/chamados", verificarAutenticacao, helpDeskController.listarChamados)
router.get("/chamados/:id", verificarAutenticacao, helpDeskController.obterChamado)
router.post("/chamados", verificarAutenticacao, helpDeskController.criarChamado)
router.put("/chamados/:id", verificarAutenticacao, helpDeskController.atualizarChamado)
router.post("/chamados/:id/interacoes", verificarAutenticacao, helpDeskController.adicionarInteracao)

router.get("/ativos", verificarAutenticacao, helpDeskController.listarAtivos)
router.post("/ativos", verificarAutenticacao, helpDeskController.criarAtivo)

export default router
