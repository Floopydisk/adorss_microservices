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
      const { phone, role } = req.body;
      const result = await authServiceClient.requestPhoneOtp(phone, role);
      res.json(result);
    } catch (error: any) {
      res.status(400).json(error);
    }
  });

  router.post("/phone/verify-otp", async (req: Request, res: Response) => {
    try {
      const { phone, otp, role } = req.body;
      const result = await authServiceClient.verifyPhoneOtp(phone, otp, role);
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
      const { phone, otp, role } = req.body;
      const result = await authServiceClient.loginWithPhone(phone, otp, role);
      res.json(result);
    } catch (error: any) {
      res.status(401).json(error);
    }
  });

  router.post(
    "/phone/request-login-otp",
    async (req: Request, res: Response) => {
      try {
        const { phone, role } = req.body;
        const result = await authServiceClient.requestLoginOtp(phone, role);
        res.json(result);
      } catch (error: any) {
        res.status(error.status || 400).json(error);
      }
    },
  );

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

  // Password reset
  router.post("/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const result = await authServiceClient.forgotPassword(email);
      res.json(result);
    } catch (error: any) {
      res.status(error.status || 400).json(error);
    }
  });

  router.post("/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, token, password, password_confirmation } = req.body;
      const result = await authServiceClient.resetPassword(
        email,
        token,
        password,
        password_confirmation,
      );
      res.json(result);
    } catch (error: any) {
      res.status(error.status || 400).json(error);
    }
  });

  return router;
}

export default router;
