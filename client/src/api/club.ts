/**
 * Loyalty Club API Client
 */

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyMember {
  id: number;
  user_id: number;
  status: 'ACTIVE' | 'INACTIVE';
  total_points: number;
  used_points: number;
  total_spent: number;
  join_date: string;
  birthday: string | null;
  phone: string | null;
  marketing_opt_in: boolean;
  tier?: LoyaltyTier; // מדרגה מחושבת לפי total_spent
}

export const TIER_INFO: Record<LoyaltyTier, { label: string; labelHe: string; earnRate: number; color: string }> = {
  bronze: { label: 'Bronze', labelHe: 'ברונזה', earnRate: 0.03, color: '#CD7F32' },
  silver: { label: 'Silver', labelHe: 'כסף', earnRate: 0.05, color: '#C0C0C0' },
  gold: { label: 'Gold', labelHe: 'זהב', earnRate: 0.07, color: '#FFD700' },
  platinum: { label: 'Platinum', labelHe: 'פלטינום', earnRate: 0.1, color: '#E5E4E2' },
};

export interface LoyaltyTransaction {
  id: number;
  member_id: number;
  type: 'EARN' | 'REDEEM';
  points: number;
  description: string;
  created_at: string;
}

// Base API URL helper
const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const envUrl = (import.meta?.env?.VITE_API_URL || '').trim();
  if (!envUrl) {
    return cleanPath;
  }
  let baseUrl = envUrl.replace(/\/+$/, '');
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
  }
  return `${baseUrl}${cleanPath}`;
};

export async function apiClubJoin(payload: {
  email: string;
  birthday: string;
  phone: string;
  marketingOptIn: boolean;
}) {
  let res;
  try {
    res = await fetch(getApiUrl('/api/club/join'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (networkError: any) {
    if (networkError.name === 'TypeError' || networkError.message?.includes('fetch') || networkError.message?.includes('ECONNREFUSED')) {
      throw new Error('השרת לא זמין כרגע. אנא ודא שהשרת רץ ונסה שוב.');
    }
    throw new Error('שגיאת רשת. אנא נסה שוב מאוחר יותר.');
  }
  
  if (!res.ok) {
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      throw new Error(`השרת לא זמין (קוד ${res.status}). אנא ודא שהשרת רץ ונסה שוב.`);
    }
    throw new Error(data?.error || 'Failed to join club');
  }
  
  try {
    return await res.json();
  } catch (parseError) {
    throw new Error('השרת החזיר תגובה לא תקינה. אנא נסה שוב מאוחר יותר.');
  }
}

export async function apiClubMe(email: string): Promise<{
  ok: boolean;
  member: LoyaltyMember | null;
  transactions: LoyaltyTransaction[];
}> {
  let res;
  try {
    res = await fetch(getApiUrl(`/api/club/me?email=${encodeURIComponent(email)}`), {
      method: 'GET',
      credentials: 'include',
    });
  } catch (networkError: any) {
    // טיפול בשגיאות רשת (ECONNREFUSED, proxy errors, וכו')
    if (networkError.name === 'TypeError' || networkError.message?.includes('fetch') || networkError.message?.includes('ECONNREFUSED')) {
      console.error('[apiClubMe] Server not available:', networkError);
      // מחזירים אובייקט ריק במקום לזרוק שגיאה, כדי שהקוד יוכל להמשיך לעבוד
      return { ok: false, member: null, transactions: [] };
    }
    throw networkError;
  }
  
  if (!res.ok) {
    console.error('[apiClubMe] Response not ok:', res.status);
    // מחזירים אובייקט ריק במקום לזרוק שגיאה
    return { ok: false, member: null, transactions: [] };
  }
  
  try {
    return await res.json();
  } catch (parseError) {
    console.error('[apiClubMe] Failed to parse response:', parseError);
    return { ok: false, member: null, transactions: [] };
  }
}

export async function apiClubRedeem(email: string, points: number, reason?: string) {
  let res;
  try {
    res = await fetch(getApiUrl('/api/club/redeem'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, points, reason: reason || 'מימוש נקודות' }),
    });
  } catch (networkError: any) {
    if (networkError.name === 'TypeError' || networkError.message?.includes('fetch') || networkError.message?.includes('ECONNREFUSED')) {
      throw new Error('השרת לא זמין כרגע. אנא ודא שהשרת רץ ונסה שוב.');
    }
    throw new Error('שגיאת רשת. אנא נסה שוב מאוחר יותר.');
  }
  
  if (!res.ok) {
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      throw new Error(`השרת לא זמין (קוד ${res.status}). אנא ודא שהשרת רץ ונסה שוב.`);
    }
    throw new Error(data?.error || 'Failed to redeem points');
  }
  
  try {
    return await res.json();
  } catch (parseError) {
    throw new Error('השרת החזיר תגובה לא תקינה. אנא נסה שוב מאוחר יותר.');
  }
}

