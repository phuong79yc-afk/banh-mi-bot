# Bot Error Watcher v1.0
# Watches bot output for runtime errors and auto-fixes them

param(
    [Parameter(Mandatory=$true)]
    [string]$BotTerminalId,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BOT ERROR WATCHER STARTED" -ForegroundColor Green
Write-Host "  Monitoring bot terminal: $BotTerminalId" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$lastCheck = Get-Date
$checkInterval = 5 # seconds
$knownErrors = @()

function Get-BotOutput {
    param([string]$terminalId)
    
    # This would need to read from bot process output
    # For now, we'll monitor a log file if it exists
    if (Test-Path ".\logs\error.log") {
        return Get-Content ".\logs\error.log" -Tail 50 -ErrorAction SilentlyContinue
    }
    return @()
}

function Analyze-Error {
    param([string]$errorLine)
    
    $fixes = @()
    
    # Pattern 1: Interaction already acknowledged (40060)
    if ($errorLine -match 'DiscordAPIError\[40060\].*Interaction has already been acknowledged') {
        if ($errorLine -match '([\w-]+)\.ts') {
            $fileName = $matches[1]
            $fixes += @{
                Type = "DuplicateDefer"
                File = "src/commands/$fileName.ts"
                Description = "Duplicate deferReply detected"
            }
        }
    }
    
    # Pattern 2: is not defined (JavaScript runtime error)
    if ($errorLine -match '(\w+) is not defined') {
        $varName = $matches[1]
        if ($errorLine -match '([\w-]+)\.ts:(\d+)') {
            $fileName = $matches[1]
            $lineNum = $matches[2]
            $fixes += @{
                Type = "UndefinedVariable"
                File = "src/commands/$fileName.ts"
                Line = $lineNum
                Variable = $varName
                Description = "Undefined variable: $varName"
            }
        }
    }
    
    # Pattern 3: JSON parse errors
    if ($errorLine -match 'SyntaxError.*JSON.*not valid JSON') {
        if ($errorLine -match '([\w-]+\.json)') {
            $fileName = $matches[1]
            $fixes += @{
                Type = "CorruptedJSON"
                File = "data/$fileName"
                Description = "Corrupted JSON file"
            }
        }
    }
    
    # Pattern 4: Cannot find module
    if ($errorLine -match "Cannot find module '([^']+)'") {
        $moduleName = $matches[1]
        $fixes += @{
            Type = "MissingModule"
            Module = $moduleName
            Description = "Missing module: $moduleName"
        }
    }
    
    return $fixes
}

function Apply-AutoFix {
    param($fix)
    
    switch ($fix.Type) {
        "DuplicateDefer" {
            Write-Host "[FIX] Running auto-fixer for duplicate defer in $($fix.File)..." -ForegroundColor Yellow
            & powershell.exe -ExecutionPolicy Bypass -File "$PSScriptRoot\auto-fixer.ps1" 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] Auto-fixer completed" -ForegroundColor Green
                
                # Rebuild
                Write-Host "[BUILD] Rebuilding..." -ForegroundColor Yellow
                npm run build --silent 2>&1 | Out-Null
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[OK] Build successful! Bot will auto-reload..." -ForegroundColor Green
                    return $true
                }
            }
            return $false
        }
        
        "UndefinedVariable" {
            Write-Host "[WARN] Undefined variable '$($fix.Variable)' in $($fix.File):$($fix.Line)" -ForegroundColor Red
            Write-Host "  This requires manual inspection" -ForegroundColor Yellow
            return $false
        }
        
        "CorruptedJSON" {
            Write-Host "[FIX] Resetting corrupted JSON: $($fix.File)" -ForegroundColor Yellow
            
            if (Test-Path $fix.File) {
                $backup = "$($fix.File).backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
                Copy-Item $fix.File $backup -ErrorAction SilentlyContinue
                Set-Content $fix.File -Value "{}" -Encoding UTF8
                Write-Host "[OK] JSON reset, backup: $backup" -ForegroundColor Green
                return $true
            }
            return $false
        }
        
        "MissingModule" {
            Write-Host "[WARN] Missing module: $($fix.Module)" -ForegroundColor Red
            Write-Host "  Run: npm install" -ForegroundColor Yellow
            return $false
        }
        
        default {
            return $false
        }
    }
}

Write-Host "[ACTIVE] Monitoring bot errors..." -ForegroundColor Green
Write-Host ""

try {
    while ($true) {
        $now = Get-Date
        
        if (($now - $lastCheck).TotalSeconds -ge $checkInterval) {
            $output = Get-BotOutput -terminalId $BotTerminalId
            
            foreach ($line in $output) {
                # Skip if we've seen this error
                $errorHash = $line.GetHashCode()
                if ($knownErrors -contains $errorHash) { continue }
                
                # Check if line contains error
                if ($line -match 'Error:|ERROR|DiscordAPIError') {
                    $fixes = Analyze-Error -errorLine $line
                    
                    if ($fixes.Count -gt 0) {
                        Write-Host "`n[ERROR DETECTED] $line" -ForegroundColor Red
                        
                        foreach ($fix in $fixes) {
                            Write-Host "  [ANALYZE] $($fix.Description)" -ForegroundColor Yellow
                            
                            $fixed = Apply-AutoFix -fix $fix
                            
                            if ($fixed) {
                                $knownErrors += $errorHash
                                Write-Host "  [RESOLVED] Error fixed automatically!" -ForegroundColor Green
                            } else {
                                Write-Host "  [MANUAL] Requires manual intervention" -ForegroundColor Red
                            }
                        }
                        
                        Write-Host ""
                    }
                }
            }
            
            $lastCheck = $now
        }
        
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`n[STOP] Error watcher stopped" -ForegroundColor Yellow
}
