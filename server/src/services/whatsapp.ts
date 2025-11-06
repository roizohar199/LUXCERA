/**
 * WhatsApp Business API Service
 * 
 * שירות לשליחת הודעות WhatsApp ללקוחות דרך WhatsApp Business API
 * דורש הגדרת WhatsApp Business API דרך Meta Business Manager
 */

import 'dotenv/config';

// בדיקה אוטומטית של ההגדרות בעת טעינת המודול
(function checkWhatsAppConfig() {
  const apiKey = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const smsService = process.env.SMS_SERVICE || 'none';
  
  console.log('\n🔍 [WhatsApp Service] Checking configuration on module load...');
  console.log(`   SMS_SERVICE: ${smsService}`);
  console.log(`   WHATSAPP_API_KEY/ACCESS_TOKEN: ${apiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   WHATSAPP_PHONE_NUMBER_ID: ${phoneNumberId ? '✅ Set' : '❌ Missing'}`);
  console.log(`   WHATSAPP_TEMPLATE_NAME: ${process.env.WHATSAPP_TEMPLATE_NAME || 'order_confirmation (default)'}`);
  
  if (smsService === 'whatsapp' && (!apiKey || !phoneNumberId)) {
    console.warn('⚠️  [WhatsApp Service] SMS_SERVICE is set to "whatsapp" but credentials are missing!');
    console.warn('⚠️  [WhatsApp Service] WhatsApp messages will not be sent until credentials are configured.');
  } else if (smsService === 'whatsapp' && apiKey && phoneNumberId) {
    console.log('✅ [WhatsApp Service] Configuration looks good!');
  } else if (smsService !== 'whatsapp') {
    console.log(`ℹ️  [WhatsApp Service] SMS_SERVICE is "${smsService}" - WhatsApp service is not active.`);
  }
  console.log('');
})();

export interface WhatsAppConfig {
  apiKey: string;
  phoneNumberId: string;
  templateName?: string;
}

export interface WhatsAppMessageOptions {
  phone: string;
  message: string;
  templateName?: string;
  templateParams?: string[]; // פרמטרים לתבנית (אם יש)
}

/**
 * פורמט מספר טלפון ל-WhatsApp
 * WhatsApp צריך מספר בפורמט בינלאומי ללא סימן +
 * @param phone - מספר טלפון (ישראל: 05x-xxxxxxx או 972-5x-xxxxxxx)
 * @returns מספר בפורמט 972XXXXXXXXX
 */
