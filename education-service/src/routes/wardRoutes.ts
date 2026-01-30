import { Router } from "express";
import wardController from "../controllers/wardController";
import { asyncHandler } from "../middleware/asyncHandler";
import { requirePermissions } from "../middleware/permissionMiddleware";

const router: Router = Router();

/**
 * Ward Management Routes - Education Service
 *
 * All routes require authentication via API Gateway
 * These routes handle ward (child) management for parents
 */

// ==================== WARD LISTING & DETAILS ====================

// Get all wards (linked children)
router.get(
  "/",
  requirePermissions(["education:read"]),
  asyncHandler(wardController.getWards.bind(wardController)),
);

// Get detailed information for a specific ward
router.get(
  "/:studentId",
  requirePermissions(["education:read"]),
  asyncHandler(wardController.getWardDetails.bind(wardController)),
);

// ==================== ENROLLMENT REQUESTS ====================

// Get all enrollment requests
router.get(
  "/enrollment/requests",
  requirePermissions(["education:read"]),
  asyncHandler(wardController.getEnrollmentRequests.bind(wardController)),
);

// Submit a new enrollment request
router.post(
  "/enrollment/requests",
  requirePermissions(["education:write"]),
  asyncHandler(wardController.submitEnrollmentRequest.bind(wardController)),
);

// Get specific enrollment request details
router.get(
  "/enrollment/requests/:requestId",
  requirePermissions(["education:read"]),
  asyncHandler(wardController.getEnrollmentRequestDetails.bind(wardController)),
);

// Update a draft enrollment request
router.patch(
  "/enrollment/requests/:requestId",
  requirePermissions(["education:write"]),
  asyncHandler(wardController.updateEnrollmentRequest.bind(wardController)),
);

// Submit a draft enrollment request for review
router.patch(
  "/enrollment/requests/:requestId/submit",
  requirePermissions(["education:write"]),
  asyncHandler(wardController.submitDraftRequest.bind(wardController)),
);

// ==================== WARD SETTINGS ====================

// Get ward settings
router.get(
  "/:studentId/settings",
  requirePermissions(["education:read"]),
  asyncHandler(wardController.getWardSettings.bind(wardController)),
);

// Update ward settings
router.put(
  "/:studentId/settings",
  requirePermissions(["education:write"]),
  asyncHandler(wardController.updateWardSettings.bind(wardController)),
);

// Update emergency contact (primary parent only)
router.patch(
  "/:studentId/emergency-contact",
  requirePermissions(["education:write"]),
  asyncHandler(wardController.updateEmergencyContact.bind(wardController)),
);

// ==================== PICKUP AUTHORIZATIONS ====================

// Get all pickup authorizations for a ward
router.get(
  "/:studentId/pickup-authorizations",
  requirePermissions(["education:read"]),
  asyncHandler(wardController.getPickupAuthorizations.bind(wardController)),
);

// Create a new pickup authorization
router.post(
  "/:studentId/pickup-authorizations",
  requirePermissions(["education:write"]),
  asyncHandler(wardController.createPickupAuthorization.bind(wardController)),
);

// Cancel a pickup authorization
router.delete(
  "/:studentId/pickup-authorizations/:authId",
  requirePermissions(["education:write"]),
  asyncHandler(wardController.cancelPickupAuthorization.bind(wardController)),
);

export default router;
