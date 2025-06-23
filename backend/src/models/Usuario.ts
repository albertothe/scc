export interface Usuario {
    usuario: string
    codusuario: string
    senha: string
    nivel: string
}

export interface UsuarioAutenticado {
    usuario: string
    codusuario: string
    nivel: string
    token: string
}
