@echo off
echo ========================================
echo  BUILD VIP MODULE + START BOT
echo ========================================
echo.

cd /d D:\projects\code

echo [1/3] Compiling TypeScript...
call npx tsc
if errorlevel 1 (
    echo.
    echo ❌ Build failed! Check errors above.
    pause
    exit /b 1
)

echo.
echo [2/3] Copying assets...
xcopy /E /I /Y assets dist\assets >nul 2>&1
xcopy /E /I /Y public dist\public >nul 2>&1
if not exist dist\data mkdir dist\data

echo.
echo [3/3] Starting bot...
echo.
node --expose-gc dist/src/index.js

pause
