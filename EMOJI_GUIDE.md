# 🎨 Hướng Dẫn Upload Custom SVG/PNG Emoji

Bot hiện đang dùng emoji Unicode mặc định. Để có emoji đẹp hơn giống Bot Keto, làm theo hướng dẫn sau:

## 📋 Bước 1: Tìm/Tạo SVG Icons

### Option 1: Download Free Icons
- [Flaticon](https://www.flaticon.com/) - Free icons
- [Icons8](https://icons8.com/) - Free PNG/SVG
- [Heroicons](https://heroicons.com/) - Free SVG icons
- [Feather Icons](https://feathericons.com/) - Simple SVG icons

### Option 2: Tự tạo với AI
Dùng AI generate icons:
```
Prompt: "Create a simple heart icon for TikTok likes, red color, minimal style, transparent background, SVG format"
```

### Icons cần thiết:
- ❤️ **heart** - Cho likes (màu đỏ/hồng)
- 💬 **comment** - Cho comments (màu xanh/trắng)
- 🔁 **share** - Cho shares (màu vàng/xanh)
- 👁️ **view** - Cho views (màu xám/trắng)
- ♫ **music** - Cho music (màu trắng/đen)
- 🎵 **tiktok** - TikTok logo (màu đen/trắng)

## 📤 Bước 2: Upload Emoji vào Discord Server

### Yêu cầu:
- ✅ Bạn phải có quyền **Manage Emoji** trong server
- ✅ File size < 256KB
- ✅ Format: PNG, JPG, GIF, hoặc SVG (Discord auto-convert to PNG)
- ✅ Server chưa đạt limit emoji (regular: 50, boosted varies)

### Cách upload:

1. **Vào Server Settings:**
   - Click tên server (góc trên bên trái)
   - Chọn "Server Settings"
   - Chọn "Emoji"

2. **Upload Emoji:**
   - Click "Upload Emoji"
   - Chọn file icon
   - Đặt tên: `heart`, `comment`, `share`, `view`, `music`, `tiktok`
   - Click "Upload"

3. **Lấy Emoji ID:**
   - Trong chat, gõ: `\:heart:` (hoặc tên emoji bạn đặt)
   - Gửi message, Discord sẽ show: `<:heart:1234567890123456789>`
   - Copy phần `1234567890123456789` (đây là Emoji ID)

## 🔧 Bước 3: Cập Nhật Code

Mở file `src/utils/linkPreview.ts` và tìm phần này:

```typescript
// SVG Icons for embed
const SVG_ICONS = {
  heart: '<:heart:1234567890>',      // ❌ Thay ID này
  comment: '<:comment:1234567890>',  // ❌ Thay ID này
  share: '<:share:1234567890>',      // ❌ Thay ID này
  view: '<:view:1234567890>',        // ❌ Thay ID này
  music: '<:music:1234567890>',      // ❌ Thay ID này
  tiktok: '<:tiktok:1234567890>'     // ❌ Thay ID này
};
```

### Thay đổi thành:

```typescript
// SVG Icons for embed
const SVG_ICONS = {
  heart: '<:heart:YOUR_HEART_EMOJI_ID>',      // ✅ ID từ Discord
  comment: '<:comment:YOUR_COMMENT_ID>',      // ✅ ID từ Discord
  share: '<:share:YOUR_SHARE_ID>',            // ✅ ID từ Discord
  view: '<:view:YOUR_VIEW_ID>',               // ✅ ID từ Discord
  music: '<:music:YOUR_MUSIC_ID>',            // ✅ ID từ Discord
  tiktok: '<:tiktok:YOUR_TIKTOK_ID>'          // ✅ ID từ Discord
};
```

### Sau đó cập nhật phần dùng icons:

Tìm phần này trong hàm `createKetoStyleEmbed`:

```typescript
// Format stats with icons (fallback to emoji if SVG not available)
const heartIcon = '❤️'; // Can replace with SVG_ICONS.heart if emoji uploaded
const commentIcon = '💬';
const shareIcon = '🔁';
const viewIcon = '👁️';
const musicIcon = '♫';
```

### Thay thành:

```typescript
// Use custom emojis
const heartIcon = SVG_ICONS.heart;
const commentIcon = SVG_ICONS.comment;
const shareIcon = SVG_ICONS.share;
const viewIcon = SVG_ICONS.view;
const musicIcon = SVG_ICONS.music;
```

## 🚀 Bước 4: Build & Restart Bot

```bash
npm run build
```

Sau đó restart bot (nếu dùng nodemon thì tự restart).

## 📸 Ví dụ Format

### Trước khi có custom emoji:
```
❤️ 1.2K  💬 45  🔁 12  👁️ 5.6K
```

### Sau khi có custom emoji:
```
[HEART_ICON] 1.2K  [COMMENT_ICON] 45  [SHARE_ICON] 12  [VIEW_ICON] 5.6K
```

## 🎯 Tips:

1. **Màu sắc phù hợp:**
   - Heart: Đỏ/Hồng (#FF0050)
   - Comment: Xanh dương (#00A5FF)
   - Share: Vàng/Cam (#FFB800)
   - View: Xám/Trắng (#FFFFFF)
   - Music: Đen/Trắng (#000000)

2. **Size recommended:** 128x128px hoặc 256x256px

3. **Transparent background** để đẹp hơn

4. **Simple design** - Không quá chi tiết

## ❓ Troubleshooting:

### Emoji không hiện:
- Kiểm tra Emoji ID đúng chưa
- Kiểm tra bot có quyền "Use External Emoji" không
- Kiểm tra emoji có bị xóa trong server không

### "Invalid Form Body":
- File size quá lớn (> 256KB)
- Format không hỗ trợ
- Tên emoji trùng với emoji có sẵn

### Bot crash sau khi update:
- Check syntax trong `SVG_ICONS`
- Phải có dấu ngoặc kép `'` hoặc `"`
- Format đúng: `<:name:ID>`

---

**Nếu không muốn dùng custom emoji, code hiện tại vẫn hoạt động bình thường với Unicode emoji!** 🎉
