@echo off
echo ========================================
echo Building TypeScript...
echo ========================================
cd /d "%~dp0..\.."
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build successful! Starting bot...
echo ========================================
node --expose-gc dist/src/index.js
pause
