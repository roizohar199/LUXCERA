import express, { Response } from "express";
import { AuthRequest, requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  createMember,
  getMemberWithTransactions,
  redeemPoints,
  addPurchasePoints,
  adminGetMembers,
  deactivateMember,
  activateMember,
} from "../models/loyalty.js";
import { users } from "../db.js";
import pool from "../db.js";
import nodemailer, { Transporter } from "nodemailer";
import { sanitizeForEmail } from "../security.js";

const router = express.Router();

// Email transporter
function createTransporter(): Transporter {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE ?? 'true') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// Helper לשליפת userId בצורה בטוחה מכל המבנה של האותנטיקציה
function getUserId(req: AuthRequest): number | null {
  const anyReq: any = req;

  // תמיכה גם ב-req.userId וגם ב-req.user.id וגם ב-req.user.userId
  const raw =
    anyReq.userId ||
    anyReq.user?.id ||
    anyReq.user?.userId ||
    anyReq.user?.user_id;

  if (!raw) return null;
  const num = Number(raw);
  return Number.isNaN(num) ? null : num;
}

// POST /api/club/join
router.post("/join", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[club/join] req.user:', req.user);
    console.log('[club/join] req.body:', req.body);
    const userId = getUserId(req);
    console.log('[club/join] userId from getUserId:', userId);
    if (!userId) {
      console.error('[club/join] Missing userId. req.user:', req.user);
      return res.status(401).json({ message: "Unauthorized: missing user id" });
    }

    const { birthday, phone, marketingOptIn } = req.body;

    const member = await createMember({
      userId,
      birthday: birthday || null,
      phone: phone || null,
      marketingOptIn: Boolean(marketingOptIn),
    });

    // שליחת מייל למנהל אדמין על הצטרפות חדשה למועדון
    try {
      // קבלת פרטי המשתמש מה-DB
      const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]) as [any[], any];
      const user = userRows && userRows.length > 0 ? userRows[0] : null;
      
      if (user) {
        const transporter = createTransporter();
        const ADMIN_EMAIL = process.env.EMAIL_ADMIN || 'LUXCERA777@GMAIL.COM';

        const adminHtml = `
          <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">חבר חדש הצטרף למועדון הלקוחות! 🎉</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
                <b>שם מלא:</b> ${sanitizeForEmail(user.full_name || 'לא צוין')}<br>
                <b>אימייל:</b> ${sanitizeForEmail(user.email || 'לא צוין')}<br>
                ${phone ? `<b>טלפון:</b> ${sanitizeForEmail(phone)}<br>` : ''}
                ${birthday ? `<b>תאריך לידה:</b> ${sanitizeForEmail(birthday)}<br>` : ''}
                <b>תאריך הצטרפות:</b> ${new Date().toLocaleString('he-IL')}<br>
                <b>מתנת הצטרפות:</b> 50 נקודות (₪50)
              </p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: ADMIN_EMAIL,
          subject: 'LUXCERA – חבר חדש הצטרף למועדון הלקוחות',
          html: adminHtml,
        }).catch((emailError) => {
          console.error('Failed to send admin notification email for club join:', emailError);
          // Don't fail the join if email fails
        });
      }
    } catch (emailError) {
      console.error('Error sending admin email for club join:', emailError);
      // Don't fail the join if email fails
    }

    res.json({ member });
  } catch (err) {
    console.error("Error /club/join:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/club/me
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[club/me] req.user:', req.user);
    console.log('[club/me] req.query:', req.query);
    const userId = getUserId(req);
    console.log('[club/me] userId from getUserId:', userId);
    if (!userId) {
      console.error('[club/me] Missing userId');
      return res.status(401).json({ ok: false, message: "Unauthorized: missing user id" });
    }

    const data = await getMemberWithTransactions(userId);
    console.log('[club/me] Member data:', data);
    res.json({ ok: true, ...data });
  } catch (err) {
    console.error("Error /club/me:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// POST /api/club/redeem
router.post("/redeem", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: missing user id" });
    }

    const { points, reason } = req.body;

    const result = await redeemPoints({
      userId,
      pointsToRedeem: Number(points),
      reason: reason || "Redeem at checkout",
    });

    if (!result.success) return res.status(400).json(result);

    res.json(result);
  } catch (err) {
    console.error("Error /club/redeem:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/club/admin/add-purchase
router.post(
  "/admin/add-purchase",
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orderId, amount } = req.body;

      await addPurchasePoints({
        userId: Number(userId),
        orderId: Number(orderId),
        amount: Number(amount),
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Error /club/admin/add-purchase:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// GET /api/club/admin/members
router.get(
  "/admin/members",
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const members = await adminGetMembers();
      res.json({ members });
    } catch (err) {
      console.error("Error /club/admin/members:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// POST /api/club/admin/deactivate/:memberId
router.post(
  "/admin/deactivate/:memberId",
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const memberId = Number(req.params.memberId);
      if (!memberId || isNaN(memberId)) {
        return res.status(400).json({ ok: false, error: "Invalid member ID" });
      }
      await deactivateMember(memberId);
      res.json({ ok: true, message: "Member deactivated successfully" });
    } catch (err: any) {
      console.error("Error /club/admin/deactivate:", err);
      res.status(500).json({ ok: false, error: "Internal server error" });
    }
  }
);

// POST /api/club/admin/activate/:memberId
router.post(
  "/admin/activate/:memberId",
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const memberId = Number(req.params.memberId);
      if (!memberId || isNaN(memberId)) {
        return res.status(400).json({ ok: false, error: "Invalid member ID" });
      }
      await activateMember(memberId);
      res.json({ ok: true, message: "Member activated successfully" });
    } catch (err: any) {
      console.error("Error /club/admin/activate:", err);
      res.status(500).json({ ok: false, error: "Internal server error" });
    }
  }
);

export default router;
