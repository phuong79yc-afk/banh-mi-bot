@echo off
echo Starting bot with ts-node...
cd /d D:\projects\code
node --expose-gc -r ts-node/register src/index.ts
pause
