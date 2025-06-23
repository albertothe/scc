import cors from "cors"

// Configuração do CORS para permitir a comunicação entre frontend e backend
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:8000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}

export const corsMiddleware = cors(corsOptions)