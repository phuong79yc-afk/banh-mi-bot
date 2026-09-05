# Economy Animated Emojis Setup Guide

## 📥 Tải Emoji Animated

Bạn cần tải các animated emoji (GIF) cho Economy system:

### 🎨 Nguồn Miễn Phí:

1. **emoji.gg** - https://emoji.gg/
   - Search: "coin animated", "money", "bank", "wallet"
   - Download các emoji bạn thích

2. **Tenor GIF** - https://tenor.com/
   - Search: "spinning coin gif", "money rain gif", "bank gif"
   - Download as GIF

3. **Giphy** - https://giphy.com/stickers
   - Search economy-related stickers
   - Download as GIF

### 📋 Danh Sách Emoji Cần Thiết:

1. **anim_coin** - Coin quay tròn (spinning coin)
2. **anim_money** - Tiền rơi/bay (money flying)
3. **anim_wallet** - Ví animation (animated wallet)
4. **anim_bank** - Ngân hàng (bank building)
5. **anim_stonks** - Mũi tên lên (stonks arrow)
6. **anim_rich** - Giàu có (rich/money rain)
7. **anim_work** - Làm việc (working animation)
8. **anim_daily** - Lịch (calendar flip)

## 🔧 Cách Upload:

### Option 1: Upload Thủ Công
1. Vào Discord server của bạn
2. Server Settings → Emoji
3. Upload từng file GIF
4. Copy emoji code từ Discord
5. Paste vào `customEmoji.ts`

### Option 2: Dùng Script (Nếu có emoji files)
```bash
# Đặt các file GIF vào folder: temp_emojis/
# File names: anim_coin.gif, anim_money.gif, etc.

npx tsx scripts/uploadEconomyEmojis.ts
```

## ✅ After Upload:

Update `src/utils/customEmoji.ts`:

```typescript
// 💰 Economy Commands - ANIMATED!
ECO_COIN_ANIM: '<a:anim_coin:YOUR_EMOJI_ID>', // ANIMATED!
ECO_MONEY_ANIM: '<a:anim_money:YOUR_EMOJI_ID>', // ANIMATED!
ECO_WALLET_ANIM: '<a:anim_wallet:YOUR_EMOJI_ID>', // ANIMATED!
// ... etc
```

## 🎯 Lưu Ý:

- Server cần **Boost Level 2+** để có nhiều emoji slot
- File GIF phải < 256KB
- Discord giới hạn 50 static + 50 animated emojis (non-boost)
- Boost Level 2: 150 static + 150 animated
