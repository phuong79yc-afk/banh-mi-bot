# 🔄 AI API Key Rotation System

## Tự động thay key khi bị rate limit hoặc hết quota!

### 🎯 Tính năng:
- ✅ Tự động rotate giữa nhiều API keys
- ✅ Phát hiện rate limit và chuyển key ngay lập tức
- ✅ Tự động unblock key sau 5 phút
- ✅ Hiển thị key đang dùng (Key 1/3, Key 2/3...)
- ✅ Không cần restart bot khi thêm key

---

## 📝 Cách Setup

### 1. Thêm nhiều keys vào `.env`:

```env
# Groq Keys (có thể có nhiều keys)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx          # Key 1 (primary)
GROQ_API_KEY_2=gsk_yyyyyyyyyyyyyyyyyyyyy        # Key 2 (backup)
GROQ_API_KEY_3=gsk_zzzzzzzzzzzzzzzzzzz          # Key 3 (backup)

# Gemini Keys (có thể có nhiều keys)
GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXX    # Key 1 (primary)
GOOGLE_API_KEY_2=AIzaSyYYYYYYYYYYYYYYYYYYYYYYY  # Key 2 (backup)
GOOGLE_API_KEY_3=AIzaSyZZZZZZZZZZZZZZZZZZZZZZZ  # Key 3 (backup)
```

### 2. Lấy nhiều API keys:

#### Groq (khuyến nghị - mỗi email 1 key):
1. Tạo nhiều tài khoản email (Gmail, Outlook, etc.)
2. Mỗi email vào: https://console.groq.com
3. Sign up → API Keys → Create
4. Copy và paste vào `.env`

#### Gemini (nếu cần):
1. Tạo nhiều Google accounts
2. Mỗi account vào: https://makersuite.google.com/app/apikey
3. Create API Key
4. Copy và paste vào `.env`

### 3. Restart bot:
```bash
npm run build
npm run start
```

---

## 🚀 Cách hoạt động

### Khi có 1 key:
```
User request → Groq Key 1 → Response
```

### Khi có nhiều keys:
```
User request 1 → Groq Key 1 → Response ✅
User request 2 → Groq Key 1 → Rate limit! ❌
              → Auto rotate to Key 2 → Response ✅
User request 3 → Groq Key 2 → Response ✅
User request 4 → Groq Key 2 → Rate limit! ❌
              → Auto rotate to Key 3 → Response ✅

(Sau 5 phút, Key 1 được unblock tự động)
```

---

## 🔍 Monitoring

Bot sẽ tự động log:

```
🔑 Loaded 3 Groq key(s), 2 Gemini key(s)
⚠️ GROQ key blocked (fail count: 3)
🔄 Rotated to Groq key #2
✅ GROQ key unblocked after cooldown
```

Response sẽ hiển thị key đang dùng:
```
🚀 Groq AI (Key 2/3) | 8/10 left
```

---

## 💡 Best Practices

### 1. Bao nhiêu keys là đủ?

**Usage thấp (<100 requests/ngày):**
- 1 Groq key là đủ

**Usage trung bình (100-500 requests/ngày):**
- 2-3 Groq keys

**Usage cao (>500 requests/ngày):**
- 3-5 Groq keys
- Hoặc mix Groq + Gemini

### 2. Tối ưu chi phí

```
Strategy 1: Full Groq (fastest)
├─ Key 1: Groq
├─ Key 2: Groq
└─ Key 3: Groq

Strategy 2: Mixed (balanced)
├─ Key 1: Groq (primary - fast)
├─ Key 2: Groq (backup)
└─ Fallback: Gemini (if all Groq fails)

Strategy 3: Full Free (safest)
├─ Key 1-3: Groq
└─ Key 4-5: Gemini
```

### 3. Rate Limits Reference

| Provider | Free Tier | Per Key |
|----------|-----------|---------|
| Groq GPT-OSS 20B | 250K TPM | 1K RPM |
| Gemini Pro | 1.5K/day | 60 RPM |

**TPM** = Tokens per minute
**RPM** = Requests per minute

---

## 🛠️ Advanced: Auto Key Management

### Check key status:
```typescript
import { keyRotator } from './utils/aiKeyRotator.js';

const status = keyRotator.getStatus();
console.log(status);
// Output:
// {
//   groq: { total: 3, active: 2, current: 2 },
//   gemini: { total: 2, active: 2, current: 1 }
// }
```

### Get current key:
```typescript
const groqKey = keyRotator.getGroqKey();
const geminiKey = keyRotator.getGeminiKey();
```

---

## ❓ FAQ

### Q: Key bị block mãi mãi?
A: Không! Key tự động unblock sau 5 phút.

### Q: Có thể add key mà không restart?
A: Hiện tại cần restart bot. Sẽ thêm hot-reload sau.

### Q: Bot có lưu key vào database?
A: Không! Keys chỉ được load từ `.env` (an toàn).

### Q: Limit 1K RPM của Groq là bao nhiêu?
A: ~16 requests/giây. Nếu server nhỏ, 1 key là đủ!

### Q: Có thể mix Groq + Gemini?
A: Có! Bot tự động fallback Groq → Gemini → Pattern Matching.

---

## 🎉 Kết quả

Với 3 Groq keys:
- ✅ 750K tokens/phút (250K × 3)
- ✅ 3K requests/phút (1K × 3)
- ✅ ~50 requests/giây
- ✅ **Không bao giờ bị rate limit!**

---

**Tóm lại:** Tạo 2-3 tài khoản Groq (miễn phí), lấy API keys, paste vào `.env`, done! 🚀
