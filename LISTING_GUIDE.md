# 📝 Bot Listing Guide - Hướng Dẫn Đăng Bot

Hướng dẫn chi tiết để đăng bot lên các trang listing phổ biến nhất.

---

## 🏆 Top.gg (Discord Bot List)

**Link**: https://top.gg/

### Bước 1: Tạo tài khoản
1. Truy cập https://top.gg/
2. Đăng nhập bằng Discord account
3. Verify email nếu chưa

### Bước 2: Submit Bot
1. Click "Add Bot" ở góc trên
2. Hoặc truy cập: https://top.gg/bot/submit

### Bước 3: Điền thông tin

**Basic Information:**
- Bot ID: `1498700400327528498`
- Bot Username: `Bánh Mì Bot`
- Short Description: (Copy từ `SHORT_DESCRIPTION.txt`)

**Long Description:** (Copy từ `BOT_DESCRIPTION.md`)

**Prefix:** `/` (slash commands)

**Website:** `https://banh-mi-bot.onrender.com`

**Invite Link:**
```
https://discord.com/api/oauth2/authorize?client_id=1498700400327528498&permissions=8&scope=bot%20applications.commands
```

**Support Server:** `https://discord.gg/phocaviet`

**GitHub:** `https://github.com/phuong79yc-afk/banh-mi-bot`

**Tags** (chọn tối đa 6):
- Moderation
- Music
- Leveling
- Economy
- Social
- Utility

**Avatar/Icon:** Upload bot avatar (220px-Ghast_JE3_BE3.webp)

**Banner:** (Optional - tạo banner 1920x1080 với branding)

### Bước 4: API Integration (Optional - For stats)

**Webhook URL:** `https://banh-mi-bot.onrender.com/api/topgg/webhook`

**Authorization Header:** (Generate secret key)

Code để post stats (add vào `src/index.ts`):
```typescript
import axios from 'axios';

// Post stats to top.gg every 30 minutes
setInterval(async () => {
  if (!client.user) return;
  
  try {
    await axios.post(`https://top.gg/api/bots/${client.user.id}/stats`, {
      server_count: client.guilds.cache.size,
      shard_count: 0 // Single shard
    }, {
      headers: {
        'Authorization': process.env.TOPGG_TOKEN || ''
      }
    });
    console.log('✅ Posted stats to top.gg');
  } catch (err) {
    console.error('❌ Failed to post stats:', err);
  }
}, 1800000); // 30 minutes
```

---

## 🌐 Discord.bots.gg

**Link**: https://discord.bots.gg/

### Thông tin cần điền:
- Bot Name: `Bánh Mì Bot`
- Short Description: (giống top.gg)
- Long Description: (giống top.gg)
- Invite URL: (giống top.gg)
- Website: `https://banh-mi-bot.onrender.com`
- Support Server: `https://discord.gg/phocaviet`

### Tags:
- Moderation, Music, Leveling, Economy, Utility

---

## 📋 DiscordBotList.com

**Link**: https://discordbotlist.com/

Tương tự như trên, điền các thông tin:
- Bot ID
- Description (short & long)
- Invite link
- Support server
- Tags

---

## 🎯 Discord.me

**Link**: https://discord.me/servers

Submit server support để quảng bá bot.

---

## 📊 Bots.ondiscord.xyz

**Link**: https://bots.ondiscord.xyz/

Submit bot với:
- Description
- Invite link
- Support server
- Features list

---

## 🚀 Tips để tăng ranking

### 1. Tối ưu Description
✅ **Làm:**
- Dùng emoji để highlight features
- List rõ ràng các tính năng chính
- Thêm ảnh screenshots
- Include use cases
- Highlight unique features (TikTok link fixer)

❌ **Tránh:**
- Spam emoji
- Copy description từ bot khác
- Quá ngắn hoặc quá dài
- Không có cấu trúc

### 2. Screenshots & Media
- Banner đẹp (1920x1080)
- Screenshots commands
- GIF demo features
- Video tutorial (YouTube)

### 3. Active Support
- Reply nhanh trong support server
- Fix bugs thường xuyên
- Update features mới
- Announce updates

### 4. Encourage Voting
Thêm vote reminder trong bot:
```typescript
// Remind users to vote every 12h
if (Math.random() < 0.1) { // 10% chance
  const voteEmbed = new EmbedBuilder()
    .setColor(0xFF1744)
    .setTitle('⭐ Vote for Bánh Mì Bot!')
    .setDescription(
      'Giúp bot phát triển bằng cách vote trên top.gg!\n' +
      '[🗳️ Vote Now](https://top.gg/bot/1498700400327528498/vote)\n\n' +
      'Cảm ơn bạn đã ủng hộ! ❤️'
    );
  
  await interaction.followUp({ embeds: [voteEmbed], ephemeral: true });
}
```

### 5. Regular Updates
- Post changelogs
- Announce new features
- Show you're actively developing
- Respond to feedback

---

## 📈 SEO & Marketing

### Keywords để optimize:
- Discord bot
- Discord moderation bot
- Discord music bot
- TikTok Discord bot
- Vietnamese Discord bot
- Free Discord bot
- Multipurpose bot

### Social Media:
- Twitter/X: Post updates, screenshots
- YouTube: Tutorial videos
- TikTok: Short demos
- Reddit: r/discordapp, r/Discord_Bots

---

## ✅ Checklist trước khi submit

- [ ] Bot verified (>75 servers)
- [ ] Website online và working
- [ ] Support server active
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Bot avatar uploaded
- [ ] Description proofread
- [ ] Invite link tested
- [ ] Commands working properly
- [ ] No major bugs
- [ ] 99%+ uptime

---

## 🎯 Mục tiêu

**Short-term (1-3 months):**
- [ ] List trên 5+ bot directories
- [ ] Reach 75+ servers (for verified badge)
- [ ] 100+ votes on top.gg
- [ ] Active support server (50+ members)

**Mid-term (3-6 months):**
- [ ] 500+ servers
- [ ] Featured on top.gg
- [ ] 1,000+ votes
- [ ] Partnership với Discord communities

**Long-term (6-12 months):**
- [ ] 1,000+ servers
- [ ] Apply for Discord Partner Program
- [ ] 10,000+ active users
- [ ] Monetization (premium features)

---

## 📞 Support

Cần giúp đỡ? Join support server: https://discord.gg/phocaviet

Good luck! 🚀
