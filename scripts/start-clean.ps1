# Kill all existing node processes
Write-Host "Killing existing node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start bot
Write-Host "Starting bot..." -ForegroundColor Green
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
node --expose-gc dist/src/index.js
