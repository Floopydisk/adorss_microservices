import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000"),
  nodeEnv: process.env.NODE_ENV || "development",

  // Service URLs
  services: {
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:8000",
    education: process.env.EDUCATION_SERVICE_URL || "http://localhost:8001",
    messaging: process.env.MESSAGING_SERVICE_URL || "http://localhost:8002",
    mobility: process.env.MOBILITY_SERVICE_URL || "http://localhost:8003",
    finance: process.env.FINANCE_SERVICE_URL || "http://localhost:8004",
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  },

  // JWT/Token settings
  jwt: {
    verifyTimeout: parseInt(process.env.JWT_VERIFY_TIMEOUT_MS || "5000"),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: process.env.CORS_CREDENTIALS === "true",
  },
};

export default config;
