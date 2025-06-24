import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Home from "./pages/Home"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout"
import ProdutosFora from "./pages/ProdutosFora"
import ProdutosEtiquetas from "./pages/ProdutosEtiquetas"
import ProdutosPromocao from "./pages/ProdutosPromocao"
import Precificacao from "./pages/Precificacao" // Importar o componente de Precificação
import ComissaoFaixas from "./pages/ComissaoFaixas"
import ComissaoFormulario from "./pages/ComissaoFormulario"
import VendedorMetas from "./pages/VendedorMetas"
import VendedorMetaFormulario from "./pages/VendedorMetaFormulario"
import AutorizacaoCompraPage from "./pages/AutorizacaoCompra"
import AutorizacaoCompraFormulario from "./pages/AutorizacaoCompraFormulario"
import AutorizacaoCompraDetalhes from "./pages/AutorizacaoCompraDetalhes"
import ControleAcessoModulos from "./pages/ControleAcessoModulos"
import ControleAcessoNiveis from "./pages/ControleAcessoNiveis"
import ControleAcessoPermissoes from "./pages/ControleAcessoPermissoes"
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"

function App() {
  console.log("App renderizando")
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
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
                <ProtectedRoute rota="/produtos-fora">
                  <Layout>
                    <ProdutosFora />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/produtos-etiquetas"
              element={
                <ProtectedRoute rota="/produtos-etiquetas">
                  <Layout>
                    <ProdutosEtiquetas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/promocao"
              element={
                <ProtectedRoute rota="/promocao">
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
                <ProtectedRoute rota="/precificacao">
                  <Layout>
                    <Precificacao />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/faixas"
              element={
                <ProtectedRoute rota="/comissao/faixas">
                  <Layout>
                    <ComissaoFaixas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/faixas/nova"
              element={
                <ProtectedRoute rota="/comissao/faixas">
                  <Layout>
                    <ComissaoFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/faixas/editar/:id"
              element={
                <ProtectedRoute rota="/comissao/faixas">
                  <Layout>
                    <ComissaoFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/metas"
              element={
                <ProtectedRoute rota="/comissao/metas">
                  <Layout>
                    <VendedorMetas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/metas/nova"
              element={
                <ProtectedRoute rota="/comissao/metas">
                  <Layout>
                    <VendedorMetaFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/metas/editar/:codvendedor"
              element={
                <ProtectedRoute rota="/comissao/metas">
                  <Layout>
                    <VendedorMetaFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/autorizacao-compra"
              element={
                <ProtectedRoute rota="/controladoria/autorizacao-compra">
                  <Layout>
                    <AutorizacaoCompraPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/autorizacao-compra/novo"
              element={
                <ProtectedRoute rota="/controladoria/autorizacao-compra">
                  <Layout>
                    <AutorizacaoCompraFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/autorizacao-compra/editar/:id"
              element={
                <ProtectedRoute rota="/controladoria/autorizacao-compra">
                  <Layout>
                    <AutorizacaoCompraFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/autorizacao-compra/visualizar/:id"
              element={
                <ProtectedRoute rota="/controladoria/autorizacao-compra">
                  <Layout>
                    <AutorizacaoCompraDetalhes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controle-acesso/modulos"
              element={
                <ProtectedRoute rota="/controle-acesso/modulos">
                  <Layout>
                    <ControleAcessoModulos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controle-acesso/niveis"
              element={
                <ProtectedRoute rota="/controle-acesso/niveis">
                  <Layout>
                    <ControleAcessoNiveis />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controle-acesso/permissoes"
              element={
                <ProtectedRoute rota="/controle-acesso/permissoes">
                  <Layout>
                    <ControleAcessoPermissoes />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
