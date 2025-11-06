/**
 * Database Module - MySQL with mysql2
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'luxcera',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Validate MySQL configuration
if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD.trim() === '') {
  console.warn('⚠️  WARNING: DB_PASSWORD is empty. MySQL may require a password.');
  console.warn('   Please set DB_PASSWORD in your .env file or configure MySQL to allow password-less login.');
}

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize tables
export async function initDatabase() {
  try {
    // Try to create database if it doesn't exist
    // If user doesn't have CREATE DATABASE permission, try to use existing database
    try {
      const tempPool = mysql.createPool({
        ...dbConfig,
        database: undefined,
      });
      
      await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      await tempPool.end();
    } catch (dbError: any) {
      // If CREATE DATABASE fails, assume database exists or user doesn't have permission
      // Continue with table creation using the existing pool
      if (dbError.code !== 'ER_DB_CREATE_EXISTS' && !dbError.message.includes('CREATE')) {
        console.warn('Could not create database (may already exist or permission denied):', dbError.message);
      }
    }

    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        salePrice DECIMAL(10, 2),
        imageUrl VARCHAR(500) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'general',
        isActive TINYINT(1) NOT NULL DEFAULT 1,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_products_category (category),
        INDEX idx_products_active (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Users table (for regular customers)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Admin users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) NOT NULL UNIQUE,
        passwordHash VARCHAR(255) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        address VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20),
        notes TEXT,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'bit',
        gift_card_amount DECIMAL(10,2) DEFAULT 0,
        gift_card_code VARCHAR(64),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_orders_created_at (created_at),
        INDEX idx_orders_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    // Add gift_card columns if they don't exist (for existing databases)
    try {
      // Check if columns exist first
      const [columns] = await pool.query(`SHOW COLUMNS FROM orders LIKE 'gift_card_amount'`) as [any[], any];
      if (columns.length === 0) {
        await pool.query(`ALTER TABLE orders ADD COLUMN gift_card_amount DECIMAL(10,2) DEFAULT 0`);
      }
      
      const [columns2] = await pool.query(`SHOW COLUMNS FROM orders LIKE 'gift_card_code'`) as [any[], any];
      if (columns2.length === 0) {
        await pool.query(`ALTER TABLE orders ADD COLUMN gift_card_code VARCHAR(64)`);
      }
    } catch (err: any) {
      // Ignore errors - columns might already exist or table might not exist yet
      console.warn('Warning: Could not add gift_card columns:', err.message);
    }

    // Order items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        image_url VARCHAR(500),
        category VARCHAR(100),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_order_items_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Reset AUTO_INCREMENT for orders table if table is empty (for local testing)
    // זה יוודא שההזמנה הבאה תמיד תתחיל מ-1 אם אין הזמנות קיימות
    try {
      const [orderRows] = await pool.query('SELECT COUNT(*) as count FROM orders') as [any[], any];
      const orderCount = orderRows[0]?.count || 0;
      
      if (orderCount === 0) {
        // אם אין הזמנות, אפס את AUTO_INCREMENT ל-1
        await pool.query('ALTER TABLE orders AUTO_INCREMENT = 1');
        console.log('✅ Reset orders AUTO_INCREMENT to 1 (no orders found)');
      } else {
        // אם יש הזמנות, וודא ש-AUTO_INCREMENT מתחיל מהמספר הגבוה ביותר + 1
        const [maxRows] = await pool.query('SELECT MAX(id) as maxId FROM orders') as [any[], any];
        const maxId = maxRows[0]?.maxId || 0;
        await pool.query(`ALTER TABLE orders AUTO_INCREMENT = ${maxId + 1}`);
        console.log(`✅ Set orders AUTO_INCREMENT to ${maxId + 1} (based on max order ID)`);
      }
    } catch (error) {
      // אם יש שגיאה, רק נדפיס אזהרה - לא נעצור את ההתחלה
      console.warn('⚠️  Could not reset orders AUTO_INCREMENT:', error);
    }

    // Ensure admin user exists with correct credentials
    const bcrypt = await import('bcryptjs');
    const targetUsername = 'LUXCERA777';
    const targetPassword = 'Keren1981';
    
    // Check if target admin exists
    const [targetAdminRows] = await pool.query(
      'SELECT * FROM admin_users WHERE username = ?',
      [targetUsername]
    ) as [any[], any];
    
    if (targetAdminRows.length > 0) {
      // Update password if needed (in case it changed)
      const passwordHash = await bcrypt.default.hash(targetPassword, 10);
      await pool.query(
        'UPDATE admin_users SET passwordHash = ? WHERE username = ?',
        [passwordHash, targetUsername]
      );
    } else {
      // Check if old admin exists and update it
      const [oldAdminRows] = await pool.query(
        'SELECT * FROM admin_users WHERE username = ?',
        ['admin']
      ) as [any[], any];
      
      const passwordHash = await bcrypt.default.hash(targetPassword, 10);
      
      if (oldAdminRows.length > 0) {
        // Update old admin to new username and password
        await pool.query(
          'UPDATE admin_users SET username = ?, passwordHash = ? WHERE username = ?',
          [targetUsername, passwordHash, 'admin']
        );
      } else {
        // Create new admin user
        await pool.query(
          'INSERT INTO admin_users (username, passwordHash) VALUES (?, ?)',
          [targetUsername, passwordHash]
        );
      }
    }

    // Promo Gifts table (מנגנון נפרד מ-Gift Cards)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promo_gifts (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(128) NOT NULL UNIQUE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(8) NOT NULL DEFAULT 'ILS',
        expires_at DATETIME NOT NULL,
        created_by INT NULL,
        max_uses INT NOT NULL DEFAULT 1,
        times_used INT NOT NULL DEFAULT 0,
        status ENUM('active','expired','disabled') NOT NULL DEFAULT 'active',
        note VARCHAR(255) NULL,
        INDEX (status),
        INDEX (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Product operations
export const products = {
  getAll: async (activeOnly: boolean = false) => {
    const query = activeOnly
      ? 'SELECT * FROM products WHERE isActive = 1 ORDER BY createdAt DESC'
      : 'SELECT * FROM products ORDER BY createdAt DESC';
    const [rows] = await pool.query(query) as [any[], any];
    return rows;
  },

  getAllActive: async () => {
    return await products.getAll(true);
  },

  getById: async (id: number) => {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]) as [any[], any];
    return rows[0] || null;
  },

  getByCategory: async (category: string, activeOnly: boolean = true) => {
    const query = activeOnly
      ? 'SELECT * FROM products WHERE category = ? AND isActive = 1 ORDER BY createdAt DESC'
      : 'SELECT * FROM products WHERE category = ? ORDER BY createdAt DESC';
    const [rows] = await pool.query(query, [category]) as [any[], any];
    return rows;
  },

  create: async (product: {
    title: string;
    description?: string;
    price: number;
    salePrice?: number;
    imageUrl: string;
    category?: string;
    isActive?: boolean;
  }) => {
    const [result] = await pool.query(
      `INSERT INTO products (title, description, price, salePrice, imageUrl, category, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        product.title,
        product.description || null,
        product.price,
        product.salePrice || null,
        product.imageUrl,
        product.category || 'general',
        product.isActive !== false ? 1 : 0
      ]
    ) as [mysql.ResultSetHeader, any];
    
    return products.getById(result.insertId);
  },

  update: async (id: number, updates: {
    title?: string;
    description?: string;
    price?: number;
    salePrice?: number;
    imageUrl?: string;
    category?: string;
    isActive?: boolean;
  }) => {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.price !== undefined) {
      fields.push('price = ?');
      values.push(updates.price);
    }
    if (updates.salePrice !== undefined) {
      fields.push('salePrice = ?');
      values.push(updates.salePrice);
    }
    if (updates.imageUrl !== undefined) {
      fields.push('imageUrl = ?');
      values.push(updates.imageUrl);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.isActive !== undefined) {
      fields.push('isActive = ?');
      values.push(updates.isActive ? 1 : 0);
    }

    if (fields.length === 0) {
      return products.getById(id);
    }

    values.push(id);

    await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return products.getById(id);
  },

  delete: async (id: number) => {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]) as [mysql.ResultSetHeader, any];
    return result;
  },
};

// User operations (regular customers)
export const users = {
  findByEmail: async (email: string) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]) as [any[], any];
    return rows[0] || null;
  },

  create: async (email: string, fullName: string) => {
    const [result] = await pool.query(
      'INSERT INTO users (email, full_name) VALUES (?, ?)',
      [email.toLowerCase(), fullName]
    ) as [mysql.ResultSetHeader, any];
    return result.insertId;
  },
};

// Admin user operations
export const adminUsers = {
  findByUsername: async (username: string) => {
    // Case-insensitive search - נסה גם עם אותיות גדולות וקטנות
    const [rows] = await pool.query(
      'SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?)', 
      [username]
    ) as [any[], any];
    return rows[0] || null;
  },

  verifyPassword: async (password: string, hash: string) => {
    const bcrypt = await import('bcryptjs');
    return bcrypt.default.compare(password, hash);
  },
};

// Close pool on process exit
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

// Gift Cards helpers
export const giftCards = {
  async getByCode(code: string) {
    const [rows] = await pool.query('SELECT * FROM gift_cards WHERE code = ?', [code]) as [any[], any];
    return rows[0] || null;
  },

  async listActive() {
    const [rows] = await pool.query('SELECT * FROM gift_cards WHERE status = "active"') as [any[], any];
    return rows;
  },
};

export default pool;
