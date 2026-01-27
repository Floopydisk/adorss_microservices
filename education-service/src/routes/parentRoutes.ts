import { Router } from "express";
import parentController from "../controllers/parentController";
import { asyncHandler } from "../middleware/asyncHandler";
import { requirePermissions } from "../middleware/permissionMiddleware";

const router: Router = Router();

/**
 * Parent Routes - Education Service
 *
 * All routes require authentication via API Gateway
 * Permission checks are done at route level using middleware
 */

// Dashboard - get overview of all children
router.get(
  "/dashboard",
  requirePermissions(["education:read"]),
  asyncHandler(parentController.getDashboard.bind(parentController)),
);

// Get all linked children
router.get(
  "/children",
  requirePermissions(["education:read"]),
  asyncHandler(parentController.getChildren.bind(parentController)),
);

// Get announcements
router.get(
  "/announcements",
  requirePermissions(["announcements:read"]),
  asyncHandler(parentController.getAnnouncements.bind(parentController)),
);

// Child-specific routes
// All routes below require :studentId parameter

// Get assignments for a specific child
router.get(
  "/children/:studentId/assignments",
  requirePermissions(["assignments:read"]),
  asyncHandler(parentController.getChildAssignments.bind(parentController)),
);

// Get grades for a specific child
router.get(
  "/children/:studentId/grades",
  requirePermissions(["grades:read"]),
  asyncHandler(parentController.getChildGrades.bind(parentController)),
);

// Get attendance for a specific child
router.get(
  "/children/:studentId/attendance",
  requirePermissions(["attendance:read"]),
  asyncHandler(parentController.getChildAttendance.bind(parentController)),
);

// Get timetable for a specific child
router.get(
  "/children/:studentId/timetable",
  requirePermissions(["timetable:read"]),
  asyncHandler(parentController.getChildTimetable.bind(parentController)),
);

// Get results for a specific child
router.get(
  "/children/:studentId/results",
  requirePermissions(["results:read"]),
  asyncHandler(parentController.getChildResults.bind(parentController)),
);

// Get comprehensive grade report for a child
router.get(
  "/children/:studentId/report",
  requirePermissions(["grades:read"]),
  asyncHandler(parentController.getChildReport.bind(parentController)),
);

export default router;