export function formatPhoneForWhatsApp(phone: string): string {
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

/**
 * שולח הודעת WhatsApp דרך WhatsApp Business API
 * 
 * @param phone - מספר הטלפון של הלקוח
 * @param message - הודעת הטקסט (לשימוש בהודעות טקסט רגילות)
 * @param options - אפשרויות נוספות (תבנית, פרמטרים, וכו')
 * @returns Promise<{ success: boolean; messageId?: string; error?: any }>
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  options?: {
    templateName?: string;
    templateParams?: { name: string; orderId: string; amount: string };
    useTemplate?: boolean;
  }
): Promise<{ success: boolean; messageId?: string; error?: any }> {
  const apiKey = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const defaultTemplateName = process.env.WHATSAPP_TEMPLATE_NAME || 'order_confirmation';
  
  console.log(`📱 [WhatsApp] Checking credentials... API Key: ${apiKey ? '✅ Set' : '❌ Missing'}, Phone Number ID: ${phoneNumberId ? '✅ Set' : '❌ Missing'}`);
  
  if (!apiKey || !phoneNumberId) {
    const missing = [];
    if (!apiKey) missing.push('WHATSAPP_API_KEY or WHATSAPP_ACCESS_TOKEN');
    if (!phoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID');
    console.warn(`⚠️  WhatsApp API credentials missing: ${missing.join(', ')}. Message not sent.`);
    console.warn(`⚠️  Please check your .env file and ensure these variables are set.`);
    return { success: false, error: { message: `Missing credentials: ${missing.join(', ')}` } };
  }

  try {
    // פורמט מספר טלפון
    const whatsappPhone = formatPhoneForWhatsApp(phone);
    
    // החלטה האם להשתמש בתבנית או הודעת טקסט רגילה
    const useTemplate = options?.useTemplate !== false && (options?.templateName || defaultTemplateName) !== 'none';
    const templateName = options?.templateName || defaultTemplateName;
    
    console.log(`📱 [WhatsApp] useTemplate: ${useTemplate}, templateName: ${templateName}, hasTemplateParams: ${!!options?.templateParams}`);
    
    let requestBody: any;
    
    if (useTemplate && templateName && options?.templateParams) {
      // שימוש בתבנית הודעה (Message Template)
      // התבנית צריכה להיות מאושרת מראש ב-WhatsApp Business Manager
      requestBody = {
        messaging_product: 'whatsapp',
        to: whatsappPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'he' }, // עברית
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: options.templateParams.name }, // שם הלקוח
                { type: 'text', text: options.templateParams.orderId }, // מספר הזמנה
                { type: 'text', text: options.templateParams.amount }, // סכום
              ],
            },
          ],
        },
      };
    } else {
      // ניסיון לשלוח הודעת טקסט רגילה
      // יעבוד רק אם הלקוח התחיל שיחה תוך 24 שעות
      requestBody = {
        messaging_product: 'whatsapp',
        to: whatsappPhone,
        type: 'text',
        text: { body: message },
      };
    }
    
    console.log(`📱 [WhatsApp] Sending request to WhatsApp API...`);
    console.log(`📱 [WhatsApp] URL: https://graph.facebook.com/v18.0/${phoneNumberId}/messages`);
    console.log(`📱 [WhatsApp] Request body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`, // שימוש בטוקן המלא
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log(`📱 [WhatsApp] Response status: ${response.status} ${response.statusText}`);
    
    const responseData = await response.json();
    console.log(`📱 [WhatsApp] Response data:`, JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      const messageId = responseData.messages?.[0]?.id;
      console.log(`✅ WhatsApp message sent successfully to ${phone} (${whatsappPhone}) - Message ID: ${messageId}`);
      return { success: true, messageId };
    } else {
      // טיפול בשגיאות נפוצות
      const errorCode = responseData.error?.code;
      const errorMessage = responseData.error?.message;
      
      // אם נכשל עם תבנית, ננסה לשלוח הודעת טקסט רגילה
      // שגיאה 132000 = "Message template not found"
      // שגיאה 132001 = "Template name does not exist in the translation"
      if (useTemplate && (errorCode === 132000 || errorCode === 132001)) {
        console.log(`\n⚠️  [WhatsApp] Template "${templateName}" failed (error code: ${errorCode})`);
        console.log(`⚠️  [WhatsApp] Template error message: ${errorMessage}`);
        console.log(`⚠️  [WhatsApp] Retrying with plain text message (no template)...`);
        console.log(`⚠️  [WhatsApp] Note: Plain text messages only work within 24 hours of customer interaction.`);
        
        const textResult = await sendWhatsAppMessage(phone, message, {
          useTemplate: false, // נסה בלי תבנית
        });
        
        if (textResult.success) {
          console.log(`✅ [WhatsApp] Plain text message sent successfully as fallback!`);
        } else {
          console.error(`❌ [WhatsApp] Plain text message also failed. Error:`, textResult.error?.errorMessage || textResult.error?.message);
          console.error(`❌ [WhatsApp] This might be because:`);
          console.error(`   1. More than 24 hours passed since customer last messaged you`);
          console.error(`   2. Customer phone number is not valid or not registered on WhatsApp`);
          console.error(`   3. WhatsApp API credentials are incorrect`);
        }
        
        return textResult;
      }
      
      // אם נכשל עם הודעת טקסט, ננסה עם תבנית (אם לא ניסינו כבר)
      if (!useTemplate && errorCode === 131047) {
        // שגיאה 131047 = "Message failed to send because more than 24 hours have passed"
        console.log(`⚠️  WhatsApp text message failed (24h window expired). Consider using a message template.`);
      }
      
      const error = {
        status: response.status,
        statusText: response.statusText,
        error: responseData.error,
        errorCode,
        errorMessage,
        errorSubcode: responseData.error?.error_subcode,
        errorType: responseData.error?.type,
      };
      
      console.error('❌ WhatsApp API error:', {
        ...error,
        phone: whatsappPhone,
        phoneNumberId,
        usedTemplate: useTemplate ? templateName : 'none',
        requestBody: JSON.stringify(requestBody, null, 2),
      });
      
      return { success: false, error };
    }
  } catch (networkError: any) {
    const error = {
      message: networkError.message,
      stack: networkError.stack,
    };
    
    console.error('❌ WhatsApp API network error:', error);
    return { success: false, error };
  }
}

/**
 * שולח הודעת אישור הזמנה ללקוח
 * 
 * @param phone - מספר הטלפון של הלקוח
 * @param fullName - שם מלא של הלקוח
 * @param orderId - מספר הזמנה
 * @param total - סכום כולל
 * @returns Promise<{ success: boolean; messageId?: string; error?: any }>
 */
export async function sendOrderConfirmation(
  phone: string,
  fullName: string,
  orderId: number,
  total: number
): Promise<{ success: boolean; messageId?: string; error?: any }> {
  console.log(`📱 [WhatsApp] Preparing order confirmation for ${fullName} (${phone}) - Order #${orderId}`);
  
  const message = `שלום ${fullName}, הזמנתך #${orderId} התקבלה! סכום: ₪${total.toFixed(2)}. אנא שלח העברה בביט ל-0546998603 וצילום אישור בוואטסאפ. LUXCERA`;
  
  const templateParams = {
    name: fullName,
    orderId: `#${orderId}`,
    amount: `₪${total.toFixed(2)}`,
  };
  
  // בדיקה אם יש תבנית מוגדרת
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'order_confirmation';
  const useTemplate = templateName !== 'none';
  
  console.log(`📱 [WhatsApp] Template name: ${templateName}, Use template: ${useTemplate}`);
  
  return await sendWhatsAppMessage(phone, message, {
    templateParams,
    templateName: useTemplate ? templateName : undefined,
    useTemplate, // נסה להשתמש בתבנית אם יש
  });
}

/**
 * בודק אם שירות WhatsApp מוגדר
 * 
 * @returns boolean - true אם שירות WhatsApp מוגדר
 */
export function isWhatsAppConfigured(): boolean {
  const apiKey = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return !!(apiKey && phoneNumberId);
}

