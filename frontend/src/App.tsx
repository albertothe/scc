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
                <ProtectedRoute niveisPermitidos={["00", "15", "80"]}>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute niveisPermitidos={["00", "15", "80"]}>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/produtos-fora"
              element={
                <ProtectedRoute niveisPermitidos={["00", "15", "80"]}>
                  <Layout>
                    <ProdutosFora />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/produtos-etiquetas"
              element={
                <ProtectedRoute niveisPermitidos={["00", "15", "80"]}>
                  <Layout>
                    <ProdutosEtiquetas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/promocao"
              element={
                <ProtectedRoute niveisPermitidos={["00", "15", "80"]}>
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
                <ProtectedRoute niveisPermitidos={["00", "15", "80"]}>
                  <Layout>
                    <Precificacao />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/faixas"
              element={
                <ProtectedRoute niveisPermitidos={["00", "15", "80"]}>
                  <Layout>
                    <ComissaoFaixas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/faixas/nova"
              element={
                <ProtectedRoute niveisPermitidos={["00", "15", "80"]}>
                  <Layout>
                    <ComissaoFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/faixas/editar/:id"
              element={
                <ProtectedRoute niveisPermitidos={["00", "15", "80"]}>
                  <Layout>
                    <ComissaoFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/metas"
              element={
                <ProtectedRoute niveisPermitidos={["00", "15", "80"]}>
                  <Layout>
                    <VendedorMetas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/metas/nova"
              element={
                <ProtectedRoute niveisPermitidos={["00", "15", "80"]}>
                  <Layout>
                    <VendedorMetaFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissao/metas/editar/:codvendedor"
              element={
                <ProtectedRoute niveisPermitidos={["00", "15", "80"]}>
                  <Layout>
                    <VendedorMetaFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/autorizacao-compra"
              element={
                <ProtectedRoute niveisPermitidos={["00", "06", "15", "80"]}>
                  <Layout>
                    <AutorizacaoCompraPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/autorizacao-compra/novo"
              element={
                <ProtectedRoute niveisPermitidos={["00", "06", "15", "80"]}>
                  <Layout>
                    <AutorizacaoCompraFormulario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controladoria/autorizacao-compra/editar/:id"
              element={
                <ProtectedRoute niveisPermitidos={["00", "06", "15", "80"]}>
                  <Layout>
                    <AutorizacaoCompraFormulario />
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
