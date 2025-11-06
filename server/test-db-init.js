/**
 * Test Database Initialization Script
 * בודק את אתחול הדאטהבייס (יצירת טבלאות)
 */

import { initDatabase } from './src/db.ts';

console.log('========================================');
console.log('בדיקת אתחול דאטהבייס');
console.log('========================================');
console.log('');

async function testInit() {
  try {
    console.log('מאתחל את הדאטהבייס...');
    await initDatabase();
    console.log('');
    console.log('========================================');
    console.log('✓ הדאטהבייס אותחל בהצלחה!');
    console.log('========================================');
    console.log('');
    console.log('הטבלאות נוצרו:');
    console.log('  - products');
    console.log('  - admin_users');
    console.log('');
    console.log('משתמש אדמין נוצר:');
    console.log('  - Username: LUXCERA777');
    console.log('  - Password: Keren1981');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('✗ שגיאה באתחול הדאטהבייס');
    console.error('========================================');
    console.error('');
    console.error('פרטי השגיאה:');
    console.error(`  קוד שגיאה: ${error.code}`);
    console.error(`  הודעה: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error('');
    process.exit(1);
  } finally {
    // סיים את התהליך
    process.exit(0);
  }
}

testInit();
