@echo off
echo.
echo ============================================
echo   GLOBAL DEPLOY - Commands hien sau 1 gio
echo ============================================
echo.
echo WARNING: Commands se mat ~1 gio de hien!
echo.
echo Neu muon instant (5 giay):
echo   - Chay deploy-instant.bat
echo   - Can GUILD_ID trong .env
echo.
echo ============================================
echo.

REM Temporarily remove GUILD_ID for global deploy
set GUILD_ID=
node scripts\deploy-all-commands.js

echo.
pause
