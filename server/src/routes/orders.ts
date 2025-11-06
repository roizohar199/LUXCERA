// server/src/routes/orders.ts
import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import nodemailer, { Transporter } from 'nodemailer';
import { sanitizeForEmail } from '../security.js';
import { sendOrderConfirmation } from '../services/whatsapp.js';

const router = Router();

// Rate limiter for orders
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'יותר מדי בקשות API מ-IP זה, נסה שוב בעוד כמה דקות.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Email transporter
function createTransporter(): Transporter {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE ?? 'true') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// Helper function to format phone number for SMS (remove non-digits, add country code)
function formatPhoneForSMS(phone: string): string {
  // הסרת כל התווים שאינם מספרים
  const digits = phone.replace(/\D/g, '');
  // אם מתחיל ב-0, החלף ל-972 (קוד ישראל)
  if (digits.startsWith('0')) {
    return '972' + digits.substring(1);
  }
  // אם כבר מתחיל ב-972, החזר כמו שהוא
  if (digits.startsWith('972')) {
    return digits;
  }
  // אחרת, הוסף 972
  return '972' + digits;
}

// סכמת ולידציה (zod) לפי מה ששלחת
const orderSchema = z.object({
  shippingData: z.object({
    fullName: z.string().min(1, 'שם מלא נדרש'),
    email: z.string().email('אימייל לא תקין'),
    phone: z.string().min(1, 'טלפון נדרש'),
    address: z.string().min(1, 'כתובת נדרשת'),
    city: z.string().min(1, 'עיר נדרשת'),
    postalCode: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
  paymentData: z
    .object({
      paymentMethod: z.enum(['bit']).default('bit'),
    })
    .optional()
    .default({ paymentMethod: 'bit' }),
  cart: z.array(
    z.object({
      id: z.union([z.number(), z.string()]), // יכול להיות מספר או string (עבור Gift Cards)
      name: z.string(),
      price: z.number(),
      originalPrice: z.number().nullable().optional(),
      salePrice: z.number().nullable().optional(),
      quantity: z.number().min(1),
      inStock: z.boolean().optional(),
      color: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
      category: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      isGiftCard: z.boolean().optional(), // סימון שזה Gift Card
      giftCardEmail: z.union([z.string().email(), z.null()]).optional(), // אימייל לקבלת Gift Card
      giftCardAmount: z.union([z.number(), z.null()]).optional(), // סכום Gift Card
    })
  ).min(1, 'הסל לא יכול להיות ריק'),
  total: z.number().min(0, 'סכום חייב להיות 0 או יותר'), // מאפשר 0 כאשר Gift Card מכסה הכל
  gift_card_amount: z.number().min(0).optional().default(0),
  gift_card_code: z.string().optional().nullable(),
});

router.post('/', apiLimiter, async (req: Request, res: Response) => {
  console.log('\n🚀 [Orders Route] ========== NEW ORDER REQUEST ==========');
  console.log(`📦 [Orders Route] Received order request at ${new Date().toISOString()}`);
  console.log(`📦 [Orders Route] Request body keys:`, Object.keys(req.body || {}));
  try {
    const parsed = orderSchema.parse(req.body);

    const {
      shippingData: { fullName, email, phone, address, city, postalCode, notes },
      cart,
      total,
      paymentData,
      gift_card_amount = 0,
      gift_card_code = null,
    } = parsed;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // יצירת ההזמנה
      const [orderResult]: any = await conn.execute(
        `
        INSERT INTO orders 
        (full_name, email, phone, address, city, postal_code, notes, total_amount, payment_method, gift_card_amount, gift_card_code, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          fullName,
          email,
          phone,
          address,
          city,
          postalCode ?? null,
          notes ?? null,
          total,
          paymentData?.paymentMethod || 'bit',
          gift_card_amount || 0,
          gift_card_code || null,
        ]
      );

      const orderId = orderResult.insertId;

      // שמירת פריטי ההזמנה
      const itemsQueries = cart.map((item) => {
        // עבור Gift Cards, product_id הוא string, אז נשמור null (כי הטבלה מצפה ל-INT)
        // עבור מוצרים רגילים, נשמור את המספר
        const productId = item.isGiftCard ? null : (typeof item.id === 'string' ? null : Number(item.id));
        
        return conn.execute(
          `
          INSERT INTO order_items
          (order_id, product_id, product_name, price, quantity, image_url, category)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [
            orderId,
            productId,
            item.name,
            item.price,
            item.quantity,
            item.imageUrl ?? null,
            item.category ?? null,
          ]
        );
      });

      try {
        await Promise.all(itemsQueries);
      } catch (itemsError: any) {
        console.error('[Orders Route] Error inserting order items:', itemsError);
        console.error('[Orders Route] Items data:', cart.map(item => ({
          id: item.id,
          name: item.name,
          isGiftCard: item.isGiftCard,
          productId: item.isGiftCard ? null : (typeof item.id === 'string' ? null : Number(item.id))
        })));
        throw itemsError;
      }

      // עדכון Gift Card קיים אם נעשה בו שימוש (redeem)
      let redeemedGiftCardInfo: { code: string; amountUsed: number; remainingBalance: number } | null = null;
      
      if (gift_card_code && gift_card_amount > 0) {
        console.log(`💳 [Orders Route] Redeeming Gift Card ${gift_card_code} for amount ₪${gift_card_amount} in order #${orderId}`);
        
        // ננעל את הרשומה כדי למנוע double-spend
        const [giftCardRows] = await conn.query(
          `SELECT * FROM gift_cards WHERE code = ? FOR UPDATE`,
          [gift_card_code]
        ) as [any[], any];

        if (giftCardRows.length === 0) {
          await conn.rollback();
          return res.status(400).json({ ok: false, error: 'Gift Card לא נמצא' });
        }

        const giftCard = giftCardRows[0];

        // בדיקת סטטוס - מאפשר 'active' או 'used' (אם כבר שומש חלקית)
        if (giftCard.status !== 'active' && giftCard.status !== 'used') {
          await conn.rollback();
          return res.status(400).json({ ok: false, error: 'Gift Card לא פעיל' });
        }

        // בדיקת תוקף
        if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
          await conn.query(`UPDATE gift_cards SET status='expired' WHERE id=?`, [giftCard.id]);
          await conn.rollback();
          return res.status(400).json({ ok: false, error: 'Gift Card פג תוקף' });
        }

        // נבדוק את היתרה הנוכחית
        const currentBalance = Number(giftCard.balance);
        
        // אם ה-Gift Card כבר 'used' ואין יתרה, זה אומר שהוא כבר שומש במלואו
        if (giftCard.status === 'used' && currentBalance === 0) {
          await conn.rollback();
          return res.status(400).json({ ok: false, error: 'Gift Card כבר שומש במלואו' });
        }
        
        // אם הסטטוס הוא 'used' אבל יש יתרה, זה אומר שהיה partial redeem
        // נשנה את הסטטוס חזרה ל-'active' כדי לאפשר שימוש נוסף
        if (giftCard.status === 'used' && currentBalance > 0) {
          // נשנה את הסטטוס חזרה ל-'active' כי יש יתרה
          await conn.query(`UPDATE gift_cards SET status='active' WHERE id=?`, [giftCard.id]);
          giftCard.status = 'active'; // לעדכון המשתנה המקומי
        }
        const amountToDeduct = Math.min(gift_card_amount, currentBalance);
        const newBalance = currentBalance - amountToDeduct;
        const newStatus = newBalance === 0 ? 'used' : 'active';

        // שמירת מידע על Gift Card לשימוש במייל
        redeemedGiftCardInfo = {
          code: gift_card_code,
          amountUsed: amountToDeduct,
          remainingBalance: newBalance,
        };

        // עדכון ה-Gift Card ביתרה החדשה
        await conn.query(
          `UPDATE gift_cards SET balance = ?, status = ?, order_id = ? WHERE id = ?`,
          [newBalance, newStatus, orderId, giftCard.id]
        );

        // הוספת log entry
        await conn.query(
          `INSERT INTO gift_card_logs (gift_card_id, action, amount, balance_after, performed_by, related_order_id, note)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            giftCard.id,
            amountToDeduct === currentBalance ? 'redeemed' : 'partial_redeemed',
            amountToDeduct,
            newBalance,
            null, // performed_by - לא משתמש רשום
            orderId,
            `redeemed in order #${orderId}`,
          ]
        );

        console.log(`✅ [Orders Route] Gift Card ${gift_card_code} updated: balance ${currentBalance} → ${newBalance} (status: ${newStatus})`);
      }

      // יצירת Gift Cards עבור Gift Cards שהיו בסל
      const giftCardItems = cart.filter(item => item.isGiftCard && item.giftCardEmail && item.giftCardAmount);
      const createdGiftCards = [];
      
      if (giftCardItems.length > 0) {
        console.log(`🎁 [Orders Route] Creating ${giftCardItems.length} gift card(s) for order #${orderId}`);
        
        for (const giftCardItem of giftCardItems) {
          // יצירת Gift Card אחד (כי כל item בסל הוא Gift Card אחד)
          const code = 'GC-' + Math.random().toString(36).slice(2, 10).toUpperCase();
          
          const [giftCardResult]: any = await conn.execute(
            `INSERT INTO gift_cards (code, initial_amount, balance, currency, assigned_to, expires_at, metadata, order_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              code,
              giftCardItem.giftCardAmount,
              giftCardItem.giftCardAmount,
              'ILS',
              null,
              null,
              JSON.stringify({ email: giftCardItem.giftCardEmail, purchasedAt: new Date().toISOString(), orderId }),
              orderId,
            ]
          );

          const giftCardId = giftCardResult.insertId;

          await conn.execute(
            `INSERT INTO gift_card_logs (gift_card_id, action, amount, balance_after, note)
             VALUES (?, 'issued', ?, ?, ?)`,
            [giftCardId, giftCardItem.giftCardAmount, giftCardItem.giftCardAmount, `purchased in order #${orderId}`]
          );

          createdGiftCards.push({
            code,
            amount: giftCardItem.giftCardAmount,
            email: giftCardItem.giftCardEmail,
          });
          
          console.log(`✅ [Orders Route] Gift Card ${code} created for ${giftCardItem.giftCardEmail}`);
        }
      }

      await conn.commit();
      
      console.log(`✅ [Orders Route] Order #${orderId} saved to database successfully`);
      console.log(`📧 [Orders Route] Starting email and SMS notifications...`);

      // שליחת מיילים והודעות לאחר יצירת ההזמנה
      try {
        const transporter = createTransporter();
        const ADMIN_EMAIL = process.env.EMAIL_ADMIN || 'LUXCERA777@GMAIL.COM';
        const EMAIL_FROM = process.env.EMAIL_FROM;

        // שליחת אימייל עם קודי Gift Cards (אם יש)
        if (createdGiftCards.length > 0) {
          for (const giftCard of createdGiftCards) {
            const giftCardEmailHtml = `
              <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4A6741; font-size: 32px; margin: 0;">LUXCERA</h1>
                  </div>
                  <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Gift Card שלך מוכן! 🎁</h2>
                  <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px">
                    שלום,
                  </p>
                  <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px">
                    Gift Card שרכשת בהזמנה #${orderId} מוכן לשימוש!
                  </p>
                  <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
                    <p style="color: #2e7d32; font-size: 14px; margin: 0 0 10px 0;">קוד ה-Gift Card שלך:</p>
                    <p style="color: #1b5e20; font-size: 32px; font-weight: bold; margin: 0; font-family: monospace; letter-spacing: 2px;">${giftCard.code}</p>
                    <p style="color: #2e7d32; font-size: 18px; margin: 15px 0 0 0;">סכום: ₪${giftCard.amount.toFixed(2)}</p>
                  </div>
                  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h3 style="color: #333; font-size: 18px; margin-top: 0; margin-bottom: 15px;">איך להשתמש ב-Gift Card:</h3>
                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 5px 0;">
                      1. היכנס לאתר LUXCERA<br>
                      2. בחר את המוצרים שאתה רוצה<br>
                      3. בעת התשלום, הכנס את קוד ה-Gift Card<br>
                      4. הסכום יקוזז מהמחיר הסופי
                    </p>
                  </div>
                  <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px">
                    תוכל להעביר את הקוד לאנשים שיקרים לך, והם יוכלו להשתמש בו לרכישת מוצרים מהחנות.<br>
                    <strong>הקוד תקף ללא הגבלת זמן.</strong>
                  </p>
                  <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px">
                    נשמח לעמוד לרשותך בכל שאלה.<br>
                    צוות LUXCERA
                  </p>
                </div>
              </div>
            `;

            await transporter.sendMail({
              from: EMAIL_FROM,
              to: giftCard.email,
              subject: `Gift Card שלך מוכן - LUXCERA`,
              html: giftCardEmailHtml,
            });
            
            console.log(`✅ [Orders Route] Gift Card email sent to ${giftCard.email} with code ${giftCard.code}`);
          }
        }

        // 1. מייל אישור ללקוח
        const customerEmailHtml = `
          <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4A6741; font-size: 32px; margin: 0;">LUXCERA</h1>
              </div>
              <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">תודה על הזמנתך! 🕯️</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                שלום ${sanitizeForEmail(fullName)},
              </p>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                קיבלנו את הזמנתך בהצלחה! מספר הזמנה: <strong style="color: #4A6741;">#${orderId}</strong>
              </p>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #333; font-size: 18px; margin-top: 0; margin-bottom: 15px;">פרטי ההזמנה:</h3>
                <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>מספר הזמנה:</strong> #${orderId}</p>
                ${redeemedGiftCardInfo ? `
                  <div style="background-color: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0;">
                    <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>סה"כ סכום העסקה הכולל לפני שימוש בקוד קופון/GIFT CARD:</strong> <strong style="color: #333; font-size: 16px;">₪${(total + gift_card_amount).toFixed(2)}</strong></p>
                    <div style="background-color: #e8f5e9; border-radius: 8px; padding: 15px; margin: 10px 0; border-right: 4px solid #4A6741;">
                      <h4 style="color: #2e7d32; font-size: 16px; margin-top: 0; margin-bottom: 10px;">💳 שימוש ב-Gift Card</h4>
                      <p style="color: #1b5e20; font-size: 14px; margin: 5px 0;"><strong>קוד Gift Card:</strong> ${redeemedGiftCardInfo.code}</p>
                      <p style="color: #1b5e20; font-size: 14px; margin: 5px 0;"><strong>סכום ששומש:</strong> ₪${redeemedGiftCardInfo.amountUsed.toFixed(2)}</p>
                      <p style="color: #1b5e20; font-size: 14px; margin: 5px 0;"><strong>יתרה שנותרה:</strong> ₪${redeemedGiftCardInfo.remainingBalance.toFixed(2)}</p>
                    </div>
                    <p style="color: #666; font-size: 14px; margin: 10px 0 5px 0;"><strong>סה"כ יתרה לתשלום לאחר מימוש קוד קופון/GIFT CARD:</strong> <strong style="color: #4A6741; font-size: 18px;">₪${total.toFixed(2)}</strong></p>
                  </div>
                ` : `
                  <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>סה"כ סכום העסקה:</strong> <strong style="color: #4A6741; font-size: 16px;">₪${total.toFixed(2)}</strong></p>
                `}
                <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>כתובת משלוח:</strong> ${sanitizeForEmail(address)}, ${sanitizeForEmail(city)}</p>
                ${postalCode ? `<p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>מיקוד:</strong> ${sanitizeForEmail(postalCode)}</p>` : ''}
                <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>טלפון:</strong> ${sanitizeForEmail(phone)}</p>
              </div>
              <div style="background-color: #fff3cd; border-right: 4px solid #ffc107; border-radius: 4px; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #856404; font-size: 16px; margin-top: 0; margin-bottom: 10px;">⚠️ חשוב - השלמת התשלום</h3>
                <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
                  כדי להשלים את ההזמנה, אנא שלח העברה בביט למספר: <strong>0546998603</strong><br>
                  לאחר ביצוע ההעברה, יש לשלוח בוואטסאפ לאותו המספר את צילום המסך של אישור ההעברה בביט.<br>
                  <strong>ההזמנה תהיה תקפה רק לאחר קבלת אישור התשלום.</strong>
                </p>
              </div>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #333; font-size: 18px; margin-top: 0; margin-bottom: 15px;">פריטי ההזמנה:</h3>
                ${cart.map(item => `
                  <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <div>
                      <p style="color: #333; font-size: 14px; margin: 0; font-weight: bold;">${sanitizeForEmail(item.name)}</p>
                      <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">כמות: ${item.quantity} | מחיר ליחידה: ₪${item.price.toFixed(2)}</p>
                    </div>
                    <p style="color: #4A6741; font-size: 14px; margin: 0; font-weight: bold;">₪${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                `).join('')}
              </div>
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
                נשמח לעמוד לרשותך בכל שאלה.<br>
                צוות LUXCERA
              </p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: EMAIL_FROM,
          to: email,
          subject: `הזמנה התקבלה - LUXCERA #${orderId}`,
          html: customerEmailHtml,
        });
        
        console.log(`✅ [Orders Route] Customer email sent to ${email}`);

        // 2. מייל למנהל עם פרטי ההזמנה
        const adminEmailHtml = `
          <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4A6741; font-size: 32px; margin: 0;">LUXCERA</h1>
              </div>
              <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">הזמנה חדשה התקבלה! 🎉</h2>
              <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #2e7d32; font-size: 18px; margin-top: 0; margin-bottom: 15px;">מספר הזמנה: #${orderId}</h3>
                <p style="color: #1b5e20; font-size: 16px; margin: 0; font-weight: bold;">סכום כולל: ₪${total.toFixed(2)}</p>
              </div>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #333; font-size: 18px; margin-top: 0; margin-bottom: 15px;">פרטי הלקוח:</h3>
                <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>שם מלא:</strong> ${sanitizeForEmail(fullName)}</p>
                <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>אימייל:</strong> ${sanitizeForEmail(email)}</p>
                <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>טלפון:</strong> ${sanitizeForEmail(phone)}</p>
                <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>כתובת משלוח:</strong> ${sanitizeForEmail(address)}, ${sanitizeForEmail(city)}</p>
                ${postalCode ? `<p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>מיקוד:</strong> ${sanitizeForEmail(postalCode)}</p>` : ''}
                ${notes ? `<p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>הערות:</strong> ${sanitizeForEmail(notes)}</p>` : ''}
              </div>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #333; font-size: 18px; margin-top: 0; margin-bottom: 15px;">פריטי ההזמנה:</h3>
                ${cart.map(item => `
                  <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <div>
                      <p style="color: #333; font-size: 14px; margin: 0; font-weight: bold;">${sanitizeForEmail(item.name)}</p>
                      <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">כמות: ${item.quantity} | מחיר ליחידה: ₪${item.price.toFixed(2)}</p>
                      ${item.category ? `<p style="color: #666; font-size: 12px; margin: 2px 0 0 0;">קטגוריה: ${sanitizeForEmail(item.category)}</p>` : ''}
                    </div>
                    <p style="color: #4A6741; font-size: 14px; margin: 0; font-weight: bold;">₪${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                `).join('')}
              </div>
              <div style="background-color: #fff3cd; border-right: 4px solid #ffc107; border-radius: 4px; padding: 15px; margin-top: 20px;">
                <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>שיטת תשלום:</strong> ביט<br>
                  <strong>מספר ביט:</strong> 0546998603<br>
                  <strong>סטטוס:</strong> ממתין לאישור תשלום
                </p>
              </div>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: EMAIL_FROM,
          to: ADMIN_EMAIL,
          subject: `הזמנה חדשה #${orderId} - ${sanitizeForEmail(fullName)}`,
          html: adminEmailHtml,
        });
        
        console.log(`✅ [Orders Route] Admin email sent to ${ADMIN_EMAIL}`);

        // 3. שליחת WhatsApp/SMS ללקוח
        console.log(`\n📱 [Orders Route] ========== SMS/WhatsApp Notification ==========`);
        try {
          const smsService = process.env.SMS_SERVICE || 'none';
          console.log(`📱 [Orders Route] SMS_SERVICE environment variable: "${smsService}"`);
          console.log(`📱 [Orders Route] All SMS-related env vars:`, {
            SMS_SERVICE: process.env.SMS_SERVICE,
            WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY ? '✅ Set' : '❌ Missing',
            WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Set' : '❌ Missing',
            WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing',
            WHATSAPP_TEMPLATE_NAME: process.env.WHATSAPP_TEMPLATE_NAME || 'order_confirmation (default)',
          });
          
          const smsPhone = formatPhoneForSMS(phone);
          const smsMessage = `שלום ${fullName}, הזמנתך #${orderId} התקבלה! סכום: ₪${total.toFixed(2)}. אנא שלח העברה בביט ל-0546998603 וצילום אישור בוואטסאפ. LUXCERA`;
          
          console.log(`📱 [Orders Route] Attempting to send message via service: ${smsService} to ${phone} (formatted: ${smsPhone})`);
          
          if (smsService === 'twilio') {
            // שליחה דרך Twilio
            const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
            const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
            const twilioFromNumber = process.env.TWILIO_PHONE_NUMBER;
            
            if (twilioAccountSid && twilioAuthToken && twilioFromNumber) {
              try {
                // Dynamic import כדי לא לגרום לשגיאה אם twilio לא מותקן
                // @ts-ignore - Twilio is optional dependency
                const twilio = await import('twilio').catch(() => null);
                if (!twilio) {
                  console.warn('⚠️  Twilio package not installed. Run: npm install twilio');
                  return;
                }
                
                const client = twilio.default(twilioAccountSid, twilioAuthToken);
                
                await client.messages.create({
                  body: smsMessage,
                  to: `+${smsPhone}`,
                  from: twilioFromNumber,
                });
                
                console.log(`✅ SMS sent via Twilio to ${phone} (${smsPhone})`);
              } catch (twilioError: any) {
                console.error('❌ Twilio SMS error:', twilioError.message);
              }
            } else {
              console.warn('⚠️  Twilio credentials not configured. SMS not sent.');
            }
          } else if (smsService === 'whatsapp') {
            // שליחה דרך WhatsApp Business API - משתמש בשירות WhatsApp
            console.log(`📱 [Orders Route] Starting WhatsApp message sending for Order #${orderId}`);
            try {
              const result = await sendOrderConfirmation(phone, fullName, orderId, total);
              
              if (result.success) {
                console.log(`✅ WhatsApp message sent successfully to ${phone} - Order #${orderId}${result.messageId ? ` (Message ID: ${result.messageId})` : ''}`);
              } else {
                // השגיאה כבר נרשמה בתוך sendOrderConfirmation
                console.error(`❌ Failed to send WhatsApp message to ${phone} - Order #${orderId}`);
                if (result.error) {
                  console.error(`❌ WhatsApp error details:`, JSON.stringify(result.error, null, 2));
                }
              }
            } catch (whatsappError: any) {
              console.error('❌ WhatsApp service error:', {
                message: whatsappError.message,
                stack: whatsappError.stack,
              });
            }
          } else {
            // שירות SMS לא מוגדר
            console.log(`📱 SMS service not configured (SMS_SERVICE=${smsService}). Would send to ${phone} (${smsPhone}): ${smsMessage}`);
          }
        } catch (smsError: any) {
          console.error('❌ Error in SMS sending logic:', smsError.message);
        }

        console.log(`✅ Order confirmation emails sent - Order #${orderId}`);
      } catch (emailError) {
        // אם יש שגיאה בשליחת המיילים, לא נכשיל את ההזמנה - רק נדפיס שגיאה
        console.error('❌ Error sending order confirmation emails:', emailError);
      }

      res.status(201).json({
        ok: true,
        orderId,
        message: 'Order created successfully',
      });
    } catch (err) {
      await conn.rollback();
      console.error('Error creating order:', err);
      res.status(500).json({ ok: false, error: 'Failed to create order' });
    } finally {
      conn.release();
    }
  } catch (err: any) {
    console.error('Validation error:', err);
    if (err instanceof z.ZodError) {
      const firstError = err.errors[0];
      return res.status(400).json({ ok: false, error: firstError?.message || 'Validation failed' });
    }
    return res.status(400).json({ ok: false, error: err.message || 'Invalid request' });
  }
});

export default router;

