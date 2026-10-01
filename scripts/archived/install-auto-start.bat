@echo off
title Setup Auto-Start Discord Bot
color 0A

echo.
echo ========================================
echo   AUTO-START DISCORD BOT INSTALLER
echo ========================================
echo.
echo This will add the bot to Windows Startup
echo Bot will start automatically when you login
echo.
pause

REM Get startup folder path
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

REM Create VBS script to run bot silently
echo Set WshShell = CreateObject("WScript.Shell") > "%STARTUP%\DiscordBot.vbs"
echo WshShell.Run "cmd /c cd /d C:\projects\code && npm start", 0, False >> "%STARTUP%\DiscordBot.vbs"

echo.
echo [SUCCESS] Auto-start installed!
echo.
echo The bot will now start automatically when Windows starts.
echo.
echo To disable auto-start:
echo 1. Press Win+R
echo 2. Type: shell:startup
echo 3. Delete "DiscordBot.vbs"
echo.
echo Starting bot now...
echo.

cd /d "C:\projects\code"
start "" npm start

echo.
echo Bot started! You can close this window.
echo.
pause
