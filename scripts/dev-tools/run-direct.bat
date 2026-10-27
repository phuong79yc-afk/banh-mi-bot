@echo off
echo Starting bot with ts-node...
cd /d "%~dp0..\.."
node --expose-gc -r ts-node/register src/index.ts
pause
