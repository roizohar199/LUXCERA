import { Router } from 'express';
import pool from '../db.js';
import { csrfProtection } from '../csrf.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * עוזר לייצר קוד אקראי
 */
function generateRandomCode() {
  return 'GC-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

/**
 * רשימת Gift Cards (אדמין בלבד)
 * GET /api/giftcards
 * Query params: status?, assigned_to?
 * חשוב: זה צריך להיות לפני ה-route של /:code
 */
router.get(
  '/',
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { status, assigned_to } = req.query;
      
      let query = `SELECT id, code, initial_amount, balance, currency, status, expires_at, issued_at, created_by, assigned_to, order_id 
                   FROM gift_cards 
                   WHERE 1=1`;
      const params: any[] = [];
      
      if (status && status !== 'all') {
        query += ` AND status = ?`;
        params.push(status);
      } else if (!status) {
        // ברירת מחדל - רק פעילים אם לא צוין אחרת
        query += ` AND status = 'active'`;
      }
      // אם status === 'all', לא מוסיפים תנאי - נקבל הכל
      
      if (assigned_to) {
        query += ` AND assigned_to = ?`;
        params.push(Number(assigned_to));
      }
      
      query += ` ORDER BY issued_at DESC LIMIT 100`;
      
      const [rows] = await pool.query(query, params);
      
      return res.json({
        ok: true,
        giftCards: rows,
        count: (rows as any[]).length,
      });
    } catch (err: any) {
      console.error('[giftcards] list error:', err);
      return res.status(500).json({ ok: false, error: 'Failed to get gift cards' });
    }
  }
);

/**
 * יצירת גיפט קארד חדש (אדמין בלבד)
 * POST /api/giftcards
 * body: { initial_amount, expires_at?, assigned_to?, currency? }
 */
router.post(
  '/',
  csrfProtection,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const { initial_amount, expires_at, assigned_to, currency } = req.body;
    
    if (!initial_amount || Number(initial_amount) <= 0) {
      return res.status(400).json({ ok: false, error: 'initial_amount is required and must be > 0' });
    }

    const code = generateRandomCode();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO gift_cards (code, initial_amount, balance, currency, created_by, assigned_to, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          code,
          initial_amount,
          initial_amount,
          currency || 'ILS',
          req.user?.id || null,
          assigned_to || null,
          expires_at || null,
        ]
      );

      const insertId = (result as any).insertId;

      await conn.query(
        `INSERT INTO gift_card_logs (gift_card_id, action, amount, balance_after, performed_by, note)
         VALUES (?, 'issued', ?, ?, ?, ?)`,
        [insertId, initial_amount, initial_amount, req.user?.id || null, 'issued by admin']
      );

      await conn.commit();

      return res.status(201).json({
        ok: true,
        giftCard: {
          id: insertId,
          code,
          initial_amount,
          balance: initial_amount,
          currency: currency || 'ILS',
          expires_at: expires_at || null,
          assigned_to: assigned_to || null,
        },
      });
    } catch (err: any) {
      await conn.rollback();
      console.error('[giftcards] create error:', err);
      return res.status(500).json({ ok: false, error: 'Failed to create gift card' });
    } finally {
      conn.release();
    }
  }
);

/**
 * מימוש גיפט קארד (לקוח רשום) – נשתמש בזה ב-Checkout
 * POST /api/giftcards/redeem
 * body: { code, orderId?, amountToApply }
 */
