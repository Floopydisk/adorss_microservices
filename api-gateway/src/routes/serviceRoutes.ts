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
) {
  const router = Router();

  // Education Service routes - Protected with auth
  router.use(
    "/students",
    authMiddleware.authenticate,
    authMiddleware.authorize("students", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/students": "/students",
    }),
  );

  router.use(
    "/teachers",
    authMiddleware.authenticate,
    authMiddleware.authorize("teachers", "read"),
    ServiceRouter.createProxy(serviceUrls.education, {
      "^/api/teachers": "/teachers",
    }),
  );

  // Finance Service routes - Protected with auth
  router.use(
    "/finance",
    authMiddleware.authenticate,
    authMiddleware.authorize("finance", "read"),
    ServiceRouter.createProxy(serviceUrls.finance, {
      "^/api/finance": "/finance",
    }),
  );

  // Messaging Service routes - Protected with auth
  router.use(
    "/messages",
    authMiddleware.authenticate,
    ServiceRouter.createProxy(serviceUrls.messaging, {
      "^/api/messages": "/messages",
    }),
  );

  // Mobility Service routes - Protected with auth
  router.use(
    "/mobility",
    authMiddleware.authenticate,
    ServiceRouter.createProxy(serviceUrls.mobility, {
      "^/api/mobility": "/mobility",
    }),
  );

  return router;
}

export default createServiceRoutes;
