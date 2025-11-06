@echo off
chcp 65001 >nul
echo ========================================
echo הגדרת סיסמת MySQL
echo ========================================
echo.
echo הסיסמה שתוגדר: Keren1981
echo.
echo יש לך שתי אפשרויות:
echo.
echo אפשרות 1 - דרך MySQL Command Line (מומלץ):
echo   1. פתח Command Prompt כמנהל מערכת
echo   2. עצור את MySQL: net stop MySQL80
echo   3. הפעל MySQL במצב בטוח בחלון נפרד:
echo      "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --skip-grant-tables
echo   4. בחלון חדש, הרץ:
echo      "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root
echo   5. בתוך MySQL, הרץ:
echo      USE mysql;
echo      ALTER USER 'root'@'localhost' IDENTIFIED BY 'Keren1981';
echo      FLUSH PRIVILEGES;
echo      exit;
echo   6. עצור את MySQL במצב בטוח (Ctrl+C) והפעל מחדש: net start MySQL80
echo.
echo אפשרות 2 - דרך MySQL Workbench:
echo   1. פתח MySQL Workbench
echo   2. אם יש לך חיבור קיים, התחבר איתו
echo   3. אם לא, נסה להתחבר עם הסיסמה הנוכחית שלך
echo   4. הרץ את השאילתה:
echo      ALTER USER 'root'@'localhost' IDENTIFIED BY 'Keren1981';
echo      FLUSH PRIVILEGES;
echo.
echo אחרי שהגדרת את הסיסמה, עדכן את server\.env:
echo DB_PASSWORD=Keren1981
echo.
pause
