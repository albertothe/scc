import cors from "cors"

// Configuração do CORS para permitir a comunicação entre frontend e backend.
// A variável FRONTEND_URL pode conter uma lista de origens separadas por vírgula.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:8000")
    .split(",")
    .map((origin) => origin.trim())

const corsOptions = {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}

export const corsMiddleware = cors(corsOptions)