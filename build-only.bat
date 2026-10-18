@echo off
echo ========================================
echo Building TypeScript...
echo ========================================
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed! Check errors above.
) else (
    echo Build successful!
)
pause
