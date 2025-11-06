/**
 * Custom CSRF Protection Implementation
 * Replaces deprecated csurf package
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const SECRET_KEY = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_LENGTH = 32;
const TOKEN_COOKIE_NAME = '_csrf';
const TOKEN_HEADER_NAME = 'X-CSRF-Token';

interface CsrfRequest extends Request {
  csrfToken?: () => string;
}

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Create a CSRF token with HMAC signature
 */
function createSignedToken(token: string): string {
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(token);
  return `${token}.${hmac.digest('hex')}`;
}

/**
 * Verify a signed CSRF token
 */
function verifySignedToken(signedToken: string): boolean {
  const parts = signedToken.split('.');
  if (parts.length !== 2) return false;
  
  const [token, signature] = parts;
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(token);
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * CSRF protection middleware
 */
export function csrfProtection(req: CsrfRequest, res: Response, next: NextFunction) {
  const PROD = process.env.NODE_ENV === 'production';
  
  // Add method to generate token
  req.csrfToken = () => {
    let token = req.cookies?.[TOKEN_COOKIE_NAME];
    
    if (!token) {
      token = generateToken();
    }
    
    // Set cookie if not exists or expired
    if (!req.cookies?.[TOKEN_COOKIE_NAME]) {
      res.cookie(TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: PROD,
        sameSite: PROD ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }
    
    return createSignedToken(token);
  };
  
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Get token from cookie
  const cookieToken = req.cookies?.[TOKEN_COOKIE_NAME];
  if (!cookieToken) {
    return res.status(403).json({ ok: false, error: 'CSRF token missing' });
  }
  
  // Get token from header
  const headerToken = 
    req.headers[TOKEN_HEADER_NAME.toLowerCase()] as string ||
    req.headers['csrf-token'] as string ||
    '';
  
  if (!headerToken) {
    return res.status(403).json({ ok: false, error: 'CSRF token not provided in header' });
  }
  
  // Verify token
  if (!verifySignedToken(headerToken)) {
    return res.status(403).json({ ok: false, error: 'Invalid CSRF token' });
  }
  
  // Extract token from signed token and compare with cookie
  const parts = headerToken.split('.');
  if (parts[0] !== cookieToken) {
    return res.status(403).json({ ok: false, error: 'CSRF token mismatch' });
  }
  
  next();
}
