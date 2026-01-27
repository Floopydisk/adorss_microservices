import { Response, NextFunction, RequestHandler } from "express";
import { AuthRequest } from "../types";

/**
 * Permission middleware for the education service
 *
 * Checks if the authenticated user has the required permissions
 * Permissions are passed from the API Gateway via headers or JWT claims
 */
export const requirePermissions = (
  requiredPermissions: string[],
): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // User data should be populated by auth middleware (from API Gateway JWT)
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Get user permissions from the token claims
    const userPermissions: string[] = user.permissions || [];
    const userRole: string = user.role || "";

    // Super admin bypass
    if (userRole === "super_admin") {
      next();
      return;
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) => {
      // Check direct permission match
      if (userPermissions.includes(permission)) {
        return true;
      }

      // Check wildcard permissions (e.g., 'education:*' matches 'education:read')
      const [resource] = permission.split(":");
      if (userPermissions.includes(`${resource}:*`)) {
        return true;
      }

      // Check global wildcard
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
        provided: userPermissions,
      });
      return;
    }

    next();
  };
};

/**
 * Check if user has a specific role
 */
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

    // Super admin bypass
    if (userRole === "super_admin") {
      next();
      return;
    }

    if (!roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message:
          "This action requires one of the following roles: " +
          roles.join(", "),
        currentRole: userRole,
      });
      return;
    }

    next();
  };
};

/**
 * Check if user is a parent (used for parent-specific routes)
 */
export const requireParentRole: RequestHandler = requireRole(["parent"]);
