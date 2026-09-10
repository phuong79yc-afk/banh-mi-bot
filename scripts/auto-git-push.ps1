# Auto Git Commit & Push Script
# Usage: .\scripts\auto-git-push.ps1 "Your commit message"

param(
    [string]$Message = "chore: Auto update"
)

Write-Host ">>> Auto Git Push Script" -ForegroundColor Cyan
Write-Host "=" -repeat 50 -ForegroundColor Cyan

# Change to project directory
Set-Location "c:\projects\code"

# Check if there are changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "[OK] No changes to commit" -ForegroundColor Green
    exit 0
}

Write-Host "`n[INFO] Changes detected:" -ForegroundColor Yellow
git status --short

# Stage all modified and new files (excluding deleted)
Write-Host "`n[STAGE] Staging files..." -ForegroundColor Cyan
git add -A

# Show what will be committed
Write-Host "`n[FILES] Files to be committed:" -ForegroundColor Cyan
git diff --cached --name-status

# Commit
Write-Host "`n[COMMIT] Committing..." -ForegroundColor Cyan
git commit -m "$Message"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Commit failed!" -ForegroundColor Red
    exit 1
}

# Push
Write-Host "`n[PUSH] Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[OK] Successfully pushed to GitHub!" -ForegroundColor Green

# Show latest commit
Write-Host "`n[COMMIT] Latest commit:" -ForegroundColor Cyan
git log -1 --pretty=format:"%C(yellow)%h%Creset - %C(cyan)%ar%Creset - %s"

Write-Host "`n`n[DONE] Complete!" -ForegroundColor Green
