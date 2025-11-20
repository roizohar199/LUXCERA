/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { users } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-very-secret-key';

export interface AuthUser {
  id?: number;              // לא חובה
  username?: string;
  email?: string;
  userId?: number;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
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

// Middleware for regular users (authenticated by email)
export function requireUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const email = req.body.email || req.query.email || req.headers['x-user-email'];
    
    if (!email || typeof email !== 'string') {
      return res.status(401).json({ ok: false, error: 'אימייל נדרש לאימות' });
    }

    // Store email in req.user for use in routes
    req.user = { email: email.toLowerCase() };
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: 'שגיאה באימות' });
  }
}

// Middleware for authenticated users (by JWT token or email)
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Try JWT token first
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email?: string };
        req.user = { id: decoded.id, email: decoded.email };
        next();
        return;
      } catch (jwtError) {
        // If JWT fails, try email-based auth
      }
    }

    // Fallback to email-based auth - find user by email and set userId
    const email = req.body.email || req.query.email || req.headers['x-user-email'];
    if (!email || typeof email !== 'string') {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    // Find user by email and set userId
    try {
      const user = await users.findByEmail(email.toLowerCase());
      if (!user) {
        return res.status(404).json({ ok: false, error: 'משתמש לא נמצא' });
      }
      // Store userId in req.user so routes can use it directly
      req.user = { id: user.id, email: user.email };
      next();
    } catch (err) {
      console.error('Error finding user by email:', err);
      return res.status(500).json({ ok: false, error: 'Authentication failed' });
    }
  } catch (error) {
    return res.status(401).json({ ok: false, error: 'Authentication failed' });
  }
}
