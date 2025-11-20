/**
 * Loyalty Club Model
 */

import { pool, execute } from '../db.js';

export type LoyaltyStatus = 'ACTIVE' | 'INACTIVE';

export interface LoyaltyMember {
  id: number;
  user_id: number;
  status: LoyaltyStatus;
  total_points: number;
  used_points: number;
  total_spent: number;
  join_date: Date;
  birthday: Date | null;
  phone: string | null;
  marketing_opt_in: boolean;
  signup_bonus_given?: boolean;
  created_at?: Date;
  updated_at?: Date;
  // מדרגה מחושבת (לא נשמרת ב-DB, מחושבת לפי total_spent)
  tier?: LoyaltyTier;
}

export interface LoyaltyTransaction {
  id: number;
  member_id: number;
  type: 'EARN' | 'REDEEM';
  points: number;
  description: string;
  created_at: Date;
}

// מדרגות צבירה לפי סכום קניות מצטבר
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TierInfo {
  tier: LoyaltyTier;
  minSpent: number;
  maxSpent: number | null; // null = אין מקסימום
  earnRate: number; // אחוז צבירה (0.03 = 3%)
  label: string;
  labelHe: string;
}

export const LOYALTY_TIERS: TierInfo[] = [
  {
    tier: 'bronze',
    minSpent: 0,
    maxSpent: 499,
    earnRate: 0.03, // 3%
    label: 'Bronze',
    labelHe: 'ברונזה',
  },
  {
    tier: 'silver',
    minSpent: 500,
    maxSpent: 1499,
    earnRate: 0.05, // 5%
    label: 'Silver',
    labelHe: 'כסף',
  },
  {
    tier: 'gold',
    minSpent: 1500,
    maxSpent: 3999,
    earnRate: 0.07, // 7%
    label: 'Gold',
    labelHe: 'זהב',
  },
  {
    tier: 'platinum',
    minSpent: 4000,
    maxSpent: null, // אין מקסימום
    earnRate: 0.1, // 10%
    label: 'Platinum',
    labelHe: 'פלטינום',
  },
];

/**
 * מחשב את המדרגה לפי סכום קניות מצטבר
 */
export function calculateLoyaltyTier(totalSpent: number): LoyaltyTier {
  // מיון מהגבוה לנמוך כדי למצוא את המדרגה הראשונה שהלקוח עומד בתנאיה
  const sortedTiers = [...LOYALTY_TIERS].sort((a, b) => b.minSpent - a.minSpent);
  
  for (const tierInfo of sortedTiers) {
    if (totalSpent >= tierInfo.minSpent) {
      return tierInfo.tier;
    }
  }
  
  // ברירת מחדל - Bronze
  return 'bronze';
}

/**
 * מחזיר את אחוז הצבירה לפי מדרגה
 */
export function getEarnRateByTier(tier: LoyaltyTier): number {
  const tierInfo = LOYALTY_TIERS.find(t => t.tier === tier);
  return tierInfo?.earnRate || 0.03; // ברירת מחדל 3%
}

/**
 * מחזיר מידע על מדרגה
 */
export function getTierInfo(tier: LoyaltyTier): TierInfo {
  return LOYALTY_TIERS.find(t => t.tier === tier) || LOYALTY_TIERS[0];
}

const SIGNUP_BONUS_POINTS = 50; // 50 ש"ח מתנת הצטרפות (50 נקודות = 50 ש"ח)
const MIN_PURCHASE_FOR_BONUS = 150; // סכום מינימום לקנייה כדי לקבל את מתנת ההצטרפות
const SIGNUP_BONUS_VALIDITY_DAYS = 30; // תוקף מתנת ההצטרפות בימים

export async function findMemberByUserId(userId: number): Promise<LoyaltyMember | null> {
  const [rows] = await pool.query(
    'SELECT * FROM loyalty_members WHERE user_id = ? LIMIT 1',
    [userId]
  ) as [any[], any];
  return rows[0] || null;
}

