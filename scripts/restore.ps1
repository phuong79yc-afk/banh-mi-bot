# 🔄 Restore Backup Script
# Restores a backup to the project

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupPath
)

# Colors
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$BackupRoot = Join-Path $ProjectRoot 'backups'

Write-Host "`n🔄 Backup Restore System" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# If no backup path provided, list available backups
if (-not $BackupPath) {
    Write-Info "Available backups:"
    Write-Host ""
    
    $Backups = Get-ChildItem -Path $BackupRoot -Directory | Sort-Object CreationTime -Descending
    
    if ($Backups.Count -eq 0) {
        Write-Error "No backups found in $BackupRoot"
        exit 1
    }
    
    for ($i = 0; $i -lt $Backups.Count; $i++) {
        $backup = $Backups[$i]
        $size = [math]::Round((Get-ChildItem -Path $backup.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
        $date = $backup.CreationTime.ToString("yyyy-MM-dd HH:mm:ss")
        
        Write-Host "  [$i] " -NoNewline -ForegroundColor Yellow
        Write-Host "$($backup.Name)" -ForegroundColor Cyan
        Write-Host "      📅 $date | 📦 $size MB" -ForegroundColor Gray
    }
    
    Write-Host ""
    $selection = Read-Host "Select backup number (0-$($Backups.Count - 1)) or 'q' to quit"
    
    if ($selection -eq 'q') {
        Write-Info "Restore cancelled"
        exit 0
    }
    
    $BackupPath = $Backups[[int]$selection].FullName
}

# Verify backup exists
if (-not (Test-Path $BackupPath)) {
    Write-Error "Backup not found: $BackupPath"
    exit 1
}

Write-Host ""
Write-Warning "⚠️  WARNING: This will OVERWRITE current files!"
Write-Host "   Backup: $BackupPath" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Type 'YES' to confirm restore"

if ($confirm -ne "YES") {
    Write-Info "Restore cancelled"
    exit 0
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Info "Starting restore process..."

# Stop bot if running
Write-Info "Checking for running bot..."
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Warning "Stopping bot processes..."
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Success "Bot stopped"
}

# Restore src/
if (Test-Path "$BackupPath\src") {
    Write-Info "Restoring src/ folder..."
    Remove-Item -Path "$ProjectRoot\src" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "$BackupPath\src" -Destination "$ProjectRoot\src" -Recurse -Force
    Write-Success "src/ restored"
}

# Restore client/
if (Test-Path "$BackupPath\client") {
    Write-Info "Restoring client/ folder..."
    Remove-Item -Path "$ProjectRoot\client" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "$BackupPath\client" -Destination "$ProjectRoot\client" -Recurse -Force
    Write-Success "client/ restored"
}

# Restore data/
if (Test-Path "$BackupPath\data") {
    Write-Info "Restoring data/ folder..."
    Remove-Item -Path "$ProjectRoot\data" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "$BackupPath\data" -Destination "$ProjectRoot\data" -Recurse -Force
    Write-Success "data/ restored"
}

# Restore config files
Write-Info "Restoring config files..."
$ConfigFiles = Get-ChildItem -Path $BackupPath -File | Where-Object { $_.Extension -in @('.json', '.js') }
foreach ($file in $ConfigFiles) {
    Copy-Item -Path $file.FullName -Destination "$ProjectRoot\$($file.Name)" -Force
}
Write-Success "Config files restored"

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Success "Restore completed successfully!"
Write-Host ""
Write-Info "Next steps:"
Write-Host "  1. npm install (if package.json changed)" -ForegroundColor Yellow
Write-Host "  2. npm run build" -ForegroundColor Yellow
Write-Host "  3. npm run dev (or npm start)" -ForegroundColor Yellow
Write-Host ""
