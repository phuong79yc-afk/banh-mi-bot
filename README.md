# 🤖 Discord Bot - AI Chat & Utilities

> **🎉 TẤT CẢ COMMANDS PUBLIC - AI CŨNG DÙNG ĐƯỢC! NO PERMISSIONS REQUIRED!**

Discord bot với AI chat (conversation memory, multi-model) + utility commands.

## ⚡ Quick Start

```bash
# 1. Install
npm install

# 2. Setup .env (xem bên dưới)

# 3. Build
npm run build

# 4. Deploy commands (QUAN TRỌNG!)
node scripts/deploy-tools/deploy-all-commands.js

# 5. Run bot
node dist/index.js
```

## 🔧 Cấu Hình (.env)

```env
# Bot credentials
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id

# Deploy mode
GUILD_ID=your_server_id  # Optional: Instant deploy (5s) thay vì global (1h)

# AI Keys (cách nhau bằng dấu phẩy)
GROQ_API_KEYS=key1,key2,key3,key4

# Database path (for persistent storage, especially on Railway)
DATABASE_PATH=/app/data  # Optional: defaults to ./data if not set

# Web dashboard
PORT=3001
```

**Lấy GUILD_ID:** Right-click server > Copy ID (cần bật Developer Mode)

**DATABASE_PATH Configuration:**
- **Local development:** Leave unset or use `./data` (default)
- **Railway deployment:** Set to `/app/data` or path to mounted persistent volume
- Railway uses ephemeral filesystem - without DATABASE_PATH pointing to a persistent volume, daily rewards and xu balances will reset on each redeploy
- Example Railway setup: Mount volume at `/app/data` and set `DATABASE_PATH=/app/data`

---

## 📋 Commands (7 Commands - Ai Cũng Dùng Được!)

### 🤖 AI Commands
| Command | Description | Permission |
|---------|-------------|------------|
| `/ai <message>` | Chat với AI (memory, chọn model & style) | ❌ None |
| `/ai-memory view` | Xem lịch sử conversation | ❌ None |
| `/ai-memory clear` | Xóa lịch sử | ❌ None |

**AI Features:**
- ✅ Conversation memory (20 messages/channel)
- ✅ Multi-model (Groq LLaMA, Mixtral, Gemini)
- ✅ Auto-reply when mentioned: `@Bot hello!`
- ✅ 5 styles: Default, Creative, Professional, Casual, Technical

### 🛠️ Utility Commands
| Command | Description | Permission |
|---------|-------------|------------|
| `/ping` | Check bot latency | ❌ None |
| `/help` | Show help | ❌ None |
| `/info` | Bot info | ❌ None |
| `/serverinfo` | Server info | ❌ None |

---

## 🚀 Deploy Commands

### ⚡ Instant (5 giây) - Khuyến nghị
```bash
# 1. Thêm GUILD_ID vào .env
GUILD_ID=1234567890123456789

# 2. Deploy
scripts\deploy-instant.bat
# hoặc: node scripts/deploy-tools/deploy-all-commands.js
```

### 🌍 Global (1 giờ)
```bash
# Không cần GUILD_ID, nhưng mất 1 giờ commands mới hiện
node scripts/deploy-tools/deploy-all-commands.js
```

📖 **Chi tiết:** Xem `HOW-TO-DEPLOY-COMMANDS.md`

---

## 📊 Bot Status

```
✅ Bot online: Supporter#0504
📊 Servers: 4 | Users: 59
🔑 AI: 4 Groq keys loaded
📦 Modules: 2 (ai-module, utility)
📊 Commands: 7 total
🎨 Dashboard: http://localhost:3001/
```

---

## 🏗️ Architecture

### Module System
```
src/modules/
├── ai-module/           # AI chat commands
│   ├── entry_point.ts   # /ai, /ai-memory
│   └── metadata.json
└── utility/             # Utility commands
    ├── entry_point.ts   # /ping, /help, /info, /serverinfo
    └── metadata.json
```

**Module Auto-Loading:**
- Modules tự động load khi bot start
- Commands auto-register
- Hot-reload support (dev mode)

