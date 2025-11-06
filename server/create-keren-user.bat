@echo off
chcp 65001 >nul
REM סקריפט ליצירת משתמש Keren ב-MySQL
REM יוצר משתמש Keren עם סיסמה Keren1981 והרשאות מלאות על דאטהבייס luxcera

set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
set SQL_FILE=%~dp0create-keren-user.sql

echo ========================================
echo יצירת משתמש Keren ב-MySQL
echo ========================================
echo.
echo המטרה: יצירת משתמש MySQL בשם Keren עם סיסמה Keren1981
echo.

REM בדיקה אם MySQL קיים
if not exist %MYSQL_PATH% (
    echo [שגיאה] MySQL לא נמצא בנתיב: %MYSQL_PATH%
    echo אנא עדכן את הנתיב בסקריפט או התקן MySQL
    pause
    exit /b 1
)

REM בדיקה אם קובץ SQL קיים
if not exist %SQL_FILE% (
    echo [שגיאה] קובץ SQL לא נמצא: %SQL_FILE%
    pause
    exit /b 1
)

echo כדי ליצור משתמש חדש, צריך להתחבר עם משתמש שיש לו הרשאות.
echo.
echo בחר את משתמש MySQL שיש לו הרשאות ליצירת משתמשים:
echo.
echo   1. root (ברירת מחדל - מומלץ)
echo   2. משתמש אחר
echo.
set /p choice="הקלד בחירה (1/2) או Enter ל-root: "

if "%choice%"=="2" (
    set /p MYSQL_USER="הקלד שם משתמש MySQL עם הרשאות: "
    echo.
    echo מתחבר עם משתמש %MYSQL_USER%...
    echo [שים לב: תתבקש להכניס את סיסמת המשתמש %MYSQL_USER%]
    echo.
    %MYSQL_PATH% -u %MYSQL_USER% -p < %SQL_FILE%
) else (
    set MYSQL_USER=root
    echo.
    echo מתחבר עם root...
    echo [שים לב: תתבקש להכניס את סיסמת root]
    echo.
    %MYSQL_PATH% -u root -p < %SQL_FILE%
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✓ המשתמש Keren נוצר בהצלחה!
    echo ========================================
    echo.
    echo פרטי ההתחברות:
    echo   משתמש: Keren
    echo   סיסמה: Keren1981
    echo   דאטהבייס: luxcera
    echo.
    echo עכשיו תוכל להתחבר עם:
    echo   mysql -u Keren -p
    echo.
) else (
    echo.
    echo ========================================
    echo ✗ שגיאה ביצירת המשתמש
    echo ========================================
    echo.
    echo אפשרויות:
    echo   1. ודא ש-MySQL רץ: net start MySQL80
    echo   2. ודא שהסיסמה נכונה
    echo   3. ודא שלמשתמש יש הרשאות ליצירת משתמשים
    echo.
)

pause
