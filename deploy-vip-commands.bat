@echo off
echo ========================================
echo  Deploy VIP Commands to Discord
echo ========================================
echo.
echo This will register /vipinfo, /vip-tiers, /vip-bonus
echo to Discord API so they show up in slash commands.
echo.
pause

cd /d D:\projects\code

echo.
echo [1/2] Deploying with ts-node...
node -r ts-node/register src/deploy-commands.ts

echo.
echo [2/2] Done!
echo.
echo Test in Discord:
echo   /vipinfo
echo   /vip-tiers
echo   /vip-bonus
echo.
pause
