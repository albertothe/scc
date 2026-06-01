import api from "./api"

export const getCompradoresHistorico = async (ano: number, mes: number) => {
  const response = await api.get("/compradores/historico", { params: { ano, mes } })
  return response.data
}
