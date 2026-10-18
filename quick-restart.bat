@echo off
echo ========================================
echo  QUICK RESTART - VIP Module Update
echo ========================================
echo.

echo [1/3] Stopping bot...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Starting with ts-node (no build needed)...
echo.
cd /d D:\projects\code
start "Banh Cuon Bot" /min node --expose-gc -r ts-node/register src/index.ts

echo [3/3] Done! Bot is starting...
echo.
echo Bot window minimized. Check Discord in 10 seconds.
echo.
pause
