# 🚀 Auto-Start Discord Bot

Bot tự động khởi động khi Windows starts up.

## ✅ Đã cài đặt

Bot sẽ tự động start khi bạn login Windows!

File location: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\DiscordBot.vbs`

## 📋 Available Scripts

### Start Bot (Hidden)
```bash
# Start bot without showing window
scripts\start-bot-hidden.vbs
```

Double-click file hoặc:
```cmd
wscript scripts\start-bot-hidden.vbs
```

### Stop Bot
```bash
# Stop all bot processes
scripts\stop-bot.bat
```

### Install Auto-Start
```bash
# Add bot to Windows Startup (already done!)
scripts\install-auto-start.bat
```

### Uninstall Auto-Start
```bash
# Remove bot from Windows Startup
scripts\uninstall-auto-start.bat
```

## 🔧 Manual Control

### Check if bot is running
Open Task Manager (Ctrl+Shift+Esc) → Look for `node.exe` processes

### View bot logs
```bash
cd C:\projects\code
npm start
```

### Restart bot
1. Run `scripts\stop-bot.bat`
2. Run `scripts\start-bot-hidden.vbs`

## 📍 Auto-Start File Location

```
C:\Users\[YourUsername]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\DiscordBot.vbs
```

To access quickly:
1. Press `Win + R`
2. Type: `shell:startup`
3. Press Enter

## ⚙️ How It Works

1. **VBS Script** runs silently in background (no console window)
2. **Changes to project directory**: `C:\projects\code`
3. **Runs command**: `npm start`
4. **Bot starts automatically** on every Windows login

## 🛑 Disable Auto-Start

### Option 1: Use uninstall script
```bash
scripts\uninstall-auto-start.bat
```

### Option 2: Delete manually
1. Press `Win + R`
2. Type: `shell:startup`
3. Delete `DiscordBot.vbs`

## 🔄 Re-enable Auto-Start

```bash
scripts\install-auto-start.bat
```

## 📊 Status

✅ **Auto-start**: Enabled  
✅ **Bot status**: Running (8 Node.js processes)  
✅ **Location**: C:\projects\code  
✅ **Mode**: Hidden (no console window)  

## 🐛 Troubleshooting

### Bot doesn't start automatically
1. Check if VBS file exists: `shell:startup`
2. Check file path in VBS: `C:\projects\code`
3. Test manually: `wscript scripts\start-bot-hidden.vbs`

### Bot crashes on startup
1. Check logs: `cd C:\projects\code && npm start`
2. Verify .env file exists with valid tokens
3. Check Node.js version: `node --version` (should be 18+)

### Multiple bot instances running
```bash
scripts\stop-bot.bat
wscript scripts\start-bot-hidden.vbs
```

## 💡 Tips

- Bot runs in **hidden mode** (no console window)
- Check Task Manager for `node.exe` processes
- Bot auto-restarts on Windows reboot
- Logs saved in `logs/` folder
- Use `stop-bot.bat` before making code changes

---

**Bot is ready to run 24/7! 🚀**
