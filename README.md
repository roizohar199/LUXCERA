# LUXCERA - דף נחיתה לנרות שעווה יוקרתיים

דף נחיתה מודרני ויפה לעסק יצירת נרות שעווה מותאמים אישית.

## 🏗️ מבנה הפרויקט

```
luxcera/
├── server/          # Node.js + Express + Nodemailer
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── client/          # React + Vite
    ├── src/
    │   ├── LuxceraLanding.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

## 🚀 התקנה והרצה

### דרישות
- Node.js 18+
- npm או yarn

### שלב 1: התקנת שרת

```bash
cd server
npm install
```

### שלב 2: הגדרת משתני סביבה

העתק את `server/.env.example` ל-`server/.env` ועדכן את הערכים:

```env
PORT=8787
CORS_ORIGIN=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_app_password_here

EMAIL_FROM="LUXCERA <yourgmail@gmail.com>"
EMAIL_TO=yourgmail@gmail.com
```

**חשוב!** עבור Gmail תצטרך ליצור App Password:
1. לך ל-[Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification (חייב להיות מופעל)
3. App passwords → צור סיסמה חדשה עבור "Mail"
4. העתק את הסיסמה (16 תווים) ל-`SMTP_PASS`

### שלב 3: התקנת קליינט

```bash
cd ../client
npm install
```

### שלב 4: הרצת הפרויקט

**טרמינל 1 - שרת:**
```bash
cd server
npm run dev
```

**טרמינל 2 - קליינט:**
```bash
cd client
npm run dev
```

האתר יעלה על http://localhost:5173

## 📧 מערכת אימייל

### טופס יצירת קשר
הטופס שולח הודעות ישירות לאימייל שנקבע ב-`EMAIL_TO`.

ההודעה כוללת:
- שם מלא
- אימייל
- טלפון
- קטגוריה (נרות/גבס/חרסינה/אפוקסי)
- צבע
- ריח
- כמות
- הודעה

### הרשמה לאתר
כשמשתמש חדש נרשם לאתר, נשלחות **שתי הודעות אימייל**:
1. **למשתמש החדש** - הודעת ברכה אישית ואישור הרשמה מוצלחת
2. **למנהל האתר** (roizohar111@gmail.com) - הודעה על משתמש חדש שנרשם

## 📦 בנייה לפרודקשן

### שרת
```bash
cd server
npm run build
npm start
```

### קליינט
```bash
cd client
npm run build
```

הקבצים יישמרו ב-`client/dist`

## 🎨 תכונות

- ✨ אנימציות חלקות עם Framer Motion
- 📱 רספונסיבי ומותאם למובייל
- 🌙 עיצוב כהה ומודרני
- 📧 אינטגרציה מלאה עם SMTP
- 💬 קישור ישיר לוואטסאפ
- 🎨 גלריה דינמית

## 🔧 טכנולוגיות

**שרת:**
- Node.js
- Express
- Nodemailer
- TypeScript

**קליינט:**
- React 18
- Vite
- Framer Motion
- Lucide Icons

## 📝 רישיון

© 2025 LUXCERA. כל הזכויות שמורות.

