# 🔄 Automated Backup System for Discord Bot
# Backs up src/, client/, data/, and important configs

param(
    [string]$BackupType = "auto",  # auto, manual, full
    [string]$Description = ""
)

# Configuration
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$BackupRoot = Join-Path $ProjectRoot 'backups'
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Colors
function Write-Success { param($msg) Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "[WARNING] $msg" -ForegroundColor Yellow }

# Start
Write-Host "`n[BACKUP] Starting Backup Process..." -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Gray

# Create backup folder
$BackupName = if ($Description) { 
    "backup_${Timestamp}_${Description}" 
} else { 
    "backup_${Timestamp}_${BackupType}" 
}

$BackupPath = Join-Path $BackupRoot $BackupName
New-Item -Path $BackupPath -ItemType Directory -Force | Out-Null
Write-Info "Backup location: $BackupPath"

# Backup src/ folder
Write-Info "Backing up src/ folder..."
Copy-Item -Path "$ProjectRoot\src" -Destination "$BackupPath\src" -Recurse -Force
Write-Success "src/ backed up"

# Backup client/ folder (dashboard)
if (Test-Path "$ProjectRoot\client") {
    Write-Info "Backing up client/ folder..."
    Copy-Item -Path "$ProjectRoot\client" -Destination "$BackupPath\client" -Recurse -Force
    Write-Success "client/ backed up"
}

# Backup data/ folder (if exists)
if (Test-Path "$ProjectRoot\data") {
    Write-Info "Backing up data/ folder..."
    Copy-Item -Path "$ProjectRoot\data" -Destination "$BackupPath\data" -Recurse -Force
    Write-Success "data/ backed up"
}

# Backup important config files
Write-Info "Backing up config files..."
$ConfigFiles = @(
    "package.json",
    "tsconfig.json",
    "nodemon.json",
    "ecosystem.config.js",
    ".env.example"
)

foreach ($file in $ConfigFiles) {
    if (Test-Path "$ProjectRoot\$file") {
        Copy-Item -Path "$ProjectRoot\$file" -Destination "$BackupPath\$file" -Force
    }
}
Write-Success "Config files backed up"

# Create backup info file
$BackupInfoContent = "# Backup Information`n`n"
$BackupInfoContent += "Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
$BackupInfoContent += "Type: $BackupType`n"
$BackupInfoContent += "Description: $Description`n`n"
$BackupInfoContent += "## Contents`n"
$BackupInfoContent += "- src/ folder`n"
$BackupInfoContent += "- client/ folder`n"
$BackupInfoContent += "- data/ folder`n"
$BackupInfoContent += "- Config files`n`n"

# Calculate backup size
$BackupSize = (Get-ChildItem -Path $BackupPath -Recurse | Measure-Object -Property Length -Sum).Sum
$BackupSizeMB = [math]::Round($BackupSize / 1MB, 2)
$BackupInfoContent += "## Size`n"
$BackupInfoContent += "Total Size: $BackupSizeMB MB`n"

# Count files
$FileCount = (Get-ChildItem -Path $BackupPath -Recurse -File | Measure-Object).Count
$BackupInfoContent += "Total Files: $FileCount`n"

# Save backup info
$BackupInfoContent | Out-File -FilePath "$BackupPath\BACKUP_INFO.md" -Encoding UTF8

Write-Host "`n========================================" -ForegroundColor Gray
Write-Success "Backup completed successfully!"
Write-Host "Size: $BackupSizeMB MB" -ForegroundColor Cyan
Write-Host "Files: $FileCount" -ForegroundColor Cyan
Write-Host "Location: $BackupPath`n" -ForegroundColor Cyan

# Cleanup old backups (keep last 10)
Write-Info "Checking for old backups..."
$AllBackups = Get-ChildItem -Path $BackupRoot -Directory | Sort-Object CreationTime -Descending
if ($AllBackups.Count -gt 10) {
    $OldBackups = $AllBackups | Select-Object -Skip 10
    Write-Warning "Found $($OldBackups.Count) old backup(s) to clean up"
    
    foreach ($old in $OldBackups) {
        Write-Info "Deleting old backup: $($old.Name)"
        Remove-Item -Path $old.FullName -Recurse -Force
    }
    Write-Success "Old backups cleaned up (kept last 10)"
} else {
    Write-Info "No old backups to clean up (total: $($AllBackups.Count))"
}

Write-Host "`n[DONE] Backup system completed!`n" -ForegroundColor Green
