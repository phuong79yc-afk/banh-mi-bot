# 🚀 Auto-Start Discord Bot

Bot tự động khởi động khi Windows starts up.

## ✅ Đã cài đặt

Bot sẽ tự động start khi bạn login Windows!

Launcher: `scripts\dev-tools\start-bot-hidden.vbs`

## 📋 Available Scripts

### Start Bot (Hidden)
```bash
# Start bot without showing window
scripts\dev-tools\start-bot-hidden.vbs
```

Double-click file hoặc:
```cmd
wscript scripts\dev-tools\start-bot-hidden.vbs
```

### Stop Bot
```bash
# Stop all bot processes
scripts\dev-tools\stop-bot.bat
```

### Windows Startup
To start the bot at login, create a Windows shortcut to `scripts\dev-tools\start-bot-hidden.vbs` in the Startup folder (`Win + R`, then `shell:startup`).

## 🔧 Manual Control

### Check if bot is running
Open Task Manager (Ctrl+Shift+Esc) → Look for `node.exe` processes

### View bot logs
```bash
cd <project-root>
npm start
```

### Restart bot
1. Run `scripts\dev-tools\stop-bot.bat`
2. Run `scripts\dev-tools\start-bot-hidden.vbs`

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
2. **Changes to the project directory** relative to the VBS file
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

✅ **Mode**: Hidden (no console window)  

## 🐛 Troubleshooting

### Bot doesn't start automatically
1. Check if VBS file exists: `shell:startup`
2. Test manually: `wscript scripts\dev-tools\start-bot-hidden.vbs`

### Bot crashes on startup
1. Check logs: run `npm start` from the project root
2. Verify .env file exists with valid tokens
3. Check Node.js version: `node --version` (should be 18+)

### Multiple bot instances running
```bash
scripts\dev-tools\stop-bot.bat
wscript scripts\dev-tools\start-bot-hidden.vbs
```

## 💡 Tips

- Bot runs in **hidden mode** (no console window)
- Check Task Manager for `node.exe` processes
- Bot auto-restarts on Windows reboot
- Logs saved in `logs/` folder
- Use `scripts\dev-tools\stop-bot.bat` before making code changes

---

**Bot is ready to run 24/7! 🚀**
