# Chuẩn bị code để deploy
# Chạy: powershell -ExecutionPolicy Bypass -File scripts/prepare-deploy.ps1

Write-Host "🚀 Preparing code for deployment..." -ForegroundColor Cyan

# 1. Clean old builds
Write-Host "🧹 Cleaning old builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# 2. Build production
Write-Host "🔨 Building for production..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# 3. Test build
Write-Host "🧪 Testing build..." -ForegroundColor Yellow
if (-not (Test-Path "dist/src/index.js")) {
    Write-Host "❌ Build output not found!" -ForegroundColor Red
    exit 1
}

# 4. Create deployment package info
$deployInfo = @{
    built_at = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    node_version = (node -v)
    npm_version = (npm -v)
    total_modules = 25
    total_commands = 95
    music_commands = 13
    files = @{
        source = "src/"
        build = "dist/"
        assets = "assets/"
        public = "public/"
        data = "data/"
    }
    required_env_vars = @(
        "DISCORD_TOKEN",
        "CLIENT_ID",
        "GROQ_API_KEY_1",
        "GROQ_API_KEY_2",
        "GROQ_API_KEY_3",
        "GROQ_API_KEY_4"
    )
    optional_env_vars = @(
        "GEMINI_API_KEY",
        "OPENAI_API_KEY",
        "GUILD_ID",
        "PORT",
        "SPOTIFY_CLIENT_ID",
        "SPOTIFY_CLIENT_SECRET",
        "OWNER_ID"
    )
} | ConvertTo-Json -Depth 3

Set-Content -Path "deploy-info.json" -Value $deployInfo

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Deployment package ready:" -ForegroundColor Cyan
Write-Host "  - Build: dist/" -ForegroundColor Gray
Write-Host "  - Assets: assets/" -ForegroundColor Gray
Write-Host "  - Public: public/" -ForegroundColor Gray
Write-Host "  - Config: package.json, start.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Read: DANBOT-SETUP.md" -ForegroundColor White
Write-Host "  2. Push to GitHub OR upload via SFTP" -ForegroundColor White
Write-Host "  3. Setup environment variables on DanBot" -ForegroundColor White
Write-Host "  4. Run on DanBot: npm install && npm run build" -ForegroundColor White
Write-Host "  5. Start bot!" -ForegroundColor White
Write-Host ""
Write-Host "🔗 DanBot Hosting: https://danbot.host/" -ForegroundColor Cyan
