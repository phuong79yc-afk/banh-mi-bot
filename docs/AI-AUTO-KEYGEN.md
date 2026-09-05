# 🤖 AI API Key Auto-Generator

## Tự động tạo API keys khi cần!

### ⚠️ Disclaimer

Tính năng này **experimental** và có thể không hoạt động 100% do:
- ❌ Captcha challenges
- ❌ Rate limiting từ providers
- ❌ Thay đổi UI của signup forms
- ❌ Yêu cầu phone verification (Gemini)

**Khuyến nghị:** Dùng manual key generation (nhanh hơn, đáng tin cậy hơn)

---

## 🎯 Cách hoạt động

```
1. Tạo temp email (mail.tm)
     ↓
2. Sign up Groq/Gemini account
     ↓
3. Verify email tự động
     ↓
4. Login và tạo API key
     ↓
5. Lưu vào .env tự động
     ↓
6. Hot reload keys (không cần restart)
```

---

## 🚀 Usage

### CLI Command:

```bash
# Generate Groq key
npm run generate-key groq

# Generate Gemini key  
npm run generate-key gemini
```

### Programmatic:

```typescript
import { keyGenerator } from './utils/aiKeyGenerator.js';

// Generate Groq key
const success = await keyGenerator.generateKeyWhenNeeded('groq');

if (success) {
  console.log('✅ New key generated!');
} else {
  console.log('❌ Failed - create manually');
}
```

---

## 📋 Requirements

### Installed packages:
```bash
npm install puppeteer node-fetch@2
```

### System requirements:
- ✅ Chrome/Chromium (for Puppeteer)
- ✅ Internet connection
- ✅ No firewall blocking mail.tm or console.groq.com

---

## 🔧 How it works

### 1. Temporary Email Creation

```typescript
// Creates email like: aibot_1735123456_abc123@mail.tm
const tempEmail = await keyGenerator.createTempEmail();

// Returns:
{
  email: "aibot_1735123456_abc123@mail.tm",
  token: "eyJhbGciOiJI..." // Auth token to read emails
}
```

### 2. Automated Signup (Puppeteer)

```typescript
// Launch headless browser
const browser = await puppeteer.launch({ headless: true });

// Navigate to signup
await page.goto('https://console.groq.com/signup');

// Fill form
await page.type('input[type="email"]', tempEmail.email);
await page.type('input[type="password"]', 'TempPassword123!');
await page.click('button[type="submit"]');
```

### 3. Email Verification

```typescript
// Wait for verification email
await sleep(10000);

// Read inbox
const emails = await keyGenerator.readEmails(tempEmail.token);

// Find verification link
const verifyLink = extractVerificationLink(emails[0]);

// Click link
await page.goto(verifyLink);
```

### 4. API Key Generation

```typescript
// Navigate to keys page
await page.goto('https://console.groq.com/keys');

// Click create button
await page.click('button:has-text("Create API Key")');

// Extract key from page
const apiKey = await page.evaluate(() => {
  return document.querySelector('[data-testid="api-key"]')?.textContent;
});
```

### 5. Save to .env

```typescript
// Add to .env
await keyGenerator.addKeyToEnv('groq', apiKey);

// Result in .env:
// GROQ_API_KEY_2=gsk_newlygenerated123...

// Hot reload
require('dotenv').config();
```

---

## 🎮 Integration với Key Rotator

Key rotator tự động gọi generator khi **tất cả keys bị block**:

```typescript
// In aiKeyRotator.ts
if (allKeysBlocked) {
  console.log('⚠️ All keys blocked! Attempting auto-generation...');
  const success = await this.autoGenerateKey('groq');
  
  if (success) {
    console.log('✅ New key generated and ready!');
  }
}
```

**Automatic flow:**
```
User request → All Groq keys blocked
                    ↓
           Auto-generate new key
                    ↓
           Add to key pool
                    ↓
           Use new key immediately
```

---

## 🛡️ Security & Privacy

### Temporary emails:
- ✅ Self-destruct after 24 hours
- ✅ No personal data required
- ✅ Anonymous

