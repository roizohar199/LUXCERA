-- SQL script to create orders and order_items tables
-- This is optional - tables are created automatically via initDatabase()
-- Run this manually if you prefer to create tables separately

USE luxcera;

-- טבלת הזמנות
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_created_at (created_at),
  INDEX idx_orders_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- פריטים של הזמנה
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

