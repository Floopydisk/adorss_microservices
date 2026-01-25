import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { User } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

/**
 * Middleware to verify JWT token with Auth Service
 */
export async function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided'
      });
      return;
    }
    
    // Verify with Auth Service
    const response = await axios.post(
      process.env.AUTH_SERVICE_URL + '/api/auth/verify-token',
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data.success) {
      req.user = response.data.user;
      next();
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error: any) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

/**
 * Middleware to check user roles
 */
export function checkRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }
    
    next();
  };
}
