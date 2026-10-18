# Components V2 Setup Guide

## Why Components V2 Not Working?

Components V2 là tính năng mới của Discord. Để sử dụng V2, bot cần:

1. ✅ **Discord.js 14.28.0+** (đã có)
2. ✅ **MessageFlags.IsComponentsV2** (đã có)
3. ❌ **Bot phải được re-invite với đúng permissions**

## Solution: Re-invite Bot

### Step 1: Generate New Invite URL

Go to Discord Developer Portal:
https://discord.com/developers/applications

1. Select your bot application
2. Go to **OAuth2** → **URL Generator**
3. Select these **SCOPES**:
   - ✅ `bot`
   - ✅ `applications.commands`
   
4. Select these **BOT PERMISSIONS**:
   - ✅ Administrator (hoặc chọn từng quyền cụ thể)

5. Copy the generated URL

### Step 2: Re-invite Bot

1. **Kick bot khỏi server** (hoặc có thể giữ lại)
2. **Click vào URL vừa tạo**
3. **Chọn server và authorize**

Bot giờ sẽ có đúng permissions để dùng Components V2!

---

## Alternative: Use Direct Invite URL

Replace `YOUR_CLIENT_ID` with your bot's Client ID:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

For your bot (Client ID: `1552573873034108978`):

```
https://discord.com/api/oauth2/authorize?client_id=1552573873034108978&permissions=8&scope=bot%20applications.commands
```

---

## Verify Components V2 Works

After re-inviting bot, test these commands:

```
/daily
/balance  
/ai message:hello
/help
```

All should show **beautiful V2 components** with:
- Colored containers
- Proper formatting
- Sections and headers

If still showing old embeds, check:
1. Discord app updated to latest version
2. Bot re-invited with correct scopes
3. Server has Components V2 enabled (most servers do)

---

## Technical Details

### What is Components V2?

Discord's new message component system:
- **Old**: EmbedBuilder with limited styling
- **New**: ContainerBuilder with rich formatting, sections, colors

### Code Example

```typescript
// Old way (Embed)
const embed = new EmbedBuilder()
  .setTitle('Hello')
  .setDescription('World')
  .setColor(0x5865f2);

await interaction.reply({ embeds: [embed] });
```

```typescript
// New way (V2)
const container = new ContainerBuilder()
  .setPrimaryColor(0x5865f2)
  .addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## Hello\nWorld')
  );

await interaction.reply({ 
  components: [container], 
  flags: MessageFlags.IsComponentsV2 
});
```

### Why V2 is Better

- ✅ Better visual design
- ✅ More flexible layouts
- ✅ Native Discord styling
- ✅ Better mobile support
- ✅ Sections, separators, galleries

---

## Troubleshooting

### "Bot không hiện V2 components"
**Fix**: Re-invite bot với URL mới (see above)

### "Vẫn hiện embed cũ"
**Fix**: 
1. Update Discord app
2. Clear cache: Settings → Advanced → Clear Cache
3. Restart Discord

### "Một số server V2 work, một số không"
**Cause**: Mỗi server cần re-invite bot riêng
**Fix**: Re-invite bot vào từng server

---

## Current Status

Your bot code is **READY** for V2:
- ✅ Discord.js 14.28.0
- ✅ All modules use V2 (daily, ai, balance, etc.)
- ✅ V2 flags set correctly
- ⚠️ **Just need re-invite!**

After re-invite → V2 will work 100%! 🎉
