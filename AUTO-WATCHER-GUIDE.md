# 🔄 Auto Watcher - Auto Build, Deploy & Restart

## ✅ Đã fix và hoạt động!

Watcher tự động build, deploy và restart bot khi bạn thay đổi code trong `src/`.

---

## 🚀 Cách sử dụng:

### **Start watcher:**

```bash
npm run watch:nodemon
```

Hoặc:

```bash
.\scripts\start-watcher.bat
```

### **Stop watcher:**

Nhấn `Ctrl+C` trong terminal watcher.

---

## ⚡ Cách hoạt động:

**Khi bạn save bất kỳ file `.ts` nào trong `src/`:**

1. 🔨 **Build:** `npm run build`
2. 🚀 **Deploy:** `node dist/deploy-commands.js`
3. 🔄 **Restart:** `.\scripts\restart-bot.bat`

**Tất cả tự động trong ~20-30 giây!**

---

## 📁 Files:

- `nodemon-rebuild.json` - Nodemon config
- `scripts/rebuild-on-change.bat` - Rebuild script
- `scripts/watch-and-rebuild.js` - Alternative chokidar watcher (có issue trên Windows)

---

## 🐛 Troubleshooting:

### **Watcher không trigger?**

**Giải pháp 1:** Restart watcher
```bash
Ctrl+C
npm run watch:nodemon
```

**Giải pháp 2:** Manual rebuild
```bash
npm run build
.\scripts\restart-bot.bat
```

### **Build lỗi?**

Check terminal output để xem lỗi TypeScript.

### **Deploy lỗi?**

Check Discord bot token trong `.env`.

### **Restart lỗi?**

Check xem bot có đang chạy không:
```bash
pm2 status
```

---

## 💡 Tips:

- **Watcher dùng nodemon** (không phải chokidar) vì Windows file system events
- **Delay 2 giây** để tránh trigger nhiều lần khi save nhiều files
- **Chỉ watch `src/**/*.ts`** - không watch `dist/`, `node_modules/`, `client/`
- **Type `rs` trong terminal** để force restart manually

---

## 🎯 Verified working:

✅ File save detection  
✅ Auto build  
✅ Auto deploy  
✅ Auto restart  
✅ Error handling  
✅ Queue multiple changes  

**Status: WORKING! 🎉**
