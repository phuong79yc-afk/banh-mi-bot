# 🗑️ EMOJI MANAGEMENT SCRIPTS

Scripts PowerShell để quản lý emoji trong Discord server.

---

## 📋 DANH SÁCH SCRIPTS

### 1. `delete-all-emojis.ps1`
Xóa **TẤT CẢ** emoji trong Discord server (cẩn thận!)

### 2. `delete-specific-emojis.ps1`
Xóa **chỉ các emoji cũ** dựa trên danh sách ID cũ trong code

---

## 🚀 CÁCH SỬ DỤNG

### Option 1: Xóa TẤT CẢ emoji (Không khuyến khích)

```powershell
# Chạy script
.\scripts\delete-all-emojis.ps1

# Script sẽ:
# 1. Kết nối Discord bot
# 2. Liệt kê tất cả emoji
# 3. Đợi 5 giây để bạn có thể Ctrl+C hủy
# 4. Xóa tất cả emoji (delay 500ms mỗi emoji)
```

⚠️ **CẢNH BÁO:** Script này sẽ xóa TOÀN BỘ emoji, bao gồm cả emoji không liên quan đến bot!

---

### Option 2: Xóa CHỈ emoji cũ (Khuyến khích) ⭐

#### Bước 1: Xem trước (Dry Run)
```powershell
# Xem danh sách emoji sẽ bị xóa mà không xóa thật
.\scripts\delete-specific-emojis.ps1 -DryRun

# Output:
# 🔍 DRY RUN - Danh sách emoji sẽ bị xóa:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. success (ID: 1547154783465508894)
# 2. error (ID: 1547155697358217216)
# 3. loading (ID: 1547154056210812970)
# ...
```

#### Bước 2: Xóa thật
```powershell
# Xóa các emoji cũ
.\scripts\delete-specific-emojis.ps1

# Script sẽ:
# 1. Tìm 50 emoji cũ trong server
# 2. Đợi 5 giây để xác nhận
# 3. Xóa từng emoji (delay 500ms)
# 4. Báo cáo kết quả
```

---

## 📊 OUTPUT MẪU

### Delete Specific Emojis (Success)

```
========================================
  XÓA EMOJI CŨ KHỎI DISCORD SERVER
========================================

📋 Danh sách emoji cũ: 50 emoji

✅ Bot đã kết nối: BanhCuonBot#1234

🎯 Server: My Discord Server
📊 Server ID: 123456789012345678

🔍 Tìm thấy 46 emoji cũ cần xóa
📊 Tổng emoji hiện tại: 46
➡️  Còn lại sau khi xóa: 0

⚠️  BẠN CÓ CHẮC MUỐN XÓA 46 EMOJI CŨ KHÔNG?
   Bot sẽ đợi 5 giây... Nhấn Ctrl+C để hủy!

🚀 Bắt đầu xóa emoji cũ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [1/46] Đã xóa: success
✅ [2/46] Đã xóa: error
✅ [3/46] Đã xóa: loading
...
✅ [46/46] Đã xóa: info
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 KẾT QUẢ:
   ✅ Đã xóa: 46 emoji
   📊 Emoji còn lại: 0
   🆓 Slots trống: 50/50

🎉 HOÀN TẤT! Bây giờ có thể upload 50 emoji mới!
```

---

## ⚙️ YÊU CẦU

### 1. Bot Token
File `.env` phải có `DISCORD_BOT_TOKEN`:
```env
DISCORD_BOT_TOKEN=your_bot_token_here
```

### 2. Bot Permissions
Bot cần quyền:
- ✅ **Manage Emojis and Stickers** (quản lý emoji)
- ✅ **View Channels** (xem server)

### 3. Node.js & Discord.js
```bash
# Đã có nếu bot đang chạy
npm install
```

---

## 🛡️ AN TOÀN

### Script có tính năng bảo vệ:

1. ⏱️ **5 giây delay** - Cho phép Ctrl+C hủy trước khi xóa
2. 🐌 **500ms delay** giữa mỗi lần xóa - Tránh Discord rate limit
3. 🔍 **Dry Run mode** - Xem trước không xóa thật
4. 📊 **Chi tiết logs** - Biết chính xác emoji nào được xóa
5. ❌ **Error handling** - Báo lỗi nếu không xóa được emoji nào

### Nếu muốn hủy:
- Nhấn **Ctrl+C** trong 5 giây đầu
- Script sẽ dừng ngay lập tức

---

## 🔧 TROUBLESHOOTING

### Lỗi: "Cannot find module 'discord.js'"
```bash
npm install
```

### Lỗi: "DISCORD_BOT_TOKEN không được set"
Kiểm tra file `.env` có token chưa

### Lỗi: "Missing Permissions"
Bot cần quyền **Manage Emojis and Stickers** trong server

### Lỗi: "Rate limited"
Discord giới hạn 50 requests/phút. Script đã có delay 500ms.
Nếu vẫn bị, tăng delay lên 1000ms trong code.

---

## 🎯 WORKFLOW KHUYẾN NGHỊ

### Bước 1: Xem trước
```powershell
.\scripts\delete-specific-emojis.ps1 -DryRun
```

### Bước 2: Xóa emoji cũ
```powershell
.\scripts\delete-specific-emojis.ps1
```

### Bước 3: Kiểm tra
Vào Discord > Server Settings > Emoji để verify

### Bước 4: Upload emoji mới
Upload 50 emoji mới theo hướng dẫn trong `EMOJI-UPLOAD-LIST.md`

### Bước 5: Update code
Copy emoji IDs vào `src/config/emojis.ts`

### Bước 6: Build & Test
```bash
npm run build
npm start
```

---

## 💡 TIPS

- ✅ Chạy **Dry Run** trước để chắc chắn
- ✅ Dùng `delete-specific-emojis.ps1` thay vì `delete-all-emojis.ps1`
- ✅ Backup emoji trước khi xóa (screenshot hoặc export)
- ✅ Test trên server test trước khi chạy trên production
- ✅ Có thể chỉnh sửa list `OLD_EMOJI_IDS` trong script nếu cần

---

## 📝 NOTES

- Scripts chỉ xóa emoji trong **server đầu tiên** mà bot join
- Nếu bot ở nhiều server, sửa code để chỉ định `GUILD_ID`
- Emoji bị xóa **KHÔNG THỂ KHÔI PHỤC** - hãy cẩn thận!
- Rate limit Discord: ~50 emojis/phút với delay 500ms

---

**Made with ❤️ by Bánh Cuốn Bot Team**
