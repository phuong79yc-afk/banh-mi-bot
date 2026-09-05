@echo off
title Auto-Fix Watcher
cd /d "%~dp0\.."
powershell.exe -ExecutionPolicy Bypass -NoExit -File ".\scripts\auto-fix-watcher.ps1"
