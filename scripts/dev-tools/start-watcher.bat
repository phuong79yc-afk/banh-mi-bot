@echo off
cd /d "%~dp0..\.."
echo ========================================
echo   AUTO BUILD, DEPLOY ^& RESTART WATCHER
echo ========================================
echo.
echo Starting file watcher...
echo This will auto rebuild when you save files in src/
echo.
echo Press Ctrl+C to stop.
echo.

node scripts\dev-tools\watch-and-rebuild.js
