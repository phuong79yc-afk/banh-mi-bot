# 🤖 AI API Setup - Hoàn Toàn Miễn Phí!

Bot hỗ trợ 3 chế độ AI (tự động chuyển đổi):

## 1. 🚀 Groq AI (Khuyến nghị - Nhanh nhất!)

**Ưu điểm:**
- ⚡ Cực nhanh (3-5x nhanh hơn GPT-4)
- 🆓 Miễn phí hoàn toàn
- 🧠 Llama 3.3 70B - Model mạnh
- 🌏 Hỗ trợ tiếng Việt tốt

**Cách lấy API Key:**
1. Truy cập: https://console.groq.com
2. Đăng ký tài khoản (miễn phí)
3. Vào mục **API Keys** → **Create API Key**
4. Copy API key và paste vào `.env`:
   ```
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
   ```

**Free Tier:**
- ✅ 30 requests/phút
- ✅ 14,400 requests/ngày
- ✅ Không giới hạn số ngày sử dụng

---

## 2. 🧠 Google Gemini (Dự phòng)

**Ưu điểm:**
- 🆓 Miễn phí
- 💪 Model mạnh (tương đương GPT-4)
- 🌐 Hỗ trợ đa ngôn ngữ tốt

**Cách lấy API Key:**
1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập Google
3. Click **Create API Key**
4. Copy API key và paste vào `.env`:
   ```
   GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXX
   ```

**Free Tier:**
- ✅ 60 requests/phút
- ✅ 1,500 requests/ngày
- ✅ Miễn phí vĩnh viễn

---

## 3. 🤖 Pattern Matching (Fallback)

Nếu không có API key nào, bot sẽ dùng pattern matching đơn giản (offline).

---

## 🎯 Cách Bot Hoạt Động

Bot sẽ tự động thử theo thứ tự:
1. **Groq AI** (nếu có key) → Nhanh nhất ⚡
2. **Google Gemini** (nếu có key) → Dự phòng 🧠
3. **Pattern Matching** (không cần key) → Offline 🤖

---

## 📝 Cấu hình trong .env

```env
# Groq AI (Khuyến nghị)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx

# Google Gemini (Dự phòng)
GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🎮 Sử dụng

```
/ai prompt:"Xin chào!"
/ai prompt:"Giải thích cách hoạt động của async/await"
/ai prompt:"Viết code tính fibonacci" reset:true
```

**Options:**
- `prompt` (required): Câu hỏi hoặc tin nhắn
- `reset` (optional): Reset lịch sử chat (bắt đầu cuộc trò chuyện mới)

---

## 🔥 Tính năng

- ✅ Chat AI thông minh
- ✅ Nhớ lịch sử chat (20 tin nhắn gần nhất)
- ✅ Hỗ trợ tiếng Việt & English
- ✅ Tự động fallback khi API fail
- ✅ Daily usage tracking
- ✅ Reset conversation

---

## 🆘 Troubleshooting

### API không hoạt động?
1. Kiểm tra API key trong `.env` có đúng không
2. Kiểm tra free tier quota còn không (xem console API)
3. Restart bot sau khi thêm API key

### Bot trả lời đơn giản?
- Bot đang dùng Pattern Matching (fallback mode)
- Thêm Groq hoặc Gemini API key để có AI thật

### "Daily Limit Reached"?
- User đã hết lượt chat trong ngày
- Đợi 24h hoặc dùng `/premium` (nếu có)

---

## 💡 Tips

1. **Groq** nhanh hơn → dùng cho production
2. **Gemini** miễn phí vĩnh viễn → backup tốt
3. Cả 2 API đều **hoàn toàn miễn phí**!
4. Có thể thêm cả 2 để tăng reliability

---

## 📚 Tài liệu

- Groq: https://console.groq.com/docs
- Gemini: https://ai.google.dev/docs
- Models: Llama 3.3 70B (Groq), Gemini Pro (Google)

---

**Tóm lại:** Lấy Groq API key (30s), paste vào `.env`, restart bot → Done! 🎉
