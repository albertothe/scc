import { Router } from "express"
import * as promocaoController from "../controllers/promocaoController"
import { verificarAutenticacao, verificarPermissao } from "../middlewares/authMiddleware"

const router = Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(verificarAutenticacao)

// Rotas que todos os níveis permitidos podem acessar
router.get("/", promocaoController.getProdutosPromocao)
router.get("/buscar", promocaoController.buscarProdutosPromocao)

// Rota para importação (apenas níveis específicos)
router.post(
    "/importar",
    verificarPermissao("promocoes", "incluir"),
    promocaoController.importarProdutosPromocao,
)

export default router
