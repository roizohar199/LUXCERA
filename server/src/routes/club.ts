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

const router = express.Router();

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
