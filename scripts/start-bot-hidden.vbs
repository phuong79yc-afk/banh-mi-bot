Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\projects\code && npm start", 0, False
