# 📤 Hướng dẫn Upload Emoji Manual

## ⚠️ Vấn đề với Auto Upload

Discord API `guild.emojis.create()` hiện đang bị block hoặc rate limit rất nghiêm ngặt, khiến script không thể upload được emoji tự động.

**Khuyến nghị: Upload manual qua Discord UI** (nhanh hơn và ổn định hơn)

---

## 📋 **Hướng dẫn Upload Manual (5-10 phút)**

### Bước 1: Mở Folder Emoji
```
C:\projects\code\assets\emojis\
```
Hoặc chạy: `explorer.exe "assets\emojis"`

### Bước 2: Mở Discord Server Settings
1. Right-click vào icon server → **Server Settings**
2. Chọn **Emoji** trong sidebar bên trái
3. Click nút **Upload Emoji** (góc trên bên phải)

### Bước 3: Upload 50 Emoji
1. Click "Upload Emoji"
2. Select file PNG từ folder (có thể chọn nhiều cùng lúc bằng Ctrl+Click)
3. Discord tự động lấy tên từ filename
4. Click "Upload"
5. Lặp lại cho đến hết 50 emoji

**Tips:**
- Có thể upload 10-15 emoji cùng lúc
- Discord tự động detect tên file
- Tổng thời gian: ~5-10 phút

---

## 🔑 **Bước 4: Lấy Emoji IDs**

### Cách 1: Manual (Từng emoji)
Trong Discord chat, gõ:
```
\:success:
```
Kết quả hiển thị:
```
<:success:1234567890123456>
```
Copy số ID: `1234567890123456`

### Cách 2: Dev Tools (Tất cả cùng lúc)
1. Mở Discord trong browser hoặc press `Ctrl+Shift+I` trong Desktop app
2. Console tab, paste code:
```javascript
// Get all emoji IDs
const emojis = {};
document.querySelectorAll('[data-type="emoji"]').forEach(el => {
  const name = el.getAttribute('data-name');
  const id = el.getAttribute('data-id');
  if (name && id) emojis[name] = id;
});
console.log(JSON.stringify(emojis, null, 2));
```
3. Copy JSON output

---

## 📝 **Bước 5: Tạo Config File**

Tạo file: `src/config/emojis.ts`

```typescript
/**
 * Custom Emoji IDs for Discord Bot
 * Generated: 2026-09-02
 */

export const EMOJI_IDS = {
  // Core Status
  success: "1234567890",
  error: "0987654321",
  loading: "1111111111",
  warning: "2222222222",
  info: "3333333333",
  
  // Actions
  settings: "4444444444",
  export: "5555555555",
  delete: "6666666666",
  refresh: "7777777777",
  edit: "8888888888",
  save: "9999999999",
  search: "1010101010",
  add: "2020202020",
  remove: "3030303030",
  copy: "4040404040",
  
  // Categories/Content
  art: "5050505050",
  document: "6060606060",
  folder: "7070707070",
  sparkles: "8080808080",
  chart: "9090909090",
  menu: "1212121212",
  image: "1313131313",
  music: "1414141414",
  video: "1515151515",
  book: "1616161616",
  
  // Social/Community
  user: "1717171717",
  users: "1818181818",
  message: "1919191919",
  bell: "2121212121",
  heart: "2222222222",
  star: "2323232323",
  trophy: "2424242424",
  gift: "2525252525",
  crown: "2626262626",
  shield: "2727272727",
  
  // Tools/Tech
  code: "2828282828",
  terminal: "2929292929",
  database: "3131313131",
  server: "3232323232",
  cloud: "3333333333",
  wifi: "3434343434",
  lock: "3535353535",
  unlock: "3636363636",
  key: "3737373737",
  link: "3838383838",
  
  // Misc
  calendar: "3939393939",
  clock: "4141414141",
  pin: "4242424242",
  tag: "4343434343",
  flag: "4444444444"
} as const;

// Helper function
export function getEmoji(name: keyof typeof EMOJI_IDS): string {
  const id = EMOJI_IDS[name];
  return id ? `<:${name}:${id}>` : '❓';
}

// Export ready-to-use emoji strings
export const emojis = {
  // Core Status
  success: getEmoji('success'),
  error: getEmoji('error'),
  loading: getEmoji('loading'),
  warning: getEmoji('warning'),
  info: getEmoji('info'),
  
  // Actions
  settings: getEmoji('settings'),
  export: getEmoji('export'),
  delete: getEmoji('delete'),
  refresh: getEmoji('refresh'),
  edit: getEmoji('edit'),
  save: getEmoji('save'),
  search: getEmoji('search'),
  add: getEmoji('add'),
  remove: getEmoji('remove'),
  copy: getEmoji('copy'),
  
  // Categories/Content
  art: getEmoji('art'),
  document: getEmoji('document'),
  folder: getEmoji('folder'),
  sparkles: getEmoji('sparkles'),
  chart: getEmoji('chart'),
  menu: getEmoji('menu'),
  image: getEmoji('image'),
  music: getEmoji('music'),
  video: getEmoji('video'),
  book: getEmoji('book'),
  
  // Social/Community
  user: getEmoji('user'),
  users: getEmoji('users'),
  message: getEmoji('message'),
  bell: getEmoji('bell'),
  heart: getEmoji('heart'),
  star: getEmoji('star'),
  trophy: getEmoji('trophy'),
  gift: getEmoji('gift'),
  crown: getEmoji('crown'),
  shield: getEmoji('shield'),
  
  // Tools/Tech
  code: getEmoji('code'),
  terminal: getEmoji('terminal'),
  database: getEmoji('database'),
  server: getEmoji('server'),
  cloud: getEmoji('cloud'),
  wifi: getEmoji('wifi'),
  lock: getEmoji('lock'),
  unlock: getEmoji('unlock'),
  key: getEmoji('key'),
  link: getEmoji('link'),
  
  // Misc
  calendar: getEmoji('calendar'),
  clock: getEmoji('clock'),
  pin: getEmoji('pin'),
  tag: getEmoji('tag'),
  flag: getEmoji('flag')
} as const;
```

---

## 🔧 **Bước 6: Sử dụng trong Code**

```typescript
import { emojis } from './config/emojis';

// Trong embed
const embed = {
  description: `${emojis.success} Hoàn tất!\n${emojis.loading} Đang xử lý...`
};

// Trong select menu
const option = {
  label: 'Export',
  value: 'export',
  emoji: emojis.export
};

// Trong button
new ButtonBuilder()
  .setLabel('Settings')
  .setEmoji(emojis.settings);
```

---

## ✅ **Checklist**

- [ ] Mở folder `assets/emojis/`
- [ ] Upload 50 emoji lên Discord Server Settings
- [ ] Lấy tất cả emoji IDs
- [ ] Tạo file `src/config/emojis.ts` với IDs
- [ ] Import và dùng trong code: `import { emojis } from './config/emojis'`
- [ ] Test bot với custom emoji

---

## 🎉 **Done!**

Sau khi hoàn thành, bot sẽ dùng emoji custom thay vì Unicode emoji! 🚀
