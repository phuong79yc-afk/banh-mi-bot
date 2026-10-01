# Smart Auto-Fixer v1.0
# Proactively scans code for common Discord bot errors

param(
    [switch]$DryRun,
    [switch]$Fix
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SMART AUTO-FIXER v1.0" -ForegroundColor Green
Write-Host "  Deep scanning for runtime errors..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$fixes = @{
    "duplicate_defer" = 0
    "missing_defer" = 0
    "wrong_reply_method" = 0
    "undefined_variables" = 0
    "syntax_errors" = 0
}

$commandFiles = Get-ChildItem -Path ".\src\commands" -Filter "*.ts" -File

# ============================================
# 1. Deep Defer Analysis
# ============================================
Write-Host "[1/5] Deep defer analysis..." -ForegroundColor Cyan

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check for defer + reply combo (common error)
    if ($content -match 'await interaction\.deferReply' -and $content -match 'await interaction\.reply') {
        Write-Host "  ! $($file.Name) - Has BOTH defer AND reply (conflict!)" -ForegroundColor Red
        
        if ($Fix -and -not $DryRun) {
            # Change reply to editReply
            $content = $content -replace 'await interaction\.reply\(', 'await interaction.editReply('
            $content = $content -replace 'return interaction\.reply\(', 'return interaction.editReply('
            Set-Content $file.FullName -Value $content -NoNewline
            $fixes["wrong_reply_method"]++
            Write-Host "    -> Fixed! Changed reply to editReply" -ForegroundColor Green
        }
    }
    
    # Check for multiple defers
    $deferCount = ([regex]::Matches($content, 'await interaction\.deferReply')).Count
    if ($deferCount -gt 1) {
        Write-Host "  ! $($file.Name) - Has $deferCount defer calls" -ForegroundColor Yellow
        
        if ($Fix -and -not $DryRun) {
            $lines = $content -split "`n"
            $foundFirst = $false
            $newLines = @()
            
            foreach ($line in $lines) {
                if ($line -match 'await interaction\.deferReply') {
                    if (-not $foundFirst) {
                        $newLines += $line
                        $foundFirst = $true
                    }
                    # Skip other defer lines
                } else {
                    $newLines += $line
                }
            }
            
            $newLines -join "`n" | Set-Content $file.FullName -NoNewline
            $fixes["duplicate_defer"]++
            Write-Host "    -> Fixed! Removed duplicate defers" -ForegroundColor Green
        }
    }
    
    # Check for missing defer in commands with editReply
    if ($content -match 'await interaction\.editReply' -and $content -notmatch 'await interaction\.deferReply') {
        Write-Host "  ! $($file.Name) - Uses editReply WITHOUT defer" -ForegroundColor Yellow
        
        if ($Fix -and -not $DryRun) {
            # Add defer at start of execute function
            if ($content -match '(export async function execute\([^)]+\)\s*\{)') {
                $content = $content -replace '(export async function execute\([^)]+\)\s*\{)', "`$1`n  await interaction.deferReply();"
                Set-Content $file.FullName -Value $content -NoNewline
                $fixes["missing_defer"]++
                Write-Host "    -> Fixed! Added defer" -ForegroundColor Green
            } elseif ($content -match '(async execute\([^)]+\)\s*\{)') {
                $content = $content -replace '(async execute\([^)]+\)\s*\{)', "`$1`n    await interaction.deferReply();"
                Set-Content $file.FullName -Value $content -NoNewline
                $fixes["missing_defer"]++
                Write-Host "    -> Fixed! Added defer" -ForegroundColor Green
            }
        }
    }
}

# ============================================
# 2. Undefined Variable Detection
# ============================================
Write-Host "`n[2/5] Checking for undefined variables..." -ForegroundColor Cyan

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check for common typos: single character garbage
    if ($content -match '\b[a-z]\b(?!\s*[=:]|\s*\))') {
        $matches = [regex]::Matches($content, '\b([a-z])\b(?!\s*[=:]|\s*\))')
        foreach ($match in $matches) {
            $char = $match.Groups[1].Value
            # Exclude common single chars like 'i', 'x', 'v'
            if ($char -notin @('i', 'x', 'v', 'r', 'g', 'b', 'a')) {
                Write-Host "  ! $($file.Name) - Suspicious single char: '$char'" -ForegroundColor Yellow
                $fixes["undefined_variables"]++
            }
        }
    }
}

