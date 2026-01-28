import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Import routes
import parentRoutes from "./routes/parentRoutes";

// Import middleware
import { authMiddleware } from "./middleware/authMiddleware";

dotenv.config();

const app: Application = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check (no auth required)
app.get("/health", async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      service: "finance-service",
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: "finance-service",
      status: "unhealthy",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

// Service info (no auth required)
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Finance Service - Payments and billing",
    service: "finance-service",
    version: "1.0.0",
    endpoints: {
      parent: "/api/parent",
      health: "/health",
    },
  });
});

// Apply auth middleware to all /api routes
app.use("/api", authMiddleware);

// Parent routes (fees, payments, receipts)
app.use("/api/parent", parentRoutes);

// TODO: Add more routes
// app.use("/api/admin", adminRoutes);
// app.use("/api/fees", feesRoutes);

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.path,
  });
});

// Start server
const PORT = process.env.PORT || 8004;

const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("🐘 PostgreSQL connected successfully");

    app.listen(PORT, () => {
      console.log("🚀 finance-service running on port", PORT);
      console.log("📍 Health check: http://localhost:" + PORT + "/health");
      console.log("💰 Parent API: http://localhost:" + PORT + "/api/parent");
    });
  } catch (error) {
    console.error("❌ PostgreSQL connection error:", error);
    process.exit(1);
  }
};

startServer();

export default app;