export async function findMemberByEmail(email: string): Promise<LoyaltyMember | null> {
  const [rows] = await pool.query(
    `SELECT lm.* FROM loyalty_members lm
     JOIN users u ON u.id = lm.user_id
     WHERE u.email = ? LIMIT 1`,
    [email.toLowerCase()]
  ) as [any[], any];
  return rows[0] || null;
}

export async function createMember(params: {
  userId: number;
  birthday?: string | null;
  phone?: string | null;
  marketingOptIn: boolean;
}): Promise<LoyaltyMember> {
  const { userId, birthday, phone, marketingOptIn } = params;

  if (!userId) {
    throw new Error("createMember: userId is required");
  }

  const birthdayValue =
    birthday && String(birthday).trim() !== "" ? birthday : null;
  const phoneValue =
    phone && String(phone).trim() !== "" ? phone : null;
  const marketingValue = marketingOptIn ? 1 : 0;

  const result = await execute(
    `INSERT INTO loyalty_members
      (user_id, status, total_points, used_points, total_spent, join_date, birthday, phone, marketing_opt_in)
     VALUES (?, 'ACTIVE', 0, 0, 0, NOW(), ?, ?, ?)`,
    [userId, birthdayValue, phoneValue, marketingValue]
  );

  const insertId = result.insertId;

  await addTransaction({
    memberId: insertId,
    type: "EARN",
    points: SIGNUP_BONUS_POINTS,
    description: "Signup bonus",
  });

  const [memberRows] = await pool.query(
    "SELECT * FROM loyalty_members WHERE id = ?",
    [insertId]
  ) as [any[], any];

  return memberRows[0];
}

export async function addTransaction(params: {
  memberId: number;
  type: 'EARN' | 'REDEEM';
  points: number;
  description: string;
}): Promise<void> {
  const { memberId, type, points, description } = params;

  await execute(
    `INSERT INTO loyalty_transactions (member_id, type, points, description, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [memberId, type, points, description]
  );

  if (type === 'EARN') {
    await execute(
      `UPDATE loyalty_members
       SET total_points = total_points + ?
       WHERE id = ?`,
      [points, memberId]
    );
  } else {
    await execute(
      `UPDATE loyalty_members
       SET used_points = used_points + ?
       WHERE id = ?`,
      [points, memberId]
    );
  }
}

export async function addPurchasePoints(params: {
  userId: number;
  orderId: number;
  amount: number;
}): Promise<void> {
  const { userId, orderId, amount } = params;

  const member = await findMemberByUserId(userId);
  if (!member || member.status !== 'ACTIVE') return;

  // עדכן את total_spent קודם (לפני חישוב המדרגה)
  await execute(
    `UPDATE loyalty_members
     SET total_spent = total_spent + ?
     WHERE id = ?`,
    [amount, member.id]
  );

  // טען את החבר המעודכן עם total_spent החדש
  const updatedMember = await findMemberByUserId(userId);
  if (!updatedMember) return;

  // חשב את המדרגה לפי הסכום המצטבר החדש
  const newTotalSpent = Number(updatedMember.total_spent);
  const tier = calculateLoyaltyTier(newTotalSpent);
  const earnRate = getEarnRateByTier(tier);
  const tierInfo = getTierInfo(tier);

  // חשב נקודות לפי המדרגה הנוכחית
  const points = Math.floor(amount * earnRate);

  if (points <= 0) return;

  // בדוק אם צריך לתת בונוס הצטרפות
  const signupBonusGiven = Boolean(updatedMember.signup_bonus_given);
  
  // בדוק תוקף הבונוס (30 ימים ממועד ההצטרפות)
  const joinDate = new Date(updatedMember.join_date);
  const now = new Date();
  const daysSinceJoin = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
  const isBonusValid = daysSinceJoin <= SIGNUP_BONUS_VALIDITY_DAYS;

  // אם עדיין לא קיבל בונוס, הבונוס בתוקף, והסכום הנוכחי >= המינימום, תן בונוס
  // חשוב: הבונוס ניתן רק ברכישה אחת (לא מצטבר) - רק אם הסכום הנוכחי >= 150
  if (!signupBonusGiven && isBonusValid && amount >= MIN_PURCHASE_FOR_BONUS) {
    await addTransaction({
      memberId: updatedMember.id,
      type: 'EARN',
      points: SIGNUP_BONUS_POINTS,
      description: 'מתנת הצטרפות למועדון - 50 ש"ח',
    });

    await execute(
      `UPDATE loyalty_members
       SET signup_bonus_given = 1
       WHERE id = ?`,
      [updatedMember.id]
    );
  }

  // בדוק אם הלקוח עלה מדרגה
  const oldTier = calculateLoyaltyTier(newTotalSpent - amount);
  let tierUpBonus = 0;
  if (oldTier !== tier) {
    // קפיצת מדרגה - בונוס חד-פעמי של 100 נקודות
    tierUpBonus = 100;
    await addTransaction({
      memberId: updatedMember.id,
      type: 'EARN',
      points: tierUpBonus,
      description: `קפיצת מדרגה: ${tierInfo.labelHe} - בונוס 100 נקודות`,
    });
  }

  // הוסף נקודות מהרכישה לפי המדרגה
  await addTransaction({
    memberId: updatedMember.id,
    type: 'EARN',
    points,
    description: `רכישה #${orderId} – ${amount}₪ (מדרגה: ${tierInfo.labelHe}, ${(earnRate * 100).toFixed(0)}%)`,
  });
}

