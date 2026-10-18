# ⚡ Quick Start - DanBot Hosting

Hướng dẫn nhanh deploy bot lên DanBot trong 10 phút!

---

## 🚀 5 Bước Deploy

### 1️⃣ Chuẩn bị (2 phút)

```powershell
# Backup data
powershell -ExecutionPolicy Bypass -File scripts/backup-before-deploy.ps1

# Build code
npm run build
```

### 2️⃣ Đăng ký DanBot (2 phút)

1. https://danbot.host/ → **Sign in with Discord**
2. Join Discord: https://discord.gg/dbh
3. Verify account trong #verification

### 3️⃣ Tạo Server (1 phút)

1. Dashboard → **Create Server**
2. Type: **Node.js 20**
3. Plan: **Free** (1GB RAM)
4. Name: `banh-cuon-bot`

### 4️⃣ Upload Code (3 phút)

**Option A: GitHub** ⭐
```bash
git init
git add .
git commit -m "Deploy"
git push origin main
```
→ DanBot Dashboard → Connect GitHub

**Option B: SFTP**
- Settings → SFTP credentials
- FileZilla → Upload files

### 5️⃣ Setup & Start (2 phút)

**DanBot Console:**
```bash
npm install
npm run build
```

**Environment Variables** (Startup tab):
```env
DISCORD_TOKEN=your_token
CLIENT_ID=your_client_id
GROQ_API_KEY_1=gsk_xxx
GROQ_API_KEY_2=gsk_xxx
GROQ_API_KEY_3=gsk_xxx
GROQ_API_KEY_4=gsk_xxx
```

**Startup Command:**
```bash
node --expose-gc dist/src/index.js
```

**Click START** ✅

---

## ✅ Verify

- Bot online trên Discord (màu xanh)
- Test: `/help`, `/ping`, `!bc play`
- Console: Không có errors

---

## 📚 Chi tiết hơn?

- Full guide: `DANBOT-SETUP.md`
- Checklist: `DEPLOYMENT-CHECKLIST.md`
- Database: `DATABASE-MIGRATION.md`

---

## 🆘 Gặp vấn đề?

**Bot không start:**
```bash
rm -rf node_modules
npm install
npm run build
```

**Commands không hoạt động:**
- Add `GUILD_ID=your_server_id` vào env vars
- Restart bot

**Support:**
- DanBot Discord: https://discord.gg/dbh
- Bot logs: Console tab

---

**Done! Bot online 24/7! 🎉**
