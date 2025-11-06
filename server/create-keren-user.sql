CREATE DATABASE IF NOT EXISTS luxcera CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'Keren'@'localhost';
CREATE USER 'Keren'@'localhost' IDENTIFIED BY 'Keren1981';
GRANT ALL PRIVILEGES ON luxcera.* TO 'Keren'@'localhost';
FLUSH PRIVILEGES;
