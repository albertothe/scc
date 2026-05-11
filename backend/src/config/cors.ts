import cors from "cors"

const isProduction = process.env.NODE_ENV === "production"

const devOrigins = [
    "http://localhost:8600",
    "http://localhost:3000",
    "http://10.5.59.85:8600",
    "http://10.5.59.85:3000",
]

const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean)
    : isProduction
        ? [] // em produção, exige FRONTEND_URL explícito
        : devOrigins

if (isProduction && allowedOrigins.length === 0) {
    throw new Error("FRONTEND_URL não definido em produção. Defina a variável de ambiente FRONTEND_URL.")
}

export const corsMiddleware = cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
})
