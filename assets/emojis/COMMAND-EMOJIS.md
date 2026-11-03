# 🎮 Emoji Suggestions for Bot Commands

## 🤖 AI Module
- `/ai` - 🤖 (Robot face - AI chat)
- `/ai-memory view` - 💭 (Thought bubble - conversation history)
- `/ai-memory clear` - 🗑️ (Trash - clear memory)
- `/image` - 🖼️ (Picture frame - AI image generation)

## 😴 AFK Module
- `/afk` - 💤 (Zzz - away from keyboard)
- `/afk-remove` - 👋 (Wave - back online)
- `/afk-list` - 📋 (Clipboard - list AFK users)

## ⚙️ Management Module
- `/manage status` - 📊 (Chart - bot status)
- `/manage health` - 🏥 (Hospital - health check)
- `/manage modules` - 📦 (Package - module list)
- `/manage module` - 🔄 (Reload - module control)
- `/manage commands` - 📝 (Memo - command list)
- `/manage welcome` - 👋 (Wave - welcome settings)
- `/manage goodbye` - 😢 (Sad - goodbye settings)
- `/manage setting` - ⚙️ (Gear - server settings)
- `/manage audit` - 📜 (Scroll - audit logs)
- `/manage backup` - 💾 (Floppy disk - backup now)
- `/manage backups` - 📁 (Folder - backup list)
- `/manage schedule` - ⏰ (Alarm - schedule tasks)

## 👑 Custom Role Module
- `/customrole-admin-enable` - ✅ (Check - enable feature)
- `/customrole-admin-disable` - ❌ (X - disable feature)
- `/customrole-admin-color-palette` - 🎨 (Palette - color restrictions)
- `/customrole-admin-create` - ➕ (Plus - create role)
- `/customrole-admin-manage` - 🛠️ (Wrench - manage roles)
- `/customrole create` - 🎭 (Theater mask - create personal role)
- `/customrole edit` - ✏️ (Pencil - edit role)
- `/customrole delete` - 🗑️ (Trash - delete role)
- `/customrole list` - 📋 (Clipboard - list roles)
- `/customrole info` - ℹ️ (Info - role details)

## 💎 Economy Module
- `/balance` - 💰 (Money bag - check balance)
- `/work` - ⛏️ (Pickaxe - earn coins)
- `/daily` - 📅 (Calendar - daily reward)
- `/transfer` - 💸 (Money with wings - send coins)
- `/leaderboard` - 🏆 (Trophy - top users)
- `/shop` - 🛒 (Shopping cart - view shop)
- `/buy` - 💳 (Credit card - purchase item)
- `/inventory` - 🎒 (Backpack - your items)

## 📜 Quest Module
- `/quest` - 🗺️ (Map - view quests)
- `/quest-claim` - ✅ (Check - claim reward)
- `/quest-admin-create` - ➕ (Plus - create quest)
- `/quest-admin-list` - 📋 (List - manage quests)
- `/quest-admin-delete` - 🗑️ (Trash - remove quest)

## 🎵 TikTok Module
- `/tiktok` - 🎵 (Music note - TikTok embed)
- Auto-embed - 🎬 (Clapper - video detection)

## 🏰 Generator Module
- `/generator-create` - 🏗️ (Construction - create generator)
- `/generator-list` - 📋 (List - view generators)
- `/generator-collect` - 💎 (Diamond - collect resources)
- `/generator-upgrade` - ⬆️ (Up arrow - upgrade generator)
- `/generator-info` - ℹ️ (Info - generator details)

## 🎁 Giveaway Module
- `/giveaway start` - 🎉 (Party - start giveaway)
- `/giveaway end` - 🏁 (Checkered flag - end early)
- `/giveaway reroll` - 🔄 (Reload - pick new winner)
- `/giveaway list` - 📋 (List - active giveaways)

## 📊 Leveling Module
- `/rank` - 📊 (Chart - your rank)
- `/leaderboard` - 🏆 (Trophy - top members)
- `/level-config` - ⚙️ (Gear - level settings)

