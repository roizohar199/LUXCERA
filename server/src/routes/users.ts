import { Router } from 'express';
import { z } from 'zod';
import { csrfProtection } from '../csrf.js';
import { users } from '../db.js';

const router = Router();

const UpdateProfileSchema = z.object({
  currentEmail: z.string().email(),
  email: z.string().email(),
  fullName: z.string().min(1).max(255),
});

// שליפת פרופיל לפי אימייל (פשוט לקריאה מהלקוח)
router.get('/me', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim();
    if (!email) {
      return res.status(400).json({ ok: false, error: 'email נדרש' });
    }
    const user = await users.findByEmail(email);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'משתמש לא נמצא' });
    }
    return res.json({ ok: true, user });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ ok: false, error: 'שגיאה בשליפת הפרופיל' });
  }
});

// עדכון פרופיל משתמש (שם מלא ואימייל) לפי האימייל הנוכחי
router.put('/me', csrfProtection, async (req, res) => {
  try {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      const errorMessage = firstError?.message || 'בקשה לא תקינה';
      return res.status(400).json({ ok: false, error: errorMessage });
    }

    const { currentEmail, email, fullName } = parsed.data;

    const existing = await users.findByEmail(currentEmail);
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'משתמש לא נמצא' });
    }

    // אם משנים אימייל, בדוק שאין כפילות
    if (currentEmail.toLowerCase() !== email.toLowerCase()) {
      const conflict = await users.findByEmail(email);
      if (conflict) {
        return res.status(400).json({ ok: false, error: 'האימייל כבר קיים במערכת' });
      }
    }

    await users.updateProfile(currentEmail, { email, fullName });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ ok: false, error: 'שגיאה בעדכון הפרופיל' });
  }
});

export default router;


