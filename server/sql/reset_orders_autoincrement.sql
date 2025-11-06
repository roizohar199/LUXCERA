-- Reset AUTO_INCREMENT for orders table
-- זה יגרום להזמנה הבאה להתחיל מ-1
-- שים לב: זה לא משנה את המספרים של הזמנות קיימות, רק את המספר הבא

USE luxcera;

-- איפוס AUTO_INCREMENT ל-1
ALTER TABLE orders AUTO_INCREMENT = 1;

-- אם אתה רוצה לאפס לפי המספר הגבוה ביותר הקיים:
-- ALTER TABLE orders AUTO_INCREMENT = (SELECT IFNULL(MAX(id), 0) + 1 FROM orders);

