# 🚀 DanBot Hosting Setup Guide

## Bước 1: Đăng ký DanBot Hosting

1. **Truy cập**: https://danbot.host/
2. **Sign Up**:
   - Click "Login" → "Sign in with Discord"
   - Authorize DanBot application
3. **Join Discord Server**:
   - Link: https://discord.gg/dbh (hoặc từ website)
   - Bắt buộc join để dùng free tier
4. **Verify**:
   - Follow hướng dẫn trong #verification channel
   - Đọc rules và react emoji

---

## Bước 2: Tạo Server Bot

1. **Dashboard**: https://danbot.host/dashboard
2. Click **"Create Server"**
3. **Chọn loại**:
   - **Node.js** (cho Discord bot)
   - Version: Node.js 20 LTS
4. **Chọn plan**:
   - **Free Plan**: 1GB RAM, 5GB Storage
   - Server Location: US/EU (chọn gần Discord data center)
5. **Server Name**: `banh-cuon-bot`
6. Click **Create**

---

## Bước 3: Upload Code

### Option A: GitHub (Khuyên dùng) ⭐

1. **Push code lên GitHub**:
   ```bash
   cd c:\projects\code
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/banh-cuon-bot.git
   git push -u origin main
   ```

2. **Connect GitHub trong DanBot**:
   - Dashboard → Server → **GitHub** tab
   - Click "Connect GitHub Repository"
   - Authorize và chọn repo `banh-cuon-bot`
   - Branch: `main`

3. **Auto Deploy**:
   - Enable "Auto Deploy" để tự động update khi push code mới

### Option B: SFTP Upload

1. **Lấy SFTP credentials**:
   - Dashboard → Server → **Settings** tab
   - Copy: Host, Port, Username, Password

2. **Connect bằng FileZilla**:
   - Download FileZilla: https://filezilla-project.org/
   - File → Site Manager → New Site
   - Protocol: SFTP
   - Host: `sftp.danbot.host` (hoặc từ dashboard)
   - Port: `2022` (hoặc từ dashboard)
   - Username & Password: từ dashboard

3. **Upload files**:
   - Upload TẤT CẢ files (trừ `node_modules`, `dist`, `.git`)
   - Quan trọng: `package.json`, `src/`, `assets/`, `public/`

---

## Bước 4: Setup Environment Variables

1. **Dashboard** → **Startup** tab → **Variables**
2. **Thêm các biến sau** (copy từ file `.env` local):

### Required Variables:

```env
DISCORD_TOKEN=your_actual_bot_token_here
CLIENT_ID=your_actual_client_id_here
```

### AI Variables (4 Groq keys):

```env
GROQ_API_KEY_1=gsk_xxxxx
GROQ_API_KEY_2=gsk_xxxxx
GROQ_API_KEY_3=gsk_xxxxx
GROQ_API_KEY_4=gsk_xxxxx
```

### Optional Variables:

```env
GEMINI_API_KEY=AIzaSyxxxxx
OPENAI_API_KEY=sk-xxxxx
GUILD_ID=your_test_server_id
PORT=3001
SPOTIFY_CLIENT_ID=7e9699591c524555b2d90fb0d6d65f03
SPOTIFY_CLIENT_SECRET=940c3c7e9e6b4172af73e936b088375f
OWNER_ID=your_discord_user_id
```

**Lưu ý**: KHÔNG bao gồm dấu ngoặc kép `"` khi paste vào DanBot

---

## Bước 5: Cài đặt và Build

1. **Mở Console** trong DanBot Dashboard
2. **Install dependencies**:
   ```bash
   npm install
   ```
   
3. **Build TypeScript**:
   ```bash
   npm run build
   ```

4. **Verify build**:
   ```bash
   ls -la dist/src/
   ```
   Phải thấy file `index.js`

---

## Bước 6: Cấu hình Startup

1. **Dashboard** → **Startup** tab
2. **Startup Command**:
   ```bash
   node --expose-gc dist/src/index.js
   ```

   Hoặc dùng script:
   ```bash
   bash start.sh
   ```

