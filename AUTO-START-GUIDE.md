# 🚀 Auto-Start Bot Guide

## Option 1: PM2 (Khuyến nghị - Professional)

PM2 là process manager chuyên nghiệp, tự động:
- ✅ Start bot khi khởi động Windows
- ✅ Restart bot khi crash
- ✅ Log management
- ✅ Monitor performance

### Setup PM2:

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Build bot
npm run build

# 3. Start bot với PM2
npm run pm2:start

# 4. Setup auto-start on Windows boot
npm run pm2:startup
# Copy command PM2 đưa ra và chạy trong PowerShell Administrator

# 5. Save current process list
npm run pm2:save

# Done! Bot sẽ tự động bật khi khởi động Windows
```

### Quản lý bot với PM2:

```bash
# Xem status
npm run pm2:status

# Xem logs real-time
npm run pm2:logs

# Restart bot
npm run pm2:restart

# Stop bot
npm run pm2:stop

# Remove from PM2
pm2 delete discord-bot
```

---

## Option 2: Windows Task Scheduler (Đơn giản hơn)

### Bước 1: Tạo Shortcut
1. Right-click `auto-start-bot.bat` → Create shortcut
2. Copy shortcut

### Bước 2: Add to Startup Folder
1. Press `Win + R`
2. Gõ: `shell:startup`
3. Paste shortcut vào folder này

Bot sẽ tự động start khi login Windows!

---

## Option 3: NSSM (Windows Service - Advanced)

NSSM biến bot thành Windows Service:

```bash
# 1. Download NSSM: https://nssm.cc/download
# 2. Extract to C:\nssm\

# 3. Install service (PowerShell Administrator)
cd C:\nssm\win64
.\nssm.exe install DiscordBot "C:\Program Files\nodejs\node.exe" "C:\projects\code\dist\index.js"

# 4. Configure working directory
.\nssm.exe set DiscordBot AppDirectory "C:\projects\code"

# 5. Configure auto-restart
.\nssm.exe set DiscordBot AppExit Default Restart

# 6. Start service
.\nssm.exe start DiscordBot
```

### Manage NSSM Service:

```bash
# Start
sc start DiscordBot

# Stop
sc stop DiscordBot

# Restart
sc restart DiscordBot

# Remove
.\nssm.exe remove DiscordBot confirm
```

---

## Khuyến nghị:

- **Development:** Không cần auto-start, chạy manual
- **Production (PC cá nhân):** Dùng PM2
- **Production (Server):** Dùng NSSM hoặc PM2

---

## Troubleshooting:

**Bot không start:**
- Check logs: `npm run pm2:logs`
- Check port 3001 có bị chiếm: `netstat -ano | findstr :3001`
- Kill process: `taskkill /PID <pid> /F`

**Bot crash liên tục:**
- Check error logs
- Verify .env file exists
- Check Discord token còn valid

**PM2 không start on boot:**
- Run `pm2 startup` again trong PowerShell Administrator
- Run `pm2 save` sau khi start bot thành công
