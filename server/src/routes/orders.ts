// server/src/routes/orders.ts
import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { z } from 'zod';
import nodemailer, { Transporter } from 'nodemailer';
import { sanitizeForEmail } from '../security.js';
import { sendOrderConfirmation } from '../services/whatsapp.js';
import { asyncHandler } from '../error-handler.js';
import { addPurchasePoints } from '../models/loyalty.js';
import { users } from '../db.js';

const router = Router();


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
    // address ו-city אופציונליים עבור Gift Cards (לא צריך משלוח פיזי)
    address: z.union([z.string().min(1), z.null()]).optional(),
    city: z.union([z.string().min(1), z.null()]).optional(),
    postalCode: z.string().optional(),
    notes: z.string().optional(),
  }),
  paymentData: z.object({
    paymentMethod: z.string().default('bit'),
  }),
  giftCardCode: z.union([z.string(), z.null()]).optional(),
  gift_card_code: z.union([z.string(), z.null()]).optional(),
  promoGiftToken: z.union([z.string(), z.null()]).optional(),
  promo_gift_token: z.union([z.string(), z.null()]).optional(),
  pointsRedeemed: z.number().optional(),
  points_redeemed: z.number().optional(),
  cart: z.array(z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    imageUrl: z.union([z.string(), z.null()]).optional(),
    category: z.union([z.string(), z.null()]).optional(),
    isGiftCard: z.boolean().optional(),
    giftCardEmail: z.union([z.string(), z.null()]).optional(),
    giftCardAmount: z.union([z.number(), z.null()]).optional(),
  })),
});

// Get user orders by email
router.get(
  '/user/:email',
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ ok: false, error: 'Email required' });
    }

    // Get all orders for this user
    const [orders] = await pool.query(
      `SELECT 
        o.id,
        o.full_name,
        o.email,
        o.phone,
        o.address,
        o.city,
        o.postal_code,
        o.notes,
        o.total_amount,
        o.payment_method,
        o.gift_card_amount,
        o.gift_card_code,
        o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.email = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC`,
      [email]
    ) as [any[], any];

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await pool.query(
          `SELECT 
            oi.id,
            oi.product_id,
            oi.product_name,
            oi.price,
            oi.quantity,
            oi.image_url,
            oi.category
          FROM order_items oi
          WHERE oi.order_id = ?
          ORDER BY oi.id`,
          [order.id]
        ) as [any[], any];

        return {
          id: order.id,
          fullName: order.full_name,
          email: order.email,
          phone: order.phone,
          address: order.address,
          city: order.city,
          postalCode: order.postal_code,
          notes: order.notes,
          totalAmount: Number(order.total_amount),
          paymentMethod: order.payment_method,
          giftCardAmount: order.gift_card_amount ? Number(order.gift_card_amount) : 0,
          giftCardCode: order.gift_card_code,
          createdAt: order.created_at,
          itemCount: order.item_count,
          items: items.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            name: item.product_name,
            price: Number(item.price),
            quantity: item.quantity,
            imageUrl: item.image_url,
            category: item.category,
          })),
        };
      })
    );

    res.json({ ok: true, orders: ordersWithItems });
  })
);

// Get single order by ID
router.get(
  '/:orderId',
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userEmail = req.headers['x-user-email'] as string;

    const [orders] = await pool.query(
      `SELECT 
        o.id,
        o.full_name,
        o.email,
        o.phone,
        o.address,
        o.city,
        o.postal_code,
        o.notes,
        o.total_amount,
        o.payment_method,
        o.gift_card_amount,
        o.gift_card_code,
        o.created_at
      FROM orders o
      WHERE o.id = ?`,
      [orderId]
    ) as [any[], any];

    if (orders.length === 0) {
      return res.status(404).json({ ok: false, error: 'Order not found' });
    }

    const order = orders[0];

    // Verify user owns this order (if email provided)
    if (userEmail && order.email !== userEmail) {
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }

    // Get order items
    const [items] = await pool.query(
      `SELECT 
        oi.id,
        oi.product_id,
        oi.product_name,
        oi.price,
        oi.quantity,
        oi.image_url,
        oi.category
      FROM order_items oi
      WHERE oi.order_id = ?
      ORDER BY oi.id`,
      [orderId]
    ) as [any[], any];

    const orderWithItems = {
      id: order.id,
      fullName: order.full_name,
      email: order.email,
      phone: order.phone,
      address: order.address,
      city: order.city,
      postalCode: order.postal_code,
      notes: order.notes,
      totalAmount: Number(order.total_amount),
      paymentMethod: order.payment_method,
      giftCardAmount: order.gift_card_amount ? Number(order.gift_card_amount) : 0,
      giftCardCode: order.gift_card_code,
      createdAt: order.created_at,
      items: items.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        name: item.product_name,
        price: Number(item.price),
        quantity: item.quantity,
        imageUrl: item.image_url,
        category: item.category,
      })),
    };

    res.json({ ok: true, order: orderWithItems });
  })
);

