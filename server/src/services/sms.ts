/**
 * SMS Service
 * 
 * שירות לשליחת SMS ללקוחות
 * דורש הגדרת שירות SMS חיצוני (Twilio, SMS Gateway, וכו')
 */

// TODO: הגדר את שירות ה-SMS הרצוי שלך
// אפשרויות:
// 1. Twilio - https://www.twilio.com/
// 2. SMS Gateway (שירות ישראלי)
// 3. WhatsApp Business API

export interface SMSConfig {
  service: 'twilio' | 'sms-gateway' | 'whatsapp' | 'none';
  apiKey?: string;
  apiSecret?: string;
  fromNumber?: string;
}

/**
 * פורמט מספר טלפון לשליחת SMS
 * ממיר מספר ישראלי לפורמט בינלאומי (972...)
 */
export function formatPhoneForSMS(phone: string): string {
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
 * שולח SMS ללקוח
 * 
 * @param phone - מספר הטלפון של הלקוח
 * @param message - הודעת ה-SMS
 * @returns Promise<boolean> - true אם נשלח בהצלחה
 */
export async function sendSMS(phone: string, message: string): Promise<boolean> {
  const smsService = process.env.SMS_SERVICE || 'none';
  
  if (smsService === 'none') {
    console.log(`📱 SMS service not configured. Would send to ${phone}: ${message}`);
    return false;
  }

  const formattedPhone = formatPhoneForSMS(phone);

  try {
    switch (smsService) {
      case 'twilio':
        return await sendViaTwilio(formattedPhone, message);
      case 'sms-gateway':
        return await sendViaSMSGateway(formattedPhone, message);
      case 'whatsapp':
        return await sendViaWhatsApp(formattedPhone, message);
      default:
        console.warn(`⚠️  Unknown SMS service: ${smsService}`);
        return false;
    }
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return false;
  }
}

/**
 * שליחה דרך Twilio
 * דורש: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */
async function sendViaTwilio(phone: string, message: string): Promise<boolean> {
  // TODO: הגדר Twilio
  // const accountSid = process.env.TWILIO_ACCOUNT_SID;
  // const authToken = process.env.TWILIO_AUTH_TOKEN;
  // const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
  // const client = require('twilio')(accountSid, authToken);
  // await client.messages.create({
  //   body: message,
  //   to: phone,
  //   from: fromNumber,
  // });
  
  console.log(`📱 [Twilio] Would send to ${phone}: ${message}`);
  return false;
}

/**
 * שליחה דרך SMS Gateway ישראלי
 * דורש: SMS_GATEWAY_API_KEY, SMS_GATEWAY_API_URL
 */
async function sendViaSMSGateway(phone: string, message: string): Promise<boolean> {
  // TODO: הגדר SMS Gateway
  // const apiKey = process.env.SMS_GATEWAY_API_KEY;
  // const apiUrl = process.env.SMS_GATEWAY_API_URL;
  
  // const response = await fetch(apiUrl, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${apiKey}`,
  //   },
  //   body: JSON.stringify({
  //     to: phone,
  //     message: message,
  //   }),
  // });
  
  console.log(`📱 [SMS Gateway] Would send to ${phone}: ${message}`);
  return false;
}

/**
 * שליחה דרך WhatsApp Business API
 * דורש: WHATSAPP_API_KEY, WHATSAPP_PHONE_NUMBER_ID
 */
async function sendViaWhatsApp(phone: string, message: string): Promise<boolean> {
  // TODO: הגדר WhatsApp Business API
  // const apiKey = process.env.WHATSAPP_API_KEY;
  // const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  // const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${apiKey}`,
  //   },
  //   body: JSON.stringify({
  //     messaging_product: 'whatsapp',
  //     to: phone,
  //     type: 'text',
  //     text: { body: message },
  //   }),
  // });
  
  console.log(`📱 [WhatsApp] Would send to ${phone}: ${message}`);
  return false;
}

