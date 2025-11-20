/**
 * Authentication Routes
 */

import { Router, Request, Response } from 'express';
import { adminUsers } from '../db.js';
import { generateToken } from '../middleware/auth.js';
import { asyncHandler } from '../error-handler.js';
import { logger } from '../logger.js';

const router = Router();

// Login
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    logger.info('Login attempt', { username, hasPassword: !!password });

    if (!username || !password) {
      logger.warn('Login attempt failed', { username, reason: 'Missing username or password' });
      return res.status(400).json({ ok: false, error: 'Username and password required' });
    }

    const user = await adminUsers.findByUsername(username);
    logger.info('User lookup result', { username, userFound: !!user, userId: user?.id });
    
    if (!user) {
      logger.warn('Login attempt failed', { username, reason: 'User not found' });
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const isValid = await adminUsers.verifyPassword(password, user.passwordHash);
    logger.info('Password verification result', { username, isValid });
    
    if (!isValid) {
      logger.warn('Login attempt failed', { username, reason: 'Invalid password' });
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, username: user.username });

    // Set cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info('Admin login successful', { username, userId: user.id });

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  })
);

// Logout
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie('adminToken');
    res.json({ ok: true, message: 'Logged out successfully' });
  })
);

export default router;
