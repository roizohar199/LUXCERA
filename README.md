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
EMAIL_TO=LUXCERA777@GMAIL.COM
EMAIL_ADMIN=LUXCERA777@GMAIL.COM

# WhatsApp Business API (אופציונלי - להגדרה)
# SMS_SERVICE=whatsapp  # אפשרויות: 'twilio', 'whatsapp', 'none'
# WHATSAPP_API_KEY=your_whatsapp_access_token
# WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token  # (אותו דבר כמו WHATSAPP_API_KEY)
# WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
# WHATSAPP_TEMPLATE_NAME=order_confirmation  # שם התבנית שהוגדרה ב-WhatsApp Business Manager (אופציונלי - 'none' לשליחת הודעות טקסט רגילות)

# Twilio SMS (אופציונלי - חלופה ל-WhatsApp)
# TWILIO_ACCOUNT_SID=your_twilio_account_sid
# TWILIO_AUTH_TOKEN=your_twilio_auth_token
# TWILIO_PHONE_NUMBER=your_twilio_phone_number
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

#### אפשרות 1: הרצה רגילה (2 טרמינלים)

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

#### אפשרות 2: עם PM2 (מומלץ לפרודקשן)

**לפיתוח:**
```bash
# מהתיקייה הראשית
pm2 start ecosystem.config.cjs
```

**לפרודקשן (אחרי build):**
```bash
# בנייה
cd server && npm run build
cd ../client && npm run build

# הרצה עם PM2
cd ..
pm2 start ecosystem.prod.config.cjs
```

**פקודות PM2 שימושיות:**
```bash
pm2 list                    # רשימת תהליכים
pm2 logs                    # הצגת לוגים
pm2 logs luxcera-server     # לוגים של שרת בלבד
pm2 logs luxcera-client     # לוגים של קליינט בלבד
pm2 stop all                # עצירת כל התהליכים
pm2 restart all             # הפעלה מחדש
pm2 delete all              # מחיקת כל התהליכים
pm2 monit                   # מוניטורינג בזמן אמת
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
2. **למנהל האתר** (LUXCERA777@GMAIL.COM) - הודעה על משתמש חדש שנרשם

### יצירת הזמנה
כשהזמנה חדשה נוצרת, נשלחות **שלוש הודעות**:

1. **מייל אישור ללקוח** - כולל:
   - מספר הזמנה
   - פרטי ההזמנה (סכום, כתובת משלוח, פריטים)
   - הוראות תשלום בביט (0546998603)
   - תזכורת לשלוח צילום אישור העברה בוואטסאפ

2. **מייל למנהל** (LUXCERA777@GMAIL.COM) - כולל:
   - מספר הזמנה
   - פרטי הלקוח המלאים (שם, אימייל, טלפון, כתובת)
   - רשימת כל הפריטים בהזמנה
   - סכום כולל
   - סטטוס תשלום

3. **WhatsApp ללקוח** (אופציונלי - דורש הגדרת WhatsApp Business API):
   - הודעה קצרה עם מספר הזמנה וסכום
   - תזכורת לתשלום בביט
   - שליחה דרך WhatsApp Business API
   
   **הערה:** כדי להפעיל שליחת WhatsApp:
   - הגדר `SMS_SERVICE=whatsapp` ב-`.env`
   - הגדר `WHATSAPP_API_KEY` ו-`WHATSAPP_PHONE_NUMBER_ID`
   - **חשוב:** WhatsApp דורש שימוש ב-Message Templates להודעות יזומות
   - הגדר תבנית הודעה ב-WhatsApp Business Manager ושם אותה ב-`WHATSAPP_TEMPLATE_NAME`
   - אלטרנטיבה: שליחת הודעות טקסט רגילות (יעבוד רק אם הלקוח התחיל שיחה תוך 24 שעות)

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

