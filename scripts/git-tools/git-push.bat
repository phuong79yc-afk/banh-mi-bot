@echo off
cd /d "%~dp0..\.."
git add .
git commit -m "feat: migrate to Turso cloud database for persistent storage"
git push
pause
