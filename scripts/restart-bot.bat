@echo off
title Restart Discord Bot
color 0B

echo.
echo ========================================
echo      RESTARTING DISCORD BOT
echo ========================================
echo.

echo [1/2] Stopping bot...
call "%~dp0stop-bot.bat"

echo.
echo [2/2] Starting bot...
timeout /t 2 >nul

wscript "%~dp0start-bot-hidden.vbs"

echo.
echo [SUCCESS] Bot restarted!
echo The bot is now running in background.
echo.
timeout /t 3 >nul
