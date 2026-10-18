# Railway Deployment Guide

## 📦 Deployment Steps

### 1. Push Code to GitHub

```bash
git add -A
git commit -m "chore: prepare for Railway deployment"
git push origin main
```

Railway sẽ tự động detect push và start build.

### 2. Set Environment Variables

Trong Railway Dashboard → Variables, thêm:

```bash
# Discord Bot
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
OWNER_ID=your_user_id

# Database (QUAN TRỌNG cho Railway!)
DATABASE_PATH=/app/data

# AI Chat - Groq (comma-separated for rate limit rotation)
GROQ_API_KEYS=key1,key2,key3,key4

# AI Chat - Gemini (fallback)
GEMINI_API_KEY=your_gemini_key

# Web Dashboard
PORT=3001
WEB_URL=https://your-railway-url.railway.app
REDIRECT_URI=https://your-railway-url.railway.app/auth-callback.html
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=change_this_secure_password
ADMIN_PASSWORD=change_this_too
JWT_SECRET=generate-random-32-char-string

# Production Mode
NODE_ENV=production
DEPLOY_GLOBAL=true

# Music (Optional)
SPOTIFY_CLIENT_ID=your_spotify_id
SPOTIFY_CLIENT_SECRET=your_spotify_secret
```

### 3. Clear Build Cache (Nếu Cần)

Nếu Railway cache node_modules cũ:

1. Settings → Danger Zone → **Clear Build Cache**
2. Redeploy

### 4. Verify Build

Check Railway build logs:

```
✅ Dependencies installed. Discord.js version:
discord.js@14.27.0
```

---

## 🎯 Components V2 Status

**⚠️ QUAN TRỌNG**: Discord.js 14.27.0 (latest stable) **CHƯA HỖ TRỢ ĐẦY ĐỦ Components V2**.

### Hiện Tại

Bot đã implement **smartReply utility** với auto-fallback:

1. **Thử V2 components trước** (colored containers, sections)
2. **Tự động fallback về Embed** nếu V2 fail
3. User luôn thấy response đẹp ✅

### Commands Đã Convert

✅ `/daily` - smartReply with V2 fallback  
✅ `/balance` - smartReply with V2 fallback  
✅ `/ai` - smartReply with V2 fallback  
✅ All modules use smartReply

### Khi Nào V2 Hoạt Động 100%?

Khi Discord release discord.js 14.28.0+ hoặc 15.x với full V2 support:

1. Update `package.json`: `"discord.js": "^14.28.0"`
2. Clear Railway cache
3. Redeploy
4. V2 sẽ work 100% không cần fallback!

---

## 🐛 Troubleshooting

### Database Errors: "no such table: daily_users"

**Fix**: Add environment variable:
```
DATABASE_PATH=/app/data
```

Railway filesystem ephemeral, cần mount volume!

### AI Module Crashes: "Groq is not initialized"

**Fix**: Add comma-separated keys:
```
GROQ_API_KEYS=key1,key2,key3,key4
GEMINI_API_KEY=your_gemini_key
```

Bot sẽ auto-failover giữa providers!

### Commands Không Hiện

**Fix**: Re-invite bot với `applications.commands` scope:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

Replace `YOUR_CLIENT_ID` với client ID thật.

### Music Không Hoạt Động

Railway free tier **không có GPU/audio codecs**. Cần:

1. Upgrade Railway plan
2. HOẶC deploy music module riêng (VPS)
3. HOẶC tắt music module

---

## 📊 Resource Usage

Railway Free Tier:
- ✅ Discord commands, daily, balance, quests
- ✅ AI chat (với rate limit rotation)
- ✅ Database (với DATABASE_PATH mount)
- ❌ Music player (cần paid tier)

---

## 🚀 Production Checklist

- [ ] Push code to GitHub
- [ ] Set all environment variables
- [ ] Set `DATABASE_PATH=/app/data`
- [ ] Set `NODE_ENV=production`
- [ ] Set `DEPLOY_GLOBAL=true`
- [ ] Clear build cache
- [ ] Verify build logs show discord.js 14.27.0
- [ ] Test `/daily`, `/balance`, `/ai`
- [ ] Re-invite bot with applications.commands scope
- [ ] Monitor Railway logs for errors

---

## 💡 Pro Tips

1. **Database Backups**: Download `/app/data/*.json` files định kỳ
2. **API Keys**: Rotate Groq keys khi bị rate limit
3. **Monitoring**: Check Railway logs thường xuyên
4. **Updates**: Theo dõi discord.js releases cho V2 support

---

✅ **Bot sẽ chạy ổn định trên Railway với smartReply fallback!**