export async function redeemPoints(params: {
  userId: number;
  pointsToRedeem: number;
  reason: string;
}): Promise<{ success: boolean; message: string }> {
  const { userId, pointsToRedeem, reason } = params;
  const member = await findMemberByUserId(userId);

  if (!member) return { success: false, message: 'חבר מועדון לא נמצא' };
  if (member.status !== 'ACTIVE') return { success: false, message: 'חבר המועדון לא פעיל' };

  const availablePoints = member.total_points - member.used_points;
  if (pointsToRedeem <= 0) return { success: false, message: 'סכום נקודות לא תקין' };
  if (pointsToRedeem > availablePoints)
    return { success: false, message: 'אין מספיק נקודות זמינות' };

  await addTransaction({
    memberId: member.id,
    type: 'REDEEM',
    points: pointsToRedeem,
    description: reason,
  });

  return { success: true, message: 'נקודות נפדו בהצלחה' };
}

export async function getMemberWithTransactions(userId: number): Promise<{
  member: LoyaltyMember | null;
  transactions: LoyaltyTransaction[];
}> {
  const member = await findMemberByUserId(userId);
  if (!member) return { member: null, transactions: [] };

  // הוסף את המדרגה המחושבת לחבר
  const totalSpent = Number(member.total_spent);
  const tier = calculateLoyaltyTier(totalSpent);
  const memberWithTier = { ...member, tier };

  const [transactions] = await pool.query(
    `SELECT * FROM loyalty_transactions
     WHERE member_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [member.id]
  ) as [any[], any];

  return { member: memberWithTier, transactions };
}

export async function adminGetMembers(): Promise<
  (LoyaltyMember & { email?: string; name?: string })[]
> {
  const [rows] = await pool.query(
    `SELECT lm.*, u.full_name as name, u.email
     FROM loyalty_members lm
     JOIN users u ON u.id = lm.user_id
     ORDER BY lm.join_date DESC`
  ) as [any[], any];
  return rows;
}

export async function deactivateMember(memberId: number): Promise<void> {
  await execute(
    `UPDATE loyalty_members
     SET status = 'INACTIVE'
     WHERE id = ?`,
    [memberId]
  );
}

export async function activateMember(memberId: number): Promise<void> {
  await execute(
    `UPDATE loyalty_members
     SET status = 'ACTIVE'
     WHERE id = ?`,
    [memberId]
  );
}

