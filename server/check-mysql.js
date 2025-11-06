/**
 * MySQL Connection Test Script
 * Run this to test your MySQL connection and find the correct password
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '.env') });

async function testConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    connectTimeout: 5000,
  };

  console.log('🔍 Testing MySQL connection...');
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Password: ${config.password ? '***' : '(empty)'}`);
  console.log('');

  try {
    // Try to connect without database first
    const connection = await mysql.createConnection(config);
    console.log('✅ Connection successful!');
    await connection.end();
    return true;
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('❌ Access denied - MySQL requires a password');
      console.log('');
      console.log('📝 To fix this:');
      console.log('   1. Find your MySQL root password');
      console.log('   2. Edit server/.env and set DB_PASSWORD=your_password');
      console.log('');
      console.log('   If you forgot your password:');
      console.log('   - Check your MySQL installation documentation');
      console.log('   - If using XAMPP/WAMP, default password is usually empty');
      console.log('   - Reset password: https://dev.mysql.com/doc/refman/8.0/en/resetting-permissions.html');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - MySQL is not running');
      console.log('');
      console.log('📝 To fix this:');
      console.log('   - Start MySQL service');
      console.log('   - If using XAMPP: Start MySQL from XAMPP Control Panel');
      console.log('   - If using WAMP: Make sure WAMP is running (green icon)');
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
    return false;
  }
}

testConnection().then((success) => {
  if (success) {
    console.log('');
    console.log('🎉 MySQL is ready! You can now start your server.');
    process.exit(0);
  } else {
    process.exit(1);
  }
});
