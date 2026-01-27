import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Import routes
import parentRoutes from "./routes/parentRoutes";
import adminRoutes from "./routes/adminRoutes";
import parentLinkController from "./controllers/parentLinkController";
import { asyncHandler } from "./middleware/asyncHandler";
import { requirePermissions } from "./middleware/permissionMiddleware";

// Import middleware
import { authMiddleware } from "./middleware/authMiddleware";

dotenv.config();

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check (no auth required)
app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    service: "education-service",
    status: "healthy",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Service info (no auth required)
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Education Service - Assignments, grades, attendance",
    service: "education-service",
    version: "1.0.0",
    endpoints: {
      parent: "/api/parent",
      health: "/health",
    },
  });
});

// Apply auth middleware to all /api routes
app.use("/api", authMiddleware);

// Parent routes
app.use("/api/parent", parentRoutes);

// Parent can request to link with children
app.post(
  "/api/parent/link-request",
  requirePermissions(["education:read"]),
  asyncHandler(parentLinkController.requestLink.bind(parentLinkController)),
);

// Parent can update their own link permissions
app.patch(
  "/api/parent/links/:linkId/permissions",
  requirePermissions(["education:read"]),
  asyncHandler(
    parentLinkController.updateMyLinkPermissions.bind(parentLinkController),
  ),
);

// Admin routes
app.use("/api/admin", adminRoutes);

// TODO: Add more routes
// app.use('/api/student', studentRoutes);
// app.use('/api/teacher', teacherRoutes);
// app.use('/api/admin', adminRoutes);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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

// Database connection
const connectDB = async (): Promise<void> => {
  const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/education-service";

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Mongoose event handlers
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected");
});

// Start server
const PORT = process.env.PORT || 8001;

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log("🚀 education-service running on port", PORT);
    console.log("📍 Health check: http://localhost:" + PORT + "/health");
    console.log("📚 Parent API: http://localhost:" + PORT + "/api/parent");
  });
};

startServer();

export default app;
