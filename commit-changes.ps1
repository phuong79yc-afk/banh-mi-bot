& "D:\Git\cmd\git.exe" add README.md
& "D:\Git\cmd\git.exe" add src/database/init.ts
& "D:\Git\cmd\git.exe" add src/modules/balance-module/entry_point.ts
& "D:\Git\cmd\git.exe" add src/modules/daily-module/entry_point.ts
& "D:\Git\cmd\git.exe" add src/modules/shop-module/entry_point.ts
& "D:\Git\cmd\git.exe" add src/modules/vip-module/entry_point.ts
& "D:\Git\cmd\git.exe" add src/web/api/dashboardRoutes.ts
& "D:\Git\cmd\git.exe" add .agents/tasks/fix-bot-railway/features/FEAT-001.json
& "D:\Git\cmd\git.exe" commit -m "fix(database): make database path configurable via DATABASE_PATH env var"
Write-Host "Commit completed successfully"
