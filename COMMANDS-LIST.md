# 📋 Bot Commands List

**Total: 57 commands** từ **13 modules**

---

## 1️⃣ AFK Module (3 commands)
- `/afk [reason] [silent]` - Set yourself AFK
- `/afk-remove` - Remove your AFK status
- `/afk-list` - List all AFK users in server

## 2️⃣ AI Module (3 commands)
- `/ai` - Chat with AI
- `/ai-memory` - View/manage conversation history
- `/ai-models` - View available AI models

## 3️⃣ Autoresponder Module (6 commands)
- `/autoresponder-add <trigger> <response>` - Add auto response
- `/autoresponder-remove <id>` - Remove auto response
- `/autoresponder-list` - List all autoresponders
- `/autoresponder-view <id>` - View autoresponder details
- `/autoresponder-matchmode <id> <mode>` - Set match mode (exact/contains/startswith/endswith/regex)
- `/autoresponder-placeholders` - Show available placeholders

## 4️⃣ Custom Role Module (7 commands)
- `/customrole-admin-enable [max-roles]` - Enable custom role system
- `/customrole-admin-disable` - Disable system
- `/customrole-admin-color-palette [colors]` - Set allowed colors
- `/customrole-admin-create <user> <name> <color>` - Create custom role for user
- `/customrole-admin-manage` - Manage roles (list/delete)
- `/customrole-admin-migrate <target-guild-id>` - Migrate roles to another server
- `/customrole-admin-terminate` - Delete ALL custom roles

## 5️⃣ Donation Module (7 commands)
- `/donation-enable <channel>` - Enable donation tracking
- `/donation-disable` - Disable donation tracking
- `/donation-add <user> <amount> [message]` - Add donation
- `/donation-subtract <user> <amount> [reason]` - Subtract donation
- `/donation-leaderboard [limit]` - View top donors
- `/donation-stats [user]` - View donation stats
- `/donation-config` - View/manage donation config

## 6️⃣ Games Module (1 command)
- `/gtn-start [min] [max] [attempts]` - Start "Guess The Number" game

## 7️⃣ Giveaway Module (1 command)
- `/giveaway-migrate <target-guild-id>` - Migrate giveaways to another server

## 8️⃣ Minecraft Module (2 commands)
- `/minecraft-server <address>` - Check Minecraft server status with DNS lookup
- `/minecraft-custom-server-banner <address> [title] [color]` - Generate custom server banner

## 9️⃣ Quick Report Module (7 commands + 1 context menu)
- **Context Menu:** `Report Message` - Right-click message to report
- `/quickreport-enable <channel>` - Enable Quick Report system
- `/quickreport-disable` - Disable system
- `/quickreport-config` - Configure settings
- `/quickreport-update <report-id> <status>` - Update report status
- `/quickreport-recent [limit]` - View recent reports
- `/quickreport-check <report-id>` - Check specific report

## 🔟 Snipe Module (2 commands)
- `/snipe [channel] [page]` - Check recent deleted messages
- `/editsnipe [channel] [page]` - Check recent edited messages

## 1️⃣1️⃣ Social Module (7 commands)
- `/kiss [user]` - Kiss someone
- `/hug [user]` - Hug someone
- `/slap [user]` - Slap someone
- `/bite [user]` - Bite someone
- `/pat [user]` - Pat someone
- `/punch [user]` - Punch someone
- `/handhold [user]` - Hold hands with someone

## 1️⃣2️⃣ Sticky Messages Module (7 commands)
- `/sticky-message <channel> <message>` - Set sticky message
- `/sticky-remove <channel>` - Remove sticky message
- `/sticky-mode <channel> <mode>` - Set mode (threshold/inactive)
- `/sticky-threshold <channel> <count>` - Set message threshold (1-500)
- `/sticky-delay <channel> <seconds>` - Set inactive delay (1-15)
- `/sticky-config <channel>` - View sticky config
- `/sticky-list` - List all sticky messages

## 1️⃣3️⃣ Utility Module (4 commands)
- `/poll <question> <options>` - Create a poll
- `/calc <expression>` - Calculate math expression
- `/random [min] [max]` - Generate random number
- `/choose <options>` - Choose between options with animation

---

## 🚀 How to Deploy Commands

### Option 1: Guild Commands (Fast, ~5s)
```powershell
cd c:\projects\code
$env:GUILD_ID='YOUR_GUILD_ID_HERE'
node scripts/deploy-quick.js
```

### Option 2: Global Commands (Slow, ~1 hour to propagate)
```powershell
cd c:\projects\code
Remove-Item Env:\GUILD_ID
node scripts/deploy-quick.js
```

---

## 📝 Notes

- **Guild commands** update instantly but only work in that server
- **Global commands** take ~1 hour to propagate but work in all servers
- Discord API có thể chậm khi deploy nhiều commands (57 commands)
- Nếu timeout, chờ 5-10 phút rồi thử lại
- Commands sẽ tự động xuất hiện khi deploy thành công

---

## ✅ Deployment Status

Bot đang chạy với tất cả 13 modules và 57 commands đã được load.
Chỉ cần deploy lên Discord API để commands xuất hiện trong Discord client.

**Current Guild ID:** `1482354951689605150`
