# 🔧 Development Workflow

## 📝 Khi sửa code commands

### **Step 1: Edit Code**
Mở và sửa file trong `src/commands/`

Example:
```typescript
// src/commands/ping.ts
export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply('Pong! 🏓');
}
```

### **Step 2: Test Locally (Hot Reload)**

#### Option A: Đã chạy `npm run dev`
- ✅ File tự động compile khi save
- ✅ Bot tự động reload command
- ✅ Test ngay trong Discord (commands trong memory)
- ❌ Không hiển thị trong Discord UI autocomplete

#### Option B: Production mode
```bash
npm run build
npm start
```
- Bot sẽ reload commands từ `dist/`
- Commands vẫn chưa deploy lên Discord

### **Step 3: Deploy to Discord** 

Sau khi test xong, deploy commands:

#### 🖥️ **Desktop Shortcut (Recommended)**
Double-click: **"Update Bot Commands"**

#### 📝 **Script**
```bash
scripts\update-commands.bat
```

#### ⚡ **Manual**
```bash
npm run build
node dist/deploy-commands.js
scripts\restart-bot.bat
```

### **Step 4: Verify**
Commands sẽ hiện trong Discord sau ~1 phút (global commands có thể mất 1 giờ)

---

## 🎯 Quick Reference

### Development Mode (Hot Reload)
```bash
# Terminal 1: Watch TypeScript
npm run dev

# Terminal 2: Logs
# Bot tự động reload khi save
```

**Pros:**
- ✅ Instant reload
- ✅ No deploy needed for testing
- ✅ Fast iteration

**Cons:**
- ❌ Commands không hiện trong Discord UI
- ❌ Phải type full command name

### Production Deploy
```bash
# Build + Deploy + Restart
scripts\update-commands.bat
```

**Pros:**
- ✅ Commands hiện trong Discord UI
- ✅ Autocomplete hoạt động
- ✅ Production ready

**Cons:**
- ⏱️ Mất ~1-2 phút mỗi lần deploy

---

## 🚀 Recommended Workflow

### **During Development:**
1. Run `npm run dev` (để hot reload)
2. Edit commands
3. Save file → auto reload
4. Test trong Discord bằng cách type full command
5. Iterate nhanh

### **Before Commit:**
1. Test xong xuôi
2. Double-click **"Update Bot Commands"**
3. Verify commands hiện trong Discord UI
4. Commit code

### **Production:**
1. Push code lên GitHub
2. Server auto-deploy (nếu setup CI/CD)
3. Hoặc manual: pull + `update-commands.bat`

---

## 📂 Files Structure

```
src/commands/          # TypeScript source
├── ping.ts
├── play.ts
└── ...

dist/commands/         # Compiled JavaScript
├── ping.js
├── play.js
└── ...
```

**Hot Reload** watches: `dist/commands/*.js`  
**Deploy** reads: `dist/commands/*.js`

---

## 🛠️ Troubleshooting

### Commands không reload
```bash
# Restart bot
scripts\restart-bot.bat
```

### Commands không hiện trong Discord
```bash
# Re-deploy
scripts\update-commands.bat
```

### Port 3001 bị chiếm
```bash
scripts\kill-port-3001.bat
```

### Build errors
```bash
# Check TypeScript errors
npm run build
```

---

## 💡 Tips

- ✅ Dùng **dev mode** để test nhanh
- ✅ Deploy **sau khi test xong**
- ✅ Commit code **sau khi deploy**
- ✅ Global commands mất ~1h để sync toàn bộ servers
- ✅ Guild commands (test server) instant

---

## 🎮 Desktop Shortcuts

- **Start Bot** - Bật bot
- **Stop Bot** - Tắt bot
- **Restart Bot** - Restart nhanh
- **Update Bot Commands** - Build + Deploy + Restart

**All-in-one workflow! 🚀**