router.post(
  '/redeem',
  csrfProtection,
  async (req: AuthRequest, res) => {
    const { code, orderId, amountToApply } = req.body;

    if (!code) {
      return res.status(400).json({ ok: false, error: 'code is required' });
    }

    // נרמול הקוד - כמו ב-orders.ts - trim + uppercase
    const normalizedCode = String(code).trim().toUpperCase();

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // ננעל את הרשומה כדי למנוע double-spend
      // נשתמש ב-UPPER(TRIM()) כדי למצוא את ה-Gift Card גם עם הבדלי case או רווחים
      const [rows] = await conn.query(
        `SELECT * FROM gift_cards WHERE UPPER(TRIM(code)) = ? FOR UPDATE`,
        [normalizedCode]
      );

      if ((rows as any[]).length === 0) {
        await conn.rollback();
        return res.status(404).json({ ok: false, error: 'Gift card not found' });
      }

      const card = (rows as any[])[0];

      // בדיקת סטטוס - אם הסטטוס הוא 'used', זה אומר שה-Gift Card שומש עד תומו
      if (card.status === 'used') {
        await conn.rollback();
        return res.status(400).json({ 
          ok: false, 
          error: 'Gift Card זה שומש עד תומו ולא ניתן להשתמש בו שוב' 
        });
      }

      // בדיקת סטטוס - רק 'active' מותר
      if (card.status !== 'active') {
        await conn.rollback();
        return res.status(400).json({ ok: false, error: 'Gift card is not active' });
      }

      // בדיקת תוקף
      if (card.expires_at && new Date(card.expires_at) < new Date()) {
        await conn.query(`UPDATE gift_cards SET status='expired' WHERE id=?`, [card.id]);
        await conn.commit();
        return res.status(400).json({ ok: false, error: 'Gift card expired' });
      }

      const balance = Number(card.balance);
      const toApply = Math.min(Number(amountToApply || balance), balance);

      if (toApply <= 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, error: 'Invalid amount to apply' });
      }

      // אם אין orderId, זה אומר שהמשתמש רק "מחיל" את ה-Gift Card בשלב הסיכום
      // במקרה כזה, לא נעדכן את ה-Gift Card כלל - רק נבדוק שהוא תקין ונחזיר את הסכום
      // העדכון האמיתי יקרה רק כאשר ההזמנה תיווצר ב-orders.ts
      if (!orderId) {
        await conn.rollback();
        // מחזירים את הסכום שניתן להחיל ואת היתרה הנוכחית (ללא עדכון)
        return res.json({
          ok: true,
          applied: toApply,
          balance: balance, // היתרה הנוכחית (לא מעודכנת)
          status: card.status, // הסטטוס הנוכחי (לא מעודכן)
        });
      }

      // אם יש orderId, זה אומר שההזמנה כבר נוצרה, ואז נעדכן את ה-Gift Card
      const newBalance = balance - toApply;
      const newStatus = newBalance === 0 ? 'used' : 'active';

      await conn.query(
        `UPDATE gift_cards SET balance = ?, status = ?, order_id = ? WHERE id = ?`,
        [newBalance, newStatus, orderId, card.id]
      );

      await conn.query(
        `INSERT INTO gift_card_logs (gift_card_id, action, amount, balance_after, performed_by, related_order_id, note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          card.id,
          toApply === Number(card.initial_amount) ? 'redeemed' : 'partial_redeemed',
          toApply,
          newBalance,
          req.user?.id || null,
          orderId,
          'redeemed in order',
        ]
      );

      await conn.commit();

      return res.json({
        ok: true,
        applied: toApply,
        balance: newBalance,
        status: newStatus,
      });
    } catch (err: any) {
      await conn.rollback();
      console.error('[giftcards] redeem error:', err);
      return res.status(500).json({ ok: false, error: 'Failed to redeem gift card' });
    } finally {
      conn.release();
    }
  }
);

/**
 * קבלת מידע על Gift Card לפי קוד (ציבורי - לקוחות יכולים לבדוק)
 * GET /api/giftcards/:code
 * חשוב: זה צריך להיות אחרי ה-route של / (רשימה)
 */
router.get(
  '/:code',
  async (req, res) => {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ ok: false, error: 'code is required' });
    }

    try {
      // נרמול הקוד - כמו ב-orders.ts - trim + uppercase
      const normalizedCode = String(code).trim().toUpperCase();
      
      // חיפוש לפי הקוד המנורמל - כמו ב-orders.ts
      const [rows] = await pool.query(
        `SELECT id, code, initial_amount, balance, currency, status, expires_at, issued_at, order_id
         FROM gift_cards 
         WHERE UPPER(TRIM(code)) = ?`,
        [normalizedCode]
      );

      if ((rows as any[]).length === 0) {
        return res.status(404).json({ ok: false, error: 'Gift card not found' });
      }

      const card = (rows as any[])[0];
      
      // בדיקת תוקף
      if (card.expires_at && new Date(card.expires_at) < new Date()) {
        // עדכון סטטוס אם פג תוקף
        await pool.query(`UPDATE gift_cards SET status='expired' WHERE id=?`, [card.id]);
        card.status = 'expired';
      }
      
      // בדיקה אם ה-Gift Card שומש במלואו - אם היתרה היא 0, הסטטוס צריך להיות 'used'
      const balance = Number(card.balance) || 0;
      const status = card.status;
      
      // אם היתרה היא 0 אבל הסטטוס לא 'used', נעדכן אותו
      if (balance === 0 && status !== 'used') {
        console.log(`[giftcards] Fixing status for Gift Card ${card.code}: balance is 0 but status is ${status}, updating to 'used'`);
        await pool.query(`UPDATE gift_cards SET status='used' WHERE id=?`, [card.id]);
        card.status = 'used';
      }

      // מחזיר רק את המידע הרלוונטי (ללא פרטים רגישים)
      return res.json({
        ok: true,
        giftCard: {
          code: card.code,
          initial_amount: card.initial_amount,
          balance: card.balance,
          currency: card.currency,
          status: card.status,
          expires_at: card.expires_at,
          issued_at: card.issued_at,
          isExpired: card.expires_at ? new Date(card.expires_at) < new Date() : false,
        },
      });
    } catch (err: any) {
      console.error('[giftcards] get error:', err);
      return res.status(500).json({ ok: false, error: 'Failed to get gift card' });
    }
  }
);

/**
 * רכישת Gift Card (לקוח - ללא הרשאות אדמין)
 * POST /api/giftcards/purchase
 * body: { email, amount, quantity, total }
 */
router.post(
  '/purchase',
  async (req, res) => {
    const { email, amount, quantity, total } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'אימייל תקין נדרש' });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ ok: false, error: 'סכום תקין נדרש' });
    }

    if (!quantity || Number(quantity) < 1) {
      return res.status(400).json({ ok: false, error: 'כמות תקינה נדרשת' });
    }

    const finalAmount = Number(amount) * Number(quantity);
    if (Math.abs(finalAmount - Number(total)) > 0.01) {
      return res.status(400).json({ ok: false, error: 'סכום לא תואם' });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // יצירת Gift Card לכל כמות
      const giftCards = [];
      for (let i = 0; i < Number(quantity); i++) {
        const code = generateRandomCode();
        
        const [result] = await conn.query(
          `INSERT INTO gift_cards (code, initial_amount, balance, currency, assigned_to, expires_at, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            code,
            Number(amount),
            Number(amount),
            'ILS',
            null, // assigned_to מיועד ל-user ID, לא לאימייל
            null, // ללא תאריך תפוגה
            JSON.stringify({ email, purchasedAt: new Date().toISOString() }), // שמירת האימייל ב-metadata
          ]
        );

        const insertId = (result as any).insertId;

        await conn.query(
          `INSERT INTO gift_card_logs (gift_card_id, action, amount, balance_after, note)
           VALUES (?, 'issued', ?, ?, ?)`,
          [insertId, Number(amount), Number(amount), 'purchased by customer']
        );

        giftCards.push({
          id: insertId,
          code,
          initial_amount: Number(amount),
          balance: Number(amount),
        });
      }

      await conn.commit();

      // שליחת אימייל עם הקודים (אפשר להוסיף כאן)
      // TODO: שליחת אימייל עם הקודים

      return res.status(201).json({
        ok: true,
        giftCard: giftCards[0], // מחזיר את הראשון (או אפשר להחזיר את כולם)
        giftCards: giftCards, // מחזיר את כל הקודים
        message: 'Gift Card נוצר בהצלחה',
      });
    } catch (err: any) {
      await conn.rollback();
      console.error('[giftcards] purchase error:', err);
      console.error('[giftcards] purchase error details:', {
        message: err.message,
        code: err.code,
        sqlMessage: err.sqlMessage,
        stack: err.stack
      });
      return res.status(500).json({ 
        ok: false, 
        error: 'שגיאה ביצירת Gift Card',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    } finally {
      conn.release();
    }
  }
);

export default router;

