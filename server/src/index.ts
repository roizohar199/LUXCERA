import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import nodemailer, { Transporter } from 'nodemailer';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { sanitizeForEmail, sanitizeString } from './security.js';
import { ContactSchema, RegisterSchema, CustomCreationSchema } from './schemas.js';
import { csrfProtection } from './csrf.js';
import { logger } from './logger.js';
import { errorHandler, asyncHandler } from './error-handler.js';
import { initDatabase, users } from './db.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import giftCardRoutes from './routes/giftcards.js';
import promoGiftRoutes from './routes/promoGifts.js';
import usersRoutes from './routes/users.js';
import cartRoutes from './routes/cart.js';
import bannersRoutes from './routes/banners.js';
import clubRoutes from './routes/club.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- CONFIG ----------
const app = express();
const PORT = Number(process.env.PORT || 8787);
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const PROD = process.env.NODE_ENV === 'production';

// אופציונלי: אם תרצה לאפשר גישה ישירה לשרת בכתובת מלאה (ללא פרוקסי)
const API_PUBLIC = (process.env.API_PUBLIC || `http://localhost:${PORT}`).trim();

// ---------- SECURITY MIDDLEWARE ----------

// אם יש פרוקסי (Nginx/Cloudflare), חובה:
app.set('trust proxy', 1);

// 1) Helmet - Security Headers (CSP עם connectSrc כולל המקורות הרלוונטיים)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', `${API_PUBLIC}/uploads`, `${ORIGIN}/uploads`],
        // אם הלקוח ניגש יחסית (/api/...) זה 'self'; אם ניגש ישירות ל-8787, הוספנו את API_PUBLIC
        connectSrc: ["'self'", ORIGIN, API_PUBLIC],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", `${API_PUBLIC}/uploads`, `${ORIGIN}/uploads`],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: PROD,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2) Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { ok: false, error: 'יותר מדי בקשות מ-IP זה, נסה שוב בעוד כמה דקות.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ ok: false, error: 'יותר מדי בקשות מ-IP זה, נסה שוב בעוד כמה דקות.' });
  },
});


const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { ok: false, error: 'יותר מדי ניסיונות הרשמה מ-IP זה, נסה שוב בעוד שעה.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ ok: false, error: 'יותר מדי ניסיונות הרשמה מ-IP זה, נסה שוב בעוד שעה.' });
  },
});

// Login limiter - יותר סלחני בפיתוח
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // 100 בפיתוח, 10 בפרודקשן
  message: { ok: false, error: 'יותר מדי ניסיונות התחברות מ-IP זה, נסה שוב בעוד כמה דקות.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ ok: false, error: 'יותר מדי ניסיונות התחברות מ-IP זה, נסה שוב בעוד כמה דקות.' });
  },
});

// Rate limiting removed - was causing 429 errors on public endpoints
// app.use(generalLimiter);

// 3) CORS – חשוב לאפשר credentials והכותרת של ה-CSRF
app.use(
  cors({
    origin: ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'csrf-token', 'Authorization'],
    optionsSuccessStatus: 200,
  })
);

// 4) Cookie parser (חובה לפני csurf)
app.use(cookieParser());

// 5) Body parsing with limits (חובה לפני csurf)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 6) CSRF Protection – שימוש בדאבל-סאבמיט עם עוגיה
// 6) CSRF Protection – using custom implementation instead of deprecated csurf
// Imported from ./csrf.js

// ---------- EMAIL ----------
function createTransporter(): Transporter {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE ?? 'true') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function createSafeEmailHtml(
  title: string,
  fields: Array<{ label: string; value: string }>
): string {
  const fieldsHtml = fields
    .map(({ label, value }) => {
      const sanitizedValue = sanitizeForEmail(value);
      return `<p><b>${sanitizeForEmail(label)}:</b> ${sanitizedValue}</p>`;
    })
    .join('\n');

  return `
    <h2>${sanitizeForEmail(title)}</h2>
    ${fieldsHtml}
  `;
}

// ---------- ROUTES ----------

// Swagger API Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LUXCERA API',
      version: '1.0.0',
      description: 'API documentation for LUXCERA luxury candles landing page',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
        },
      },
    },
  },
  apis: ['./src/index.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// בריאות (ללא CSRF/לימיט)
app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true }));

// ראוט שמנפיק טוקן ומציב גם עוגייה ידידותית ללקוח לקריאה
// csurf ב-GET requests רק יוצר טוקן חדש, לא מאמת אותו (אז זה בסדר)
app.get('/api/csrf', csrfProtection, (req: Request, res: Response) => {
  const token = (req as any).csrfToken();
  // עוגיית עזר שהלקוח כן יכול לקרוא (לא httpOnly) כדי לשלוף ממנה ולשים בכותרת
  res.cookie('XSRF-TOKEN', token, {
    sameSite: PROD ? 'none' : 'lax',
    secure: PROD ? true : false,
  });
  res.json({ csrfToken: token });
});

