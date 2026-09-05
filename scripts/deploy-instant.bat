@echo off
echo.
echo ============================================
echo   INSTANT DEPLOY - Commands hien trong 5s
echo ============================================
echo.
echo Yeu cau: Can GUILD_ID trong .env
echo.
echo Cach lay GUILD_ID:
echo   1. Mo Discord
echo   2. Right-click server cua ban
echo   3. Copy ID (bat Developer Mode trong Settings truoc)
echo   4. Them vao .env: GUILD_ID=your_id
echo.
echo ============================================
echo.

node scripts\deploy-all-commands.js

echo.
pause
