@echo off
title Create Desktop Shortcuts
color 0B

echo.
echo ========================================
echo   CREATING DESKTOP SHORTCUTS
echo ========================================
echo.

set "DESKTOP=%USERPROFILE%\Desktop"
set "PROJECT=C:\projects\code"

REM Create Start Bot shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%DESKTOP%\Start Discord Bot.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%PROJECT%\scripts\start-bot-hidden.vbs" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%PROJECT%" >> CreateShortcut.vbs
echo oLink.Description = "Start Discord Bot (Hidden)" >> CreateShortcut.vbs
echo oLink.IconLocation = "C:\Windows\System32\shell32.dll,137" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

REM Create Stop Bot shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut2.vbs
echo sLinkFile = "%DESKTOP%\Stop Discord Bot.lnk" >> CreateShortcut2.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut2.vbs
echo oLink.TargetPath = "%PROJECT%\scripts\stop-bot.bat" >> CreateShortcut2.vbs
echo oLink.WorkingDirectory = "%PROJECT%" >> CreateShortcut2.vbs
echo oLink.Description = "Stop Discord Bot" >> CreateShortcut2.vbs
echo oLink.IconLocation = "C:\Windows\System32\shell32.dll,132" >> CreateShortcut2.vbs
echo oLink.Save >> CreateShortcut2.vbs

cscript //nologo CreateShortcut.vbs
cscript //nologo CreateShortcut2.vbs
del CreateShortcut.vbs
del CreateShortcut2.vbs

echo [SUCCESS] Desktop shortcuts created!
echo.
echo Created:
echo - Start Discord Bot.lnk
echo - Stop Discord Bot.lnk
echo.
echo You can now start/stop the bot from your desktop!
echo.
pause
