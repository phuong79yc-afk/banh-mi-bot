# Quick Push - Fast commit & push with smart commit messages
# Usage: 
#   .\scripts\quick-push.ps1           -> Auto-generated message
#   .\scripts\quick-push.ps1 "message" -> Custom message

param(
    [string]$Message = ""
)

Set-Location "c:\projects\code"

# Check for changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "OK No changes" -ForegroundColor Green
    exit 0
}

# Auto-generate message if not provided
if ([string]::IsNullOrEmpty($Message)) {
    $changes = @()
    
    # Detect change types
    $modified = (git diff --name-only) -split "`n" | Where-Object { $_ }
    $added = (git ls-files --others --exclude-standard) -split "`n" | Where-Object { $_ }
    
    if ($modified.Count -gt 0) {
        $changes += "Update $($modified.Count) files"
    }
    if ($added.Count -gt 0) {
        $changes += "Add $($added.Count) new files"
    }
    
    # Check specific files for better messages
    $changedFiles = ($modified + $added) | Select-Object -First 5
    
    if ($changedFiles -match "module.*entry_point") {
        $Message = "feat: Update modules - " + ($changes -join ", ")
    } elseif ($changedFiles -match "config") {
        $Message = "chore: Update config - " + ($changes -join ", ")
    } elseif ($changedFiles -match "script") {
        $Message = "chore: Update scripts - " + ($changes -join ", ")
    } elseif ($changedFiles -match "\.md$") {
        $Message = "docs: Update documentation - " + ($changes -join ", ")
    } else {
        $Message = "chore: " + ($changes -join ", ")
    }
}

Write-Host ">> $Message" -ForegroundColor Cyan

# Stage, commit, push
git add -A
git commit -m "$Message"
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Pushed!" -ForegroundColor Green
    git log -1 --oneline
} else {
    Write-Host "ERROR Failed!" -ForegroundColor Red
}
