/**
 * Test Database Connection Script
 * בודק את החיבור של השרת ל-MySQL
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'luxcera',
};

console.log('========================================');
console.log('בדיקת חיבור MySQL');
console.log('========================================');
console.log('');
console.log('הגדרות חיבור:');
console.log(`  Host: ${dbConfig.host}`);
console.log(`  Port: ${dbConfig.port}`);
console.log(`  User: ${dbConfig.user}`);
console.log(`  Database: ${dbConfig.database}`);
console.log(`  Password: ${dbConfig.password ? '***מוגדר***' : 'לא מוגדר'}`);
console.log('');

async function testConnection() {
  let connection;
  
  try {
    console.log('מנסה להתחבר ל-MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ חיבור הצליח!');
    console.log('');
    
    // בדיקת גרסת MySQL
    const [versionRows] = await connection.query('SELECT VERSION() as version');
    console.log(`✓ גרסת MySQL: ${versionRows[0].version}`);
    
    // בדיקת דאטהבייס נוכחי
    const [dbRows] = await connection.query('SELECT DATABASE() as db');
    console.log(`✓ דאטהבייס פעיל: ${dbRows[0].db || 'ללא'}`);
    
    // בדיקת טבלאות
    const [tableRows] = await connection.query('SHOW TABLES');
    console.log(`✓ מספר טבלאות: ${tableRows.length}`);
    
    if (tableRows.length > 0) {
      console.log('  טבלאות קיימות:');
      tableRows.forEach((row, index) => {
        const tableName = Object.values(row)[0];
        console.log(`    ${index + 1}. ${tableName}`);
      });
    }
    
    console.log('');
    console.log('========================================');
    console.log('✓ כל הבדיקות הצליחו!');
    console.log('========================================');
    
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('✗ שגיאה בחיבור ל-MySQL');
    console.error('========================================');
    console.error('');
    console.error('פרטי השגיאה:');
    console.error(`  קוד שגיאה: ${error.code}`);
    console.error(`  הודעה: ${error.message}`);
    console.error('');
    console.error('אפשרויות לפתרון:');
    console.error('  1. ודא ש-MySQL רץ: net start MySQL80');
    console.error('  2. ודא שהסיסמה נכונה בקובץ .env');
    console.error('  3. ודא ששם המשתמש נכון בקובץ .env');
    console.error('  4. ודא שהדאטהבייס קיים');
    console.error('');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();





