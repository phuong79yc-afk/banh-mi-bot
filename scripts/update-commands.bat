@echo off
title Update Discord Commands
color 0B

echo.
echo ========================================
echo   UPDATE DISCORD COMMANDS WORKFLOW
echo ========================================
echo.
echo This will:
echo 1. Build TypeScript
echo 2. Deploy commands to Discord
echo 3. Restart bot
echo.
pause

cd /d "C:\projects\code"

echo.
echo [1/3] 📦 Building TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed! Fix errors and try again.
    pause
    exit /b 1
)
echo ✅ Build successful!

echo.
echo [2/3] 🚀 Deploying commands to Discord...
node dist/deploy-commands.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Deploy failed!
    pause
    exit /b 1
)
echo ✅ Commands deployed!

echo.
echo [3/3] 🔄 Restarting bot...

REM Stop bot
taskkill /F /IM node.exe >nul 2>&1
powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1
timeout /t 2 >nul

REM Start bot
wscript scripts\start-bot-hidden.vbs
timeout /t 3 >nul

echo ✅ Bot restarted!

echo.
echo ========================================
echo   ✅ UPDATE COMPLETE!
echo ========================================
echo.
echo Your commands are now updated on Discord!
echo Bot is running with the new code.
echo.
echo Note: Discord may take up to 1 hour to show
echo global commands in all servers.
echo.
pause