# ============================================
# 3. Syntax Error Detection
# ============================================
Write-Host "`n[3/5] Checking for syntax errors..." -ForegroundColor Cyan

foreach ($file in $commandFiles) {
    $lines = Get-Content $file.FullName
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Check for unmatched parentheses/brackets
        $openParen = ($line.ToCharArray() | Where-Object { $_ -eq '(' }).Count
        $closeParen = ($line.ToCharArray() | Where-Object { $_ -eq ')' }).Count
        
        if ($openParen -ne $closeParen -and $line -notmatch '^\s*//' -and $line.Trim() -ne '') {
            # Only flag if line doesn't continue on next line
            if ($i+1 -lt $lines.Count) {
                $nextLine = $lines[$i+1]
                if ($nextLine -notmatch '^\s*\)' -and $nextLine -notmatch '^\s*\.') {
                    Write-Host "  ! $($file.Name):$($i+1) - Unmatched parentheses" -ForegroundColor Yellow
                    $fixes["syntax_errors"]++
                }
            }
        }
    }
}

# ============================================
# 4. TypeScript Compilation Check
# ============================================
Write-Host "`n[4/5] Running TypeScript compiler..." -ForegroundColor Cyan

$tscOutput = npx tsc --noEmit 2>&1 | Out-String

if ($tscOutput -match 'error TS') {
    $errorLines = $tscOutput -split "`n" | Where-Object { $_ -match 'error TS' }
    
    foreach ($errorLine in $errorLines | Select-Object -First 10) {
        if ($errorLine -match 'src/commands/([\w-]+)\.ts\((\d+),(\d+)\): error TS\d+: (.+)') {
            $fileName = $matches[1]
            $lineNum = $matches[2]
            $colNum = $matches[3]
            $message = $matches[4]
            
            Write-Host "  X $fileName.ts line $lineNum col $colNum - $message" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  [OK] No TypeScript errors found" -ForegroundColor Green
}

# ============================================
# 5. Runtime Error Simulation
# ============================================
Write-Host "`n[5/5] Checking for potential runtime errors..." -ForegroundColor Cyan

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check for .editReply with ephemeral flag
    if ($content -match '\.editReply\([^)]*ephemeral\s*:') {
        Write-Host "  ! $($file.Name) - ephemeral flag in editReply (not allowed)" -ForegroundColor Red
        
        if ($Fix -and -not $DryRun) {
            $content = $content -replace '(\.editReply\([^)]*),\s*ephemeral\s*:\s*\w+', '$1'
            Set-Content $file.FullName -Value $content -NoNewline
            Write-Host "    -> Fixed! Removed ephemeral from editReply" -ForegroundColor Green
        }
    }
    
    # Check for .editReply with flags
    if ($content -match '\.editReply\([^)]*flags\s*:') {
        Write-Host "  ! $($file.Name) - flags in editReply (not allowed)" -ForegroundColor Red
        
        if ($Fix -and -not $DryRun) {
            $content = $content -replace '(\.editReply\([^)]*),\s*flags\s*:\s*\d+', '$1'
            Set-Content $file.FullName -Value $content -NoNewline
            Write-Host "    -> Fixed! Removed flags from editReply" -ForegroundColor Green
        }
    }
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SCAN COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

if ($Fix -and -not $DryRun) {
    Write-Host "MODE: AUTO-FIX" -ForegroundColor Green
    Write-Host "Fixes Applied:" -ForegroundColor White
    foreach ($key in $fixes.Keys) {
        if ($fixes[$key] -gt 0) {
            Write-Host "  - $($key): $($fixes[$key])" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n[NEXT] Run 'npm run build' to verify fixes" -ForegroundColor Cyan
} elseif ($DryRun) {
    Write-Host "MODE: DRY RUN (No changes made)" -ForegroundColor Yellow
} else {
    Write-Host "MODE: SCAN ONLY" -ForegroundColor Gray
    Write-Host "Run with -Fix to apply automatic fixes" -ForegroundColor Cyan
}

Write-Host ""
