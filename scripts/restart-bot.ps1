# Restart Bot Script
Write-Host "`n=== RESTARTING BOT ===" -ForegroundColor Cyan
Write-Host ""

# Stop all node processes running the bot
Write-Host "🛑 Stopping old bot processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*node.exe" 
} | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "✅ Old processes stopped`n" -ForegroundColor Green

# Rebuild
Write-Host "🔨 Building bot..." -ForegroundColor Yellow
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $ProjectRoot
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful`n" -ForegroundColor Green
    
    # Start bot in new window
    Write-Host "🚀 Starting bot in new window..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot'; npm start"
    
    Write-Host "`n✅ Bot restarted successfully!" -ForegroundColor Green
    Write-Host "📝 Check the new window for bot logs`n" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Build failed! Bot not started.`n" -ForegroundColor Red
}
