// server/src/routes/orders.ts
import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import nodemailer, { Transporter } from 'nodemailer';
import { sanitizeForEmail } from '../security.js';
import { sendOrderConfirmation } from '../services/whatsapp.js';
import { asyncHandler } from '../error-handler.js';

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
    postalCode: z.string().optional(),
    notes: z.string().optional(),
  }),
  paymentData: z.object({
    paymentMethod: z.string().default('bit'),
  }),
  giftCardCode: z.string().optional(),
  promoGiftToken: z.string().optional(),
  cart: z.array(z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    imageUrl: z.string().optional(),
    category: z.string().optional(),
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
  apiLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validationResult = orderSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        ok: false,
        error: validationResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const { shippingData, paymentData, giftCardCode, promoGiftToken, cart } = validationResult.data;

    // Start transaction
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // Calculate totals
      const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingFee = cartTotal >= 300 ? 0 : 30;
      let giftCardAmount = 0;
      let promoGiftAmount = 0;

      // Apply gift card if provided
      if (giftCardCode) {
        const [giftCards] = await conn.query(
          'SELECT * FROM gift_cards WHERE code = ? AND status = "active"',
          [giftCardCode]
        ) as [any[], any];

        if (giftCards.length > 0) {
          const giftCard = giftCards[0];
          const availableAmount = Number(giftCard.remaining_balance || giftCard.amount);
          giftCardAmount = Math.min(availableAmount, cartTotal + shippingFee);
        }
      }

      // Apply promo gift if provided
      if (promoGiftToken) {
        const [promoGifts] = await conn.query(
          'SELECT * FROM promo_gifts WHERE token = ? AND status = "active" AND expires_at > NOW() AND times_used < max_uses',
          [promoGiftToken]
        ) as [any[], any];

        if (promoGifts.length > 0) {
          const promoGift = promoGifts[0];
          promoGiftAmount = Number(promoGift.amount);
        }
      }

      const finalTotal = Math.max(0, cartTotal + shippingFee - giftCardAmount - promoGiftAmount);

      // Create order
      const [orderResult] = await conn.query(
        `INSERT INTO orders (
          full_name, email, phone, address, city, postal_code, notes,
          total_amount, payment_method, gift_card_amount, gift_card_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shippingData.fullName,
          shippingData.email,
          shippingData.phone,
          shippingData.address,
          shippingData.city,
          shippingData.postalCode || null,
          shippingData.notes || null,
          finalTotal,
          paymentData.paymentMethod,
          giftCardAmount,
          giftCardCode || null,
        ]
      ) as [any, any];

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of cart) {
        await conn.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, price, quantity, image_url, category
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.id,
            item.name,
            item.price,
            item.quantity,
            item.imageUrl || null,
            item.category || null,
          ]
        );
      }

      // Update gift card balance if used
      if (giftCardCode && giftCardAmount > 0) {
        await conn.query(
          `UPDATE gift_cards 
           SET remaining_balance = remaining_balance - ?,
               last_used_at = NOW()
           WHERE code = ?`,
          [giftCardAmount, giftCardCode]
        );
      }

      // Update promo gift usage if used
      if (promoGiftToken && promoGiftAmount > 0) {
        await conn.query(
          `UPDATE promo_gifts 
           SET times_used = times_used + 1
           WHERE token = ?`,
          [promoGiftToken]
        );
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
                  <td style="padding: 10px; border-top: 2px solid #333; font-weight: bold;">
                    סה"כ: ₪${finalTotal.toFixed(2)}
                  </td>
                </tr>
              </table>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              נחזור אליך בהקדם עם פרטי המשלוח.
            </p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: shippingData.email,
        subject: `הזמנה #${orderId} התקבלה - LUXCERA`,
        html: emailHtml,
      });

      // Send WhatsApp notification if configured
      try {
        await sendOrderConfirmation({
          phone: shippingData.phone,
          orderId,
          fullName: shippingData.fullName,
        });
      } catch (whatsappError) {
        console.error('WhatsApp notification failed:', whatsappError);
        // Don't fail the order if WhatsApp fails
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
