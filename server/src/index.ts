import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = Number(process.env.PORT || 8787);
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: ORIGIN }));
app.use(express.json({ limit: '1mb' }));

// בריאות
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// שליחת הודעת טופס
app.post('/api/contact', async (req, res) => {
  try {
    const { fullName, email, phone, message, category, color, scent, qty } = req.body || {};
    if (!fullName || !message) return res.status(400).json({ ok: false, error: 'Missing fields' });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || 'true') === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const html = `
      <h2>פנייה חדשה מ-LUXCERA</h2>
      <p><b>שם מלא:</b> ${fullName}</p>
      ${email ? `<p><b>אימייל:</b> ${email}</p>` : ''}
      ${phone ? `<p><b>טלפון:</b> ${phone}</p>` : ''}
      ${category ? `<p><b>קטגוריה:</b> ${category}</p>` : ''}
      ${color ? `<p><b>צבע:</b> ${color}</p>` : ''}
      ${scent ? `<p><b>ריח:</b> ${scent}</p>` : ''}
      ${qty ? `<p><b>כמות:</b> ${qty}</p>` : ''}
      <p><b>הודעה:</b></p>
      <pre style="white-space:pre-wrap;font-family:inherit">${message}</pre>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: 'LUXCERA – הודעת טופס חדשה',
      html
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Email failed' });
  }
});

// שליחת הודעות הרשמה
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email } = req.body || {};
    if (!fullName || !email) return res.status(400).json({ ok: false, error: 'Missing fields' });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || 'true') === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const ADMIN_EMAIL = 'roizohar111@gmail.com';

    // 1. שליחת מייל למשתמש
    const userHtml = `
      <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4A6741; font-size: 32px; margin: 0;">LUXCERA</h1>
          </div>
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">ברוכים הבאים ${fullName}! 👋</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            תודה שהצטרפת ל-LUXCERA! ההרשמה שלך הושלמה בהצלחה.
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            כעת תוכל:
          </p>
          <ul style="color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 30px; padding-right: 20px;">
            <li>להזמין נרות שעווה מותאמים אישית</li>
            <li>לעקוב אחרי ההזמנות שלך</li>
            <li>לנהל את החשבון שלך</li>
            <li>לקבל עדכונים על מבצעים וחדשות</li>
          </ul>
          <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 2px solid #4A6741;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              נשמח לראותך בסביבתנו! 🕯️✨
            </p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>LUXCERA © 2025 - נרות שעווה יוקרתיים</p>
        </div>
      </div>
    `;

    // 2. שליחת מייל למנהל
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4A6741; font-size: 32px; margin: 0;">LUXCERA</h1>
          </div>
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">משתמש חדש נרשם לאתר! 🎉</h2>
          <div style="background-color: #f0f9ff; border-right: 4px solid #4A6741; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
              <b>שם מלא:</b> ${fullName}<br>
              <b>אימייל:</b> ${email}
            </p>
          </div>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            משתמש חדש הצטרף ל-LUXCERA וממתין לטיפול.
          </p>
        </div>
      </div>
    `;

    // שליחת שני המיילים במקביל
    await Promise.all([
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'ברוכים הבאים ל-LUXCERA! 🕯️',
        html: userHtml
      }),
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: ADMIN_EMAIL,
        subject: 'LUXCERA – משתמש חדש נרשם',
        html: adminHtml
      })
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Registration email error:', err);
    res.status(500).json({ ok: false, error: 'Email failed' });
  }
});

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));

