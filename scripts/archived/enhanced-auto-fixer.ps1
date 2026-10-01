# Enhanced Auto-Fixer Script v2.1
# Tu dong phat hien va sua cac loi nho nhat trong Discord bot

param(
    [switch]$DryRun,
    [switch]$Verbose,
    [switch]$All
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ENHANCED AUTO-FIXER v2.1" -ForegroundColor Green
Write-Host "  Detecting and fixing bot errors..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$fixes = @{
    "missing_defer" = 0
    "old_api" = 0
    "corrupted_json" = 0
    "type_errors" = 0
    "missing_error_handling" = 0
    "duplicate_defer" = 0
    "unused_imports" = 0
    "console_logs" = 0
    "hardcoded_values" = 0
    "garbage_chars" = 0
}

$warnings = @()
$errors = @()

# ============================================
# 1. CRITICAL: Missing deferReply (Timeout Issues)
# ============================================
Write-Host "[1/9] Checking for missing deferReply..." -ForegroundColor Cyan

$commandFiles = Get-ChildItem -Path ".\src\commands" -Filter "*.ts" -File

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if has execute function but no defer
    if ($content -match 'export async function execute\(interaction: ChatInputCommandInteraction\)') {
        if ($content -notmatch 'await interaction\.deferReply') {
            $warnings += "Missing defer: $($file.Name)"
            Write-Host "  ! $($file.Name) - No defer found" -ForegroundColor Yellow
            
            if (-not $DryRun) {
                $content = $content -replace `
                    '(export async function execute\(interaction: ChatInputCommandInteraction\) \{)', `
                    "`$1`n  await interaction.deferReply({ flags: 64 });`n"
                
                $content = $content -replace 'await interaction\.reply\(\{', 'await interaction.editReply({'
                $content = $content -replace 'return interaction\.reply\(\{', 'return interaction.editReply({'
                
                Set-Content $file.FullName -Value $content -NoNewline
                $fixes["missing_defer"]++
                Write-Host "    -> Fixed!" -ForegroundColor Green
            }
        }
    }
}

# ============================================
# 2. Duplicate deferReply (Performance Issue)
# ============================================
Write-Host "`n[2/10] Checking for duplicate deferReply..." -ForegroundColor Cyan

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Fix inline duplicates first (e.g., "defer();defer();")
    if ($content -match 'deferReply[^;]*;[^;]*deferReply') {
        Write-Host "  ! $($file.Name) - Inline duplicate defer" -ForegroundColor Yellow
        if (-not $DryRun) {
            # Remove inline duplicate patterns
            $content = $content -replace '(await interaction\.deferReply\([^)]*\);)\s*await interaction\.deferReply\([^)]*\);\s*', '$1'
            Set-Content $file.FullName -Value $content -NoNewline
            $fixes["duplicate_defer"]++
            Write-Host "    -> Fixed inline duplicate!" -ForegroundColor Green
        }
    }
    
    # Reload content after inline fix
    $content = Get-Content $file.FullName -Raw
    $deferMatches = [regex]::Matches($content, 'await interaction\.deferReply')
    
    if ($deferMatches.Count -gt 1) {
        $warnings += "Duplicate defer: $($file.Name) ($($deferMatches.Count) times)"
        Write-Host "  ! $($file.Name) - Multiple defer calls ($($deferMatches.Count))" -ForegroundColor Yellow
        
        if (-not $DryRun) {
            # Keep only first defer, remove others
            $lines = $content -split "`n"
            $foundFirst = $false
            $newLines = @()
            
            foreach ($line in $lines) {
                if ($line -match 'await interaction\.deferReply') {
                    if (-not $foundFirst) {
                        $newLines += $line
                        $foundFirst = $true
                    } else {
                        Write-Host "    -> Removed duplicate defer line" -ForegroundColor Green
                        $fixes["duplicate_defer"]++
                    }
                } else {
                    $newLines += $line
                }
            }
            
            $newLines -join "`n" | Set-Content $file.FullName -NoNewline
        }
    }
}

