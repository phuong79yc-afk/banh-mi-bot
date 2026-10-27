@echo off
chcp 65001 >nul
cd /d "%~dp0..\.."
echo.
echo ================================
echo 🚀 AUTO DEPLOY ^& RESTART BOT
echo ================================
echo.

echo [1/5] 📦 Building TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)
echo ✅ Build successful!
echo.

echo [2/5] 🔄 Deploying commands to Discord...
node dist/src/deploy-commands.js
if %errorlevel% neq 0 (
    echo ❌ Deploy failed!
    pause
    exit /b 1
)
echo ✅ Commands deployed!
echo.

echo [3/5] 🛑 Stopping bot...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✅ Bot stopped!
echo.

echo [4/5] 🚀 Starting bot...
start "" npm start
timeout /t 3 /nobreak >nul
echo ✅ Bot started!
echo.

echo [5/5] ✅ Checking status...
tasklist | findstr node.exe >nul
if %errorlevel% equ 0 (
    echo ✅ Bot is running!
) else (
    echo ⚠️ Bot may not be running, check console
)

echo.
echo ================================
echo ✅ DONE! Bot deployed ^& running
echo ================================
echo.
echo Press any key to exit...
pause >nul
