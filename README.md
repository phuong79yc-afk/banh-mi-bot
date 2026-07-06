# 🍞 Bánh Mì Bot

A powerful Discord bot with TikTok link fixer, moderation tools, music player, and more!

## ✨ Features

- **🎵 TikTok Link Fixer:** Auto-download and embed TikTok videos (like Bot Keto)
- **🛡️ Moderation:** Anti-spam, anti-raid, auto-mod
- **🎶 Music Player:** Play music from YouTube
- **📊 Level System:** Track user activity
- **🔧 Utility Commands:** Server info, user info, and more

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Discord Bot Token
- TypeScript

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/banh-mi-bot.git
cd banh-mi-bot

# Install dependencies
npm install

# Copy .env.example to .env and fill in your tokens
cp .env.example .env

# Build
npm run build

# Start bot
npm start
```

### Development

```bash
# Run in dev mode with auto-reload
npm run dev
```

## 📋 Commands

### Moderation
- `/antiraid` - Configure anti-raid protection
- `/antispam` - Configure anti-spam
- `/antimrbeast` - Protect against fake giveaway scams
- `/ban`, `/kick`, `/mute`, `/warn` - Moderation actions

### TikTok Fixer
- `/linkpreview enable` - Enable TikTok link fixer
- `/linkpreview config` - Configure settings
- `/linkpreview status` - Check status

### Music
- `/play` - Play music from YouTube
- `/voice` - Voice channel management

### Utility
- `/help` - Show all commands
- `/serverinfo` - Server information
- `/user` - User information

## 🌐 Web Dashboard

Bot includes a web dashboard at `http://localhost:3002`

- Home page with stats
- Terms of Service
- Privacy Policy

## 📦 Tech Stack

- **Language:** TypeScript
- **Framework:** Discord.js v14
- **Web Server:** Express
- **Video Processing:** TikWM API
- **Music:** YouTube API

## 🔒 Privacy & Security

- Message content is NOT stored
- Only minimal data for functionality
- See [Privacy Policy](PRIVACY_POLICY.md)
- See [Terms of Service](TERMS_OF_SERVICE.md)

## 📄 License

MIT License - See [LICENSE](LICENSE) file

## 🤝 Contributing

Contributions welcome! Please read contributing guidelines first.

## 📞 Support

- Bot Dashboard: http://localhost:3002
- Discord: [Your Support Server]
- Issues: GitHub Issues

## ⚙️ Environment Variables

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
PORT=3002
GOOGLE_API_KEY=your_gemini_key (optional)
```

## 🚀 Deployment

See [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) for detailed deployment instructions to Render.com

## 📊 Stats

- Servers: 5+
- Users: 60+
- Commands: 34
- Uptime: 99.9%

---

Made with ❤️ by [Your Name]