# ============================================
# 3. Garbage Characters (Syntax Errors)
# ============================================
Write-Host "`n[3/10] Checking for garbage characters..." -ForegroundColor Cyan
Write-Host "  [SKIP] Disabled to protect Vietnamese strings" -ForegroundColor Gray

# DISABLED: Too aggressive, removes Vietnamese characters in strings
# This section is disabled because it incorrectly removes non-ASCII
# characters even inside strings, breaking Vietnamese text.
#
# Future improvement: Use a proper parser to only detect garbage
# outside of strings/comments

# ============================================
# 4. Old API Usage
# ============================================
Write-Host "`n[4/10] Checking for old API usage..." -ForegroundColor Cyan

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match 'withResponse:\s*true') {
        $warnings += "Old API: $($file.Name) (withResponse)"
        Write-Host "  ! $($file.Name) - Old withResponse API" -ForegroundColor Yellow
        
        if (-not $DryRun) {
            $content = $content -replace 'withResponse:\s*true', 'fetchReply: true'
            Set-Content $file.FullName -Value $content -NoNewline
            $fixes["old_api"]++
            Write-Host "    -> Fixed!" -ForegroundColor Green
        }
    }
}

# ============================================
# 5. Corrupted JSON Files
# ============================================
Write-Host "`n[5/10] Checking JSON files..." -ForegroundColor Cyan

if (Test-Path ".\data") {
    $jsonFiles = Get-ChildItem -Path ".\data" -Filter "*.json" -File
    
    foreach ($file in $jsonFiles) {
        try {
            $content = Get-Content $file.FullName -Raw -ErrorAction Stop
            if ($content -and $content.Trim() -ne "") {
                $null = $content | ConvertFrom-Json -ErrorAction Stop
            }
        } catch {
            $errors += "Corrupted JSON: $($file.Name)"
            Write-Host "  X $($file.Name) - Corrupted!" -ForegroundColor Red
            
            if (-not $DryRun) {
                $backup = "$($file.FullName).backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
                Copy-Item $file.FullName $backup -ErrorAction SilentlyContinue
                Set-Content $file.FullName -Value "{}" -Encoding UTF8
                $fixes["corrupted_json"]++
                Write-Host "    -> Fixed! Backup: $($file.Name).backup" -ForegroundColor Green
            }
        }
    }
}

# ============================================
# 6. Type Errors (flags: 64 in editReply)
# ============================================
Write-Host "`n[6/10] Checking for type errors..." -ForegroundColor Cyan

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match 'editReply\([^)]*flags:\s*64') {
        $warnings += "Type error: $($file.Name) (flags in editReply)"
        Write-Host "  ! $($file.Name) - Invalid flags in editReply" -ForegroundColor Yellow
        
        if (-not $DryRun) {
            $content = $content -replace ',\s*flags:\s*64(?:\s*//[^\n]*)?\s*\}', ' }'
            $content = $content -replace ',\s*flags:\s*64', ''
            Set-Content $file.FullName -Value $content -NoNewline
            $fixes["type_errors"]++
            Write-Host "    -> Fixed!" -ForegroundColor Green
        }
    }
}

# ============================================
# 7. Missing Error Handling
# ============================================
Write-Host "`n[7/10] Checking for missing error handling..." -ForegroundColor Cyan

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match 'export async function execute' -and $content -notmatch 'try\s*\{') {
        $warnings += "No error handling: $($file.Name)"
        Write-Host "  ! $($file.Name) - No try-catch block" -ForegroundColor Yellow
        $fixes["missing_error_handling"]++
    }
}

# ============================================
# 8. Console.log in Production
# ============================================
Write-Host "`n[8/10] Checking for console.log..." -ForegroundColor Cyan

$allFiles = Get-ChildItem -Path ".\src" -Filter "*.ts" -File -Recurse

foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw
    $consoleMatches = [regex]::Matches($content, 'console\.log\(')
    
    if ($consoleMatches.Count -gt 0) {
        $warnings += "Console.log found: $($file.Name) ($($consoleMatches.Count) times)"
        if ($Verbose) {
            Write-Host "  ~ $($file.Name) - $($consoleMatches.Count) console.log" -ForegroundColor Gray
        }
        $fixes["console_logs"] += $consoleMatches.Count
    }
}

# ============================================
# 9. Hardcoded Values (Security Risk)
# ============================================
Write-Host "`n[9/10] Checking for hardcoded sensitive values..." -ForegroundColor Cyan

foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check for potential tokens/keys
    $pattern = '(token|key|password|secret)\s*[:=]\s*["\x27][^"\x27]{20,}["\x27]'
    if ($content -match $pattern) {
        $warnings += "Hardcoded value: $($file.Name)"
        Write-Host "  ! $($file.Name) - Potential hardcoded secret" -ForegroundColor Yellow
        $fixes["hardcoded_values"]++
    }
}

# ============================================
# 10. Unused Imports (Code Quality)
# ============================================
Write-Host "`n[10/10] Checking for unused imports..." -ForegroundColor Cyan

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Extract imports
    $imports = [regex]::Matches($content, "import\s*\{([^}]+)\}")
    
    foreach ($import in $imports) {
        $items = $import.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }
        
        foreach ($item in $items) {
            # Check if imported item is used in file
            $importLineCount = ($content -split "`n" | Where-Object { $_ -match "import.*$item" } | Measure-Object).Count
            if ($importLineCount -eq 1) {
                $usagePattern = [regex]::Escape($item)
                $usageCount = ([regex]::Matches($content, $usagePattern)).Count
                
                if ($usageCount -le 1) {
                    $warnings += "Unused import: $item in $($file.Name)"
                    if ($Verbose) {
                        Write-Host "  ~ $($file.Name) - Unused: $item" -ForegroundColor Gray
                    }
                    $fixes["unused_imports"]++
                }
            }
        }
    }
}

# ============================================
# SUMMARY
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SCAN RESULTS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODE: DRY RUN (No changes made)" -ForegroundColor Yellow
} else {
    Write-Host "MODE: AUTO FIX" -ForegroundColor Green
}

Write-Host ""
Write-Host "Issues Found:" -ForegroundColor Cyan

$totalIssues = 0
foreach ($key in $fixes.Keys | Sort-Object) {
    $count = $fixes[$key]
    if ($count -gt 0) {
        $totalIssues += $count
        $label = ($key -replace '_', ' ').ToUpper()
        
        if ($key -in @('corrupted_json', 'type_errors', 'missing_defer')) {
            Write-Host "  [CRITICAL] $label : $count" -ForegroundColor Red
        } elseif ($key -in @('old_api', 'missing_error_handling', 'hardcoded_values')) {
            Write-Host "  [HIGH] $label : $count" -ForegroundColor Yellow
        } else {
            Write-Host "  [LOW] $label : $count" -ForegroundColor Gray
        }
    }
}

Write-Host ""

if ($totalIssues -eq 0) {
    Write-Host "STATUS: ALL CLEAR!" -ForegroundColor Green
    Write-Host "No issues detected. Bot is healthy!" -ForegroundColor Green
} else {
    Write-Host "TOTAL ISSUES: $totalIssues" -ForegroundColor $(if ($DryRun) { "Yellow" } else { "Green" })
    
    if (-not $DryRun) {
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Run 'npm run build' to verify" -ForegroundColor White
        Write-Host "  2. Run 'npm start' to test bot" -ForegroundColor White
        Write-Host "  3. Check logs for runtime errors" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Return exit code based on critical errors
if ($errors.Count -gt 0) {
    exit 1
} else {
    exit 0
}
