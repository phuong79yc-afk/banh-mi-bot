# 🎨 Discord No Embed Border Theme

Theme BetterDiscord để ẩn viền trái của embed messages trong Discord.

## 📸 Preview

**Trước khi dùng theme:**
```
┃ Embed Title
┃ Embed Description
┃ Fields...
```
← Có viền màu bên trái

**Sau khi dùng theme:**
```
  Embed Title
  Embed Description
  Fields...
```
← Không có viền!

---

## 🚀 Cài đặt

### Bước 1: Cài BetterDiscord

1. Download BetterDiscord: https://betterdiscord.app/
2. Chạy installer và làm theo hướng dẫn
3. Khởi động lại Discord

### Bước 2: Áp dụng theme

**CÁCH 1 - Import Theme File (Khuyến nghị):**

1. Mở Discord Settings → **BetterDiscord** → **Themes**
2. Click **"Open Themes Folder"**
3. Copy file `discord-no-embed-border.theme.css` vào folder
4. Quay lại Discord, bật theme **"No Embed Border"**
5. Reload Discord (Ctrl+R)

**CÁCH 2 - Custom CSS:**

1. Mở Discord Settings → **BetterDiscord** → **Custom CSS**
2. Copy toàn bộ code từ file `.theme.css`
3. Paste vào Custom CSS editor
4. Click **Save** và reload Discord (Ctrl+R)

---

## 🛠️ Tùy chỉnh

### Ẩn viền chỉ cho bot cụ thể

Tìm dòng này trong CSS:

```css
[data-author-id="YOUR_BOT_ID"] [class*="embedFull"] {
    border-left: none !important;
}
```

Thay `YOUR_BOT_ID` bằng Discord ID của bot bạn.

**Cách lấy Bot ID:**
1. Bật Developer Mode: Settings → Advanced → Developer Mode
2. Click phải vào bot → Copy ID

### Tùy chỉnh màu nền embed

```css
[class*="embedFull"] {
    background-color: rgba(47, 49, 54, 0.6) !important;
}
```

Đổi giá trị RGBA để thay đổi màu nền.

### Tùy chỉnh bo tròn góc

```css
[class*="embedFull"] {
    border-radius: 8px !important;
}
```

Tăng/giảm giá trị để bo tròn nhiều hơn/ít hơn.

---

## ❓ Xử lý lỗi

### Theme không hoạt động sau khi Discord update?

Discord thường xuyên thay đổi class names. Làm theo:

1. Bấm **F12** để mở DevTools
2. Click vào tab **Elements**
3. Click vào một embed message
4. Tìm class name mới (vd: `embedFull-abc123`)
5. Sửa trong CSS:

```css
.embedFull-abc123 {
    border-left: none !important;
}
```

### Viền vẫn hiện?

Thử dùng `!important` và các selector backup:

```css
[class*="embedFull"] {
    border-left: none !important;
    border-left-width: 0 !important;
    border-left-color: transparent !important;
}
```

### Chỉ một số embed bị ẩn viền?

Class name có thể khác nhau giữa các loại embed. Thêm:

```css
.embedWrapper__8f5af,
.embedFull__8dc21,
[class*="embed"] {
    border-left: none !important;
}
```

---

## 🔥 Tips & Tricks

### 1. Kết hợp với Bot Settings

Bot nên dùng màu embed tối (`0x2F3136`) để viền ít nổi bật hơn cho user không dùng theme:

```javascript
.setColor(0x2F3136) // Màu nền Discord
```

### 2. Ẩn thumbnail của embed

```css
[class*="embedThumbnail"] {
    display: none !important;
}
```

### 3. Ẩn footer của embed

```css
[class*="embedFooter"] {
    display: none !important;
}
```

### 4. Compact embed (giảm padding)

```css
[class*="embedFull"] {
    padding: 8px !important;
}
```

---

## ⚠️ Lưu ý

- ❌ **Theme này chỉ hoạt động cho người cài BetterDiscord**
- ❌ **Người khác vẫn thấy embed có viền bình thường**
- ❌ **BetterDiscord vi phạm Discord ToS** (dùng rủi ro riêng)
- ✅ **Bot không cần thay đổi gì**, chỉ người dùng cài theme
- ✅ **Theme hoạt động với tất cả embed**, không chỉ của bot bạn

---

## 🤝 Support

- Discord Server: [Link server của bạn]
- GitHub Issues: [Link GitHub repo]
- Bot Invite: [Link invite bot]

---

## 📝 License

MIT License - Tự do sử dụng và chỉnh sửa.

---

## 🎯 Alternative: Không cần BetterDiscord

Nếu không muốn dùng BetterDiscord, bot có thể:

1. **Gửi message thường** thay vì embed (không có viền)
2. **Dùng màu embed tối** `0x2F3136` (viền mờ nhất)
3. **Tạo ảnh canvas** rồi gửi (giống embed nhưng là ảnh)

Xem bot code trong `src/handlers/prefixCommandHandler.ts` để biết cách implement.

---

Made with ❤️ by Supporter Bot Team
