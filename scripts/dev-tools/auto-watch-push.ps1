# Auto Watch & Push - Monitors file changes and auto commits/pushes
# Usage: .\scripts\dev-tools\auto-watch-push.ps1

param(
    [int]$Interval = 30  # Check every 30 seconds
)

$ProjectPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $ProjectPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AUTO WATCH & PUSH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Watching: $ProjectPath" -ForegroundColor Yellow
Write-Host "Interval: $Interval seconds" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Red
Write-Host "========================================`n" -ForegroundColor Cyan

$lastCommit = git rev-parse HEAD

while ($true) {
    Start-Sleep -Seconds $Interval
    
    # Check for changes
    $status = git status --porcelain
    
    if ($status) {
        Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Changes detected!" -ForegroundColor Yellow
        
        # Run quick push script
        & "$ProjectPath\scripts\dev-tools\auto-git-push.ps1"
        
        if ($LASTEXITCODE -eq 0) {
            $newCommit = git rev-parse HEAD
            if ($newCommit -ne $lastCommit) {
                Write-Host "[OK] Auto-pushed successfully!" -ForegroundColor Green
                $lastCommit = $newCommit
            }
        } else {
            Write-Host "[ERROR] Push failed, will retry..." -ForegroundColor Red
        }
    } else {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] No changes" -ForegroundColor DarkGray
    }
}
