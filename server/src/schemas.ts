/**
 * Zod validation schemas for API endpoints
 */

import { z } from 'zod';

/**
 * Contact form schema - מחמיר עם ולידציה מלאה
 */
export const ContactSchema = z.object({
  fullName: z.string()
    .min(2, 'שם מלא חובה ומינ׳ 2 תווים')
    .max(100, 'שם יכול להכיל עד 100 תווים')
    .trim(),
  email: z.string()
    .email('אימייל לא תקין')
    .or(z.literal(''))
    .optional()
    .transform(val => (val === '' || !val) ? undefined : val),
  phone: z.string()
    .min(8, 'טלפון חייב להכיל לפחות 8 ספרות')
    .or(z.literal(''))
    .optional()
    .transform(val => (val === '' || !val) ? undefined : val),
  category: z.enum(['נרות', 'גבס', 'חרסינה', 'אפוקסי'], {
    required_error: 'יש לבחור קטגוריה',
    invalid_type_error: 'קטגוריה לא תקינה'
  }),
  color: z.string().max(50, 'צבע יכול להכיל עד 50 תווים').optional().default(''),
  scent: z.string().max(50, 'ריח יכול להכיל עד 50 תווים').optional().default(''),
  qty: z.coerce.number()
    .int('כמות חייבת להיות מספר שלם')
    .min(1, 'כמות חייבת להיות 1 ומעלה')
    .max(1000, 'כמות מקסימלית היא 1000'),
  message: z.string()
    .min(3, 'הודעה חובה ומינ׳ 3 תווים')
    .max(2000, 'הודעה יכולה להכיל עד 2000 תווים')
    .trim(),
}).refine(
  (data) => {
    // לפחות אחד מ-email או phone חייב להיות מלא
    const hasEmail = data.email && typeof data.email === 'string' && data.email.trim().length > 0;
    const hasPhone = data.phone && typeof data.phone === 'string' && data.phone.trim().length > 0;
    return hasEmail || hasPhone;
  },
  {
    message: 'חובה למלא אימייל או טלפון אחד לפחות',
    path: ['email'] // לשיוך הודעה לשדה email
  }
);

/**
 * Register schema
 */
export const RegisterSchema = z.object({
  fullName: z.string()
    .min(2, 'שם מלא חובה ומינ׳ 2 תווים')
    .max(100, 'שם יכול להכיל עד 100 תווים')
    .trim(),
  email: z.string()
    .email('כתובת אימייל לא תקינה')
    .trim()
    .toLowerCase(),
});

/**
 * Custom Creation form schema - יצירה בהתאמה אישית
 */
export const CustomCreationSchema = z.object({
  fullName: z.string()
    .min(2, 'שם מלא חובה ומינ׳ 2 תווים')
    .max(100, 'שם יכול להכיל עד 100 תווים')
    .trim(),
  contact: z.string()
    .min(3, 'ווטסאפ או אימייל חובה ומינ׳ 3 תווים')
    .max(255, 'אורך מקסימלי 255 תווים')
    .trim(),
  purpose: z.string().max(50, 'אורך מקסימלי 50 תווים').optional().default(''),
  dimensions: z.string().max(200, 'אורך מקסימלי 200 תווים').optional().default(''),
  style: z.string().max(50, 'אורך מקסימלי 50 תווים').optional().default(''),
  budget: z.string().max(50, 'אורך מקסימלי 50 תווים').optional().default(''),
  colorPalette: z.string().max(200, 'אורך מקסימלי 200 תווים').optional().default(''),
  materials: z.string().max(200, 'אורך מקסימלי 200 תווים').optional().default(''),
  notes: z.string().max(2000, 'הערות יכולות להכיל עד 2000 תווים').optional().default(''),
  filesCount: z.coerce.number().int().min(0).max(20, 'מקסימום 20 קבצים').optional().default(0),
});

// Type exports for TypeScript
export type ContactInput = z.infer<typeof ContactSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CustomCreationInput = z.infer<typeof CustomCreationSchema>;

