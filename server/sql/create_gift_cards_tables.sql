-- יצירת טבלת גיפט קארד
CREATE TABLE IF NOT EXISTS gift_cards (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  initial_amount DECIMAL(10,2) NOT NULL,
  balance DECIMAL(10,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'ILS',
  created_by INT NULL,
  assigned_to INT NULL,
  order_id INT NULL,
  status ENUM('active','used','expired','cancelled') NOT NULL DEFAULT 'active',
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  metadata JSON NULL,
  INDEX (assigned_to),
  INDEX (status)
);

-- לוג פעולות על גיפט קארד
CREATE TABLE IF NOT EXISTS gift_card_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  gift_card_id BIGINT NOT NULL,
  action ENUM('issued','assigned','redeemed','partial_redeemed','refunded','expired','cancelled','edited') NOT NULL,
  amount DECIMAL(10,2) NULL,
  balance_after DECIMAL(10,2) NULL,
  performed_by INT NULL,
  related_order_id INT NULL,
  note VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gift_card_logs_card
    FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id)
    ON DELETE CASCADE
);

