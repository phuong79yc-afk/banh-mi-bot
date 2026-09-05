# ⚡ Quick Start Guide

## 🚀 Bot đã sẵn sàng!

### ✅ Setup hoàn tất:
- ✅ **15 commands** đã deploy
- ✅ **Auto-start** on Windows boot
- ✅ **Hot reload** khi dev
- ✅ **Dashboard** production-ready
- ✅ **Desktop shortcuts** (4 shortcuts)

---

## 🎮 Desktop Shortcuts

### **Start Bot** 🟢
Bật bot trong chế độ hidden (không hiện console)

### **Stop Bot** 🔴  
Tắt bot và free port 3001

### **Restart Bot** 🔄
Restart nhanh (stop + start)

### **Update Bot Commands** ⚡
Build + Deploy + Restart (sau khi sửa code)

---

## 📝 Development Quick Guide

### **1. Edit Code**
```bash
# Mở file commands
src/commands/ping.ts
src/commands/play.ts
# ... sửa code
```

### **2. Test với Hot Reload**
```bash
# Terminal: Run dev mode
npm run dev

# Save file → Commands auto-reload
# Test trong Discord ngay lập tức
```

### **3. Deploy to Discord**
```bash
# Desktop: Double-click "Update Bot Commands"
# Or script:
scripts\update-commands.bat
```

---

## 🛠️ Common Tasks

### Check bot status
```powershell
Get-NetTCPConnection -LocalPort 3001
```

### View logs
```bash
# Stop hidden bot first
scripts\stop-bot.bat

# Run with logs
npm start
```

### Kill port 3001
```bash
scripts\kill-port-3001.bat
```

### Rebuild everything
```bash
npm run build
node dist/deploy-commands.js
scripts\restart-bot.bat
```

---

## 📋 15 Commands Available

### 🤖 AI
- `/ai` - Chat với AI
- `/ai-usage` - Check usage stats

### 🎵 Music  
- `/play` - Phát nhạc
- `/pause` - Tạm dừng
- `/skip` - Bỏ qua
- `/stop` - Dừng
- `/queue` - Xem queue

### 👮 Moderation
- `/ban` - Ban member
- `/kick` - Kick member
- `/timeout` - Timeout member
- `/purge` - Xóa nhiều tin nhắn

### ℹ️ Utility
- `/ping` - Check latency
- `/help` - Help menu
- `/info` - Bot info
- `/avatar` - View avatar

---

## 🎨 Dashboard

**URL**: http://localhost:3001

Features:
- Bot statistics (servers, users, commands)
- Music player controls
- Queue management
- Real-time updates

---

## 🔧 Configuration

### Environment Variables
Edit `.env` file:
```env
DISCORD_TOKEN=your_token
CLIENT_ID=your_client_id
GROQ_API_KEY_1=key1
GROQ_API_KEY_2=key2
GOOGLE_API_KEY=gemini_key
PORT=3001
```

### Custom Emojis
Edit `src/utils/customEmoji.ts` để update emoji IDs

---

## 📚 Documentation

- **README.md** - Project overview
- **DEV-WORKFLOW.md** - Development workflow chi tiết
- **STRUCTURE.md** - Project structure
- **AUTO-START-GUIDE.md** - Auto-start setup
- **scripts/AUTO-START-README.md** - Scripts guide

---

## 🐛 Troubleshooting

### Bot không start
```bash
# Check logs
npm start

# Verify .env file exists
# Check Discord token is valid
```

### Commands không hiện trong Discord
```bash
# Re-deploy commands
scripts\update-commands.bat

# Wait 1 hour for global commands to sync
```

### Port 3001 bị chiếm
```bash
scripts\kill-port-3001.bat
scripts\start-bot-hidden.vbs
```

### TypeScript errors
```bash
# Rebuild
npm run build

# Check for syntax errors in src/
```

---

## 💡 Pro Tips

✅ **Dùng `npm run dev`** cho development (hot reload)  
✅ **Deploy commands** chỉ khi test xong  
✅ **Commit code** sau khi deploy thành công  
✅ **Global commands** mất ~1h để sync  
✅ **Guild commands** (test server) instant  

---

## 🚀 Next Steps

### Add more commands
1. Create `src/commands/new-command.ts`
2. Code your command
3. Save → Hot reload trong dev
4. Double-click "Update Bot Commands"

### Deploy to production
1. Push code to GitHub
2. Setup server (VPS, Railway, Render)
3. Add environment variables
4. Run `npm start` or use PM2

### Add features
- More AI integrations
- Economy system
- Level/XP system
- Custom moderation
- Analytics

---

**Bot is ready to rock! 🎸**

For detailed guides, check other `.md` files in the project root.
