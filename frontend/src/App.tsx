import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Home from "./pages/Home"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout"
import ProdutosFora from "./pages/ProdutosFora"
import ProdutosEtiquetas from "./pages/ProdutosEtiquetas"
import ProdutosPromocao from "./pages/ProdutosPromocao"
import ProdutosFacing from "./pages/ProdutosFacing"
import Precificacao from "./pages/Precificacao" // Importar o componente de Precificação
import ComissaoFaixas from "./pages/ComissaoFaixas"
import ComissaoFormulario from "./pages/ComissaoFormulario"
import ComissaoVendedores from "./pages/ComissaoVendedores"
import VendedorMetas from "./pages/VendedorMetas"
import VendedorMetaFormulario from "./pages/VendedorMetaFormulario"
import AutorizacaoCompraPage from "./pages/AutorizacaoCompra"
import AutorizacaoCompraFormulario from "./pages/AutorizacaoCompraFormulario"
import AutorizacaoCompraDetalhes from "./pages/AutorizacaoCompraDetalhes"
import ControleAcessoModulos from "./pages/ControleAcessoModulos"
import ControleAcessoNiveis from "./pages/ControleAcessoNiveis"
import ControleAcessoPermissoes from "./pages/ControleAcessoPermissoes"
import Dre from "./pages/Dre"
import DreF360 from "./pages/DreF360"
import HelpDeskChamados from "./pages/HelpDeskChamados"
import HelpDeskAtivos from "./pages/HelpDeskAtivos"
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import Compradores from "./pages/Compradores"
import CompradoresGrupos from "./pages/CompradoresGrupos"
import CompradoresMetas from "./pages/CompradoresMetas"
import TvCompras from "./pages/TvCompras"
import TvComprasLojas from "./pages/TvComprasLojas"

function App() {
  console.log("App renderizando")
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/tv-compras" element={<TvCompras />} />
            <Route path="/tv-compras-lojas" element={<TvComprasLojas />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/produtos-fora"
              element={
                <ProtectedRoute rota="produtos">
                  <Layout>
                    <ProdutosFora />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/produtos-etiquetas"
              element={
                <ProtectedRoute rota="produtos">
                  <Layout>
                    <ProdutosEtiquetas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/produtos-facing"
              element={
                <ProtectedRoute rota="produtos">
                  <Layout>
                    <ProdutosFacing />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/promocao"
              element={
                <ProtectedRoute rota="promocoes">
                  <Layout>
                    <ProdutosPromocao />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Nova rota para Precificação */}
            <Route
              path="/precificacao"
              element={
                <ProtectedRoute rota="produtos">
                  <Layout>
                    <Precificacao />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/faixas"
              element={
                <ProtectedRoute rota="comissoes">
                  <Layout>
                    <ComissaoFaixas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/faixas/nova"
              element={
                <ProtectedRoute rota="comissoes">
                  <Layout>
                    <ComissaoFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/faixas/editar/:id"
              element={
                <ProtectedRoute rota="comissoes">
                  <Layout>
                    <ComissaoFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/vendedores"
              element={
                <ProtectedRoute rota="vendedor-metas">
                  <Layout>
                    <ComissaoVendedores />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/metas"
              element={
                <ProtectedRoute rota="vendedor-metas">
                  <Layout>
                    <VendedorMetas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/metas/nova"
              element={
                <ProtectedRoute rota="vendedor-metas">
                  <Layout>
                    <VendedorMetaFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/metas/editar/:codvendedor"
              element={
                <ProtectedRoute rota="vendedor-metas">
                  <Layout>
                    <VendedorMetaFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/dre"
              element={
                <ProtectedRoute rota="dre">
                  <Layout>
                    <Dre />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/dre-f360"
              element={
                <ProtectedRoute rota="dre">
                  <Layout>
                    <DreF360 />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/autorizacao-compra"
              element={
                <ProtectedRoute rota="autorizacao-compra">
                  <Layout>
                    <AutorizacaoCompraPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/autorizacao-compra/novo"
              element={
                <ProtectedRoute rota="autorizacao-compra">
                  <Layout>
                    <AutorizacaoCompraFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/autorizacao-compra/editar/:id"
              element={
                <ProtectedRoute rota="autorizacao-compra">
                  <Layout>
                    <AutorizacaoCompraFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/autorizacao-compra/visualizar/:id"
              element={
                <ProtectedRoute rota="autorizacao-compra">
                  <Layout>
                    <AutorizacaoCompraDetalhes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/help-desk/chamados"
              element={
                <ProtectedRoute>
                  <Layout>
                    <HelpDeskChamados />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/help-desk/ativos"
              element={
                <ProtectedRoute rota="ativos">
                  <Layout>
                    <HelpDeskAtivos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controle-acesso/modulos"
              element={
                <ProtectedRoute rota="controle-acesso">
                  <Layout>
                    <ControleAcessoModulos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controle-acesso/niveis"
              element={
                <ProtectedRoute rota="controle-acesso">
                  <Layout>
                    <ControleAcessoNiveis />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controle-acesso/permissoes"
              element={
                <ProtectedRoute rota="controle-acesso">
                  <Layout>
                    <ControleAcessoPermissoes />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="/compradores" element={<ProtectedRoute><Layout><Compradores /></Layout></ProtectedRoute>} />
            <Route path="/compradores/grupos" element={<ProtectedRoute><Layout><CompradoresGrupos /></Layout></ProtectedRoute>} />
            <Route path="/compradores/metas" element={<ProtectedRoute><Layout><CompradoresMetas /></Layout></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