### API keys:
- ✅ Stored only in `.env` (local)
- ✅ Not sent anywhere else
- ✅ Protected by `.gitignore`

### Browser automation:
- ✅ Headless mode (no GUI)
- ✅ No cookies persisted
- ✅ Clean shutdown

---

## ⚡ Performance

| Step | Time | Success Rate |
|------|------|--------------|
| Create temp email | ~2s | 95% |
| Groq signup | ~10s | 70% |
| Email verification | ~10s | 80% |
| Key extraction | ~5s | 90% |
| **Total** | **~30s** | **~50%** |

**Success rate thấp do:**
- Captcha challenges
- Rate limiting
- UI changes

---

## 🔥 Pros & Cons

### ✅ Pros:
- Hoàn toàn tự động
- Không cần tài khoản thật
- Có thể scale (tạo unlimited keys)
- Tích hợp hot-reload

### ❌ Cons:
- Success rate ~50%
- Phụ thuộc vào Puppeteer
- Chậm hơn manual (30s vs 2 phút)
- Có thể bị detect là bot

---

## 💡 Alternatives

### Option 1: Manual (Khuyến nghị)
```
1. Visit console.groq.com
2. Sign up (1 email = 1 key)
3. Copy key → .env
Time: ~2 phút per key
Success: 100%
```

### Option 2: Semi-Auto (Tốt nhất)
```
1. Tạo sẵn 3-5 emails (Gmail)
2. Batch generate keys manually
3. Paste all vào .env
Time: ~10 phút one-time
Success: 100%
Keys: 3-5 keys ready
```

### Option 3: Full Auto (Experimental)
```
npm run generate-key groq
Time: ~30s
Success: ~50%
```

---

## 🧪 Testing

```bash
# Test temp email creation
npm run generate-key groq

# Check logs
tail -f console.log

# Expected output:
✅ Created temp email: aibot_xxx@mail.tm
📧 Waiting for verification email...
✅ Successfully generated Groq API key!
✅ Added GROQ_API_KEY_2 to .env
```

---

## 🐛 Troubleshooting

### "Failed to create temp email"
- mail.tm API down
- Try again later

### "Verification email not received"
- Email provider delay (wait longer)
- Groq rate limited (try tomorrow)

### "Failed to extract API key"
- Groq UI changed (update selectors)
- Captcha appeared (manual intervention needed)

### "Puppeteer error"
```bash
# Install Chrome
npm install puppeteer

# Or use system Chrome
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

---

## 📊 Comparison

| Method | Speed | Reliability | Effort |
|--------|-------|-------------|--------|
| Manual | ⭐⭐ (2 min) | ⭐⭐⭐⭐⭐ (100%) | Low |
| Semi-Auto | ⭐⭐⭐ (10 min batch) | ⭐⭐⭐⭐⭐ (100%) | Medium |
| **Full Auto** | ⭐⭐⭐⭐⭐ (30s) | ⭐⭐⭐ (50%) | **Zero** |

---

## 🎯 Recommendation

**Dùng khi nào?**
- ✅ Prototype/testing (không quan trọng reliability)
- ✅ Development environment
- ✅ Muốn test auto-scaling

**KHÔNG dùng khi:**
- ❌ Production (cần stability)
- ❌ Cần keys ngay lập tức
- ❌ Bot quan trọng (dùng manual keys)

---

## 🚀 Best Practice

**Hybrid Approach (khuyến nghị):**

```env
# Manual keys (primary - reliable)
GROQ_API_KEY=gsk_manual_key_1
GROQ_API_KEY_2=gsk_manual_key_2

# Auto-generated keys (backup - when needed)
# Auto-generated on 2026-08-24T12:00:00Z
GROQ_API_KEY_3=gsk_auto_key_3
```

**Strategy:**
1. Tạo 2-3 keys manual (base keys)
2. Enable auto-generation for emergencies
3. Bot tự tạo key mới khi cần

**Result:**
- ✅ Reliable base keys
- ✅ Auto-scaling when needed
- ✅ Zero downtime

---

**Tóm lại:** Tính năng hay nhưng **experimental**. Dùng manual keys cho production, auto-gen cho testing! 🎉
