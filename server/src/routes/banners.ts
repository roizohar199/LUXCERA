/**
 * Public Banners Routes - For frontend
 */

import { Router } from 'express';
import { pool } from '../db.js';
import { asyncHandler } from '../error-handler.js';

const router = Router();

// Get active banner (public)
router.get(
  '/active',
  asyncHandler(async (req, res) => {
    const now = new Date();
    // Use full datetime comparison (including time)
    
    const [banners] = await pool.query(
      `SELECT * FROM promotional_banners 
       WHERE is_active = 1 
       AND (starts_at IS NULL OR starts_at <= ?)
       AND (ends_at IS NULL OR ends_at >= ?)
       ORDER BY created_at DESC
       LIMIT 1`,
      [now, now]
    ) as [any[], any];

    if (banners.length === 0) {
      return res.json({ ok: true, banner: null });
    }

    res.json({ ok: true, banner: banners[0] });
  })
);

export default router;

