@echo off
title Kill Port 3001
color 0E

echo.
echo ========================================
echo      KILLING PROCESS ON PORT 3001
echo ========================================
echo.

powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force"

echo.
echo [SUCCESS] Port 3001 is now free!
echo.
timeout /t 2 >nul
