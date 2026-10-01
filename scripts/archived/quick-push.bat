@echo off
REM Quick Git Push - Double click to push now

cd /d "%~dp0.."
powershell -ExecutionPolicy Bypass -File scripts\auto-git-push.ps1

pause
