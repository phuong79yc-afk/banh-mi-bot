@echo off
title Auto-Fix Watcher
cd /d "%~dp0..\.."
powershell.exe -ExecutionPolicy Bypass -NoExit -File ".\scripts\dev-tools\auto-fix-watcher.ps1"
