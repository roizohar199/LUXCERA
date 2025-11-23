import { Router } from 'express';
import pool from '../db.js';
import { csrfProtection } from '../csrf.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

function generatePromoToken() {
  return 'PG-' + Math.random().toString(36).slice(2, 12).toUpperCase();
}

/**
 * רשימת Promo Gifts (אדמין בלבד)
 * GET /api/promo-gifts
 * Query params: status?
 */
router.get(
  '/',
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { status } = req.query;
      
      let query = `SELECT id, token, amount, currency, expires_at, created_by, max_uses, times_used, status, note 
                   FROM promo_gifts 
                   WHERE 1=1`;
      const params: any[] = [];
      
      if (status && status !== 'all') {
        query += ` AND status = ?`;
        params.push(status);
      }
      
      query += ` ORDER BY expires_at DESC LIMIT 100`;
      
      const [rows] = await pool.query(query, params);
      
      return res.json({
        ok: true,
        promoGifts: rows,
        count: (rows as any[]).length,
      });
    } catch (err: any) {
      console.error('[promo-gifts] list error:', err);
      return res.status(500).json({ ok: false, error: 'Failed to get promo gifts' });
    }
  }
);

/**
 * יצירת פרומו-גיפט (זה הסוג השני)
 * POST /api/promo-gifts
 * body: { amount, currency?, hours?, max_uses? }
 */
router.post(
  '/',
  csrfProtection,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const { amount, currency, hours, max_uses } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ ok: false, error: 'amount is required' });
    }

    const token = generatePromoToken();
    const expiresAt = new Date(Date.now() + (Number(hours) || 24) * 60 * 60 * 1000);

    try {
      const [result] = await pool.query(
        `INSERT INTO promo_gifts (token, amount, currency, expires_at, created_by, max_uses, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [
          token,
          amount,
          currency || 'ILS',
          expiresAt,
          req.user?.id || null,
          max_uses || 1,
        ]
      ) as [any, any];

      return res.status(201).json({
        ok: true,
        token,
        link: `/promo/${token}`,
        expires_at: expiresAt,
        amount: Number(amount),
      });
    } catch (err: any) {
      console.error('[promo-gifts] create error', err);
      return res.status(500).json({ ok: false, error: 'failed to create promo gift' });
    }
  }
);

/**
 * בדיקה אם הפרומו תקף
 * GET /api/promo-gifts/:token
 */
router.get('/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // בדיקה אם זה Gift Card במקום Promo Gift
    if (token.startsWith('GC-')) {
      return res.status(400).json({ 
        ok: false, 
        error: 'זהו קוד Gift Card, לא Promo Gift. Promo Gifts מתחילים ב-PG-' 
      });
    }

    const [rows] = await pool.query(
      'SELECT * FROM promo_gifts WHERE token = ?',
      [token]
    ) as [any[], any];

    if (!rows.length) {
      console.log(`[promo-gifts] Token not found: ${token}`);
      return res.status(404).json({ ok: false, error: 'not found' });
    }

    const promo = rows[0];

    // תוקף
    if (new Date(promo.expires_at) < new Date()) {
      return res.status(400).json({ ok: false, error: 'expired', status: 'expired' });
    }

    // זמינות
    if (promo.status !== 'active') {
      return res.status(400).json({ ok: false, error: 'not active', status: promo.status });
    }

    // הגבלת שימושים
    if (promo.times_used >= promo.max_uses) {
      return res.status(400).json({ ok: false, error: 'no more uses', status: 'limit_reached' });
    }

    return res.json({
      ok: true,
      token: promo.token,
      amount: promo.amount,
      currency: promo.currency,
      expires_at: promo.expires_at,
      remaining: promo.max_uses - promo.times_used,
    });
  } catch (err: any) {
    console.error('[promo-gifts] get error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to get promo gift' });
  }
});

/**
 * מימוש בפועל – זה לא יוצר gift_cards!
 * זה רק אומר: "הלקוח קיבל עכשיו הנחה חד פעמית מהלינק"
 * POST /api/promo-gifts/:token/redeem
 * body: { orderTotal }
 */
router.post(
  '/:token/redeem',
  csrfProtection,
  async (req: AuthRequest, res) => {
    const { token } = req.params;
    const { orderTotal } = req.body;

    // בדיקה אם זה Gift Card במקום Promo Gift
    if (token.startsWith('GC-')) {
      return res.status(400).json({ 
        ok: false, 
        error: 'זהו קוד Gift Card, לא Promo Gift. Promo Gifts מתחילים ב-PG-' 
      });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // ננעל
      const [rows] = await conn.query(
        'SELECT * FROM promo_gifts WHERE token = ? FOR UPDATE',
        [token]
      ) as [any[], any];

      if (!rows.length) {
        await conn.rollback();
        console.log(`[promo-gifts] Redeem: Token not found: ${token}`);
        return res.status(404).json({ ok: false, error: 'not found' });
      }

      const promo = rows[0];

      // בדיקות
      const now = new Date();
      if (new Date(promo.expires_at) < now) {
        await conn.query('UPDATE promo_gifts SET status="expired" WHERE id=?', [promo.id]);
        await conn.commit();
        return res.status(400).json({ ok: false, error: 'expired' });
      }

      if (promo.status !== 'active') {
        await conn.rollback();
        return res.status(400).json({ ok: false, error: 'not active' });
      }

      if (promo.times_used >= promo.max_uses) {
        await conn.rollback();
        return res.status(400).json({ ok: false, error: 'no more uses' });
      }

      const amountToApply = Math.min(Number(promo.amount), Number(orderTotal || promo.amount));

      // מעדכנים שימוש
      await conn.query(
        `UPDATE promo_gifts
         SET times_used = times_used + 1
         WHERE id=?`,
        [promo.id]
      );

      // אופציונלי: אם הגענו למקסימום – לנעול
      if (promo.times_used + 1 >= promo.max_uses) {
        await conn.query(
          `UPDATE promo_gifts SET status='disabled' WHERE id=?`,
          [promo.id]
        );
      }

      await conn.commit();

      // נביא את המידע המעודכן
      const [updatedRows] = await conn.query(
        'SELECT times_used, max_uses, status FROM promo_gifts WHERE id = ?',
        [promo.id]
      ) as [any[], any];
      
      const updatedPromo = updatedRows[0];
      const remainingUses = updatedPromo.max_uses - updatedPromo.times_used;

      return res.json({
        ok: true,
        applied: amountToApply,
        times_used: updatedPromo.times_used,
        max_uses: updatedPromo.max_uses,
        remainingUses: Math.max(0, remainingUses),
        status: updatedPromo.status,
        // אין כאן balance כי זה לא gift card
      });
    } catch (err: any) {
      await conn.rollback();
      console.error('[promo-gifts] redeem error', err);
      return res.status(500).json({ ok: false, error: 'failed to redeem promo gift' });
    } finally {
      conn.release();
    }
  }
);

export default router;

