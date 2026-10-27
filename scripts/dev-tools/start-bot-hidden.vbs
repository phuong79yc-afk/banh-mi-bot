Set WshShell = CreateObject("WScript.Shell")
Set FileSystem = CreateObject("Scripting.FileSystemObject")
ProjectRoot = FileSystem.GetParentFolderName(FileSystem.GetParentFolderName(FileSystem.GetParentFolderName(WScript.ScriptFullName)))
WshShell.Run "cmd /c cd /d """ & ProjectRoot & """ && npm start", 0, False
