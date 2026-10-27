# Auto-Fix Watcher v1.0
# Watches src/commands for changes and auto-fixes + rebuilds

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AUTO-FIX WATCHER STARTED" -ForegroundColor Green
Write-Host "  Watching: src/commands/*.ts" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$watchPath = Join-Path $ProjectRoot 'src\commands'
$lastRun = [DateTime]::MinValue

# Create FileSystemWatcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $watchPath
$watcher.Filter = "*.ts"
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true
$messageData = @{
    CooldownSeconds = 3 # seconds between runs
    ProjectRoot = $ProjectRoot
    AutoFixPath = Join-Path $PSScriptRoot 'auto-fixer.ps1'
}

# Define action
$action = {
    $eventData = $Event.MessageData
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    $fileName = Split-Path $path -Leaf
    
    # Rate limiting
    $now = [DateTime]::Now
    $global:lastRun = if ($null -eq $global:lastRun) { [DateTime]::MinValue } else { $global:lastRun }
    
    if (($now - $global:lastRun).TotalSeconds -lt $eventData.CooldownSeconds) {
        return
    }
    $global:lastRun = $now
    
    Write-Host "`n[CHANGE] Detected change: $fileName ($changeType)" -ForegroundColor Cyan
    Write-Host "[RUN] Running auto-fixer..." -ForegroundColor Yellow
    
    # Run auto-fixer
    Set-Location $eventData.ProjectRoot
    $fixOutput = & powershell.exe -ExecutionPolicy Bypass -File $eventData.AutoFixPath 2>&1
    
    # Check if any fixes were made
    $fixesMade = $fixOutput | Select-String "Fixed!" -Quiet
    
    if ($fixesMade) {
        Write-Host "[OK] Auto-fixes applied!" -ForegroundColor Green
        
        # Rebuild
        Write-Host "[BUILD] Rebuilding..." -ForegroundColor Yellow
        $buildOutput = npm run build --silent 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Build successful!" -ForegroundColor Green
            Write-Host "[INFO] Bot will auto-reload..." -ForegroundColor Cyan
        } else {
            Write-Host "[ERROR] Build failed!" -ForegroundColor Red
            Write-Host $buildOutput -ForegroundColor Red
        }
    } else {
        Write-Host "[INFO] No auto-fixes needed" -ForegroundColor Gray
    }
    
    Write-Host "[WATCH] Watching for changes..." -ForegroundColor Gray
}

# Register events
Register-ObjectEvent -InputObject $watcher -EventName "Changed" -MessageData $messageData -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Created" -MessageData $messageData -Action $action | Out-Null

Write-Host "[ACTIVE] Watcher active! Edit any file in src/commands/ to trigger auto-fix..." -ForegroundColor Green
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    $watcher.Dispose()
    Write-Host "`n[STOP] Watcher stopped" -ForegroundColor Yellow
}
