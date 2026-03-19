import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
}

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Extracts the Bearer token from the Authorization header.
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Authentication middleware that requires a valid Bearer token.
 * For now, accepts any token and attaches a mock user to req.user.
 */
export function authenticateToken(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    next(new AppError('Authentication required. Provide a Bearer token in the Authorization header.', 401));
    return;
  }

  // TODO: Replace with real JWT verification (e.g., jsonwebtoken.verify)
  // For now, accept any token and attach a mock user
  req.user = {
    id: 'mock-user-001',
    email: 'dev@gridironiq.com',
    username: 'devuser',
    role: 'user',
  };

  next();
}

/**
 * Optional authentication middleware.
 * Attaches user if a valid token is present, but does not fail if missing.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (token) {
    // TODO: Replace with real JWT verification
    req.user = {
      id: 'mock-user-001',
      email: 'dev@gridironiq.com',
      username: 'devuser',
      role: 'user',
    };
  }

  next();
}
