/**
 * Internal Routes - Service-to-Service Communication
 *
 * These routes are called by other services (primarily Education Service)
 * for transport tracking data. They should be protected by service-to-service
 * authentication in production.
 *
 * Base path: /api/mobility/internal
 */

import { Router } from "express";
import transportTrackingController from "../controllers/transportTrackingController";

const router = Router();

// ==========================================
// Passenger Routes (for Education Service)
// ==========================================

/**
 * Get transport status for a student/passenger
 * Used by Education Service to show transport status to parents
 */
router.get(
  "/passengers/:studentId/status",
  transportTrackingController.getPassengerStatus.bind(
    transportTrackingController,
  ),
);

/**
 * Get transport history for a student/passenger
 * Used by Education Service to show transport history to parents
 */
router.get(
  "/passengers/:studentId/history",
  transportTrackingController.getPassengerHistory.bind(
    transportTrackingController,
  ),
);

/**
 * Notify that a student will be absent from transport
 * Used by Education Service when parent notifies absence
 */
router.post(
  "/passengers/:studentId/notify-absence",
  transportTrackingController.notifyAbsence.bind(transportTrackingController),
);

// ==========================================
// Route Tracking (for Education Service)
// ==========================================

/**
 * Get real-time tracking data for a route
 * Includes current location, progress, delays
 */
router.get(
  "/routes/:routeId/tracking",
  transportTrackingController.getRouteTracking.bind(
    transportTrackingController,
  ),
);

/**
 * Get ETA for a specific stop on a route
 * Used to show parents when bus will arrive
 */
router.get(
  "/routes/:routeId/eta",
  transportTrackingController.getETA.bind(transportTrackingController),
);

export default router;
