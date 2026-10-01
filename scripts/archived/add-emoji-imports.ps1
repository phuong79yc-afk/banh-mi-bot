# Script to add emoji imports to all modules
$modules = @(
    'afk-module', 'ai-module', 'autoresponder-module', 'customrole-module',
    'donation-module', 'games-module', 'giveaway-module', 'minecraft-module',
    'moderation-module', 'quickreport-module', 'snipe-module', 'social-module',
    'sticky-messages-module', 'ticket-module', 'utility'
)

foreach ($module in $modules) {
    $file = "c:\projects\code\src\modules\$module\entry_point.ts"
    
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Check if already has emoji import
        if ($content -match "from.*config/emojis") {
            Write-Host "✅ $module already has emoji import" -ForegroundColor Green
            continue
        }
        
        # Find first import line
        if ($content -match "(?m)^import .* from .*;\r?\n") {
            $firstImport = $matches[0]
            $newImport = $firstImport + "import { emojis } from '../../config/emojis';`n"
            $content = $content -replace [regex]::Escape($firstImport), $newImport
            
            # Save file
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "✅ Added emoji import to $module" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Could not find import in $module" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ File not found: $module" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Done!" -ForegroundColor Cyan
