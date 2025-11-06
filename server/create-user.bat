@echo off
echo ============================================
echo Creating MySQL User: Keren
echo ============================================
echo.
echo This script will:
echo   1. Create the 'luxcera' database
echo   2. Create user 'Keren' with password 'Keren1981'
echo   3. Grant all privileges on 'luxcera' database
echo.
echo NOTE: You need to enter your MySQL ROOT password when prompted
echo.
pause

mysql -u root -p < create-keren-user.sql

if %errorlevel% equ 0 (
    echo.
    echo ✅ User 'Keren' created successfully!
    echo.
    echo You can now restart the server with:
    echo   pm2 restart luxcera-server --update-env
) else (
    echo.
    echo ❌ Error creating user. Please check:
    echo   1. MySQL is running
    echo   2. You entered the correct ROOT password
    echo   3. You have permissions to create users
)

pause
