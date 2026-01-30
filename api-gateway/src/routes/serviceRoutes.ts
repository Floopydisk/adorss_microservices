import { Router } from "express";
import ServiceRouter from "../middleware/serviceRouter";
import AuthMiddleware from "../middleware/authMiddleware";
import JWTValidator from "../utils/jwtValidator";

export function createServiceRoutes(
  jwtValidator: JWTValidator,
  authMiddleware: AuthMiddleware,
  serviceUrls: {
    education: string;
    messaging: string;
    mobility: string;
    finance: string;
  },
): Router {
  const router = Router();

  // ========== EDUCATION SERVICE ROUTES ==========

  // Assignments - create, read, update, delete
  router.post(
    "/education/assignments",
    authMiddleware.authenticate,
    authMiddleware.authorize("assignments", "create"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/assignments": "/assignments",
    }),
  );

  router.get(
    "/education/assignments",
    authMiddleware.authenticate,
    authMiddleware.authorize("assignments", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/assignments": "/assignments",
    }),
  );

  router.get(
    "/education/assignments/:id",
    authMiddleware.authenticate,
    authMiddleware.authorize("assignments", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/assignments": "/assignments",
    }),
  );

  router.patch(
    "/education/assignments/:id",
    authMiddleware.authenticate,
    authMiddleware.authorize("assignments", "update"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/assignments": "/assignments",
    }),
  );

  router.delete(
    "/education/assignments/:id",
    authMiddleware.authenticate,
    authMiddleware.authorize("assignments", "delete"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/assignments": "/assignments",
    }),
  );

  // Grades
  router.post(
    "/education/grades",
    authMiddleware.authenticate,
    authMiddleware.authorize("grades", "create"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/grades": "/grades",
    }),
  );

  router.get(
    "/education/grades",
    authMiddleware.authenticate,
    authMiddleware.authorize("grades", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/grades": "/grades",
    }),
  );

  router.patch(
    "/education/grades/:id",
    authMiddleware.authenticate,
    authMiddleware.authorize("grades", "update"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/grades": "/grades",
    }),
  );

  // Attendance
  router.post(
    "/education/attendance",
    authMiddleware.authenticate,
    authMiddleware.authorize("attendance", "create"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/attendance": "/attendance",
    }),
  );

  router.get(
    "/education/attendance",
    authMiddleware.authenticate,
    authMiddleware.authorize("attendance", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/attendance": "/attendance",
    }),
  );

  router.patch(
    "/education/attendance/:id",
    authMiddleware.authenticate,
    authMiddleware.authorize("attendance", "update"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/attendance": "/attendance",
    }),
  );

  // Timetable
  router.get(
    "/education/timetable",
    authMiddleware.authenticate,
    authMiddleware.authorize("timetable", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/timetable": "/timetable",
    }),
  );

  router.post(
    "/education/timetable",
    authMiddleware.authenticate,
    authMiddleware.authorize("timetable", "create"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/timetable": "/timetable",
    }),
  );

  router.patch(
    "/education/timetable/:id",
    authMiddleware.authenticate,
    authMiddleware.authorize("timetable", "update"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/timetable": "/timetable",
    }),
  );

  // Results
  router.get(
    "/education/results",
    authMiddleware.authenticate,
    authMiddleware.authorize("results", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/results": "/results",
    }),
  );

  router.post(
    "/education/results",
    authMiddleware.authenticate,
    authMiddleware.authorize("results", "create"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/results": "/results",
    }),
  );

  router.patch(
    "/education/results/:id",
    authMiddleware.authenticate,
    authMiddleware.authorize("results", "update"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/results": "/results",
    }),
  );

  // Classes
  router.get(
    "/education/classes",
    authMiddleware.authenticate,
    authMiddleware.authorize("classes", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/classes": "/classes",
    }),
  );

  router.post(
    "/education/classes",
    authMiddleware.authenticate,
    authMiddleware.authorize("classes", "manage"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/classes": "/classes",
    }),
  );

  // Students
  router.get(
    "/education/students",
    authMiddleware.authenticate,
    authMiddleware.authorize("students", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/students": "/students",
    }),
  );

  router.post(
    "/education/students",
    authMiddleware.authenticate,
    authMiddleware.authorize("students", "create"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/students": "/students",
    }),
  );

  router.patch(
    "/education/students/:id",
    authMiddleware.authenticate,
    authMiddleware.authorize("students", "update"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/students": "/students",
    }),
  );

  // Teachers
  router.get(
    "/education/teachers",
    authMiddleware.authenticate,
    authMiddleware.authorize("teachers", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/teachers": "/teachers",
    }),
  );

  router.post(
    "/education/teachers",
    authMiddleware.authenticate,
    authMiddleware.authorize("teachers", "create"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/teachers": "/teachers",
    }),
  );

  router.patch(
    "/education/teachers/:id",
    authMiddleware.authenticate,
    authMiddleware.authorize("teachers", "update"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/teachers": "/teachers",
    }),
  );

  // ========== PARENT-SPECIFIC EDUCATION ROUTES ==========
  // These routes are specifically designed for the parent role

  // Parent Dashboard - overview of all linked children
  router.get(
    "/education/parent/dashboard",
    authMiddleware.authenticate,
    authMiddleware.authorize("education", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/parent": "/api/parent",
    }),
  );

  // Get all children linked to this parent
  router.get(
    "/education/parent/children",
    authMiddleware.authenticate,
    authMiddleware.authorize("education", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/parent": "/api/parent",
    }),
  );

  // Get announcements for parents
  router.get(
    "/education/parent/announcements",
    authMiddleware.authenticate,
    authMiddleware.authorize("announcements", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/parent": "/api/parent",
    }),
  );

  // Child-specific routes - assignments
  router.get(
    "/education/parent/children/:studentId/assignments",
    authMiddleware.authenticate,
    authMiddleware.authorize("assignments", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/parent": "/api/parent",
    }),
  );

  // Child-specific routes - grades
  router.get(
    "/education/parent/children/:studentId/grades",
    authMiddleware.authenticate,
    authMiddleware.authorize("grades", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/parent": "/api/parent",
    }),
  );

  // Child-specific routes - attendance
  router.get(
    "/education/parent/children/:studentId/attendance",
    authMiddleware.authenticate,
    authMiddleware.authorize("attendance", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/parent": "/api/parent",
    }),
  );

  // Child-specific routes - timetable
  router.get(
    "/education/parent/children/:studentId/timetable",
    authMiddleware.authenticate,
    authMiddleware.authorize("timetable", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/parent": "/api/parent",
    }),
  );

  // Child-specific routes - results
  router.get(
    "/education/parent/children/:studentId/results",
    authMiddleware.authenticate,
    authMiddleware.authorize("results", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/parent": "/api/parent",
    }),
  );

  // Child-specific routes - grade report
  router.get(
    "/education/parent/children/:studentId/report",
    authMiddleware.authenticate,
    authMiddleware.authorize("grades", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/parent": "/api/parent",
    }),
  );

  // Parent link request - parent requests to link with a child
  router.post(
    "/education/parent/link-request",
    authMiddleware.authenticate,
    authMiddleware.authorize("education", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/parent": "/api/parent",
    }),
  );

  // Parent update own link permissions
  router.patch(
    "/education/parent/links/:linkId/permissions",
    authMiddleware.authenticate,
    authMiddleware.authorize("education", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/parent": "/api/parent",
    }),
  );

  // ========== EDUCATION ADMIN ROUTES ==========
  // Administrative endpoints for school admins

  // Get all parent-student links
  router.get(
    "/education/admin/parent-links",
    authMiddleware.authenticate,
    authMiddleware.authorize("students", "manage"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/admin": "/api/admin",
    }),
  );

  // Create a parent-student link
  router.post(
    "/education/admin/parent-links",
    authMiddleware.authenticate,
    authMiddleware.authorize("students", "manage"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/admin": "/api/admin",
    }),
  );

  // Verify a pending parent-student link
  router.patch(
    "/education/admin/parent-links/:linkId/verify",
    authMiddleware.authenticate,
    authMiddleware.authorize("students", "manage"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/admin": "/api/admin",
    }),
  );

  // Delete a parent-student link
  router.delete(
    "/education/admin/parent-links/:linkId",
    authMiddleware.authenticate,
    authMiddleware.authorize("students", "manage"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/education/admin": "/api/admin",
    }),
  );

  // ========== MESSAGING SERVICE ROUTES ==========

  // Messages
  router.post(
    "/messaging/messages",
    authMiddleware.authenticate,
    authMiddleware.authorize("messages", "create"),
    ServiceRouter.createProxy(serviceUrls.messaging, {
      "^/api/messaging/messages": "/messages",
    }),
  );

  router.get(
    "/messaging/messages",
    authMiddleware.authenticate,
    authMiddleware.authorize("messages", "read"),
    ServiceRouter.createProxy(serviceUrls.messaging, {
      "^/api/messaging/messages": "/messages",
    }),
  );

  router.delete(
    "/messaging/messages/:id",
    authMiddleware.authenticate,
    authMiddleware.authorize("messages", "delete"),
    ServiceRouter.createProxy(serviceUrls.messaging, {
      "^/api/messaging/messages": "/messages",
    }),
  );

  // Notifications
  router.get(
    "/messaging/notifications",
    authMiddleware.authenticate,
    authMiddleware.authorize("notifications", "read"),
    ServiceRouter.createProxy(serviceUrls.messaging, {
      "^/api/messaging/notifications": "/notifications",
    }),
  );

  router.patch(
    "/messaging/notifications/:id",
    authMiddleware.authenticate,
    authMiddleware.authorize("notifications", "dismiss"),
    ServiceRouter.createProxy(serviceUrls.messaging, {
      "^/api/messaging/notifications": "/notifications",
    }),
  );

  // Announcements
  router.get(
    "/messaging/announcements",
    authMiddleware.authenticate,
    authMiddleware.authorize("announcements", "read"),
    ServiceRouter.createProxy(serviceUrls.messaging, {
      "^/api/messaging/announcements": "/announcements",
    }),
  );

  router.post(
    "/messaging/announcements",
    authMiddleware.authenticate,
    authMiddleware.authorize("announcements", "create"),
    ServiceRouter.createProxy(serviceUrls.messaging, {
      "^/api/messaging/announcements": "/announcements",
    }),
  );

  // ========== MOBILITY SERVICE ROUTES ==========

  // Routes - Transport routes management
  router.get(
    "/mobility/routes",
    authMiddleware.authenticate,
    authMiddleware.authorize("routes", "read"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.get(
    "/mobility/routes/:routeId",
    authMiddleware.authenticate,
    authMiddleware.authorize("routes", "read"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.get(
    "/mobility/routes/:routeId/tracking",
    authMiddleware.authenticate,
    authMiddleware.authorize("routes", "read"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.get(
    "/mobility/routes/:routeId/eta",
    authMiddleware.authenticate,
    authMiddleware.authorize("routes", "read"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.post(
    "/mobility/routes",
    authMiddleware.authenticate,
    authMiddleware.authorize("routes", "manage"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  // Drivers - Driver management
  router.get(
    "/mobility/drivers",
    authMiddleware.authenticate,
    authMiddleware.authorize("drivers", "read"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.get(
    "/mobility/drivers/:driverId",
    authMiddleware.authenticate,
    authMiddleware.authorize("drivers", "read"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.post(
    "/mobility/drivers",
    authMiddleware.authenticate,
    authMiddleware.authorize("drivers", "manage"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.patch(
    "/mobility/drivers/:driverId/status",
    authMiddleware.authenticate,
    authMiddleware.authorize("drivers", "manage"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.patch(
    "/mobility/drivers/:driverId/location",
    authMiddleware.authenticate,
    authMiddleware.authorize("drivers", "manage"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  // Vehicles - Vehicle/fleet management
  router.get(
    "/mobility/vehicles",
    authMiddleware.authenticate,
    authMiddleware.authorize("vehicles", "read"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.get(
    "/mobility/vehicles/:vehicleId",
    authMiddleware.authenticate,
    authMiddleware.authorize("vehicles", "read"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.get(
    "/mobility/vehicles/:vehicleId/tracking",
    authMiddleware.authenticate,
    authMiddleware.authorize("vehicles", "read"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.post(
    "/mobility/vehicles",
    authMiddleware.authenticate,
    authMiddleware.authorize("vehicles", "manage"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  // Rides - Ride requests (Uber-like functionality)
  router.post(
    "/mobility/rides",
    authMiddleware.authenticate,
    authMiddleware.authorize("rides", "create"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.get(
    "/mobility/rides/:rideId",
    authMiddleware.authenticate,
    authMiddleware.authorize("rides", "read"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  router.patch(
    "/mobility/rides/:rideId",
    authMiddleware.authenticate,
    authMiddleware.authorize("rides", "update"),
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/api/mobility",
    }),
  );

  // ========== FINANCE SERVICE ROUTES ==========

  // ========== PARENT-SPECIFIC FINANCE ROUTES ==========

  // Get all fees grouped by school (for parent)
  router.get(
    "/finance/parent/fees",
    authMiddleware.authenticate,
    authMiddleware.authorize("fees", "read"),
    ServiceRouter.createProxy(serviceUrls.finance, {
      "^/api/finance/parent": "/api/parent",
    }),
  );

  // Get fees for a specific child
  router.get(
    "/finance/parent/fees/:studentId",
    authMiddleware.authenticate,
    authMiddleware.authorize("fees", "read"),
    ServiceRouter.createProxy(serviceUrls.finance, {
      "^/api/finance/parent": "/api/parent",
    }),
  );

  // Get parent's payment history
  router.get(
    "/finance/parent/payments",
    authMiddleware.authenticate,
    authMiddleware.authorize("payments", "read"),
    ServiceRouter.createProxy(serviceUrls.finance, {
      "^/api/finance/parent": "/api/parent",
    }),
  );

  // Get parent's receipts
  router.get(
    "/finance/parent/receipts",
    authMiddleware.authenticate,
    authMiddleware.authorize("receipts", "read"),
    ServiceRouter.createProxy(serviceUrls.finance, {
      "^/api/finance/parent": "/api/parent",
    }),
  );

  // Get a specific receipt
  router.get(
    "/finance/parent/receipts/:receiptId",
    authMiddleware.authenticate,
    authMiddleware.authorize("receipts", "read"),
    ServiceRouter.createProxy(serviceUrls.finance, {
      "^/api/finance/parent": "/api/parent",
    }),
  );

  // ========== GENERAL FINANCE ROUTES ==========

  // Fees
  router.get(
    "/finance/fees",
    authMiddleware.authenticate,
    authMiddleware.authorize("fees", "read"),
    ServiceRouter.createProxy(serviceUrls.finance, {
      "^/api/finance/fees": "/fees",
    }),
  );

  router.post(
    "/finance/fees",
    authMiddleware.authenticate,
    authMiddleware.authorize("fees", "manage"),
    ServiceRouter.createProxy(serviceUrls.finance, {
      "^/api/finance/fees": "/fees",
    }),
  );

  // Payments
  router.post(
    "/finance/payments",
    authMiddleware.authenticate,
    authMiddleware.authorize("fees", "pay"),
    ServiceRouter.createProxy(serviceUrls.finance, {
      "^/api/finance/payments": "/payments",
    }),
  );

  router.get(
    "/finance/payments",
    authMiddleware.authenticate,
    authMiddleware.authorize("payments", "read"),
    ServiceRouter.createProxy(serviceUrls.finance, {
      "^/api/finance/payments": "/payments",
    }),
  );

  // Receipts
  router.get(
    "/finance/receipts",
    authMiddleware.authenticate,
    authMiddleware.authorize("receipts", "read"),
    ServiceRouter.createProxy(serviceUrls.finance, {
      "^/api/finance/receipts": "/receipts",
    }),
  );

  router.get(
    "/finance/receipts/:id/download",
    authMiddleware.authenticate,
    authMiddleware.authorize("receipts", "download"),
    ServiceRouter.createProxy(serviceUrls.finance, {
      "^/api/finance/receipts": "/receipts",
    }),
  );

  return router;
}

export default createServiceRoutes;
