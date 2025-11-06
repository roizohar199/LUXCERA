/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-very-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
  }
}

export function generateToken(user: { id: number; username: string }): string {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '7d',
  });
}
