import cors from "cors"

/**
 * Configuração do CORS para permitir a comunicação entre frontend e backend.
 *
 * Se a variável de ambiente `FRONTEND_URL` estiver definida, ela é utilizada
 * como origem permitida. Caso contrário, todas as origens são aceitas para
 * evitar problemas em ambientes de desenvolvimento onde o endereço pode variar.
 */

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(origin => origin.trim()).filter(Boolean)
  : []

const corsOptions = allowedOrigins.length > 0
  ? {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }
  : {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }

export const corsMiddleware = cors(corsOptions)