// Create new order (existing code - keep as is)
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validationResult = orderSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error('[Order] Validation error:', validationResult.error.errors);
      return res.status(400).json({
        ok: false,
        error: validationResult.error.errors[0]?.message || 'Validation error',
        details: validationResult.error.errors, // הוספת פרטים נוספים לדיבוג
      });
    }

    const { shippingData, paymentData, giftCardCode, gift_card_code, promoGiftToken, promo_gift_token, pointsRedeemed, points_redeemed, cart } = validationResult.data;
    
    // תמיכה בשני שמות - giftCardCode או gift_card_code
    const finalGiftCardCode = giftCardCode || gift_card_code;
    // תמיכה בשני שמות - promoGiftToken או promo_gift_token
    const finalPromoGiftToken = promoGiftToken || promo_gift_token;
    // תמיכה בשני שמות - pointsRedeemed או points_redeemed
    const finalPointsRedeemed = pointsRedeemed || points_redeemed;
    
    // ניקוי ונרמול של Gift Card code - trim ו-uppercase
    const normalizedGiftCardCode = finalGiftCardCode ? String(finalGiftCardCode).trim().toUpperCase() : null;

    console.log(`[Order] Received Gift Card code:`, {
      original: finalGiftCardCode,
      normalized: normalizedGiftCardCode,
      isNull: normalizedGiftCardCode === null,
      isEmpty: normalizedGiftCardCode === '',
    });

    // Start transaction
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // Calculate totals
      const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      // בדיקה אם כל הפריטים בעגלה הם Gift Cards - אם כן, אין עלות משלוח
      const isOnlyGiftCardsOrder = cart.length > 0 && cart.every(item => item.isGiftCard === true);
      
      // אם כל הפריטים הם Gift Cards, אין עלות משלוח. אחרת, חישוב רגיל
      const shippingFee = isOnlyGiftCardsOrder ? 0 : (cartTotal >= 300 ? 0 : 30);
      let giftCardAmount = 0;
      let promoGiftAmount = 0;

      // Apply gift card if provided
      let giftCardInfo = null;
      if (normalizedGiftCardCode) {
        // בודקים Gift Card לפי קוד - רק אם יש יתרה גדולה מ-0 והסטטוס הוא 'active'
        // חשוב: אם הסטטוס הוא 'used', זה אומר שה-Gift Card שומש עד תומו ולא ניתן להשתמש בו שוב
        // חשוב: נשתמש ב-normalizedGiftCardCode (trim + uppercase)
        const [giftCards] = await conn.query(
          'SELECT * FROM gift_cards WHERE UPPER(TRIM(code)) = ? AND balance > 0 AND status = "active"',
          [normalizedGiftCardCode]
        ) as [any[], any];

        console.log(`[Order] Checking Gift Card:`, {
          normalizedCode: normalizedGiftCardCode,
          found: giftCards.length > 0,
          card: giftCards.length > 0 ? {
            id: giftCards[0].id,
            code: giftCards[0].code,
            balance: giftCards[0].balance,
            status: giftCards[0].status,
            initial_amount: giftCards[0].initial_amount,
          } : null,
        });

        // אם לא נמצא Gift Card פעיל, נבדוק אם הוא קיים אבל שומש עד תומו
        if (giftCards.length === 0) {
          const [usedGiftCards] = await conn.query(
            'SELECT * FROM gift_cards WHERE UPPER(TRIM(code)) = ? AND status = "used"',
            [normalizedGiftCardCode]
          ) as [any[], any];
          
          if (usedGiftCards.length > 0) {
            const usedCard = usedGiftCards[0];
            console.log(`[Order] Gift Card ${normalizedGiftCardCode} is already used (status: used, balance: ${usedCard.balance})`);
            await conn.rollback();
            return res.status(400).json({
              ok: false,
              error: 'Gift Card זה שומש עד תומו ולא ניתן להשתמש בו שוב',
            });
          }
        }

        if (giftCards.length > 0) {
          const giftCard = giftCards[0];
          // משתמשים ב-balance (לא remaining_balance) לפי המבנה של הטבלה
          const currentBalance = Number(giftCard.balance) || 0;
          const availableAmount = currentBalance;
          giftCardAmount = Math.min(availableAmount, cartTotal + shippingFee);
          
          console.log(`[Order] Gift Card calculation:`, {
            code: finalGiftCardCode,
            currentBalance,
            cartTotal,
            shippingFee,
            availableAmount,
            giftCardAmount,
          });
          
          // שמירת מידע על Gift Card לפני העדכון (לצורך מייל)
          const balanceAfter = currentBalance - giftCardAmount;
          giftCardInfo = {
            code: normalizedGiftCardCode, // נשתמש ב-normalized code
            originalCode: giftCard.code, // נשמור גם את הקוד המקורי מהמסד
            initialAmount: Number(giftCard.initial_amount || giftCard.balance),
            balanceBefore: currentBalance,
            amountUsed: giftCardAmount,
            balanceAfter: balanceAfter,
            statusBefore: giftCard.status,
            isFullyUsed: false, // יתעדכן אחר כך
            statusAfter: 'active', // יתעדכן אחר כך
          };
          
          console.log(`[Order] Gift Card info prepared:`, giftCardInfo);
        } else {
          // אם לא נמצא Gift Card פעיל ולא נמצא Gift Card שומש, זה אומר שהוא לא קיים או אין לו יתרה
          console.log(`[Order] Gift Card ${normalizedGiftCardCode} not found, has no balance, or is not active`);
          await conn.rollback();
          return res.status(400).json({
            ok: false,
            error: 'Gift Card לא נמצא, אין לו יתרה, או שהוא לא פעיל',
          });
        }
      }

      // Apply promo gift if provided
      let promoGiftInfo = null;
      if (finalPromoGiftToken) {
        // קודם נבדוק אם ה-promo gift קיים בכלל
        const [allPromoGifts] = await conn.query(
          'SELECT * FROM promo_gifts WHERE token = ?',
          [finalPromoGiftToken]
        ) as [any[], any];

        if (allPromoGifts.length === 0) {
          // אם ה-promo gift לא נמצא, נתעלם ממנו (אולי הוא כבר נמחק או לא קיים)
          console.log(`[Order] Promo Gift token not found, ignoring: ${finalPromoGiftToken}`);
          // לא נחזיר שגיאה, פשוט נתעלם מה-promo gift
        } else {
          const promoGift = allPromoGifts[0];
          const now = new Date();
          const expiresAt = new Date(promoGift.expires_at);
          const timesUsed = Number(promoGift.times_used);
          const maxUses = Number(promoGift.max_uses);

          // אם ה-promo gift כבר שומש עד תומו או disabled, נשמור את הפרטים להצגה במייל
          // אבל לא נשתמש בו שוב בחישוב הסופי (כי הוא כבר נוצל)
          if (promoGift.status === 'disabled' && timesUsed >= maxUses) {
            console.log(`[Order] Promo Gift already used and disabled, but keeping info for email: ${finalPromoGiftToken}`);
            // נשמור את פרטי ה-promo gift להצגה במייל
            // נגדיר את promoGiftAmount רק להצגה במייל (לא נעדכן את times_used שוב ולא נשתמש בו בחישוב)
            const promoAmount = Number(promoGift.amount);
            promoGiftInfo = {
              token: finalPromoGiftToken,
              amount: promoAmount,
              timesUsedBefore: timesUsed,
              maxUses: maxUses,
              timesUsedAfter: timesUsed,
              remainingUses: 0,
              alreadyUsed: true, // סימן שה-promo gift כבר שומש
            };
            // נגדיר את promoGiftAmount כדי להציג אותו נכון במייל וב-totalDiscounts
            // אבל לא נעדכן את times_used שוב (כי הוא כבר שומש)
            promoGiftAmount = promoAmount;
            console.log(`[Order] Promo Gift already used, amount for display: ${promoAmount}, will show in email but not update usage`);
          } else if (promoGift.status !== 'active') {
            await conn.rollback();
            return res.status(400).json({
              ok: false,
              error: `Promo Gift לא פעיל (סטטוס: ${promoGift.status})`,
            });
          } else if (expiresAt < now) {
            await conn.rollback();
            return res.status(400).json({
              ok: false,
              error: 'Promo Gift פג תוקף',
            });
          } else if (timesUsed >= maxUses) {
            await conn.rollback();
            return res.status(400).json({
              ok: false,
              error: 'Promo Gift הגיע למקסימום שימושים',
            });
          } else {
            // אם הכל תקין, נשתמש ב-promo gift
            promoGiftAmount = Number(promoGift.amount);
            promoGiftInfo = {
              token: finalPromoGiftToken,
              amount: promoGiftAmount,
              timesUsedBefore: timesUsed,
              maxUses: maxUses,
              timesUsedAfter: timesUsed + 1,
              remainingUses: maxUses - timesUsed - 1,
            };

            console.log(`[Order] Promo Gift applied:`, {
              token: finalPromoGiftToken,
              amount: promoGiftAmount,
              timesUsed: promoGiftInfo.timesUsedBefore,
              maxUses: promoGiftInfo.maxUses,
            });
          }
        }
      }

      // נקודות מועדון - אם יש
      const loyaltyPointsAmount = finalPointsRedeemed ? Number(finalPointsRedeemed) : 0;
      
      const finalTotal = Math.max(0, cartTotal + shippingFee - giftCardAmount - promoGiftAmount - loyaltyPointsAmount);

      // Create order
      // עבור Gift Cards בלבד, נשתמש בערכי ברירת מחדל עבור address ו-city (כי הטבלה דורשת NOT NULL)
      // עבור Gift Cards, נשתמש בערכי ברירת מחדל
      const orderAddress = isOnlyGiftCardsOrder ? 'Gift Card - No Shipping Required' : (shippingData.address || '');
      const orderCity = isOnlyGiftCardsOrder ? 'Gift Card' : (shippingData.city || '');
      
      const [orderResult] = await conn.query(
        `INSERT INTO orders (
          full_name, email, phone, address, city, postal_code, notes,
          total_amount, payment_method, gift_card_amount, gift_card_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shippingData.fullName,
          shippingData.email,
          shippingData.phone,
          orderAddress,
          orderCity,
          shippingData.postalCode || null,
          shippingData.notes || null,
          finalTotal,
          paymentData.paymentMethod,
          giftCardAmount,
          normalizedGiftCardCode || null,
        ]
      ) as [any, any];

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of cart) {
        // עבור Gift Cards, product_id יהיה null (כי זה לא מוצר אמיתי במסד הנתונים)
        // עבור מוצרים רגילים, product_id הוא מספר
        let productId: number | null = null;
        if (!item.isGiftCard) {
          // עבור מוצרים רגילים, ממירים את ה-ID למספר
          if (typeof item.id === 'string') {
            const parsedId = parseInt(item.id);
            productId = isNaN(parsedId) ? null : parsedId;
          } else {
            productId = Number(item.id) || null;
          }
        }
        // עבור Gift Cards, productId נשאר null
        
        await conn.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, price, quantity, image_url, category
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            productId,
            String(item.name || ''),
            Number(item.price || 0),
            Number(item.quantity || 1),
            item.imageUrl || null,
            item.category || null,
          ]
        );
      }

      // Update gift card balance if used
      // חשוב: נעדכן גם אם giftCardInfo הוא null (למקרה של בעיה בחיפוש)
      if (normalizedGiftCardCode && giftCardAmount > 0) {
        // אם giftCardInfo הוא null, ננסה למצוא את ה-Gift Card שוב
        if (!giftCardInfo) {
          console.log(`[Order ${orderId}] ⚠️ giftCardInfo is null, trying to find Gift Card again...`);
          const [retryGiftCards] = await conn.query(
            'SELECT * FROM gift_cards WHERE UPPER(TRIM(code)) = ?',
            [normalizedGiftCardCode]
          ) as [any[], any];
          
          if (retryGiftCards.length > 0) {
            const retryGiftCard = retryGiftCards[0];
            const retryBalance = Number(retryGiftCard.balance) || 0;
            giftCardInfo = {
              code: normalizedGiftCardCode,
              originalCode: retryGiftCard.code,
              initialAmount: Number(retryGiftCard.initial_amount || retryGiftCard.balance),
              balanceBefore: retryBalance,
              amountUsed: giftCardAmount,
              balanceAfter: retryBalance - giftCardAmount,
              statusBefore: retryGiftCard.status,
              isFullyUsed: false,
              statusAfter: 'active',
            };
            console.log(`[Order ${orderId}] Found Gift Card on retry:`, giftCardInfo);
          } else {
            console.error(`[Order ${orderId}] ⚠️ Gift Card not found even on retry!`, {
              normalizedCode: normalizedGiftCardCode,
            });
            // נמשיך גם בלי giftCardInfo - ננסה לעדכן לפי הקוד בלבד
          }
        }
        
        if (giftCardInfo) {
          // חישוב היתרה החדשה - אם מגיעה ל-0 או פחות, נגדיר ל-0 בדיוק
          const newBalance = Math.max(0, giftCardInfo.balanceAfter);
          const isFullyUsed = newBalance === 0;
        
          // נשתמש בקוד המקורי מהמסד (giftCardInfo.originalCode) או ב-normalized
          const codeToUpdate = giftCardInfo.originalCode || normalizedGiftCardCode;
          
          console.log(`[Order ${orderId}] Updating Gift Card:`, {
            normalizedCode: normalizedGiftCardCode,
            codeToUpdate,
            balanceBefore: giftCardInfo.balanceBefore,
            amountUsed: giftCardAmount,
            balanceAfter: newBalance,
            isFullyUsed,
          });
          
          // עדכון ה-balance והסטטוס - תמיד נגדיר את הערך המדויק (0 אם שומש עד תומו)
          // אם היתרה היא 0, הסטטוס חייב להיות 'used'
          // חשוב: נעדכן גם אם הסטטוס הנוכחי הוא 'used' (למקרה של שימוש חלקי קודם)
          // נעדכן את הסטטוס במפורש לפי החישוב שלנו
          const finalStatus = isFullyUsed ? 'used' : 'active';
          
          // נעדכן לפי הקוד המקורי מהמסד (case-sensitive) או לפי normalized code
          // נשתמש ב-UPPER(TRIM()) כדי למצוא את ה-Gift Card גם עם הבדלי case או רווחים
          const [updateResult] = await conn.query(
            `UPDATE gift_cards 
             SET balance = ?,
                 status = ?,
                 order_id = ?
             WHERE UPPER(TRIM(code)) = ?`,
            [newBalance, finalStatus, orderId, normalizedGiftCardCode]
          ) as [any, any];
          
          console.log(`[Order ${orderId}] Gift Card update result:`, {
            affectedRows: updateResult.affectedRows,
            codeToUpdate,
            normalizedCode: normalizedGiftCardCode,
            newBalance,
            finalStatus,
            isFullyUsed,
          });
          
          if (updateResult.affectedRows === 0) {
            console.error(`[Order ${orderId}] ⚠️ Gift Card update failed - no rows affected!`, {
              codeToUpdate,
              normalizedCode: normalizedGiftCardCode,
              newBalance,
              finalStatus,
            });
            
            // ניסיון נוסף עם הקוד המקורי מהמסד
            console.log(`[Order ${orderId}] Retrying with original code from DB...`);
            const [retryUpdateResult] = await conn.query(
              `UPDATE gift_cards 
               SET balance = ?,
                   status = ?,
                   order_id = ?
               WHERE code = ?`,
              [newBalance, finalStatus, orderId, codeToUpdate]
            ) as [any, any];
            
            console.log(`[Order ${orderId}] Retry update result:`, {
              affectedRows: retryUpdateResult.affectedRows,
              codeUsed: codeToUpdate,
            });
            
            // אם גם זה לא עבד, ננסה עם LIKE
            if (retryUpdateResult.affectedRows === 0) {
              console.log(`[Order ${orderId}] Retrying with LIKE pattern...`);
              const [likeUpdateResult] = await conn.query(
                `UPDATE gift_cards 
                 SET balance = ?,
                     status = ?,
                     order_id = ?
                 WHERE UPPER(TRIM(code)) LIKE ?`,
                [newBalance, finalStatus, orderId, `%${normalizedGiftCardCode}%`]
              ) as [any, any];
              
              console.log(`[Order ${orderId}] LIKE update result:`, {
                affectedRows: likeUpdateResult.affectedRows,
              });
            }
          }
          
          // וידוא שהעדכון בוצע - בדיקה נוספת
          const [verifyResult] = await conn.query(
            'SELECT balance, status FROM gift_cards WHERE code = ? OR UPPER(TRIM(code)) = ?',
            [codeToUpdate, normalizedGiftCardCode]
          ) as [any[], any];
          
          if (verifyResult.length > 0) {
            const actualBalance = Number(verifyResult[0].balance) || 0;
            const actualStatus = verifyResult[0].status;
            
            console.log(`[Order ${orderId}] Gift Card after update:`, {
              codeToUpdate,
              normalizedCode: normalizedGiftCardCode,
              expectedBalance: newBalance,
              actualBalance,
              expectedStatus: isFullyUsed ? 'used' : 'active',
              actualStatus,
              match: actualBalance === newBalance && actualStatus === (isFullyUsed ? 'used' : 'active'),
            });
            
            // אם העדכון לא התבצע נכון, ננסה שוב
            if (actualBalance !== newBalance || actualStatus !== (isFullyUsed ? 'used' : 'active')) {
              console.error(`[Order ${orderId}] ⚠️ Gift Card update mismatch! Retrying...`, {
                codeToUpdate,
                normalizedCode: normalizedGiftCardCode,
                expected: { balance: newBalance, status: isFullyUsed ? 'used' : 'active' },
                actual: { balance: actualBalance, status: actualStatus },
              });
              
              // ניסיון שני לעדכן - ננסה גם עם הקוד המקורי וגם עם normalized
              await conn.query(
                `UPDATE gift_cards 
                 SET balance = ?,
                     status = ?,
                     order_id = ?
                 WHERE code = ? OR UPPER(TRIM(code)) = ?`,
                [newBalance, isFullyUsed ? 'used' : 'active', orderId, codeToUpdate, normalizedGiftCardCode]
              );
              
              // בדיקה נוספת
              const [retryResult] = await conn.query(
                'SELECT balance, status FROM gift_cards WHERE code = ? OR UPPER(TRIM(code)) = ?',
                [codeToUpdate, normalizedGiftCardCode]
              ) as [any[], any];
              
              if (retryResult.length > 0) {
                console.log(`[Order ${orderId}] Gift Card after retry:`, {
                  codeToUpdate,
                  normalizedCode: normalizedGiftCardCode,
                  balance: retryResult[0].balance,
                  status: retryResult[0].status,
                });
              }
            }
          } else {
            console.error(`[Order ${orderId}] ⚠️ Gift Card not found after update!`, {
              codeToUpdate,
              normalizedCode: normalizedGiftCardCode,
            });
          }
          
          // עדכון giftCardInfo עם הערך הסופי המדויק
          giftCardInfo.balanceAfter = newBalance;
          giftCardInfo.isFullyUsed = isFullyUsed;
          giftCardInfo.statusAfter = isFullyUsed ? 'used' : 'active';
        } else {
          // אם giftCardInfo עדיין null, ננסה לעדכן לפי הקוד בלבד
          console.log(`[Order ${orderId}] ⚠️ Updating Gift Card without giftCardInfo, using code only...`);
          const [fallbackGiftCards] = await conn.query(
            'SELECT balance FROM gift_cards WHERE UPPER(TRIM(code)) = ?',
            [normalizedGiftCardCode]
          ) as [any[], any];
          
          if (fallbackGiftCards.length > 0) {
            const currentBalance = Number(fallbackGiftCards[0].balance) || 0;
            const newBalance = Math.max(0, currentBalance - giftCardAmount);
            const isFullyUsed = newBalance === 0;
            const finalStatus = isFullyUsed ? 'used' : 'active';
            
            const [fallbackUpdateResult] = await conn.query(
              `UPDATE gift_cards 
               SET balance = ?,
                   status = ?,
                   order_id = ?
               WHERE UPPER(TRIM(code)) = ?`,
              [newBalance, finalStatus, orderId, normalizedGiftCardCode]
            ) as [any, any];
            
            console.log(`[Order ${orderId}] Fallback Gift Card update result:`, {
              affectedRows: fallbackUpdateResult.affectedRows,
              newBalance,
              finalStatus,
            });
          } else {
            console.log(`[Order ${orderId}] Gift Card update skipped:`, {
              normalizedGiftCardCode: !!normalizedGiftCardCode,
              originalGiftCardCode: finalGiftCardCode,
              giftCardAmount,
              giftCardInfo: !!giftCardInfo,
            });
          }
        }
      } else {
        console.log(`[Order ${orderId}] Gift Card update skipped:`, {
          normalizedGiftCardCode: !!normalizedGiftCardCode,
          originalGiftCardCode: finalGiftCardCode,
          giftCardAmount,
          giftCardInfo: !!giftCardInfo,
        });
      }

      // Update promo gift usage if used (רק אם הוא לא שומש כבר)
      if (finalPromoGiftToken && promoGiftAmount > 0 && !promoGiftInfo?.alreadyUsed) {
        // עדכון ה-times_used ובדיקה אם הגענו למקסימום שימושים
        await conn.query(
          `UPDATE promo_gifts 
           SET times_used = times_used + 1,
               status = CASE 
                 WHEN (times_used + 1) >= max_uses THEN 'disabled'
                 ELSE status
               END
           WHERE token = ?`,
          [finalPromoGiftToken]
        );
        
        // בדיקה נוספת - אם הגענו למקסימום שימושים, נעדכן את הסטטוס ל-'disabled'
        const [checkResult] = await conn.query(
          `SELECT times_used, max_uses FROM promo_gifts WHERE token = ?`,
          [finalPromoGiftToken]
        ) as [any[], any];
        
        if (checkResult.length > 0 && Number(checkResult[0].times_used) >= Number(checkResult[0].max_uses)) {
          await conn.query(
            `UPDATE promo_gifts SET status = 'disabled' WHERE token = ?`,
            [finalPromoGiftToken]
          );
        }
      }

      await conn.commit();

      // Send confirmation emails
      const transporter = createTransporter();
      const orderItemsHtml = cart
        .map(
          (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${item.name} x${item.quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: left;">
            ₪${(item.price * item.quantity).toFixed(2)}
          </td>
        </tr>
      `
        )
        .join('');

      // בניית פירוט ההנחות
      const discountsHtml = [];
      let totalDiscounts = 0;
      
      if (giftCardAmount > 0) {
        // אם יש giftCardInfo, נציג פרטים מלאים, אחרת רק את הסכום
        if (giftCardInfo) {
          const finalBalance = giftCardInfo.balanceAfter || 0;
          const balanceDisplay = finalBalance === 0 
            ? '₪0.00 (שומש עד תומו)' 
            : `₪${finalBalance.toFixed(2)}`;
          
          discountsHtml.push(`
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">
                <strong style="color: #10b981;">🎁 GIFT CARD</strong><br>
                <span style="font-size: 13px; color: #666;">קוד: <strong>${giftCardInfo.code}</strong></span><br>
                <span style="font-size: 12px; color: #999; margin-top: 4px; display: block;">
                  יתרה לפני שימוש: ₪${giftCardInfo.balanceBefore.toFixed(2)} | 
                  שומש בהזמנה זו: ₪${giftCardInfo.amountUsed.toFixed(2)} | 
                  יתרה נשארת: ${balanceDisplay}
                </span>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left; color: #10b981; font-weight: bold; font-size: 16px;">-₪${giftCardAmount.toFixed(2)}</td>
            </tr>
          `);
        } else {
          // אם אין giftCardInfo אבל יש giftCardAmount, נציג רק את הסכום
          discountsHtml.push(`
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">
                <strong style="color: #10b981;">🎁 GIFT CARD</strong>
                ${normalizedGiftCardCode ? `<br><span style="font-size: 13px; color: #666;">קוד: <strong>${normalizedGiftCardCode}</strong></span>` : ''}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left; color: #10b981; font-weight: bold; font-size: 16px;">-₪${giftCardAmount.toFixed(2)}</td>
            </tr>
          `);
        }
        totalDiscounts += giftCardAmount;
      }
      
      // הצגת PROMO GIFTS במייל - תמיד כשיש token תקין או info
      if (finalPromoGiftToken && (promoGiftAmount > 0 || promoGiftInfo)) {
        const displayAmount = promoGiftAmount > 0 ? promoGiftAmount : (promoGiftInfo?.amount || 0);
        if (promoGiftInfo) {
          const isAlreadyUsed = promoGiftInfo.alreadyUsed || false;
          discountsHtml.push(`
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">
                <strong style="color: #10b981;">🎁 PROMO GIFTS</strong><br>
                <span style="font-size: 13px; color: #666;">קוד: <strong>${promoGiftInfo.token}</strong></span><br>
                <span style="font-size: 12px; color: #999; margin-top: 4px; display: block;">
                  ${isAlreadyUsed 
                    ? `שומש בהזמנה זו: ${promoGiftInfo.timesUsedBefore}/${promoGiftInfo.maxUses} | קוד זה שומש עד תומו`
                    : `שימושים: ${promoGiftInfo.timesUsedBefore + 1}/${promoGiftInfo.maxUses} | שימושים נשארים: ${Math.max(0, promoGiftInfo.remainingUses)}`
                  }
                </span>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left; color: #10b981; font-weight: bold; font-size: 16px;">-₪${displayAmount.toFixed(2)}</td>
            </tr>
          `);
        } else {
          discountsHtml.push(`
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">
                <strong style="color: #10b981;">🎁 PROMO GIFTS</strong>
                ${finalPromoGiftToken ? `<br><span style="font-size: 13px; color: #666;">קוד: <strong>${finalPromoGiftToken}</strong></span>` : ''}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left; color: #10b981; font-weight: bold; font-size: 16px;">-₪${displayAmount.toFixed(2)}</td>
            </tr>
          `);
        }
        // נוסיף ל-totalDiscounts את הסכום (גם אם הוא כבר שומש, צריך להציג אותו במייל)
        totalDiscounts += displayAmount;
      }
      
      if (loyaltyPointsAmount > 0) {
        discountsHtml.push(`
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">
              <strong style="color: #10b981;">⭐ נקודות מועדון</strong>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left; color: #10b981; font-weight: bold; font-size: 16px;">-₪${loyaltyPointsAmount.toFixed(2)}</td>
          </tr>
        `);
        totalDiscounts += loyaltyPointsAmount;
      }

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">תודה על ההזמנה! 🎉</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              שלום ${sanitizeForEmail(shippingData.fullName)},
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              ההזמנה שלך התקבלה בהצלחה! מספר הזמנה: <strong>#${orderId}</strong>
            </p>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">פרטי ההזמנה:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${orderItemsHtml}
                <tr>
                  <td style="padding: 10px; border-top: 2px solid #ddd; font-weight: bold; color: #666;">סה"כ מוצרים:</td>
                  <td style="padding: 10px; border-top: 2px solid #ddd; text-align: left; font-weight: bold;">₪${(cartTotal).toFixed(2)}</td>
                </tr>
                ${shippingFee > 0 ? `
                <tr>
                  <td style="padding: 8px; color: #666;">דמי משלוח:</td>
                  <td style="padding: 8px; text-align: left;">₪${shippingFee.toFixed(2)}</td>
                </tr>
                ` : `
                <tr>
                  <td style="padding: 8px; color: #10b981; font-weight: bold;">דמי משלוח:</td>
                  <td style="padding: 8px; text-align: left; color: #10b981; font-weight: bold;">חינם</td>
                </tr>
                `}
                ${discountsHtml.length > 0 ? `
                <tr>
                  <td colspan="2" style="padding: 15px 0 10px 0; border-top: 2px solid #ddd;">
                    <h4 style="color: #333; font-size: 16px; font-weight: bold; margin: 0;">💰 הנחות וקיזוזים:</h4>
                  </td>
                </tr>
                ${discountsHtml.join('')}
                <tr>
                  <td style="padding: 10px; background-color: #f0fdf4; color: #333; font-weight: bold; font-size: 15px;">סה"כ הנחות וקיזוזים:</td>
                  <td style="padding: 10px; background-color: #f0fdf4; text-align: left; color: #10b981; font-weight: bold; font-size: 16px;">-₪${totalDiscounts.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding: 5px 0;"></td>
                </tr>
                <tr>
                  <td style="padding: 15px; border-top: 3px solid #333; background-color: #fef3c7; font-weight: bold; font-size: 18px; color: #92400e;">💳 סכום לתשלום בביט:</td>
                  <td style="padding: 15px; border-top: 3px solid #333; background-color: #fef3c7; text-align: left; font-weight: bold; font-size: 22px; color: #92400e;">₪${finalTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px 0; border-top: 1px solid #ddd;">
                    <div style="font-size: 12px; color: #666; line-height: 1.6;">
                      <strong>פירוט החישוב:</strong><br>
                      סה"כ מוצרים: ₪${cartTotal.toFixed(2)} + 
                      משלוח: ${shippingFee > 0 ? `₪${shippingFee.toFixed(2)}` : 'חינם'}${totalDiscounts > 0 ? ` - הנחות: ₪${totalDiscounts.toFixed(2)}` : ''} = 
                      <strong style="color: #92400e;">₪${finalTotal.toFixed(2)}</strong>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fef3c7; border-right: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #92400e; font-size: 18px; margin-bottom: 10px; font-weight: bold;">⚠️ חשוב מאוד - השלמת התשלום:</h3>
              <p style="color: #78350f; font-size: 16px; line-height: 1.8; margin-bottom: 10px;">
                ההזמנה תאושר רק לאחר העברת התשלום בביט למספר: <strong style="font-size: 18px;">054-6998603</strong>
              </p>
              <p style="color: #78350f; font-size: 16px; line-height: 1.8; margin-bottom: 10px;">
                אנא העבר את הסכום <strong>₪${finalTotal.toFixed(2)}</strong> לביט למספר הנ"ל ושלח צילום מסך של ההעברה לווטסאפ למספר: <strong style="font-size: 18px;">054-6998603</strong>
              </p>
              <p style="color: #78350f; font-size: 14px; line-height: 1.6; margin-top: 15px;">
                <strong>מספר הזמנה להזכרה:</strong> #${orderId}
              </p>
            </div>
            
            ${isOnlyGiftCardsOrder ? `
            <div style="background-color: #dbeafe; border-right: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 10px; font-weight: bold;">🎁 קבלת קוד ה-Gift Card:</h3>
              <p style="color: #1e3a8a; font-size: 16px; line-height: 1.8; margin-bottom: 10px;">
                קוד ה-Gift Card יישלח אליך במייל לאחר שתעביר את התשלום בביט ותשלח צילום מסך של ההעברה לווטסאפ למספר: <strong style="font-size: 18px;">054-6998603</strong>
              </p>
              <p style="color: #1e3a8a; font-size: 14px; line-height: 1.6; margin-top: 10px;">
                <strong>שלבי התהליך:</strong><br>
                1. העברת התשלום <strong>₪${finalTotal.toFixed(2)}</strong> לביט למספר 054-6998603<br>
                2. צילום מסך של ההעברה<br>
                3. שליחת הצילום לווטסאפ למספר 054-6998603<br>
                4. קבלת קוד ה-Gift Card במייל
              </p>
            </div>
            ` : `
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              לאחר קבלת התשלום נחזור אליך בהקדם עם פרטי המשלוח.
            </p>
            `}
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 10px;">
              תודה על רכישתך ב-LUXCERA! 🕯️
            </p>
          </div>
        </div>
      `;

      const ADMIN_EMAIL = process.env.EMAIL_ADMIN || 'LUXCERA777@GMAIL.COM';

      // בניית מייל למנהל אדמין על הזמנה חדשה
      const adminOrderHtml = `
        <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">הזמנה חדשה התקבלה! 🎉</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              מספר הזמנה: <strong>#${orderId}</strong>
            </p>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">פרטי הלקוח:</h3>
              <p style="color: #666; font-size: 16px; line-height: 1.8; margin: 5px 0;">
                <strong>שם מלא:</strong> ${sanitizeForEmail(shippingData.fullName)}<br>
                <strong>אימייל:</strong> ${sanitizeForEmail(shippingData.email)}<br>
                <strong>טלפון:</strong> ${sanitizeForEmail(shippingData.phone)}<br>
                ${!isOnlyGiftCardsOrder ? `
                <strong>כתובת:</strong> ${sanitizeForEmail(orderAddress)}<br>
                <strong>עיר:</strong> ${sanitizeForEmail(orderCity)}<br>
                ` : '<strong>סוג הזמנה:</strong> Gift Card (אין צורך במשלוח פיזי)<br>'}
                ${shippingData.postalCode ? `<strong>מיקוד:</strong> ${sanitizeForEmail(shippingData.postalCode)}<br>` : ''}
                ${shippingData.notes ? `<strong>הערות:</strong> ${sanitizeForEmail(shippingData.notes)}<br>` : ''}
              </p>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">פרטי ההזמנה:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${orderItemsHtml}
                <tr>
                  <td style="padding: 10px; border-top: 2px solid #ddd; font-weight: bold; color: #666;">סה"כ מוצרים:</td>
                  <td style="padding: 10px; border-top: 2px solid #ddd; text-align: left; font-weight: bold;">₪${(cartTotal).toFixed(2)}</td>
                </tr>
                ${shippingFee > 0 ? `
                <tr>
                  <td style="padding: 8px; color: #666;">דמי משלוח:</td>
                  <td style="padding: 8px; text-align: left;">₪${shippingFee.toFixed(2)}</td>
                </tr>
                ` : `
                <tr>
                  <td style="padding: 8px; color: #10b981; font-weight: bold;">דמי משלוח:</td>
                  <td style="padding: 8px; text-align: left; color: #10b981; font-weight: bold;">חינם</td>
                </tr>
                `}
                ${discountsHtml.length > 0 ? `
                <tr>
                  <td colspan="2" style="padding: 15px 0 10px 0; border-top: 2px solid #ddd;">
                    <h4 style="color: #333; font-size: 16px; font-weight: bold; margin: 0;">💰 הנחות וקיזוזים:</h4>
                  </td>
                </tr>
                ${discountsHtml.join('')}
                <tr>
                  <td style="padding: 10px; background-color: #f0fdf4; color: #333; font-weight: bold; font-size: 15px;">סה"כ הנחות וקיזוזים:</td>
                  <td style="padding: 10px; background-color: #f0fdf4; text-align: left; color: #10b981; font-weight: bold; font-size: 16px;">-₪${totalDiscounts.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding: 5px 0;"></td>
                </tr>
                <tr>
                  <td style="padding: 15px; border-top: 3px solid #333; background-color: #fef3c7; font-weight: bold; font-size: 18px; color: #92400e;">💳 סכום לתשלום:</td>
                  <td style="padding: 15px; border-top: 3px solid #333; background-color: #fef3c7; text-align: left; font-weight: bold; font-size: 22px; color: #92400e;">₪${finalTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #666;">שיטת תשלום:</td>
                  <td style="padding: 8px; text-align: left; color: #666;">${paymentData.paymentMethod === 'bit' ? 'ביט' : paymentData.paymentMethod}</td>
                </tr>
              </table>
            </div>

            ${isOnlyGiftCardsOrder ? `
            <div style="background-color: #dbeafe; border-right: 4px solid #3b82f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                <strong>⚠️ שימו לב:</strong> זו הזמנת Gift Card. הקוד יישלח ללקוח במייל לאחר קבלת התשלום וצילום העברה לווטסאפ.
              </p>
            </div>
            ` : ''}

            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
              תאריך הזמנה: ${new Date().toLocaleString('he-IL')}
            </p>
          </div>
        </div>
      `;

      // שליחת מיילים ללקוח ולמנהל
      await Promise.all([
        transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: shippingData.email,
          subject: `הזמנה #${orderId} התקבלה - LUXCERA`,
          html: emailHtml,
        }),
        transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: ADMIN_EMAIL,
          subject: `הזמנה חדשה #${orderId} - LUXCERA`,
          html: adminOrderHtml,
        }).catch((adminEmailError) => {
          console.error('Failed to send admin notification email:', adminEmailError);
          // Don't fail the order if admin email fails
        }),
      ]);

      // Send WhatsApp notification if configured
      try {
        await sendOrderConfirmation(
          shippingData.fullName,
          shippingData.phone,
          orderId,
          finalTotal
        );
      } catch (whatsappError) {
        console.error('WhatsApp notification failed:', whatsappError);
        // Don't fail the order if WhatsApp fails
      }

      // Add loyalty points if user is a club member
      // חשוב: הנקודות מחושבות רק על סכום המוצרים (cartTotal) לפני משלוח, קופונים ונקודות
      try {
        const user = await users.findByEmail(shippingData.email);
        if (user) {
          await addPurchasePoints({
            userId: user.id,
            orderId,
            amount: cartTotal, // רק סכום המוצרים, ללא משלוח והנחות
          });
        }
      } catch (loyaltyError) {
        console.error('Loyalty points update failed:', loyaltyError);
        // Don't fail the order if loyalty points update fails
      }

      res.json({
        ok: true,
        orderId,
        message: 'Order created successfully',
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  })
);

export default router;
