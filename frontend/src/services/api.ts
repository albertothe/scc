import axios from "axios"

const getApiBaseUrl = (): string => {
  const configuredBaseUrl = process.env.REACT_APP_API_URL?.trim()

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "")
  }

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location
    return `${protocol}//${hostname}:8601/api`
  }

  return "http://localhost:8601/api"
}

// Configuração do axios para a API utilizando variáveis de ambiente
const api = axios.create({
  baseURL: getApiBaseUrl(),
})

// Adicionar logs para depuração
api.interceptors.request.use(
  (config) => {
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
      localStorage.removeItem("auth_token")
      localStorage.removeItem("usuario")
      window.location.href = "/login"
    }

    return Promise.reject(error)
  },
)

export default api
