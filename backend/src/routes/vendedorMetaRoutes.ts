import express from "express"
import * as vendedorMetaController from "../controllers/vendedorMetaController"
import { verificarAutenticacao, verificarPermissao } from "../middlewares/authMiddleware"

const router = express.Router()

// Rota de diagnóstico que não requer autenticação
router.get("/verificar-banco", vendedorMetaController.verificarEstruturaBanco)

// Rotas que não precisam de autenticação (temporariamente para diagnóstico)
router.get("/vendedores", vendedorMetaController.getVendedores)
router.get("/competencia/:competencia", vendedorMetaController.getMetasPorCompetencia)

// Rotas que precisam de autenticação
router.get("/:codvendedor/:competencia", verificarAutenticacao, vendedorMetaController.getMetaVendedor)
router.post("/", verificarAutenticacao, vendedorMetaController.salvarMetaVendedor)
router.delete("/:codvendedor/:competencia", verificarAutenticacao, vendedorMetaController.excluirMetaVendedor)
router.post("/copiar", verificarAutenticacao, vendedorMetaController.copiarMetas)

// Rota para importar metas em lote
router.post(
    "/importar",
    verificarAutenticacao,
    verificarPermissao("vendedor-metas", "incluir"),
    vendedorMetaController.importarMetas,
)

export default router
