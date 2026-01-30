import { Router } from "express";
import transportTrackingController from "../controllers/transportTrackingController";
import { asyncHandler } from "../middleware/asyncHandler";
import { requirePermissions } from "../middleware/permissionMiddleware";

const router: Router = Router();

/**
 * Transport Tracking Routes - Education Service
 *
 * All routes require authentication via API Gateway
 * These routes handle school transport tracking for parents
 */

// ==================== OVERVIEW ====================

// Get transport overview for all wards
router.get(
  "/overview",
  requirePermissions(["transport:read"]),
  asyncHandler(
    transportTrackingController.getTransportOverview.bind(
      transportTrackingController,
    ),
  ),
);

// ==================== WARD-SPECIFIC TRANSPORT ====================

// Get current transport status for a specific ward
router.get(
  "/wards/:studentId/status",
  requirePermissions(["transport:read"]),
  asyncHandler(
    transportTrackingController.getTransportStatus.bind(
      transportTrackingController,
    ),
  ),
);

// Get real-time route tracking data (for map display)
router.get(
  "/wards/:studentId/track",
  requirePermissions(["transport:read"]),
  asyncHandler(
    transportTrackingController.getRouteTracking.bind(
      transportTrackingController,
    ),
  ),
);

// Get ETA for current trip
router.get(
  "/wards/:studentId/eta",
  requirePermissions(["transport:read"]),
  asyncHandler(
    transportTrackingController.getETA.bind(transportTrackingController),
  ),
);

// Get today's transport summary for a ward
router.get(
  "/wards/:studentId/today",
  requirePermissions(["transport:read"]),
  asyncHandler(
    transportTrackingController.getTodayTransport.bind(
      transportTrackingController,
    ),
  ),
);

// Get route information for a ward
router.get(
  "/wards/:studentId/route",
  requirePermissions(["transport:read"]),
  asyncHandler(
    transportTrackingController.getRouteInfo.bind(transportTrackingController),
  ),
);

// Get transport history for a ward
router.get(
  "/wards/:studentId/history",
  requirePermissions(["transport:read"]),
  asyncHandler(
    transportTrackingController.getTransportHistory.bind(
      transportTrackingController,
    ),
  ),
);

// Notify absence from transport
router.post(
  "/wards/:studentId/notify-absence",
  requirePermissions(["transport:write"]),
  asyncHandler(
    transportTrackingController.notifyAbsence.bind(transportTrackingController),
  ),
);

export default router;
