# Auto-Fixer Script
# Tự động phát hiện và vá các lỗi phổ biến trong Discord bot

param(
    [switch]$DryRun,
    [switch]$Verbose
)

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $ProjectRoot

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔧 AUTO-FIXER - Discord Bot Error Detector" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$fixes = @{
    "missing_defer" = 0
    "old_api" = 0
    "corrupted_json" = 0
    "type_errors" = 0
}

# 1. Check for missing deferReply
Write-Host "📋 Checking for missing deferReply..." -ForegroundColor Cyan

$commandFiles = Get-ChildItem -Path ".\src\commands" -Filter "*.ts" -File

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match 'export async function execute\(interaction: ChatInputCommandInteraction\)' -and 
        $content -notmatch 'deferReply') {
        
        Write-Host "  ⚠️  $($file.Name) - Missing defer" -ForegroundColor Yellow
        
        if (-not $DryRun) {
            $content = $content -replace `
                '(export async function execute\(interaction: ChatInputCommandInteraction\) \{)', `
                "`$1`n  await interaction.deferReply({ flags: 64 });`n"
            
            $content = $content -replace 'await interaction\.reply\(', 'await interaction.editReply('
            $content = $content -replace 'return interaction\.reply\(', 'return interaction.editReply('
            
            Set-Content $file.FullName -Value $content -NoNewline
            $fixes["missing_defer"]++
            Write-Host "    ✅ Fixed!" -ForegroundColor Green
        }
    }
}

# 2. Check for old API usage
Write-Host "`n📋 Checking for old API usage..." -ForegroundColor Cyan

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match 'withResponse:\s*true') {
        Write-Host "  ⚠️  $($file.Name) - Old withResponse API" -ForegroundColor Yellow
        
        if (-not $DryRun) {
            $content = $content -replace 'withResponse:\s*true', 'fetchReply: true'
            Set-Content $file.FullName -Value $content -NoNewline
            $fixes["old_api"]++
            Write-Host "    ✅ Fixed!" -ForegroundColor Green
        }
    }
}

# 3. Check for corrupted JSON files
Write-Host "`n📋 Checking JSON files..." -ForegroundColor Cyan

$jsonFiles = Get-ChildItem -Path ".\data" -Filter "*.json" -File

foreach ($file in $jsonFiles) {
    try {
        $content = Get-Content $file.FullName -Raw
        if ($content) {
            $null = $content | ConvertFrom-Json
        }
    } catch {
        Write-Host "  ⚠️  $($file.Name) - Corrupted JSON" -ForegroundColor Yellow
        
        if (-not $DryRun) {
            $backup = "$($file.FullName).backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
            Copy-Item $file.FullName $backup
            Set-Content $file.FullName -Value "{}" -Encoding UTF8
            $fixes["corrupted_json"]++
            Write-Host "    ✅ Fixed! (Backed up to $backup)" -ForegroundColor Green
        }
    }
}

# 4. Check for type errors (flags: 64 in editReply)
Write-Host "`n📋 Checking for type errors..." -ForegroundColor Cyan

foreach ($file in $commandFiles) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match 'editReply\([^)]*flags:\s*64') {
        Write-Host "  ⚠️  $($file.Name) - Invalid flags in editReply" -ForegroundColor Yellow
        
        if (-not $DryRun) {
            $content = $content -replace ',\s*\n\s*flags:\s*64\s*(//[^\n]*)?\n', "`n"
            $content = $content -replace ',\s*flags:\s*64\s*\}', ' }'
            Set-Content $file.FullName -Value $content -NoNewline
            $fixes["type_errors"]++
            Write-Host "    ✅ Fixed!" -ForegroundColor Green
        }
    }
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "`n🔍 DRY RUN MODE - No changes made" -ForegroundColor Yellow
} else {
    Write-Host "`nFixed:" -ForegroundColor Green
    Write-Host "  • Missing defer: $($fixes['missing_defer'])" -ForegroundColor White
    Write-Host "  • Old API: $($fixes['old_api'])" -ForegroundColor White
    Write-Host "  • Corrupted JSON: $($fixes['corrupted_json'])" -ForegroundColor White
    Write-Host "  • Type errors: $($fixes['type_errors'])" -ForegroundColor White
    
    $total = $fixes.Values | Measure-Object -Sum | Select-Object -ExpandProperty Sum
    Write-Host "`n✅ Total fixes: $total" -ForegroundColor Green
    
    if ($total -gt 0) {
        Write-Host "`n💡 Run 'npm run build' to verify" -ForegroundColor Cyan
    }
}

Write-Host ""
