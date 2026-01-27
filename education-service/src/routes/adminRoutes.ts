import { Router } from "express";
import parentLinkController from "../controllers/parentLinkController";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireRole } from "../middleware/permissionMiddleware";

const router: Router = Router();

/**
 * Admin Routes - Education Service
 *
 * Administrative endpoints for managing education service data
 * Most routes require school_admin or super_admin role
 */

// ========== PARENT-STUDENT LINKS ==========

// Get all parent-student links
router.get(
  "/parent-links",
  requireRole(["school_admin", "super_admin"]),
  asyncHandler(parentLinkController.getAllLinks.bind(parentLinkController)),
);

// Create a new parent-student link
router.post(
  "/parent-links",
  requireRole(["school_admin", "super_admin"]),
  asyncHandler(parentLinkController.createLink.bind(parentLinkController)),
);

// Verify a pending parent-student link
router.patch(
  "/parent-links/:linkId/verify",
  requireRole(["school_admin", "super_admin"]),
  asyncHandler(parentLinkController.verifyLink.bind(parentLinkController)),
);

// Delete a parent-student link
router.delete(
  "/parent-links/:linkId",
  requireRole(["school_admin", "super_admin"]),
  asyncHandler(parentLinkController.deleteLink.bind(parentLinkController)),
);

export default router;
