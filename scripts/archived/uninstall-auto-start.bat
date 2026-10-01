@echo off
title Remove Auto-Start Discord Bot
color 0C

echo.
echo ========================================
echo   REMOVE AUTO-START DISCORD BOT
echo ========================================
echo.
echo This will remove the bot from Windows Startup
echo.
pause

REM Get startup folder path
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

REM Delete VBS script
if exist "%STARTUP%\DiscordBot.vbs" (
    del "%STARTUP%\DiscordBot.vbs"
    echo.
    echo [SUCCESS] Auto-start removed!
    echo The bot will no longer start automatically.
) else (
    echo.
    echo [INFO] Auto-start was not installed.
)

echo.
pause
