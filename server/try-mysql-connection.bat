@echo off
echo ============================================
echo Testing MySQL Connection Methods
echo ============================================
echo.

echo Attempting to connect without password...
mysql -u root -e "SELECT 'Connection successful!' AS status;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Success! Root has no password.
    echo Running SQL script...
    mysql -u root < create-keren-user.sql
    if %errorlevel% equ 0 (
        echo ✅ User 'Keren' created successfully!
        echo.
        echo Restart the server with:
        echo   pm2 restart luxcera-server --update-env
    )
    goto :end
)

echo.
echo Attempting with common passwords...
for %%p in ("", "root", "admin", "password", "123456", "Keren1981") do (
    echo Trying password: %%p
    mysql -u root -p%%~p -e "SELECT 'Success!' AS status;" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Found working password: %%~p
        echo Running SQL script...
        mysql -u root -p%%~p < create-keren-user.sql
        if %errorlevel% equ 0 (
            echo ✅ User 'Keren' created successfully!
            echo.
            echo Restart the server with:
            echo   pm2 restart luxcera-server --update-env
        )
        goto :end
    )
)

echo.
echo ❌ Could not connect. Please:
echo   1. Find your MySQL root password
echo   2. Or reset it using reset-mysql-password.bat
echo   3. Or create the user manually in MySQL Workbench

:end
pause
