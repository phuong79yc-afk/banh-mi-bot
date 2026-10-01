# Auto Git Push Script
# Tự động commit và push code lên Git

param(
    [string]$Message = "Auto-save: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

Write-Host "🔄 Auto Git Push Starting..." -ForegroundColor Cyan

# Check if git repo
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not a git repository!" -ForegroundColor Red
    exit 1
}

# Check for changes
$status = git status --porcelain
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
    exit 0
}

Write-Host "📝 Changes detected:" -ForegroundColor Yellow
git status --short

# Add all changes
Write-Host "`n📦 Adding files..." -ForegroundColor Cyan
git add .

# Commit
Write-Host "💾 Committing..." -ForegroundColor Cyan
git commit -m $Message

# Push
Write-Host "🚀 Pushing to remote..." -ForegroundColor Cyan
$branch = git branch --show-current
git push origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to $branch!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Push failed!" -ForegroundColor Red
    exit 1
}
