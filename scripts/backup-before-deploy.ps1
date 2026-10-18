# Backup script trước khi deploy
# Chạy: powershell -ExecutionPolicy Bypass -File scripts/backup-before-deploy.ps1

Write-Host "🔄 Backing up data before deploy..." -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupDir = "backups/pre-deploy_$timestamp"

# Tạo thư mục backup
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

# Backup data folder
Write-Host "📦 Backing up data folder..." -ForegroundColor Yellow
Copy-Item -Path "data" -Destination "$backupDir/data" -Recurse -Force

# Backup .env
Write-Host "🔐 Backing up .env file..." -ForegroundColor Yellow
Copy-Item -Path ".env" -Destination "$backupDir/.env" -Force

# Tạo file metadata
$metadata = @{
    timestamp = $timestamp
    bot_version = "1.0.0"
    node_version = (node -v)
    npm_version = (npm -v)
    files_backed_up = @(
        "data/*.json"
        "data/*.db"
        ".env"
    )
} | ConvertTo-Json

Set-Content -Path "$backupDir/metadata.json" -Value $metadata

Write-Host "✅ Backup completed: $backupDir" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Upload code to DanBot (GitHub or SFTP)"
Write-Host "  2. Copy environment variables to DanBot dashboard"
Write-Host "  3. Run 'npm install' and 'npm run build'"
Write-Host "  4. Upload data folder if needed (SFTP)"
Write-Host ""
Write-Host "💡 Tip: Keep this backup safe in case you need to restore" -ForegroundColor Yellow
