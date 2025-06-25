import axios from "axios"

// Configuração do axios para a API utilizando variáveis de ambiente
const api = axios.create({
  // A URL base é obtida do arquivo .env
  baseURL: process.env.REACT_APP_API_URL ?? "http://localhost:8001/api",
})

// Adicionar logs para depuração
api.interceptors.request.use(
  (config) => {
    // Log da requisição completa para diagnóstico
    console.log(
      `API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      config.params || config.data,
    )

    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    console.error("API Request Error:", error)
    return Promise.reject(error)
  },
)

// Interceptor para tratar erros de autenticação e logar respostas
api.interceptors.response.use(
  (response) => {
    console.log(
      `API Response: ${response.status} ${response.config.url}`,
      response.data ? (Array.isArray(response.data) ? `${response.data.length} items` : "data") : "no data",
    )
    return response
  },
  (error) => {
    console.error(
      "API Response Error:",
      error.response
        ? {
          status: error.response.status,
          url: error.config?.url,
          data: error.response.data,
        }
        : error.message,
    )

    if (error.response && error.response.status === 401) {
      // Redirecionar para login se o token for inválido
      localStorage.removeItem("auth_token")
      localStorage.removeItem("usuario")
      window.location.href = "/login"
    }

    return Promise.reject(error)
  },
)

export default api
