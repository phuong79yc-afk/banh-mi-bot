# 📚 Hướng dẫn sử dụng Command Emojis

## 🎯 Cách áp dụng vào code

### 1. Import emoji config

```typescript
import { commandEmojis, withEmoji, getCommandEmoji } from '../../config/commandEmojis';
```

### 2. Sử dụng trong SlashCommandBuilder

#### Cách 1: Trực tiếp
```typescript
const dailyCommand = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('⭐ Điểm danh hôm nay để nhận xu')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('💎 Chọn loại phần thưởng')
        .setRequired(false)
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    // ...
  }
};
```

#### Cách 2: Dùng helper function
```typescript
import { commandEmojis, withEmoji } from '../../config/commandEmojis';

const dailyCommand = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription(withEmoji('daily', 'Điểm danh hôm nay để nhận xu'))
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription(withEmoji('diamond', 'Chọn loại phần thưởng'))
        .setRequired(false)
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    // ...
  }
};
```

### 3. Sử dụng trong Embeds

```typescript
import { EmbedBuilder } from 'discord.js';
import { commandEmojis } from '../../config/commandEmojis';

const embed = new EmbedBuilder()
  .setColor(0x00ff00)
  .setTitle(`${commandEmojis.daily} Phần thưởng hàng ngày`)
  .setDescription(`Bạn đã nhận được **1,000** ${commandEmojis.diamond} xu!`)
  .addFields(
    { 
      name: `${commandEmojis.success} Thành công`, 
      value: 'Streak: 7 ngày liên tục' 
    },
    { 
      name: `${commandEmojis.info} Thông tin`, 
      value: `Quay lại sau 24 giờ ${commandEmojis.loading}` 
    }
  )
  .setFooter({ text: `${commandEmojis.pickaxe} Minecraft Bot` });

await interaction.reply({ embeds: [embed] });
```

### 4. Sử dụng trong Messages

```typescript
import { commandEmojis } from '../../config/commandEmojis';

await interaction.reply({
  content: `${commandEmojis.success} Bạn đã nhận được phần thưởng hàng ngày!\n` +
           `${commandEmojis.diamond} **+1,000 xu**\n` +
           `${commandEmojis.info} Chuỗi điểm danh: **7 ngày**`,
  ephemeral: true
});
```

### 5. Sử dụng trong Components V2

```typescript
import { ContainerBuilder, TextDisplayBuilder } from 'discord.js';
import { commandEmojis } from '../../config/commandEmojis';

const container = new ContainerBuilder()
  .setAccentColor(0x00ff00)
  .addTextDisplayComponents(
    new TextDisplayBuilder()
      .setContent(`${commandEmojis.daily} **Phần thưởng hàng ngày**\n\n` +
                 `Bạn đã nhận được ${commandEmojis.diamond} **1,000 xu**!\n` +
                 `-# ${commandEmojis.info} Chuỗi: 7 ngày liên tục`)
  );
```

### 6. Sử dụng trong Button Labels

```typescript
import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { commandEmojis } from '../../config/commandEmojis';

const button = new ButtonBuilder()
  .setCustomId('claim-daily')
  .setLabel(`${commandEmojis.daily} Nhận thưởng`)
  .setStyle(ButtonStyle.Primary);
```

---

## 🎨 Ví dụ hoàn chỉnh: Daily Command

```typescript
import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { commandEmojis, withEmoji } from '../../config/commandEmojis';

