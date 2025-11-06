/**
 * MySQL Setup Script - Help configure MySQL password
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MYSQL_PATH = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe';
const ENV_FILE = join(__dirname, '.env');

console.log('🔧 MySQL Setup Helper');
console.log('');
console.log('This script will help you configure MySQL password.');
console.log('');

async function main() {
  try {
    // Try to read current .env
    let envContent = '';
    try {
      envContent = readFileSync(ENV_FILE, 'utf-8');
    } catch (e) {
      console.log('⚠️  .env file not found, will create one.');
    }

    console.log('📝 Instructions:');
    console.log('');
    console.log('Option 1: Reset MySQL root password (if you forgot it)');
    console.log('   1. Stop MySQL service: net stop MySQL80');
    console.log('   2. Start MySQL in safe mode:');
    console.log('      "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe" --skip-grant-tables');
    console.log('   3. In another terminal, connect:');
    console.log('      "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe" -u root');
    console.log('   4. Run these commands:');
    console.log('      USE mysql;');
    console.log('      ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'your_new_password\';');
    console.log('      FLUSH PRIVILEGES;');
    console.log('   5. Restart MySQL service: net start MySQL80');
    console.log('');
    console.log('Option 2: Set password if MySQL allows root login without password');
    console.log('   Run this command in Command Prompt (as Administrator):');
    console.log(`   "${MYSQL_PATH}" -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_password';"`);
    console.log('');
    console.log('Option 3: Check if there\'s a password file');
    console.log('   Look for: C:\\Program Files\\MySQL\\MySQL Server 8.0\\data\\*.err');
    console.log('   This file might contain temporary password from installation');
    console.log('');
    console.log('After you set the password, update server/.env:');
    console.log('   DB_PASSWORD=your_password');
    console.log('');
    
    // Try to check if we can connect without password
    console.log('🔍 Testing connection without password...');
    try {
      const { stdout } = await execAsync(`"${MYSQL_PATH}" -u root -e "SELECT 1;" 2>&1`, { timeout: 5000 });
      if (stdout.includes('ERROR')) {
        console.log('❌ Cannot connect without password - MySQL requires a password.');
      } else {
        console.log('✅ Can connect without password! Setting a new password...');
        console.log('');
        console.log('To set a password, run this command:');
        console.log(`"${MYSQL_PATH}" -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'Luxcera2024!';"`);
        console.log('');
        console.log('Then update server/.env with: DB_PASSWORD=Luxcera2024!');
      }
    } catch (error) {
      console.log('❌ Cannot connect - MySQL requires a password.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
