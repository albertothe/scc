import axios from "axios"

const getPublicApiBase = () => {
  const configuredBaseUrl = process.env.REACT_APP_API_URL?.trim()
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/api\/?$/, "")
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location
    return `${protocol}//${hostname}:8601`
  }
  return "http://localhost:8601"
}

export const getDashboardTvCompras = async () => {
  const response = await axios.get(`${getPublicApiBase()}/dashboard-tv-compras`)
  return response.data
}