## 🔔 Reminder Module
- `/reminder set` - ⏰ (Alarm - set reminder)
- `/reminder list` - 📋 (List - your reminders)
- `/reminder delete` - 🗑️ (Trash - remove reminder)

## 🎫 Ticket Module
- `/ticket create` - 🎫 (Ticket - open ticket)
- `/ticket close` - 🔒 (Lock - close ticket)
- `/ticket config` - ⚙️ (Gear - ticket settings)

## 🛠️ Utility Module
- `/ping` - 🏓 (Ping pong - latency test)
- `/info` - ℹ️ (Info - bot information)
- `/serverinfo` - 🏰 (Castle - server details)
- `/userinfo` - 👤 (User - member info)
- `/avatar` - 🖼️ (Picture - avatar display)
- `/poll` - 📊 (Chart - create poll)
- `/say` - 💬 (Speech - bot message)
- `/embed` - 📝 (Memo - create embed)

## 🎮 Fun Module
- `/8ball` - 🎱 (8-ball - fortune telling)
- `/coinflip` - 🪙 (Coin - heads or tails)
- `/dice` - 🎲 (Dice - roll dice)
- `/meme` - 😂 (Joy - random meme)
- `/joke` - 🤣 (Laugh - random joke)

## 🛡️ Moderation Module
- `/warn` - ⚠️ (Warning - warn user)
- `/kick` - 👢 (Boot - kick member)
- `/ban` - 🔨 (Hammer - ban user)
- `/mute` - 🔇 (Mute - timeout user)
- `/unmute` - 🔊 (Speaker - remove timeout)
- `/clear` - 🧹 (Broom - clear messages)
- `/lockdown` - 🔒 (Lock - lock channel)

## 👑 VIP Module
- `/vip` - 💎 (Diamond - VIP status)
- `/vip-give` - 🎁 (Gift - grant VIP)
- `/vip-remove` - ❌ (X - revoke VIP)
- `/vip-list` - 📋 (List - VIP members)

## 📢 Announcement Module
- `/announce` - 📢 (Megaphone - send announcement)
- `/announce-embed` - 📰 (Newspaper - embed announcement)

## 🎨 Server Generator Module
- `/server-generator design` - 🏗️ (Construction - design server)
- `/server-generator create` - ✨ (Sparkles - create server)
- `/server-generator templates` - 📚 (Books - view templates)

---

## 🎯 Implementation Notes

**File to update:** `src/config/emojis.ts`

```typescript
export const commandEmojis = {
  // AI Module
  ai: '🤖',
  aiMemory: '💭',
  image: '🖼️',
  
  // AFK Module
  afk: '💤',
  afkRemove: '👋',
  afkList: '📋',
  
  // Economy
  balance: '💰',
  work: '⛏️',
  daily: '📅',
  shop: '🛒',
  buy: '💳',
  inventory: '🎒',
  
  // Quests
  quest: '🗺️',
  questClaim: '✅',
  
  // TikTok
  tiktok: '🎵',
  
  // Management
  manage: '⚙️',
  status: '📊',
  health: '🏥',
  
  // Custom Roles
  customRole: '🎭',
  
  // Utility
  ping: '🏓',
  info: 'ℹ️',
  serverinfo: '🏰',
  
  // Fun
  dice: '🎲',
  coinflip: '🪙',
  eightball: '🎱',
  
  // Moderation
  warn: '⚠️',
  kick: '👢',
  ban: '🔨',
  mute: '🔇',
  
  // VIP
  vip: '💎',
  
  // Giveaway
  giveaway: '🎉',
  
  // Success/Error
  success: '✅',
  error: '❌',
  warning: '⚠️',
  loading: '⏳',
};
```

**Usage in commands:**
```typescript
.setDescription(`${commandEmojis.daily} Nhận phần thưởng hàng ngày`)
```
