import { Router } from "express"
import * as comissaoVendedorController from "../controllers/comissaoVendedorController"
import { verificarAutenticacao, verificarPermissao } from "../middlewares/authMiddleware"

const router = Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(verificarAutenticacao)

// Rotas para vendedores e lojas
router.get("/vendedores", comissaoVendedorController.getVendedores)
router.get("/lojas", comissaoVendedorController.getLojas)

// Rotas para comissões de vendedores
router.get("/", comissaoVendedorController.getComissoesVendedores)
router.get("/:id", comissaoVendedorController.getComissaoVendedor)
router.post("/", comissaoVendedorController.criarComissaoVendedor)
router.put("/:id", comissaoVendedorController.atualizarComissaoVendedor)
router.patch("/:id", comissaoVendedorController.atualizarComissaoVendedor)
router.delete("/:id", comissaoVendedorController.excluirComissaoVendedor)

export default router
