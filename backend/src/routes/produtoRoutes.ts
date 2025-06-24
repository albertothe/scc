import { Router } from "express"
import * as produtoController from "../controllers/produtoController"
import { verificarAutenticacao, verificarPermissao } from "../middlewares/authMiddleware"

const router = Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(verificarAutenticacao)

// Rotas que todos os níveis permitidos podem acessar
router.get("/fora", produtoController.getProdutosFora)
router.get("/etiquetas", produtoController.getProdutosEtiquetas)
router.get("/buscar", produtoController.buscarProdutos)

// Rotas que requerem nível específico
router.post("/fora", verificarPermissao("produtos", "incluir"), produtoController.adicionarProdutoFora)
router.delete(
    "/fora/:codproduto/:mesAno",
    verificarPermissao("produtos", "excluir"),
    produtoController.removerProdutoFora,
)
router.post("/etiqueta", verificarPermissao("produtos", "incluir"), produtoController.adicionarProdutoBandeira)
router.delete(
    "/etiqueta/:codproduto/:mesAno",
    verificarPermissao("produtos", "excluir"),
    produtoController.removerProdutoBandeira,
)
router.post(
    "/fora/importar",
    verificarPermissao("produtos", "incluir"),
    produtoController.importarProdutosFora,
)
router.post(
    "/etiqueta/importar",
    verificarPermissao("produtos", "incluir"),
    produtoController.importarProdutosEtiquetas,
)

export default router
