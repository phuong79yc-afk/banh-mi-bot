@echo off
title Stop Discord Bot
color 0E

echo.
echo ========================================
echo      STOPPING DISCORD BOT
echo ========================================
echo.

REM Kill all node processes running npm start
taskkill /F /FI "WINDOWTITLE eq npm*" /T >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

REM Kill process on port 3001 if still occupied
powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1

echo [SUCCESS] Bot stopped!
echo All Node.js processes terminated.
echo Port 3001 freed.
echo.
timeout /t 3 >nul
