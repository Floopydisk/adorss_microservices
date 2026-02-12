import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import JWTValidator from "./utils/jwtValidator";
import AuthMiddleware from "./middleware/authMiddleware";
import { createAuthRoutes } from "./routes/authRoutes";
import createServiceRoutes from "./routes/serviceRoutes";
import AuthServiceClient from "./services/authServiceClient";

dotenv.config();

const app: Application = express();

// Initialize services
const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:8000";
const jwtValidator = new JWTValidator(authServiceUrl);
const authMiddleware = new AuthMiddleware(jwtValidator);
const authServiceClient = new AuthServiceClient(authServiceUrl);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  message: "Too many requests from this IP, please try again later.",
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    service: "api-gateway",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Environment variables (development only)
app.get("/debug/env", (req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "Environment debug endpoint is disabled in production",
    });
  }

  res.json({
    success: true,
    environment: process.env,
    timestamp: new Date().toISOString(),
  });
});

// Root
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API Gateway - Routes requests to microservices",
    service: "api-gateway",
    version: "1.0.0",
    auth_service: authServiceUrl,
  });
});

// Auth routes (public, with rate limiting)
app.use("/auth", authLimiter, createAuthRoutes(authServiceClient));

// Service routes (protected, requires authentication)
const serviceUrls = {
  education: process.env.EDUCATION_SERVICE_URL || "http://localhost:8001",
  messaging: process.env.MESSAGING_SERVICE_URL || "http://localhost:8002",
  mobility: process.env.MOBILITY_SERVICE_URL || "http://localhost:8003",
  finance: process.env.FINANCE_SERVICE_URL || "http://localhost:8004",
};

app.use("/api", createServiceRoutes(jwtValidator, authMiddleware, serviceUrls));

// Not found handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.path,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : undefined,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 api-gateway running on port", PORT);
  console.log("📍 Health check: http://localhost:" + PORT + "/health");
  console.log("🔐 Auth Service: " + authServiceUrl);
  console.log("📚 Education Service: " + serviceUrls.education);
  console.log("💬 Messaging Service: " + serviceUrls.messaging);
  console.log("🚕 Mobility Service: " + serviceUrls.mobility);
  console.log("💰 Finance Service: " + serviceUrls.finance);
});

export default app;
