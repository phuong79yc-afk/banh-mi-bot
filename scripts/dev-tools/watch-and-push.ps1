# Watch for changes and auto-push
# Chạy script này để tự động push mỗi X phút

param(
    [int]$IntervalMinutes = 5
)

Write-Host "👀 Watching for changes (push every $IntervalMinutes minutes)..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow

while ($true) {
    Start-Sleep -Seconds ($IntervalMinutes * 60)
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "⏰ $(Get-Date -Format 'HH:mm:ss') - Checking for changes..." -ForegroundColor Cyan
    
    & "$PSScriptRoot\auto-git-push.ps1"
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
}
