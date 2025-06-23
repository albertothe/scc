import { Router } from "express"
import * as produtoController from "../controllers/produtoController"
import { verificarAutenticacao, verificarNivel } from "../middlewares/authMiddleware"

const router = Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(verificarAutenticacao)

// Rotas que todos os níveis permitidos podem acessar
router.get("/fora", produtoController.getProdutosFora)
router.get("/etiquetas", produtoController.getProdutosEtiquetas)
router.get("/buscar", produtoController.buscarProdutos)

// Rotas que requerem nível específico
router.post("/fora", verificarNivel(["00", "15"]), produtoController.adicionarProdutoFora)
router.delete("/fora/:codproduto/:mesAno", verificarNivel(["00", "15"]), produtoController.removerProdutoFora)
router.post("/etiqueta", verificarNivel(["00", "15"]), produtoController.adicionarProdutoBandeira)
router.delete("/etiqueta/:codproduto/:mesAno", verificarNivel(["00", "15"]), produtoController.removerProdutoBandeira)
router.post("/fora/importar", verificarNivel(["00"]), produtoController.importarProdutosFora)
router.post("/etiqueta/importar", verificarNivel(["00"]), produtoController.importarProdutosEtiquetas)

export default router
