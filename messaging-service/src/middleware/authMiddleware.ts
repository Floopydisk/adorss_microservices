/**
 * Authentication Middleware for Messaging Service
 *
 * Validates JWT tokens against the Auth Service and attaches
 * user data to the request object.
 *
 * Usage:
 *   import { authenticate, authorize } from './middleware/authMiddleware';
 *
 *   // Require authentication
 *   router.get('/messages', authenticate, getMessages);
 *
 *   // Require authentication + specific permission
 *   router.post('/messages', authenticate, authorize('messages', 'send'), sendMessage);
 */

import { Request, Response, NextFunction } from "express";
import authServiceClient, { AuthUser } from "../services/authServiceClient";

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  token?: string;
}

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }
  return parts[1];
}

/**
 * Authentication middleware
 * Validates token and attaches user to request
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No authentication token provided",
        },
      });
      return;
    }

    // Validate token against Auth Service
    const user = await authServiceClient.validateToken(token);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired authentication token",
        },
      });
      return;
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "AUTH_ERROR",
        message: "Authentication service unavailable",
      },
    });
  }
}

/**
 * Authorization middleware factory
 * Checks if user has permission to perform action on resource
 */
export function authorize(resource: string, action: string) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.token) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        });
        return;
      }

      const allowed = await authServiceClient.checkPermission(
        req.token,
        resource,
        action,
      );

      if (!allowed) {
        res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: `Permission denied: ${resource}:${action}`,
          },
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "AUTH_ERROR",
          message: "Authorization service unavailable",
        },
      });
    }
  };
}

/**
 * Optional authentication middleware
 * Attaches user if token provided, but doesn't require it
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractToken(req.headers.authorization);

  if (token) {
    const user = await authServiceClient.validateToken(token);
    if (user) {
      req.user = user;
      req.token = token;
    }
  }

  next();
}

export default {
  authenticate,
  authorize,
  optionalAuth,
};
