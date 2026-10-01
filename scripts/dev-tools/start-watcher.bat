@echo off
echo ========================================
echo   AUTO BUILD, DEPLOY ^& RESTART WATCHER
echo ========================================
echo.
echo Starting file watcher...
echo This will auto rebuild when you save files in src/
echo.
echo Press Ctrl+C to stop.
echo.

npm run watch:rebuild
