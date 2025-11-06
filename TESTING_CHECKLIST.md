# רשימת בדיקות - LUXCERA
**תאריך:** 2025

## ✅ 1. בדיקות בסיסיות - שרתים

### בדיקת PM2 Status
```bash
pm2 status
```
**צפוי:** שני תהליכים online (luxcera-server, luxcera-client)

### בדיקת Health Check
```bash
curl http://localhost:8787/api/health
```
**צפוי:** `{"ok":true}`

### בדיקת קליינט
- פתח דפדפן: `http://localhost:5173`
- **צפוי:** האתר נטען ללא שגיאות

---

## ✅ 2. בדיקות API Endpoints

### בדיקת טופס יצירת קשר (Contact)

**בקשה תקינה:**
```bash
curl -X POST http://localhost:8787/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "דני כהן",
    "email": "test@example.com",
    "phone": "0501234567",
    "category": "נרות",
    "color": "אדום",
    "scent": "וניל",
    "qty": 2,
    "message": "אני מעוניין בנר מותאם אישית"
  }'
```
**צפוי:** `{"ok":true}`

**בקשה לא תקינה (חסר שם):**
```bash
curl -X POST http://localhost:8787/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "",
    "message": "הודעה"
  }'
```
**צפוי:** `{"ok":false,"error":"שם מלא חובה ומינ׳ 2 תווים"}` (400)

**בקשה לא תקינה (אין email או phone):**
```bash
curl -X POST http://localhost:8787/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "דני כהן",
    "message": "הודעה"
  }'
```
**צפוי:** `{"ok":false,"error":"חובה למלא אימייל או טלפון אחד לפחות"}` (400)

### בדיקת הרשמה (Register)

**בקשה תקינה:**
```bash
curl -X POST http://localhost:8787/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "דני כהן",
    "email": "test@example.com"
  }'
```
**צפוי:** `{"ok":true}`

**בקשה לא תקינה:**
```bash
curl -X POST http://localhost:8787/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "ד",
    "email": "invalid-email"
  }'
```
**צפוי:** שגיאת ולידציה (400)

---

## ✅ 3. בדיקות טופס בקליינט

### בדיקת ולידציה בטפסים

1. **טופס יצירת קשר:**
   - [ ] נסה לשלוח טופס ריק → **צפוי:** הודעת שגיאה
   - [ ] מלא רק שם (פחות מ-2 תווים) → **צפוי:** שגיאה
   - [ ] מלא שם אבל ללא email/phone → **צפוי:** שגיאה
   - [ ] מלא אימייל לא תקין → **צפוי:** שגיאה
   - [ ] בחר כמות 0 או שלילית → **צפוי:** שגיאה
   - [ ] בחר כמות מעל 1000 → **צפוי:** שגיאה
   - [ ] הודעה קצרה מ-3 תווים → **צפוי:** שגיאה
   - [ ] מלא הכל נכון → **צפוי:** שליחה מוצלחת, איפוס טופס

2. **טופס הרשמה:**
   - [ ] נסה להרשם עם שם קצר → **צפוי:** שגיאה
   - [ ] נסה להרשם עם אימייל לא תקין → **צפוי:** שגיאה
   - [ ] מלא הכל נכון → **צפוי:** הצלחה

---

## ✅ 4. בדיקות תכונות אתר

### בדיקת חיפוש מוצרים
- [ ] לחץ על אייקון החיפוש
- [ ] הקלד שם מוצר → **צפוי:** תוצאות מוצגות
- [ ] לחץ על מוצר → **צפוי:** גלילה לגלריה
- [ ] נסה להוסיף לסל מתוצאות חיפוש → **צפוי:** הוספה מוצלחת

### בדיקת עגלת קניות
- [ ] הוסף מוצר לעגלה
- [ ] פתח עגלה → **צפוי:** המוצר מופיע
- [ ] שנה כמות → **צפוי:** מחיר מתעדכן
- [ ] לחץ "המשך לתשלום" → **צפוי:** דף תשלום נפתח

### בדיקת דף תשלום
- [ ] מלא פרטי משלוח
- [ ] המשך לתשלום → **צפוי:** שלב 2
- [ ] בחר שיטת תשלום → **צפוי:** שדות מתאימים מופיעים
- [ ] מלא פרטי כרטיס (בדיקה) → **צפוי:** ולידציה עובדת
- [ ] המשך לסיכום → **צפוי:** שלב 3 עם כל הפרטים

---

## ✅ 5. בדיקות אבטחה

### בדיקת Rate Limiting
```bash
# הרץ את הפקודה 25 פעמים (יותר מ-20 המותר)
for /L %i in (1,1,25) do @curl -X POST http://localhost:8787/api/contact -H "Content-Type: application/json" -d "{\"fullName\":\"test\",\"email\":\"test@test.com\",\"category\":\"נרות\",\"qty\":1,\"message\":\"test\"}"
```
**צפוי:** לאחר 20 בקשות - שגיאת rate limit

### בדיקת Security Headers
פתח DevTools → Network → בדוק Response Headers:
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options`
- [ ] `Content-Security-Policy`

### בדיקת XSS Protection
נסה לשלוח בטפסים:
- [ ] `<script>alert('xss')</script>` בשם
- [ ] `javascript:alert(1)` בהודעה
**צפוי:** הקוד לא רץ, הכל escaped במיילים

---

## ✅ 6. בדיקות סביבה (Environment)

### בדיקת משתני סביבה

**ב-clientside:**
- פתח DevTools Console:
```javascript
console.log(import.meta.env.VITE_API_URL)
```
**צפוי:** כתובת השרת או `undefined` (אם לא מוגדר)

**ב-serverside:**
- בדוק `.env` ב-`server/`:
  - [ ] `SMTP_HOST` מוגדר
  - [ ] `SMTP_USER` מוגדר
  - [ ] `SMTP_PASS` מוגדר
  - [ ] `EMAIL_FROM` מוגדר
  - [ ] `EMAIL_TO` מוגדר

---

## ✅ 7. בדיקות אינטגרציה

### בדיקת שליחת מיילים
- [ ] שלח טופס יצירת קשר → **צפוי:** מייל נשלח ל-EMAIL_TO
- [ ] הרשם משתמש חדש → **צפוי:** 2 מיילים נשלחים (למשתמש ולאדמין)

### בדיקת CORS
פתח דפדפן → Console → הרץ:
```javascript
fetch('http://localhost:8787/api/health')
  .then(r => r.json())
  .then(console.log)
```
**צפוי:** עבודה ללא שגיאת CORS

---

## ✅ 8. בדיקות לוגים

```bash
# בדיקת לוגי שרת
pm2 logs luxcera-server --lines 20

# בדיקת לוגי קליינט
pm2 logs luxcera-client --lines 20
```
**צפוי:** אין שגיאות קריטיות

---

## ✅ 9. בדיקות ביצועים

```bash
# בדיקת שימוש בזיכרון
pm2 monit
```
**צפוי:** שימוש סביר בזיכרון (לא מעל 512MB)

---

## 📋 סיכום

לאחר ביצוע כל הבדיקות:
- [ ] כל הבדיקות הבסיסיות עברו
- [ ] כל ה-API endpoints עובדים
- [ ] ולידציה עובדת בקליינט ובשרת
- [ ] אבטחה מופעלת
- [ ] מיילים נשלחים
- [ ] אין שגיאות קריטיות בלוגים

**אם הכל עבר בהצלחה → האתר מוכן לייצור! 🎉**

