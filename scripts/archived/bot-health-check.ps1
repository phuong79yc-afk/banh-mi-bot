# Bot Health Check Script
# Simple error detection without fixes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BOT HEALTH CHECK" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$issues = @{
    critical = @()
    warnings = @()
    info = @()
}

# 1. Check TypeScript build
Write-Host "[1/5] Checking TypeScript build..." -ForegroundColor Cyan
try {
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        $issues.critical += "TypeScript build failed"
        Write-Host "  X Build FAILED" -ForegroundColor Red
    } else {
        Write-Host "  OK Build successful" -ForegroundColor Green
    }
} catch {
    $issues.critical += "Cannot run build"
    Write-Host "  X Build error: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Check JSON files
Write-Host "`n[2/5] Checking JSON files..." -ForegroundColor Cyan
if (Test-Path ".\data") {
    $jsonFiles = Get-ChildItem -Path ".\data" -Filter "*.json"
    $jsonOk = 0
    $jsonBad = 0
    
    foreach ($file in $jsonFiles) {
        try {
            $content = Get-Content $file.FullName -Raw
            if ($content.Trim()) {
                $null = $content | ConvertFrom-Json
                $jsonOk++
            }
        } catch {
            $jsonBad++
            $issues.critical += "Corrupted JSON: $($file.Name)"
            Write-Host "  X $($file.Name) - CORRUPTED" -ForegroundColor Red
        }
    }
    
    Write-Host "  OK $jsonOk valid, $jsonBad corrupted" -ForegroundColor $(if ($jsonBad -gt 0) { "Yellow" } else { "Green" })
}

# 3. Check for missing defer
Write-Host "`n[3/5] Checking commands for defer..." -ForegroundColor Cyan
$commandFiles = Get-ChildItem -Path ".\src\commands" -Filter "*.ts"
$noDeferCount = 0

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match 'export async function execute' -and $content -notmatch 'deferReply') {
        $noDeferCount++
        $issues.warnings += "No defer: $($file.Name)"
    }
}

if ($noDeferCount -eq 0) {
    Write-Host "  OK All commands have defer" -ForegroundColor Green
} else {
    Write-Host "  ! $noDeferCount commands without defer" -ForegroundColor Yellow
}

# 4. Check for .env file
Write-Host "`n[4/5] Checking environment..." -ForegroundColor Cyan
if (Test-Path ".\.env") {
    $envContent = Get-Content ".\.env" -Raw
    if ($envContent -match 'DISCORD_TOKEN\s*=\s*.+') {
        Write-Host "  OK .env file configured" -ForegroundColor Green
    } else {
        $issues.warnings += "DISCORD_TOKEN not set in .env"
        Write-Host "  ! DISCORD_TOKEN not found" -ForegroundColor Yellow
    }
} else {
    $issues.critical += ".env file missing"
    Write-Host "  X .env file not found" -ForegroundColor Red
}

# 5. Check node_modules
Write-Host "`n[5/5] Checking dependencies..." -ForegroundColor Cyan
if (Test-Path ".\node_modules") {
    Write-Host "  OK node_modules exists" -ForegroundColor Green
} else {
    $issues.critical += "node_modules missing"
    Write-Host "  X node_modules not found (run npm install)" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$criticalCount = $issues.critical.Count
$warningCount = $issues.warnings.Count

if ($criticalCount -gt 0) {
    Write-Host "CRITICAL ISSUES: $criticalCount" -ForegroundColor Red
    foreach ($issue in $issues.critical) {
        Write-Host "  X $issue" -ForegroundColor Red
    }
    Write-Host ""
}

if ($warningCount -gt 0) {
    Write-Host "WARNINGS: $warningCount" -ForegroundColor Yellow
    foreach ($issue in $issues.warnings) {
        Write-Host "  ! $issue" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($criticalCount -eq 0 -and $warningCount -eq 0) {
    Write-Host "STATUS: HEALTHY" -ForegroundColor Green
    Write-Host "Bot is ready to run!" -ForegroundColor Green
} elseif ($criticalCount -eq 0) {
    Write-Host "STATUS: OK (with warnings)" -ForegroundColor Yellow
    Write-Host "Bot can run but has minor issues" -ForegroundColor Yellow
} else {
    Write-Host "STATUS: CRITICAL" -ForegroundColor Red
    Write-Host "Fix critical issues before running bot" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Return exit code
if ($criticalCount -gt 0) {
    exit 1
} else {
    exit 0
}
