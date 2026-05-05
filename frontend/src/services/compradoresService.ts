import api from "./api"

export const listarCompradores = async () => (await api.get("/compradores")).data
export const criarComprador = async (payload: any) => (await api.post("/compradores", payload)).data
export const atualizarComprador = async (id: number, payload: any) => (await api.put(`/compradores/${id}`, payload)).data
export const excluirComprador = async (id: number) => (await api.delete(`/compradores/${id}`)).data

export const listarCompradorGrupo = async () => (await api.get("/comprador-grupo")).data
export const criarCompradorGrupo = async (payload: any) => (await api.post("/comprador-grupo", payload)).data
export const atualizarCompradorGrupo = async (id: number, payload: any) =>
  (await api.put(`/comprador-grupo/${id}`, payload)).data
export const excluirCompradorGrupo = async (id: number) => (await api.delete(`/comprador-grupo/${id}`)).data

export const listarMetasCompradores = async (params: any) => (await api.get("/metas-compradores", { params })).data
export const salvarMetaComprador = async (meta: any) => meta.id
  ? (await api.put(`/metas-compradores/${meta.id}`, meta)).data
  : (await api.post("/metas-compradores", meta)).data
export const excluirMetaComprador = async (id: number) => (await api.delete(`/metas-compradores/${id}`)).data