// צור קשר / הזמנה – עם CSRF protection
app.post('/api/contact', csrfProtection, async (req: Request, res: Response) => {
  try {
    const parsed = ContactSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      const errorMessage = firstError?.message || 'בקשה לא תקינה';
      return res.status(400).json({ ok: false, error: errorMessage });
    }

    const data = parsed.data;

    const sanitizedFullName = sanitizeString(data.fullName, 100);
    const sanitizedEmail = data.email ? sanitizeString(data.email, 255) : '';
    const sanitizedPhone = data.phone ? sanitizeString(data.phone, 20) : '';
    const sanitizedMessage = sanitizeString(data.message, 2000);
    const sanitizedCategory = sanitizeString(data.category, 50);
    const sanitizedColor = sanitizeString(data.color || '', 50);
    const sanitizedScent = sanitizeString(data.scent || '', 50);

    const transporter = createTransporter();

    const fields = [
      { label: 'שם מלא', value: sanitizedFullName },
      ...(sanitizedEmail ? [{ label: 'אימייל', value: sanitizedEmail }] : []),
      ...(sanitizedPhone ? [{ label: 'טלפון', value: sanitizedPhone }] : []),
      { label: 'קטגוריה', value: sanitizedCategory },
      ...(sanitizedColor ? [{ label: 'צבע', value: sanitizedColor }] : []),
      ...(sanitizedScent ? [{ label: 'ריח', value: sanitizedScent }] : []),
      { label: 'כמות', value: String(data.qty) },
      { label: 'הודעה', value: sanitizedMessage },
    ];

    const html = createSafeEmailHtml('פנייה חדשה מ-LUXCERA', fields);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: 'LUXCERA – הודעת טופס חדשה',
      html,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Contact email error:', err);
    return res.status(500).json({ ok: false, error: 'Email failed' });
  }
});

// יצירה מותאמת אישית – עם CSRF protection
app.post('/api/custom-creation', csrfProtection, async (req: Request, res: Response) => {
  try {
    const parsed = CustomCreationSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      const errorMessage = firstError?.message || 'בקשה לא תקינה';
      return res.status(400).json({ ok: false, error: errorMessage });
    }

    const data = parsed.data;

    const sanitizedFullName = sanitizeString(data.fullName, 100);
    const sanitizedContact = sanitizeString(data.contact, 255);
    const sanitizedPurpose = sanitizeString(data.purpose || '', 50);
    const sanitizedDimensions = sanitizeString(data.dimensions || '', 200);
    const sanitizedStyle = sanitizeString(data.style || '', 50);
    const sanitizedBudget = sanitizeString(data.budget || '', 50);
    const sanitizedColorPalette = sanitizeString(data.colorPalette || '', 200);
    const sanitizedMaterials = sanitizeString(data.materials || '', 200);
    const sanitizedNotes = sanitizeString(data.notes || '', 2000);

    const transporter = createTransporter();

    const fields = [
      { label: 'שם מלא', value: sanitizedFullName },
      { label: 'ווטסאפ / אימייל', value: sanitizedContact },
      ...(sanitizedPurpose ? [{ label: 'מטרה', value: sanitizedPurpose }] : []),
      ...(sanitizedDimensions ? [{ label: 'מידות', value: sanitizedDimensions }] : []),
      ...(sanitizedStyle ? [{ label: 'סגנון', value: sanitizedStyle }] : []),
      ...(sanitizedBudget ? [{ label: 'תקציב', value: sanitizedBudget }] : []),
      ...(sanitizedColorPalette ? [{ label: 'פלטת צבעים', value: sanitizedColorPalette }] : []),
      ...(sanitizedMaterials ? [{ label: 'חומרים', value: sanitizedMaterials }] : []),
      ...(sanitizedNotes ? [{ label: 'הערות', value: sanitizedNotes }] : []),
      ...(data.filesCount && data.filesCount > 0 ? [{ label: 'קבצים מצורפים', value: `${data.filesCount} קבצים` }] : []),
    ];

    const html = createSafeEmailHtml('בקשה ליצירה מותאמת אישית מ-LUXCERA', fields);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: 'LUXCERA – בקשה ליצירה מותאמת אישית',
      html,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Custom creation email error:', err);
    return res.status(500).json({ ok: false, error: 'Email failed' });
  }
});

// התחברות עם Google – בודק אם המשתמש רשום
app.post('/api/login-google', csrfProtection, async (req: Request, res: Response) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      const errorMessage = firstError?.message || 'בקשה לא תקינה';
      return res.status(400).json({ ok: false, error: errorMessage });
    }

    const data = parsed.data;
    const sanitizedEmail = sanitizeString(data.email, 255).toLowerCase();

    // בדיקה אם המשתמש רשום
    const existingUser = await users.findByEmail(sanitizedEmail);
    if (!existingUser) {
      return res.status(401).json({ 
        ok: false, 
        error: 'החשבון לא רשום במערכת. אנא הירשם קודם באמצעות Google.' 
      });
    }

    // המשתמש קיים - מאפשרים התחברות
    return res.json({ ok: true, user: existingUser });
  } catch (err) {
    console.error('Google login check error:', err);
    return res.status(500).json({ ok: false, error: 'שגיאה בבדיקת המשתמש. אנא נסה שוב.' });
  }
});

