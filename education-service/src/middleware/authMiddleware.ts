import { Response, NextFunction, RequestHandler } from "express";
import { AuthRequest } from "../types";

/**
 * Auth middleware for the education service
 *
 * Parses the user data from API Gateway headers or validates JWT directly
 * The API Gateway should handle primary authentication and pass user info
 */
export const authMiddleware: RequestHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    // Option 1: User data passed from API Gateway via headers
    const userHeader = req.headers["x-user-data"];
    if (userHeader) {
      try {
        req.user = JSON.parse(userHeader as string);
        next();
        return;
      } catch (e) {
        // Continue to check other methods
      }
    }

    // Option 2: Extract from Authorization header (JWT)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      // Decode JWT payload (middle part)
      // Note: In production, you would verify the signature with shared secret
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        req.user = {
          sub: payload.sub,
          role: payload.role,
          permissions: payload.permissions || [],
          email: payload.email,
          phone: payload.phone,
        };
        next();
        return;
      }
    }

    // Option 3: User ID and role passed via individual headers
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    const userPermissions = req.headers["x-user-permissions"];

    if (userId) {
      req.user = {
        sub: userId as string,
        role: (userRole as string) || "guest",
        permissions: userPermissions
          ? (userPermissions as string).split(",")
          : [],
      };
      next();
      return;
    }

    // No authentication found
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }
};

/**
 * Optional auth - doesn't fail if no auth, but populates user if present
 */
export const optionalAuth: RequestHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const userHeader = req.headers["x-user-data"];
    if (userHeader) {
      req.user = JSON.parse(userHeader as string);
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        req.user = {
          sub: payload.sub,
          role: payload.role,
          permissions: payload.permissions || [],
          email: payload.email,
          phone: payload.phone,
        };
      }
    }
  } catch (e) {
    // Ignore auth errors for optional auth
  }

  next();
};