### Core Files
```
src/
├── index.ts                  # Main bot + AI auto-reply
├── core/ModuleLoader.ts      # Module system
├── utils/
│   ├── conversationManager.ts  # AI memory manager
│   └── aiChatService.ts        # AI API service
└── web/server.ts             # Dashboard API
```

---

## 🤖 AI Chat System

### Auto-Reply
```
User: @Bot what's the weather?
Bot: I'm an AI assistant without real-time...
```

### Manual Chat
```
/ai message: Tell me a joke
     model: llama-3.3-70b-versatile
     style: casual
```

### Configuration
File: `data/conversation-config.json`
```json
{
  "autoReplyOnMention": true,
  "maxHistoryLength": 20,
  "conversationTimeout": 1800000,
  "allowedChannels": [],
  "blacklistedUsers": []
}
```

---

## 📁 Project Structure

```
c:\projects\code/
├── src/                    # TypeScript source
│   ├── modules/            # Bot modules
│   ├── core/               # Core systems
│   ├── utils/              # Utilities
│   └── web/                # Dashboard
├── dist/                   # Compiled JS
├── data/                   # JSON databases
│   ├── conversations.json
│   └── conversation-config.json
├── scripts/                # Utility scripts
│   ├── deploy-all-commands.js
│   ├── deploy-instant.bat
│   └── deploy-global.bat
└── docs/                   # Documentation
```

---

## 🔥 Features

✅ **Module System**
- Dynamic module loading
- Auto command registration
- Priority-based loading
- Hot-reload in dev mode

✅ **AI Chat**
- Conversation memory per channel
- Multi-model support (Groq + Gemini)
- Auto-reply on mention
- Configurable styles

✅ **No Permissions Required**
- All commands are public
- No admin/mod restrictions
- Everyone can use AI chat

✅ **Web Dashboard**
- REST API at `http://localhost:3001/`
- Bot stats
- Command usage

---

## 🐛 Troubleshooting

### Commands không hiện trong Discord?
```bash
# 1. Check đã deploy chưa
node scripts/deploy-tools/deploy-all-commands.js

# 2. Nếu global - chờ 1 giờ
# 3. Nếu guild - check GUILD_ID trong .env
```

### AI không hoạt động?
```bash
# Check bot logs
⚠️ No GROQ_API_KEYS found for AI chat

# Fix: Thêm vào .env
GROQ_API_KEYS=your_key_here

# Restart bot
```

### Bot không online?
```bash
# Check terminal output
🚀 Bot online: Supporter#0504

# Nếu error - check DISCORD_TOKEN trong .env
```

---

## 📚 Documentation

- `HOW-TO-DEPLOY-COMMANDS.md` - Hướng dẫn deploy chi tiết
- `COMMANDS-STATUS.md` - Status tất cả commands
- `MODULE-SYSTEM.md` - Module system docs (nếu có)
- `AI-MODELS.md` - AI models documentation

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run (production)
node dist/index.js

# Deploy commands
node scripts/deploy-tools/deploy-all-commands.js

# Delete all commands (cleanup)
node src/delete-all-commands.ts
```

---

## 📦 Dependencies

```json
{
  "discord.js": "^14.14.1",
  "discord-player": "^7.2.0",
  "@discord-player/extractor": "^7.2.0",
  "dotenv": "^16.4.5",
  "express": "^5.2.1",
  "typescript": "^5.x"
}
```

---

## 📝 License

ISC

---

## 🙏 Credits

- Built with discord.js v14
- AI powered by Groq & Google Gemini
- Module system inspired by modern bot architectures

---

**Bot Version:** 1.0.0  
**Last Updated:** 2026-08-26  
**Status:** ✅ Production Ready

---

## 🚀 Quick Links

- [Deploy Guide](HOW-TO-DEPLOY-COMMANDS.md)
- [Commands Status](COMMANDS-STATUS.md)
- [Discord.js Docs](https://discord.js.org/)
- [Groq API](https://console.groq.com/)

---

**Made with ❤️ for Discord communities**
