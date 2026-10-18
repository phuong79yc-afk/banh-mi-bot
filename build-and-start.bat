@echo off
echo ========================================
echo Building TypeScript...
echo ========================================
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
