import { Router, Request, Response, NextFunction } from "express";
import AuthServiceClient from "../services/authServiceClient";

const router: Router = Router();

export function createAuthRoutes(authServiceClient: AuthServiceClient): Router {
  // Register
  router.post("/register", async (req: Request, res: Response) => {
    try {
      const result = await authServiceClient.register(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json(error);
    }
  });

  // Login
  router.post("/login", async (req: Request, res: Response) => {
    try {
      const result = await authServiceClient.login(
        req.body.email,
        req.body.password,
      );
      res.json(result);
    } catch (error: any) {
      res.status(401).json(error);
    }
  });

  // Phone auth routes
  router.post("/phone/request-otp", async (req: Request, res: Response) => {
    try {
      const { phone, country_code } = req.body;
      const result = await authServiceClient.requestPhoneOtp(
        phone,
        country_code,
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json(error);
    }
  });

  router.post("/phone/verify-otp", async (req: Request, res: Response) => {
    try {
      const { phone, otp } = req.body;
      const result = await authServiceClient.verifyPhoneOtp(phone, otp);
      res.json(result);
    } catch (error: any) {
      res.status(400).json(error);
    }
  });

  router.post(
    "/phone/complete-registration",
    async (req: Request, res: Response) => {
      try {
        const result = await authServiceClient.completePhoneRegistration(
          req.body,
        );
        res.json(result);
      } catch (error: any) {
        res.status(400).json(error);
      }
    },
  );

  router.post("/phone/login", async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;
      const result = await authServiceClient.loginWithPhone(phone);
      res.json(result);
    } catch (error: any) {
      res.status(401).json(error);
    }
  });

  // Email verification
  router.post("/verify-email", async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;
      const result = await authServiceClient.verifyEmail(email, code);
      res.json(result);
    } catch (error: any) {
      res.status(400).json(error);
    }
  });

  router.post(
    "/resend-verification-email",
    async (req: Request, res: Response) => {
      try {
        const { email } = req.body;
        const result = await authServiceClient.resendVerificationEmail(email);
        res.json(result);
      } catch (error: any) {
        res.status(400).json(error);
      }
    },
  );

  return router;
}

export default router;
