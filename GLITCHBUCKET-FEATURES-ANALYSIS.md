# 📊 GlitchBucket Features Analysis

Based on research from [official language file](https://gist.github.com/tudubucket/940bd5e76e12e52a1ee999ff9be13883) and [Top.gg page](https://top.gg/bot/1103932552701550622).

## 🎯 Core Features

### 1. **💬 Autoresponder System**
- Auto-reply based on keywords
- Match modes: Equal, Contains, Starts With, Ends With
- Case sensitive/insensitive matching
- Support placeholders (user, server, channel, message)
- Max 50 autoresponders per guild
- Commands: add, view, delete, list, matchmode, placeholders

### 2. **🤖 AI Chat**
- Conversation with AI
- Context memory
- Multiple models support

### 3. **📌 Sticky Messages**
- Pin important messages in channels
- Auto-repost when new messages come
- 2 modes: Message Threshold, Chat Inactive Delay
- Custom webhooks support
- Embed support
- Max 3 sticky messages per server
- Allow/disallow mentions

### 4. **🖼️ Illustrations (Pixiv Integration)**
- Search artwork from Pixiv
- Tag search with multiple modes
- Sort options: Popular, Date ascending/descending
- Leaderboard: Daily, Weekly, Monthly
- NSFW filter
- R18/R34 commands

### 5. **⚡ Quick Report System**
- Context menu: "Report this Message"
- Report management (approve/decline)
- Blacklist/whitelist channels/categories
- Auto-delete reports on events
- Max concurrent reports per user
- Report UUID tracking
- Manager role system

### 6. **💰 Donation Tracking**
- Auto-receive donations through currency bots
- Leaderboard system
- Reward roles based on donation amounts
- Multiple receivers support
- Announcement threshold
- Custom donation messages
- Support placeholders

### 7. **🎮 BlocksMC Integration**
- Player statistics tracker
- Game information display
- Rank & guild changelog
- Playtime tracking
- Whitelist system
- Supports: Skywars, Bedwars, etc.

### 8. **🎲 Games**
- Guess The Number
- Round-based gameplay
- Customizable parameters

### 9. **😊 Social Interactions**
- Kiss, Hug, Slap, Bite
- Handhold, Pat, Punch
- Match users
- Anime-style GIFs

### 10. **⚙️ Moderation & Security**
- Anti-cancer nickname (auto-rename bad unicode)
- Lock server invites permanently
- Purge all bans
- AFK system with auto-welcome back
- Snipe deleted/edited messages (28 days history)

### 11. **🇻🇳 Vietnam-Specific Features**
- Power outage lookup (`/outage`)
- Subscribe to power outage notifications
- Provider/subprovider lookup
- Keyword-based notifications

### 12. **🛠️ Utility Commands**
- `/help` - Show commands
- `/information` - Bot stats & info
- `/fack` - Send fack to haters
- `/locale` - Set language (guild/user)
- `/setting` - Various settings

---

## 🔥 Priority Features to Implement

### **Phase 1: Essential** (Tuần 1)
1. ✅ **AI Chat** (Already done)
2. **Autoresponder System**
3. **Sticky Messages**
4. **AFK System**

### **Phase 2: Advanced** (Tuần 2)
5. **Quick Report System**
6. **Donation Tracking**
7. **Snipe (deleted messages)**
8. **Social Interactions**

### **Phase 3: Fun & Games** (Tuần 3)
9. **Illustrations/Artwork search**
10. **Games (GTN)**
11. **Moderation tools**

---

## 📋 Feature Comparison

| Feature | GlitchBucket | Our Bot | Priority |
|---------|--------------|---------|----------|
| AI Chat | ✅ | ✅ | Done |
| Autoresponder | ✅ | ❌ | HIGH |
| Sticky Messages | ✅ | ❌ | HIGH |
| Quick Report | ✅ | ❌ | MEDIUM |
| Donation Tracking | ✅ | ❌ | MEDIUM |
| AFK System | ✅ | ❌ | HIGH |
| Snipe Messages | ✅ | ❌ | MEDIUM |
| Social Interactions | ✅ | ❌ | LOW |
| Illustrations | ✅ | ❌ | LOW |
| Games | ✅ | ❌ | LOW |
| BlocksMC | ✅ | ❌ | SKIP |
| Vietnam Outage | ✅ | ❌ | SKIP |

---

## 🎨 Technical Implementation Notes

### Autoresponder
```typescript
interface Autoresponder {
  trigger: string;
  response: string;
  mode: 'equal' | 'contains' | 'startswith' | 'endswith';
  ignoreCase: boolean;
  guildId: string;
}
```

### Sticky Messages
```typescript
interface StickyMessage {
  channelId: string;
  guildId: string;
  message: string;
  embed?: EmbedData;
  mode: 'threshold' | 'inactive';
  threshold?: number; // messages
  delay?: number; // seconds
  allowMentions: boolean;
  webhookUrl?: string;
  lastMessageId?: string;
}
```

### Quick Report
```typescript
interface Report {
  uuid: string;
  guildId: string;
  reporterId: string;
  reportedUserId: string;
  messageId: string;
  channelId: string;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  reportTime: number;
  lastUpdate: number;
  approver?: string;
  approvalMessage?: string;
}
```

### Donation Tracking
```typescript
interface Donation {
  userId: string;
  guildId: string;
  amount: number;
  timestamp: number;
  type: 'received' | 'added' | 'subtracted';
  reason?: string;
}

interface DonationConfig {
  guildId: string;
  enabled: boolean;
  receiveChannels: string[];
  receivers: string[];
  announcementChannel?: string;
  threshold: number; // announce if amount >= threshold
  rewards: Array<{role: string; threshold: number}>;
  message: string; // with placeholders
}
```

---

## 📦 Module Structure

```
src/modules/
├── autoresponder/
│   ├── entry_point.ts
│   ├── commands/
│   │   ├── add.ts
│   │   ├── remove.ts
│   │   ├── list.ts
│   │   └── matchmode.ts
│   └── events/
│       └── messageCreate.ts
├── sticky-messages/
│   ├── entry_point.ts
│   ├── commands/
│   └── manager.ts
├── quick-report/
│   ├── entry_point.ts
│   ├── commands/
│   └── context-menu.ts
├── donation-tracker/
│   ├── entry_point.ts
│   ├── commands/
│   └── events/
├── afk-system/
│   ├── entry_point.ts
│   └── events/
└── social-interactions/
    ├── entry_point.ts
    └── commands/
```

---

## 🚀 Implementation Plan

### Week 1: Core Systems
- [x] AI Chat (Done)
- [ ] Autoresponder module
- [ ] Sticky Messages module
- [ ] AFK System

### Week 2: Advanced Features
- [ ] Quick Report System
- [ ] Donation Tracking
- [ ] Message Snipe

### Week 3: Fun & Polish
- [ ] Social Interactions
- [ ] Games module
- [ ] Illustrations search
- [ ] UI/UX improvements

---

## 💡 Key Learnings from GlitchBucket

1. **Modular Design**: Features organized by category
2. **Customization**: Almost everything is configurable
3. **Placeholders**: Extensive use of placeholders in messages
4. **Multi-language**: Full i18n support
5. **Context Menus**: Used for quick actions (reports)
6. **Webhooks**: Custom webhooks for better branding
7. **Embeds**: Heavy use of embeds for rich content
8. **Permissions**: Role-based access control
9. **Cooldowns**: Command cooldown system
10. **Database**: JSON-based storage with auto-cleanup

---

Created: 2026-08-26
Status: ✅ Analysis Complete
Next: Implementation Phase 1