3. **Working Directory**: `/home/container` (mặc định)

---

## Bước 7: Start Bot

1. Click nút **Start** (màu xanh lá)
2. Xem logs trong **Console** tab
3. Đợi đến khi thấy:
   ```
   ✅ Loaded 25 module(s) successfully
   ✅ Deployed 95 commands to guild
   🌐 Web server running on http://localhost:3001
   ```

4. **Verify bot online**:
   - Check bot status trên Discord (màu xanh lá)
   - Test lệnh: `/help`

---

## 🔄 Update Bot (sau khi có code mới)

### Nếu dùng GitHub:
```bash
# Local
git add .
git commit -m "Update features"
git push
```
→ DanBot tự động pull (nếu bật Auto Deploy)

### Nếu dùng SFTP:
1. Upload files mới qua FileZilla
2. Trong Console:
   ```bash
   npm install  # Nếu có dependencies mới
   npm run build
   ```
3. Click **Restart**

---

## 📊 Monitoring & Management

### Xem Logs:
- **Real-time**: Console tab
- **History**: File Manager → `logs/` folder

### Resource Usage:
- Dashboard hiển thị: RAM, CPU, Network
- Free tier: 1GB RAM, Bot này dùng ~400-500MB

### Restart Bot:
- **Manual**: Click nút "Restart"
- **Auto**: Bot tự restart khi crash
- **Scheduled**: Có thể bị restart định kỳ (free tier)

---

## ⚠️ Lưu ý quan trọng

### 1. Database (SQLite)
**Vấn đề**: File `data/economy.db` có thể bị mất khi restart container

**Giải pháp**:
- **Backup thường xuyên**: Download `data/` folder qua SFTP
- **Migrate sang cloud DB**:
  - PostgreSQL: ElephantSQL (free)
  - MongoDB: MongoDB Atlas (free)
  - MySQL: PlanetScale (free)

### 2. Memory Limit
- Free tier: 1GB RAM
- Bot hiện tại: ~400-500MB
- Nếu OOM (Out of Memory):
  - Optimize code (giảm cache)
  - Upgrade tier ($3-5/tháng)

### 3. File Storage
- Upload files (images, audio) có thể bị mất
- Recommend: Dùng CDN (Cloudinary, ImgBB, Discord CDN)

### 4. Uptime
- Free tier: 99% uptime (có thể bị restart)
- Paid tier: 99.9% uptime guarantee

---

## 🆘 Troubleshooting

### Bot không start:
1. Check Console logs
2. Verify environment variables (đặc biệt `DISCORD_TOKEN`)
3. Kiểm tra `node_modules` đã install
4. Chạy `npm run build` lại

### Module not found:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Out of Memory:
```bash
node --max-old-space-size=900 dist/src/index.js
```

### Permission denied:
```bash
chmod +x start.sh
```

### Database error:
- Backup `data/` folder
- Reset database: Xóa `data/*.db` và restart

---

## 📦 Alternative: Self-Hosting Options

Nếu cần performance tốt hơn:

1. **Oracle Cloud Free Tier**
   - 2 VPS miễn phí MÃI MÃI
   - 1GB RAM, 0.2 vCPU each
   - Full control

2. **VPS (DigitalOcean, Vultr)**
   - $5-10/tháng
   - Best performance

3. **Home Server / Local Machine**
   - Free
   - Full control
   - Requires stable internet

---

## ✅ Checklist Deploy

- [x] Bot token và environment variables đã setup
- [x] Code đã build và ready to run
- [x] `npm install` thành công
- [x] `npm run build` thành công
- [x] Startup command đã đúng
- [x] Bot online trên Discord
- [x] Test các lệnh cơ bản (/help, /ping)
- [x] Music commands hoạt động (!bc play)
- [x] AI chat reply hoạt động (@bot hello)

---

## 🎉 Done!

Bot của bạn giờ đã online 24/7 trên DanBot Hosting!

**Support**:
- DanBot Discord: https://discord.gg/dbh
- Documentation: https://docs.danbot.host/

Good luck! 🚀
