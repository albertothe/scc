import cors from "cors"

const isProduction = process.env.NODE_ENV === "production"

const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean)
    : isProduction
        ? [] // em produção, exige FRONTEND_URL explícito
        : ["http://localhost:8600", "http://localhost:3000"]

if (isProduction && allowedOrigins.length === 0) {
    throw new Error("FRONTEND_URL não definido em produção. Defina a variável de ambiente FRONTEND_URL.")
}

export const corsMiddleware = cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
})
