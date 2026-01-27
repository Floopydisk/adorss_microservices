import { Response, NextFunction, RequestHandler } from "express";
import { AuthRequest } from "../types";

/**
 * Auth middleware for the finance service
 * Parses the user data from API Gateway headers or JWT
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
      } catch {
        // Continue to check other methods
      }
    }

    // Option 2: Extract from Authorization header (JWT)
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

    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }
};

/**
 * Permission middleware
 */
export const requirePermissions = (
  requiredPermissions: string[],
): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const userPermissions: string[] = user.permissions || [];
    const userRole: string = user.role || "";

    // Super admin bypass
    if (userRole === "super_admin") {
      next();
      return;
    }

    const hasAllPermissions = requiredPermissions.every((permission) => {
      if (userPermissions.includes(permission)) {
        return true;
      }
      const [resource] = permission.split(":");
      if (userPermissions.includes(`${resource}:*`)) {
        return true;
      }
      if (userPermissions.includes("*:*")) {
        return true;
      }
      return false;
    });

    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
        required: requiredPermissions,
      });
      return;
    }

    next();
  };
};

export const requireRole = (roles: string[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const userRole = user.role || "";

    if (userRole === "super_admin" || roles.includes(userRole)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message:
        "This action requires one of the following roles: " + roles.join(", "),
    });
  };
};
