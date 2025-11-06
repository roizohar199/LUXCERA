/**
 * סקריפט בדיקה לשליחת הודעת WhatsApp
 * 
 * הרצה: node server/test-whatsapp.js
 * 
 * דורש הגדרת משתני סביבה ב-.env:
 * - SMS_SERVICE=whatsapp
 * - WHATSAPP_API_KEY או WHATSAPP_ACCESS_TOKEN
 * - WHATSAPP_PHONE_NUMBER_ID
 * - WHATSAPP_TEMPLATE_NAME (אופציונלי)
 */

import 'dotenv/config';
import { sendOrderConfirmation, formatPhoneForWhatsApp, isWhatsAppConfigured } from './src/services/whatsapp.js';

async function testWhatsApp() {
  console.log('\n🧪 ========== WhatsApp API Test ==========\n');
  
  // בדיקת הגדרות
  console.log('🔍 Checking configuration...');
  console.log(`   SMS_SERVICE: ${process.env.SMS_SERVICE || 'none'}`);
  console.log(`   WHATSAPP_API_KEY: ${process.env.WHATSAPP_API_KEY ? '✅ Set (' + process.env.WHATSAPP_API_KEY.substring(0, 10) + '...)' : '❌ Missing'}`);
  console.log(`   WHATSAPP_ACCESS_TOKEN: ${process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Set (' + process.env.WHATSAPP_ACCESS_TOKEN.substring(0, 10) + '...)' : '❌ Missing'}`);
  console.log(`   WHATSAPP_PHONE_NUMBER_ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID || '❌ Missing'}`);
  console.log(`   WHATSAPP_TEMPLATE_NAME: ${process.env.WHATSAPP_TEMPLATE_NAME || 'order_confirmation (default)'}`);
  console.log('');
  
  const isConfigured = isWhatsAppConfigured();
  console.log(`   WhatsApp configured: ${isConfigured ? '✅ Yes' : '❌ No'}\n`);
  
  if (!isConfigured) {
    console.error('❌ WhatsApp is not configured properly. Please check your .env file.');
    console.error('   Required: SMS_SERVICE=whatsapp, WHATSAPP_API_KEY (or WHATSAPP_ACCESS_TOKEN), WHATSAPP_PHONE_NUMBER_ID');
    process.exit(1);
  }
  
  // פרטי בדיקה - ניתן לשנות כאן
  const testPhone = process.argv[2] || '0507666526'; // מספר טלפון לבדיקה
  const testName = process.argv[3] || 'רועי בדיקה';
  const testOrderId = parseInt(process.argv[4]) || 999;
  const testTotal = parseFloat(process.argv[5]) || 100.50;
  
  console.log('📱 Test parameters:');
  console.log(`   Phone: ${testPhone}`);
  console.log(`   Formatted: ${formatPhoneForWhatsApp(testPhone)}`);
  console.log(`   Name: ${testName}`);
  console.log(`   Order ID: ${testOrderId}`);
  console.log(`   Total: ₪${testTotal.toFixed(2)}\n`);
  
  console.log('📤 Sending test message...\n');
  
  try {
    const result = await sendOrderConfirmation(testPhone, testName, testOrderId, testTotal);
    
    if (result.success) {
      console.log('\n✅ SUCCESS! Message sent successfully!');
      console.log(`   Message ID: ${result.messageId || 'N/A'}`);
      console.log(`   Check WhatsApp on phone: ${testPhone}`);
    } else {
      console.log('\n❌ FAILED! Message not sent.');
      console.log('   Error details:');
      console.log(JSON.stringify(result.error, null, 2));
    }
  } catch (error) {
    console.error('\n❌ ERROR! Exception occurred:');
    console.error(error);
  }
  
  console.log('\n🧪 ========== Test Complete ==========\n');
}

// הרצת הבדיקה
testWhatsApp().catch(console.error);