// הרשמה – מייל למשתמש + לאדמין – עם CSRF protection
app.post('/api/register', csrfProtection, registerLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      const errorMessage = firstError?.message || 'בקשה לא תקינה';
      return res.status(400).json({ ok: false, error: errorMessage });
    }

    const data = parsed.data;
    const sanitizedFullName = sanitizeString(data.fullName, 100);
    const sanitizedEmail = sanitizeString(data.email, 255).toLowerCase();

    // בדיקה אם המשתמש כבר רשום
    const existingUser = await users.findByEmail(sanitizedEmail);
    if (existingUser) {
      return res.status(400).json({ 
        ok: false, 
        error: 'כתובת האימייל כבר רשומה במערכת. אנא התחבר או השתמש בכתובת אחרת.' 
      });
    }

    // שמירת המשתמש ב-DB
    try {
      await users.create(sanitizedEmail, sanitizedFullName);
    } catch (dbError: any) {
      // אם יש שגיאה ב-DB (למשל duplicate email), נחזיר שגיאה
      if (dbError.code === 'ER_DUP_ENTRY' || dbError.message.includes('Duplicate')) {
        return res.status(400).json({ 
          ok: false, 
          error: 'כתובת האימייל כבר רשומה במערכת. אנא התחבר או השתמש בכתובת אחרת.' 
        });
      }
      console.error('Database error during registration:', dbError);
      return res.status(500).json({ ok: false, error: 'שגיאה בשמירת המשתמש. אנא נסה שוב.' });
    }

    const transporter = createTransporter();
    const ADMIN_EMAIL = process.env.EMAIL_ADMIN || 'LUXCERA777@GMAIL.COM';

    const userHtml = `
      <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4A6741; font-size: 32px; margin: 0;">LUXCERA</h1>
          </div>
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">ברוכים הבאים ${sanitizeForEmail(sanitizedFullName)}! 👋</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">תודה שהצטרפת ל-LUXCERA! ההרשמה שלך הושלמה בהצלחה.</p>
        </div>
      </div>
    `;

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">משתמש חדש נרשם לאתר</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
            <b>שם מלא:</b> ${sanitizeForEmail(sanitizedFullName)}<br>
            <b>אימייל:</b> ${sanitizeForEmail(sanitizedEmail)}
          </p>
        </div>
      </div>
    `;

    await Promise.all([
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: sanitizedEmail,
        subject: 'ברוכים הבאים ל-LUXCERA! 🕯️',
        html: userHtml,
      }),
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: ADMIN_EMAIL,
        subject: 'LUXCERA – משתמש חדש נרשם',
        html: adminHtml,
      }),
    ]);

    return res.json({ ok: true });
  } catch (err) {
    console.error('Registration email error:', err);
    return res.status(500).json({ ok: false, error: 'Email failed' });
  }
});

// ---------- STATIC FILES ----------
// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ---------- NEW CMS ROUTES ----------
// Authentication routes (no CSRF for login, but with login-specific rate limiting)
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);

// Public products routes
app.use('/api/public/products', productsRoutes);
// Public banners routes
app.use('/api/public/banners', bannersRoutes);

// Orders routes
app.use('/api/orders', ordersRoutes);

// Cart routes (for logged-in users)
app.use('/api/cart', cartRoutes);

// Loyalty Club routes
app.use('/api/club', clubRoutes);

// גיפט קארד – חלק עם CSRF בפנים
app.use('/api/giftcards', giftCardRoutes);
// פרומו גיפט – מנגנון נפרד לחלוטין
app.use('/api/promo-gifts', promoGiftRoutes);
// Users routes
app.use('/api/users', usersRoutes);

// Admin routes (protected, no CSRF for easier API usage)
app.use('/api/admin', adminRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// ---------- START ----------
(async () => {
  // Initialize database
  try {
    await initDatabase();
    logger.info('Database initialized successfully');
  } catch (err) {
    logger.error('Database initialization failed', { error: err });
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.info(`✅ Server running on http://localhost:${PORT}`);
    logger.info(`🔒 Security features enabled:`);
    logger.info(`   - Helmet (Security Headers)`);
    logger.info(`   - Rate Limiting`);
    logger.info(`   - Input Validation`);
    logger.info(`   - XSS Protection (Email Sanitization)`);
    logger.info(`   - CSRF Protection: ENABLED`);
    logger.info(`   - JWT Authentication: ENABLED`);
    logger.info(`🌐 CORS Origin: ${ORIGIN}`);
  });
})();
