-- MySQL Setup Script for LUXCERA
-- Run this script in MySQL Workbench or MySQL Command Line as root user

-- 1. Create database
CREATE DATABASE IF NOT EXISTS luxcera CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Create user (drop first if exists to avoid errors)
DROP USER IF EXISTS 'Keren'@'localhost';
CREATE USER 'Keren'@'localhost' IDENTIFIED BY 'Keren1981';

-- 3. Grant all privileges on luxcera database
GRANT ALL PRIVILEGES ON luxcera.* TO 'Keren'@'localhost';

-- 4. Apply changes
FLUSH PRIVILEGES;

-- 5. Verify (optional - run separately)
-- SHOW DATABASES;
-- SELECT user, host FROM mysql.user WHERE user = 'Keren';
