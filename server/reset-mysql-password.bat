@echo off
echo ========================================
echo MySQL Password Reset Script
echo ========================================
echo.
echo This script will reset MySQL root password to: Keren1981
echo.
echo IMPORTANT: You must run this as Administrator!
echo.
pause

echo.
echo [1/5] Stopping MySQL service...
net stop MySQL80
if errorlevel 1 (
    echo ERROR: Failed to stop MySQL. Make sure you're running as Administrator!
    pause
    exit /b 1
)

echo.
echo [2/5] Starting MySQL in safe mode (no password required)...
start /B "MySQL Safe Mode" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --skip-grant-tables --console
timeout /t 3 /nobreak >nul

echo.
echo [3/5] Setting new password...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'Keren1981'; FLUSH PRIVILEGES;" 2>nul
if errorlevel 1 (
    echo ERROR: Failed to set password. Trying alternative method...
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root mysql -e "UPDATE user SET authentication_string=PASSWORD('Keren1981') WHERE User='root'; FLUSH PRIVILEGES;" 2>nul
)

echo.
echo [4/5] Stopping MySQL safe mode...
taskkill /F /FI "WINDOWTITLE eq MySQL Safe Mode*" /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo [5/5] Starting MySQL service...
net start MySQL80

echo.
echo ========================================
echo Done! Testing connection...
echo ========================================
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pKeren1981 -e "SELECT 'Password set successfully!' AS Status;" 2>nul
if errorlevel 1 (
    echo WARNING: Could not verify password. Please test manually.
) else (
    echo.
    echo SUCCESS! MySQL password is now: Keren1981
)

echo.
echo Remember to update server\.env with:
echo DB_PASSWORD=Keren1981
echo.
pause
