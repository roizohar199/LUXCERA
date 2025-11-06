-- יצירת טבלת פרומו גיפט (מנגנון נפרד מ-Gift Cards)
CREATE TABLE IF NOT EXISTS promo_gifts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(128) NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'ILS',
  expires_at DATETIME NOT NULL,
  created_by INT NULL,
  max_uses INT NOT NULL DEFAULT 1,      -- כמה פעמים מותר לממש את זה (1 = חד פעמי)
  times_used INT NOT NULL DEFAULT 0,    -- כמה כבר מומש
  status ENUM('active','expired','disabled') NOT NULL DEFAULT 'active',
  note VARCHAR(255) NULL,
  INDEX (status),
  INDEX (token)
);

