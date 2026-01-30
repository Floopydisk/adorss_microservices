/**
 * Public Routes - API Gateway & External Access
 *
 * These routes are exposed through the API Gateway for:
 * - Driver app
 * - Organization admin dashboard
 * - Public ride requests
 *
 * Base path: /api/mobility
 */

import { Router } from "express";
import transportTrackingController from "../controllers/transportTrackingController";

const router = Router();

// ==========================================
// Route Management
// ==========================================

/**
 * Get all routes
 * Query params: organizationId, status, type
 */
router.get(
  "/routes",
  transportTrackingController.getRoutes.bind(transportTrackingController),
);

/**
 * Get route by ID
 * Includes driver and vehicle info
 */
router.get(
  "/routes/:routeId",
  transportTrackingController.getRouteById.bind(transportTrackingController),
);

/**
 * Get real-time tracking for a route
 * Used by parents and admins to track buses
 */
router.get(
  "/routes/:routeId/tracking",
  transportTrackingController.getRouteTracking.bind(
    transportTrackingController,
  ),
);

/**
 * Get ETA for a specific stop
 * Query param: stopId (required), tripType (optional)
 */
router.get(
  "/routes/:routeId/eta",
  transportTrackingController.getETA.bind(transportTrackingController),
);

// ==========================================
// Driver Management
// ==========================================

/**
 * Get all drivers
 * Query params: organizationId, status
 */
router.get(
  "/drivers",
  transportTrackingController.getDrivers.bind(transportTrackingController),
);

/**
 * Get driver by ID
 * Includes current vehicle info
 */
router.get(
  "/drivers/:driverId",
  transportTrackingController.getDriverById.bind(transportTrackingController),
);

// ==========================================
// Vehicle Management
// ==========================================

/**
 * Get all vehicles
 * Query params: organizationId, status, type
 */
router.get(
  "/vehicles",
  transportTrackingController.getVehicles.bind(transportTrackingController),
);

/**
 * Get vehicle by ID
 * Includes current driver info
 */
router.get(
  "/vehicles/:vehicleId",
  transportTrackingController.getVehicleById.bind(transportTrackingController),
);

/**
 * Get real-time tracking for a vehicle
 * Returns current location, status, route info
 */
router.get(
  "/vehicles/:vehicleId/tracking",
  transportTrackingController.getVehicleTracking.bind(
    transportTrackingController,
  ),
);

// ==========================================
// Placeholder Routes (TODO: Implement)
// ==========================================

/**
 * Driver registration
 * POST /api/mobility/drivers
 */
router.post("/drivers", (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Driver registration not yet implemented",
    },
  });
});

/**
 * Update driver status (online/offline)
 * PATCH /api/mobility/drivers/:driverId/status
 */
router.patch("/drivers/:driverId/status", (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Driver status update not yet implemented",
    },
  });
});

/**
 * Update driver location
 * PATCH /api/mobility/drivers/:driverId/location
 */
router.patch("/drivers/:driverId/location", (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Driver location update not yet implemented",
    },
  });
});

/**
 * Create a ride request (Uber-like)
 * POST /api/mobility/rides
 */
router.post("/rides", (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Ride requests not yet implemented",
    },
  });
});

/**
 * Get ride request status
 * GET /api/mobility/rides/:rideId
 */
router.get("/rides/:rideId", (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Ride requests not yet implemented",
    },
  });
});

/**
 * Accept/reject ride request (for drivers)
 * PATCH /api/mobility/rides/:rideId
 */
router.patch("/rides/:rideId", (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Ride requests not yet implemented",
    },
  });
});

/**
 * Organization management
 * POST /api/mobility/organizations
 */
router.post("/organizations", (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Organization management not yet implemented",
    },
  });
});

/**
 * Create a route
 * POST /api/mobility/routes
 */
router.post("/routes", (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Route creation not yet implemented",
    },
  });
});

/**
 * Register a vehicle
 * POST /api/mobility/vehicles
 */
router.post("/vehicles", (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Vehicle registration not yet implemented",
    },
  });
});

export default router;
