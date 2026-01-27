import { Router } from "express";
import parentFeesController from "../controllers/parentFeesController";
import { asyncHandler } from "../middleware/asyncHandler";
import { requirePermissions } from "../middleware/authMiddleware";

const router: Router = Router();

/**
 * Parent Fee Routes - Finance Service
 *
 * All routes require authentication via API Gateway
 */

// Get all fees grouped by school
router.get(
  "/fees",
  requirePermissions(["fees:read"]),
  asyncHandler(
    parentFeesController.getFeesGroupedBySchool.bind(parentFeesController),
  ),
);

// Get fees for a specific child
router.get(
  "/fees/:studentId",
  requirePermissions(["fees:read"]),
  asyncHandler(parentFeesController.getChildFees.bind(parentFeesController)),
);

// Get payment history
router.get(
  "/payments",
  requirePermissions(["payments:read"]),
  asyncHandler(
    parentFeesController.getPaymentHistory.bind(parentFeesController),
  ),
);

// Get receipts
router.get(
  "/receipts",
  requirePermissions(["receipts:read"]),
  asyncHandler(parentFeesController.getReceipts.bind(parentFeesController)),
);

// Get a specific receipt
router.get(
  "/receipts/:receiptId",
  requirePermissions(["receipts:read"]),
  asyncHandler(parentFeesController.getReceiptById.bind(parentFeesController)),
);

export default router;
