@echo off
echo.
echo ==========================================
echo   AUTO REBUILD TRIGGERED
echo ==========================================
echo.

echo [1/3] Building...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed!
    exit /b 1
)

echo.
echo [2/3] Deploying...
call node dist/deploy-commands.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Deploy failed!
    exit /b 1
)

echo.
echo [3/3] Restarting bot...
call .\scripts\restart-bot.bat

echo.
echo ✅ Rebuild complete!
echo.
