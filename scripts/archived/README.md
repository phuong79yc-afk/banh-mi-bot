# 🤖 AUTO UPLOAD EMOJI TO DISCORD

## ✅ **SCRIPT TỰ ĐỘNG UPLOAD 36 EMOJI LÊN DISCORD**

Script này sẽ tự động:
- ✅ Upload tất cả 36 PNG files lên Discord server
- ✅ Đặt tên emoji theo convention (`:music_play:`, `:mod_ban:`, etc.)
- ✅ Skip emoji đã tồn tại (không duplicate)
- ✅ Tạo file `src/utils/customEmoji.ts` với tất cả emoji IDs
- ✅ Rate limit safe (1 giây giữa mỗi upload)

---

## 🚀 **CÁCH SỬ DỤNG**

### **Bước 1: Lấy Bot Token và Guild ID**

#### 1.1. Lấy DISCORD_TOKEN:
1. Vào [Discord Developer Portal](https://discord.com/developers/applications)
2. Chọn application của bot
3. Vào **Bot** tab
4. Click **Reset Token** → Copy token

#### 1.2. Lấy GUILD_ID:
1. Mở Discord
2. Vào **User Settings** → **Advanced**
3. Bật **Developer Mode**
4. Right-click vào server name → **Copy Server ID**

### **Bước 2: Thêm vào .env**

Mở file `.env` và thêm:

```env
DISCORD_TOKEN=your_bot_token_here
GUILD_ID=your_server_id_here
```

**Lưu ý:** Bot phải có permission `MANAGE_EMOJIS_AND_STICKERS` trong server!

### **Bước 3: Chạy Script**

```bash
npm run upload-emoji
```

Hoặc:

```bash
tsx scripts/uploadEmoji.ts
```

---

## 📊 **OUTPUT MẪU**

```
🎨 Starting emoji upload process...

📋 Checking existing emojis...

Found 0 existing emojis

✅ play.png            → :music_play: (ID: 1234567890123456789)
✅ pause.png           → :music_pause: (ID: 1234567890123456790)
✅ stop.png            → :music_stop: (ID: 1234567890123456791)
...
⏭️  ban.png             → :mod_ban: already exists (ID: 1234567890123456792)
...

============================================================
📊 UPLOAD SUMMARY
============================================================
✅ Uploaded: 30
⏭️  Skipped: 6 (already exists)
❌ Failed: 0
📦 Total: 36
============================================================

📝 Generating customEmoji.ts file...
✅ File created: src/utils/customEmoji.ts

🎉 Done! All emojis uploaded successfully!

💡 Usage:
   import { CUSTOM_EMOJI } from "./utils/customEmoji";
   .setTitle(`${CUSTOM_EMOJI.MUSIC_PLAY} Now Playing`)
```

---

## 📦 **36 EMOJI SẼ UPLOAD**

### 🎵 Music (11):
- `music_play`, `music_pause`, `music_stop`, `music_skip`
- `music_prev`, `music_loop`, `music_shuffle`, `music_volume`
- `music_queue`, `music_lyrics`, `music`

### 🛡️ Moderation (10):
- `mod_ban`, `mod_kick`, `mod_mute`, `mod_warn`
- `mod_timeout`, `mod_lock`, `mod_unlock`, `mod_slowmode`
- `mod_purge`, `mod_nuke`

### ⚙️ Utility (7):
- `util_settings`, `util_help`, `util_ping`, `util_stats`
- `util_avatar`, `util_search`, `util_filter`

### 💰 Economy (3):
- `eco_wallet`, `eco_coin`, `eco_gift`

### ℹ️ Status (5):
- `status_success`, `status_error`, `status_loading`
- `status_info`, `ticket`

---

## 📄 **FILE TỰ ĐỘNG TẠO**

Script sẽ tạo file: `src/utils/customEmoji.ts`

```typescript
// Auto-generated custom emoji mappings
// Generated at: 2024-01-01T00:00:00.000Z
// Total emojis: 36

export const CUSTOM_EMOJI = {
  // 🎵 Music Commands
  MUSIC_PLAY: '<:music_play:1234567890123456789>',
  MUSIC_PAUSE: '<:music_pause:1234567890123456790>',
  // ... all other emojis

  // 🛡️ Moderation Commands
  MOD_BAN: '<:mod_ban:1234567890123456791>',
  // ... etc
} as const;

// Type-safe emoji keys
export type CustomEmojiKey = keyof typeof CUSTOM_EMOJI;

// Helper function to get emoji by key
export function getEmoji(key: CustomEmojiKey): string {
  return CUSTOM_EMOJI[key];
}

// All emoji IDs for reference
export const EMOJI_IDS = {
  MUSIC_PLAY: '1234567890123456789',
  MUSIC_PAUSE: '1234567890123456790',
  // ... etc
} as const;
```

---

## 🤖 **CÁCH DÙNG TRONG BOT**

### Import:

```typescript
import { CUSTOM_EMOJI } from './utils/customEmoji';
```

### Sử dụng trong embed:

```typescript
const embed = new EmbedBuilder()
  .setTitle(`${CUSTOM_EMOJI.MUSIC_PLAY} Now Playing`)
  .setDescription(`${CUSTOM_EMOJI.MUSIC_QUEUE} 5 songs in queue`)
  .addFields({
    name: `${CUSTOM_EMOJI.UTIL_STATS} Stats`,
    value: 'Some stats'
  });
```

### Sử dụng trong message:

```typescript
await interaction.reply({
  content: `${CUSTOM_EMOJI.SUCCESS} Song added!`,
  ephemeral: true
});
```

---

## ⚠️ **LƯU Ý**

### 1. Bot Permissions:
Bot cần permission `MANAGE_EMOJIS_AND_STICKERS` trong server!

Cách bật:
1. Server Settings → Roles
2. Tìm role của bot
3. Bật **Manage Emojis and Stickers**

### 2. Server Emoji Limits:
- **Free Server**: 50 emoji slots
- **Level 1 Boost**: 100 emoji slots
- **Level 2 Boost**: 150 emoji slots
- **Level 3 Boost**: 250 emoji slots

Script upload 36 emoji → **Fits in free server!** ✅

### 3. Rate Limiting:
Script tự động chờ 1 giây giữa mỗi upload để tránh rate limit.

### 4. Skip Duplicates:
Nếu emoji đã tồn tại, script sẽ skip và dùng ID hiện có.

---

## 🐛 **TROUBLESHOOTING**

### Error: "Missing Permissions"
**Giải pháp:** Bật permission `MANAGE_EMOJIS_AND_STICKERS` cho bot

### Error: "GUILD_ID not found"
**Giải pháp:** Thêm `GUILD_ID` vào file `.env`

### Error: "DISCORD_TOKEN invalid"
**Giải pháp:** Reset token trong Developer Portal và update `.env`

### Error: "discord-emoji-png folder not found"
**Giải pháp:** Chạy `npm run upload-emoji` từ folder root của project

### Error: "Maximum number of emojis reached"
**Giải pháp:** Server đã đầy emoji slots. Delete emoji cũ hoặc boost server.

---

## 📁 **FOLDER STRUCTURE**

```
c:\projects\code\
├── scripts/
│   ├── uploadEmoji.ts        ← Upload script
│   └── README.md             ← This file
├── discord-emoji-png/
│   └── 36 PNG files          ← Emoji files
├── src/utils/
│   └── customEmoji.ts        ← Auto-generated
└── .env                      ← Config file
```

---

## ✅ **CHECKLIST**

Trước khi chạy:
- [ ] Đã cài `tsx` (`npm install tsx --save-dev`)
- [ ] Đã có folder `discord-emoji-png/` với 36 PNG files
- [ ] Đã thêm `DISCORD_TOKEN` vào `.env`
- [ ] Đã thêm `GUILD_ID` vào `.env`
- [ ] Bot đã được invite vào server
- [ ] Bot có permission `MANAGE_EMOJIS_AND_STICKERS`

Sau khi chạy:
- [ ] Check console output - tất cả ✅ success
- [ ] Check Discord server - emoji đã hiện lên
- [ ] Check file `src/utils/customEmoji.ts` đã tạo
- [ ] Test emoji trong commands
- [ ] Done! 🎉

---

## 🚀 **READY!**

Chạy ngay:

```bash
npm run upload-emoji
```

**3-5 phút là xong 36 emoji!** ⚡✨
