import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Routes
import publicRoutes from "./routes/publicRoutes";
import internalRoutes from "./routes/internalRoutes";

dotenv.config();

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    service: "mobility-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    mode: "mock", // Indicates this is returning mock data
  });
});

// API Routes
app.use("/api/mobility", publicRoutes);
app.use("/api/mobility/internal", internalRoutes);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message:
      "Mobility Service - Fleet management, drivers, and transport tracking",
    service: "mobility-service",
    version: "1.0.0",
    assignedTo: "Backend Dev 2",
    mode: "mock",
    endpoints: {
      public: {
        routes: "GET /api/mobility/routes",
        drivers: "GET /api/mobility/drivers",
        vehicles: "GET /api/mobility/vehicles",
        tracking: "GET /api/mobility/routes/:routeId/tracking",
      },
      internal: {
        passengerStatus:
          "GET /api/mobility/internal/passengers/:studentId/status",
        passengerHistory:
          "GET /api/mobility/internal/passengers/:studentId/history",
        notifyAbsence:
          "POST /api/mobility/internal/passengers/:studentId/notify-absence",
        routeTracking: "GET /api/mobility/internal/routes/:routeId/tracking",
        routeETA: "GET /api/mobility/internal/routes/:routeId/eta",
      },
    },
    documentation: "See README.md for full API documentation",
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Endpoint not found: ${req.method} ${req.path}`,
    },
  });
});

const PORT = process.env.PORT || 8003;

app.listen(PORT, () => {
  console.log("🚀 mobility-service running on port", PORT);
  console.log("📍 Health check: http://localhost:" + PORT + "/health");
  console.log("🚌 Public API: http://localhost:" + PORT + "/api/mobility");
  console.log(
    "🔒 Internal API: http://localhost:" + PORT + "/api/mobility/internal",
  );
  console.log("⚠️  Mode: MOCK DATA - Replace with real implementations");
  console.log("👤 Assigned to: Backend Dev 2");
});

export default app;
