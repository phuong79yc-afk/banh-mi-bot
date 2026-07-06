# 🚀 Hướng Dẫn Deploy Bot Lên Render.com

## Bước 1: Push code lên GitHub

### 1.1 Tạo GitHub Repository
1. Vào https://github.com/new
2. Tên repo: `banh-mi-bot` (hoặc tên bạn thích)
3. **QUAN TRỌNG:** Chọn **Private** (vì có bot token)
4. Không tạo README, .gitignore (đã có sẵn)
5. Click **Create repository**

### 1.2 Push code lên GitHub

Mở terminal trong folder `c:\projects\code` và chạy:

```bash
# Khởi tạo git (nếu chưa có)
git init

# Add tất cả files
git add .

# Commit
git commit -m "Initial commit - Bánh Mì Bot"

# Add remote (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/banh-mi-bot.git

# Push lên GitHub
git branch -M main
git push -u origin main
```

**Nếu lỗi authentication:**
```bash
# Dùng Personal Access Token
# Tạo token tại: https://github.com/settings/tokens
# Chọn: repo (full control)
# Copy token và dùng làm password khi push
```

---

## Bước 2: Deploy trên Render.com

### 2.1 Tạo tài khoản Render
1. Vào https://render.com
2. Sign up (dùng GitHub account cho nhanh)
3. Authorize Render truy cập GitHub

### 2.2 Tạo Web Service
1. Click **New +** → **Web Service**
2. Connect GitHub repository: `banh-mi-bot`
3. Điền thông tin:
   - **Name:** `banh-mi-bot`
   - **Region:** Singapore (gần VN nhất)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/src/index.js`
   - **Instance Type:** `Free`

### 2.3 Thêm Environment Variables
Click **Environment** tab, thêm:

```
DISCORD_TOKEN=paste_bot_token_here
CLIENT_ID=1498700400327528498
CLIENT_SECRET=paste_client_secret_here
PORT=3002
SESSION_SECRET=random_string_here
GOOGLE_API_KEY=paste_api_key_here (optional)
```

**Lấy bot token:**
- Discord Developer Portal → Bot → Reset Token → Copy

**Lấy client secret:**
- Discord Developer Portal → OAuth2 → Client Secret → Copy

### 2.4 Deploy!
1. Click **Create Web Service**
2. Render sẽ:
   - Clone repo từ GitHub
   - Run `npm install`
   - Run `npm run build`
   - Start bot với `node dist/src/index.js`
3. Đợi ~5-10 phút

---

## Bước 3: Lấy Public URLs

Sau khi deploy xong:

1. **Dashboard URL:** `https://banh-mi-bot.onrender.com`
2. **Terms of Service:** `https://banh-mi-bot.onrender.com/terms`
3. **Privacy Policy:** `https://banh-mi-bot.onrender.com/privacy`

---

## Bước 4: Cập nhật Discord Developer Portal

Vào https://discord.com/developers/applications/1498700400327528498

### 4.1 General Information tab:
- **Terms of Service URL:** `https://banh-mi-bot.onrender.com/terms`
- **Privacy Policy URL:** `https://banh-mi-bot.onrender.com/privacy`
- Click **Save Changes**

### 4.2 OAuth2 tab:
- **Redirects:** Add `https://banh-mi-bot.onrender.com/auth/callback`
- Click **Save Changes**

---

## Bước 5: Update Environment Variable

Quay lại Render.com:
1. Dashboard → `banh-mi-bot` → Environment
2. Edit `REDIRECT_URI`:
   ```
   https://banh-mi-bot.onrender.com/auth/callback
   ```
3. Click **Save Changes**
4. Render sẽ tự động redeploy

---

## ✅ HOÀN THÀNH!

Bot đã online 24/7 với public URLs:
- ✅ Terms: `https://banh-mi-bot.onrender.com/terms`
- ✅ Privacy: `https://banh-mi-bot.onrender.com/privacy`
- ✅ Dashboard: `https://banh-mi-bot.onrender.com`

---

## 🔧 Troubleshooting

### Bot không online sau deploy:
1. Check logs: Render Dashboard → Logs
2. Verify DISCORD_TOKEN đúng
3. Check PORT=3002 trong env vars

### URLs không hoạt động:
1. Đợi deploy hoàn tất (check Render logs)
2. Test URLs trong browser
3. Check web server có start không

### Free tier limitations:
- ⚠️ Sleep sau 15 phút không activity
- ⚠️ 750 hours/month (đủ cho 1 app 24/7)
- ⚠️ Slow cold start (30s-1min khi wake up)

**Giải pháp:** Dùng UptimeRobot ping mỗi 14 phút để giữ bot online

---

## 📝 Notes

- **Auto-deploy:** Mỗi khi push code lên GitHub, Render tự động deploy
- **Logs:** Xem real-time logs trong Render dashboard
- **Scale:** Khi cần, upgrade lên paid plan ($7/month)

---

## 🎯 Next Steps

1. ✅ Deploy xong
2. ✅ URLs public
3. ⏳ Tăng servers từ 5 → 75
4. ⏳ Submit App Directory

**Good luck!** 🚀
