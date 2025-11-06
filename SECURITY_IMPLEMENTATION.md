# תיעוד יישום אבטחה - LUXCERA

## ✅ מה יושם:

### 1. **Security Headers (Helmet)** 🔒
- **Content Security Policy (CSP)** - מונע XSS attacks
- **X-Content-Type-Options** - מונע MIME sniffing
- **X-Frame-Options** - מונע clickjacking
- **X-XSS-Protection** - הגנה נוספת מפני XSS
- **Strict-Transport-Security** - כופה HTTPS
- **Cross-Origin Embedder Policy** - הגנה מפני Spectre

**מיקום:** `server/src/index.ts` - שורות 20-40

---

### 2. **Rate Limiting** 🚦
יושמו שלושה רבדים של rate limiting:

- **General Limiter:** 100 בקשות לכל IP ב-15 דקות
- **API Limiter:** 20 בקשות API לכל IP ב-15 דקות
- **Register Limiter:** 5 ניסיונות הרשמה לכל IP בשעה

**מיקום:** `server/src/index.ts` - שורות 42-65

---

### 3. **Input Validation (express-validator)** ✅
ולידציה מלאה בשרת לכל השדות:

**Contact Form:**
- שם מלא: 2-100 תווים, רק אותיות ורווחים
- אימייל: פורמט תקין (אופציונלי)
- טלפון: 9-15 ספרות (אופציונלי)
- הודעה: 10-2000 תווים
- קטגוריה, צבע, ריח: עד 50 תווים
- כמות: מספר בין 1-1000

**Register Form:**
- שם מלא: 2-100 תווים, רק אותיות ורווחים
- אימייל: פורמט תקין, נורמליזציה

**מיקום:** `server/src/index.ts` - שורות 99-141

---

### 4. **XSS Protection (Email Sanitization)** 🛡️
- כל הנתונים עוברים `sanitizeForEmail()` לפני הכנסה ל-HTML
- Escape של תווים מיוחדים (`, `, `&`, `"`, `'`)
- שימוש ב-DOMPurify לניקוי HTML

**פונקציות:**
- `sanitizeForEmail()` - Escape HTML
- `escapeHtml()` - Escape תווים מיוחדים
- `sanitizeString()` - ניקוי ובדיקת אורך

**מיקום:** `server/src/security.ts`

---

### 5. **CSRF Protection** 🔐
- CSRF tokens באמצעות `csurf` (⚠️ הערה: החבילה deprecated אך עדיין פועלת)
- Cookies מאובטחים (`httpOnly`, `secure`, `sameSite`)
- **מושבת בפיתוח** (development mode) לצורך בדיקות
- **מופעל בייצור** (production mode)
- **הערה:** בעתיד מומלץ לעבור ל-`csurf` אלטרנטיבה או ליישם CSRF באופן ידני

**מיקום:** `server/src/index.ts` - שורות 76-102

---

### 6. **CORS Configuration** 🌐
- מוגבל ל-origin אחד בלבד (משתנה סביבה)
- `credentials: true` לאפשר cookies
- `optionsSuccessStatus: 200`

---

## 📦 חבילות שהותקנו:

```json
{
  "helmet": "^8.0.0",              // Security headers
  "express-rate-limit": "^7.4.1",  // Rate limiting
  "express-validator": "^7.2.0",   // Input validation
  "csurf": "^1.11.0",              // CSRF protection
  "cookie-parser": "^1.4.6",       // Cookie parsing (for CSRF)
  "dompurify": "^3.2.2",           // HTML sanitization
  "isomorphic-dompurify": "^2.15.1", // DOMPurify for Node.js
  "jsdom": "^25.0.1"               // DOM implementation
}
```

---

## 🚀 התקנה:

```bash
cd server
npm install
```

---

## ⚙️ משתני סביבה נדרשים:

```env
PORT=8787
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development  # או production
```

---

## 🧪 בדיקה:

לאחר ההתקנה, השרת יציג:
```
✅ Server running on http://localhost:8787
🔒 Security features enabled:
   - Helmet (Security Headers)
   - Rate Limiting
   - Input Validation
   - XSS Protection (Email Sanitization)
   - CSRF Protection: DISABLED (dev mode) / ENABLED
```

---

## ⚠️ הערות חשובות:

1. **CSRF מושבת בפיתוח** - בייצור צריך להפעיל (`NODE_ENV=production`)
2. **Rate Limiting** - יכול להפריע לבדיקות, אפשר להתאים את המספרים
3. **Payment Gateway** - עדיין לא יושם, צריך אינטגרציה עם Stripe/PayPal

---

## 📝 שיפורים עתידיים מומלצים:

1. **Logging** - להוסיף Winston/Pino לרישום פעולות חשובות
2. **Database Security** - אם יש DB, להשתמש ב-prepared statements
3. **Password Hashing** - אם יש סיסמאות, להשתמש ב-bcrypt/argon2
4. **JWT Tokens** - אם יש authentication, לוודא expiration תקין
5. **Payment Gateway** - אינטגרציה עם Stripe/PayPal
6. **HTTPS Enforcement** - לוודא שהכל עובד רק על HTTPS בייצור

---

**תאריך יישום:** 2025
**רמת אבטחה לאחר יישום:** 🟢 גבוהה - כל הבעיות הקריטיות תוקנו!