export default class DailyModule {
  name = 'daily-module';
  description = 'Hệ thống điểm danh hàng ngày';
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    this.registerCommands();
  }

  private registerCommands() {
    // ===== DAILY COMMAND =====
    const dailyCommand = {
      data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription(withEmoji('daily', 'Điểm danh hôm nay để nhận xu'))
        .addBooleanOption(option =>
          option
            .setName('silent')
            .setDescription(withEmoji('info', 'Chỉ hiển thị kết quả cho bạn'))
            .setRequired(false)
        ),
      
      execute: async (interaction: ChatInputCommandInteraction) => {
        const silent = interaction.options.getBoolean('silent') ?? false;
        
        try {
          // Giả lập logic điểm danh
          const reward = 1000;
          const streak = 7;
          const nextClaimTime = Date.now() + 24 * 60 * 60 * 1000;
          
          const embed = new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle(`${commandEmojis.daily} Phần thưởng hàng ngày`)
            .setDescription(
              `${commandEmojis.success} Bạn đã điểm danh thành công!\n\n` +
              `${commandEmojis.diamond} **Nhận được:** +${reward.toLocaleString()} xu\n` +
              `${commandEmojis.info} **Chuỗi:** ${streak} ngày liên tục\n` +
              `${commandEmojis.loading} **Điểm danh tiếp:** <t:${Math.floor(nextClaimTime / 1000)}:R>`
            )
            .setThumbnail('https://i.imgur.com/minecraft-chest.png')
            .setFooter({ 
              text: `${commandEmojis.pickaxe} ${interaction.user.username}`,
              iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();
          
          await interaction.reply({ 
            embeds: [embed], 
            ephemeral: silent 
          });
          
        } catch (error) {
          const errorEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`${commandEmojis.error} Lỗi`)
            .setDescription(
              `${commandEmojis.warning} Bạn đã điểm danh hôm nay rồi!\n` +
              `-# ${commandEmojis.info} Quay lại sau 24 giờ`
            );
          
          await interaction.reply({ 
            embeds: [errorEmbed], 
            ephemeral: true 
          });
        }
      },
    };

    // ===== DAILY STATS COMMAND =====
    const dailyStatsCommand = {
      data: new SlashCommandBuilder()
        .setName('daily-stats')
        .setDescription(withEmoji('dailyStats', 'Xem thống kê điểm danh của bạn'))
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription(withEmoji('info', 'Xem thống kê của người khác'))
            .setRequired(false)
        ),
      
      execute: async (interaction: ChatInputCommandInteraction) => {
        const targetUser = interaction.options.getUser('user') ?? interaction.user;
        
        // Giả lập dữ liệu
        const stats = {
          currentStreak: 7,
          longestStreak: 15,
          totalClaims: 42,
          totalEarned: 42000,
          lastClaim: Date.now() - 12 * 60 * 60 * 1000,
        };
        
        const embed = new EmbedBuilder()
          .setColor(0x00d4ff)
          .setTitle(`${commandEmojis.dailyStats} Thống kê điểm danh`)
          .setDescription(`**Người dùng:** ${targetUser.username}`)
          .addFields(
            {
              name: `${commandEmojis.daily} Chuỗi hiện tại`,
              value: `**${stats.currentStreak}** ngày`,
              inline: true
            },
            {
              name: `${commandEmojis.info} Chuỗi dài nhất`,
              value: `**${stats.longestStreak}** ngày`,
              inline: true
            },
            {
              name: `${commandEmojis.success} Tổng điểm danh`,
              value: `**${stats.totalClaims}** lần`,
              inline: true
            },
            {
              name: `${commandEmojis.diamond} Tổng nhận được`,
              value: `**${stats.totalEarned.toLocaleString()}** xu`,
              inline: false
            }
          )
          .setThumbnail(targetUser.displayAvatarURL())
          .setFooter({ text: `${commandEmojis.pickaxe} Minecraft Bot` })
          .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
      },
    };

    this.commands.set('daily', dailyCommand);
    this.commands.set('daily-stats', dailyStatsCommand);
  }
}
```

---

## 💡 Best Practices

### 1. Consistency (Nhất quán)
✅ **Đúng:** Luôn dùng emoji `commandEmojis.daily` cho daily system
❌ **Sai:** Đổi emoji liên tục giữa các lệnh

### 2. Relevance (Liên quan)
✅ **Đúng:** `${commandEmojis.diamond}` cho xu/currency
❌ **Sai:** `${commandEmojis.sword}` cho xu

### 3. Visibility (Rõ ràng)
✅ **Đúng:** Emoji đơn giản, dễ nhìn
❌ **Sai:** Emoji phức tạp, khó phân biệt

### 4. Context (Ngữ cảnh)
✅ **Đúng:** `${commandEmojis.success}` cho thành công
❌ **Sai:** `${commandEmojis.error}` cho thành công

---

## 🔧 Migration từ code cũ

### Trước (Old):
```typescript
.setDescription('Điểm danh hôm nay để nhận xu')
```

### Sau (New):
```typescript
import { withEmoji } from '../../config/commandEmojis';

.setDescription(withEmoji('daily', 'Điểm danh hôm nay để nhận xu'))
```

### Script migration tự động:
```bash
# Tìm tất cả file cần update
grep -r "setDescription" src/modules/*/entry_point.ts

# Backup trước khi thay đổi
cp -r src/modules src/modules.backup

# Manual update từng file...
```

---

## 📊 Thống kê Emoji đã sử dụng

### Top 10 Emoji phổ biến nhất:
1. ⭐ - Daily/Achievement
2. 💰 - Balance/Currency
3. 💎 - Gems/Premium
4. ✅ - Success
5. ❌ - Error/Delete
6. ℹ️ - Information
7. ⚙️ - Settings
8. 📋 - List/View
9. 🎒 - Inventory
10. 🏪 - Shop

---

## 🎨 Custom Emoji cho Discord Server

Nếu muốn tạo custom emoji pixel art riêng cho server:

### Tools:
- **Piskel** (https://www.piskelapp.com/) - Free online pixel editor
- **Aseprite** ($19.99) - Professional pixel art tool
- **GIMP** (Free) - General image editor

### Specifications:
- **Size:** 128x128px hoặc 256x256px
- **Format:** PNG với background trong suốt
- **Grid:** 16x16 hoặc 32x32 pixel
- **Colors:** Limited palette (Minecraft style)
- **File size:** Dưới 256KB

### Upload to Discord:
1. Server Settings → Emoji → Upload
2. Tên emoji: `daily_reward`, `minecraft_diamond`, etc.
3. Sử dụng: `<:daily_reward:123456789>`

### Example:
```typescript
const customEmojis = {
  dailyReward: '<:daily_reward:1234567890>',
  minecraftDiamond: '<:minecraft_diamond:0987654321>',
};

.setDescription(`${customEmojis.dailyReward} Điểm danh hôm nay`)
```

---

## 📝 Checklist triển khai

- [ ] Import `commandEmojis.ts` vào tất cả module files
- [ ] Update tất cả `.setDescription()` với emoji
- [ ] Update tất cả embed titles với emoji
- [ ] Update button labels với emoji
- [ ] Test hiển thị trên mobile và desktop
- [ ] Commit changes với message rõ ràng
- [ ] Deploy và test trên production
- [ ] Thu thập feedback từ users

---

**Generated:** Manual guide  
**Last Updated:** 2024  
**Maintained by:** Bot Development Team

