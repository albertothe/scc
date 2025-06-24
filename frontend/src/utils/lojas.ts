export const LOJAS = [
    "LOURIVAL",
    "KENNEDY",
    "DIRCEU",
    "PREMIUM",
    "PARNAIBA",
    "TANCREDO",
    "PIÇARRA",
    "TIMON",
    "CD",
    "BLACK",
    "PICOS",
    "PREM.PHB",
    "CIMENTO",
    "E-COMMERCE",
    "ATACADO",
    "LIGHT",
    "CPTH",
] as const

export type Loja = typeof LOJAS[number]
