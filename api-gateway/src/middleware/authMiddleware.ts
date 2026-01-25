import { Request, Response, NextFunction } from "express";
import JWTValidator, { DecodedToken } from "../utils/jwtValidator";

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
      token?: string;
    }
  }
}

class AuthMiddleware {
  private jwtValidator: JWTValidator;

  constructor(jwtValidator: JWTValidator) {
    this.jwtValidator = jwtValidator;
  }

  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const token = this.jwtValidator.extractToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Missing or invalid authorization header",
      });
      return;
    }

    const decoded = await this.jwtValidator.verifyToken(token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    req.user = decoded;
    req.token = token;
    next();
  };

  authorize = (resource: string, action: string) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      if (!req.token || !req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const allowed = await this.jwtValidator.checkPermission(
        req.token,
        resource,
        action,
      );
      if (!allowed) {
        res.status(403).json({
          success: false,
          message: `Forbidden: missing permission ${resource}:${action}`,
        });
        return;
      }

      next();
    };
  };

  authorizeAny = (permissions: Array<{ resource: string; action: string }>) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      if (!req.token || !req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      for (const perm of permissions) {
        const allowed = await this.jwtValidator.checkPermission(
          req.token,
          perm.resource,
          perm.action,
        );
        if (allowed) {
          next();
          return;
        }
      }

      res.status(403).json({
        success: false,
        message: "Forbidden: none of the required permissions granted",
      });
    };
  };
}

export default AuthMiddleware;
