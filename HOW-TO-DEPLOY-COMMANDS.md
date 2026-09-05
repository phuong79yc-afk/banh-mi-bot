# 🚀 Hướng Dẫn Deploy Commands

Bot có 7 commands nhưng **phải deploy lên Discord** thì mới dùng được!

## ⚡ Cách 1: Deploy Instant (5 giây) - KHUYẾN NGHỊ

**Bước 1:** Lấy GUILD_ID (Server ID)
1. Mở Discord
2. Vào Settings > Advanced > Bật **Developer Mode**
3. Right-click vào server của bạn
4. Chọn **Copy ID**

**Bước 2:** Thêm vào `.env`
```env
GUILD_ID=1234567890123456789
```

**Bước 3:** Deploy
```bash
# Windows
scripts\deploy-instant.bat

# Linux/Mac
node scripts/deploy-all-commands.js
```

✅ Commands sẽ hiện trong **VÀI GIÂY**!

---

## 🌍 Cách 2: Deploy Global (1 giờ)

Nếu KHÔNG có GUILD_ID trong `.env`:

```bash
node scripts/deploy-all-commands.js
```

⏰ Commands sẽ mất **~1 giờ** để hiện toàn bộ Discord servers!

---

## 📋 Commands Hiện Có

### AI Commands (Ai cũng dùng được)
- `/ai` - Chat với AI (có memory, chọn model)
- `/ai-memory view` - Xem lịch sử chat
- `/ai-memory clear` - Xóa lịch sử
- `/ai-models` - List các AI models có sẵn

### Utility Commands (Ai cũng dùng được)
- `/ping` - Check độ trễ bot
- `/help` - Xem hướng dẫn
- `/info` - Thông tin bot
- `/serverinfo` - Thông tin server

---

## 🔧 Thêm Commands Mới

Sau khi thêm command trong code:

1. Build lại bot:
```bash
npm run build
```

2. Deploy lại:
```bash
node scripts/deploy-all-commands.js
```

3. Restart bot:
```bash
# Ctrl+C để tắt bot cũ
node dist/index.js
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **Tất cả commands KHÔNG CẦN QUYỀN** - Ai cũng dùng được
2. Nếu muốn giới hạn quyền, thêm vào code:
   ```js
   .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
   ```

3. **GUILD_ID deploy:** Commands chỉ hiện trong 1 server
4. **Global deploy:** Commands hiện toàn bộ servers mà bot join

---

## 🐛 Troubleshooting

### Commands không hiện trong Discord?

1. Kiểm tra đã deploy chưa:
```bash
node scripts/deploy-all-commands.js
```

2. Nếu deploy global - chờ 1 giờ

3. Nếu deploy guild - check GUILD_ID đúng chưa

4. Kick bot ra khỏi server và invite lại với link:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### Commands cũ vẫn còn?

Xóa toàn bộ commands cũ:
```bash
node src/delete-all-commands.ts
```

Sau đó deploy lại bình thường.

---

## 📞 Support

- Bot đang chạy: Check terminal có hiện "Bot online" không
- Commands lỗi: Check terminal có error message không
- AI không hoạt động: Check có GROQ_API_KEYS trong `.env` không
