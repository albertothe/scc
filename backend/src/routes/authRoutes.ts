import { Router } from "express"
import * as authController from "../controllers/authController"
import { verificarAutenticacao } from "../middlewares/authMiddleware"

const router = Router()

// Rota de login
router.post("/login", authController.login)

// Rota para verificar autenticação
router.get("/verificar", verificarAutenticacao, authController.verificarAutenticacao)

export default router
