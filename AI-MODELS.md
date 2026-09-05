# 🤖 AI Models Configuration

## Current Setup

### Groq API
**Model**: `llama-3.1-8b-instant` (Free Tier)

**Available FREE Groq Models**:
- ✅ `llama-3.1-8b-instant` ⭐ (Current - Free, Fast)
- ✅ `openai/gpt-oss-20b` (20B params, free)
- ✅ `qwen/qwen3.6-27b` (27B params, free)

**Enterprise Models** (Require paid plan):
- 🔒 `llama-3.3-70b-versatile` (Enterprise only)
- 🔒 `llama-3.1-8b-instant` (Enterprise - higher limits)
- 🔒 `openai/gpt-oss-120b` (Enterprise only)

### Google Gemini
**Model**: `gemini-pro` (for lyrics generation)

---

## Change AI Model

### Edit `src/commands/ai.ts`

Find this line:
```typescript
model: 'llama-3.1-70b-versatile',
```

Replace with one of:
```typescript
// Fast responses (current, free)
model: 'llama-3.1-8b-instant',

// GPT-style (free)
model: 'openai/gpt-oss-20b',

// Qwen 3.6 (free)
model: 'qwen/qwen3.6-27b',
```

### Rebuild & Restart
```bash
# Desktop shortcut
Double-click "Update Bot Commands"

# Or manual
npm run build
scripts\restart-bot.bat
```

---

## Model Comparison

### llama-3.1-70b-versatile ⭐ (Current)
- **Size**: 70B parameters
- **Speed**: Medium
- **Quality**: Excellent
- **Context**: 8K tokens
- **Use**: General purpose, high quality

### llama-3.1-8b-instant
- **Size**: 8B parameters
- **Speed**: Very fast
- **Quality**: Good
- **Context**: 8K tokens
- **Use**: Quick responses, simple queries

### mixtral-8x7b-32768
- **Size**: 8x7B MoE
- **Speed**: Fast
- **Quality**: Very good
- **Context**: 32K tokens
- **Use**: Long conversations, code

### gemma2-9b-it
- **Size**: 9B parameters
- **Speed**: Fast
- **Quality**: Good
- **Context**: 8K tokens
- **Use**: Lightweight alternative

---

## API Keys Setup

### Groq (4 keys configured)
```env
GROQ_API_KEY=key1
GROQ_API_KEY_2=key2
GROQ_API_KEY_3=key3
GROQ_API_KEY_4=key4
```

Bot automatically rotates between keys if one fails or hits rate limit.

### Google Gemini (1 key)
```env
GOOGLE_API_KEY=your_gemini_key
```

Used for lyrics generation only.

---

## Rate Limits

### Groq Free Tier
- **Requests**: ~30 per minute per key
- **Tokens**: Various limits by model
- **With 4 keys**: ~120 requests/min total

### Google Gemini Free Tier
- **Requests**: 60 per minute
- **Tokens**: Generous limits

---

## Testing New Models

### 1. Update model name
Edit `src/commands/ai.ts`

### 2. Test locally
```bash
npm run dev
# Use /ai command in Discord
```

### 3. Deploy if working
```bash
scripts\update-commands.bat
```

---

## Troubleshooting

### "Model not found" error
- ✅ Check model name spelling
- ✅ Verify model is still available
- ✅ Check [Groq docs](https://console.groq.com/docs/models)

### "Rate limit exceeded"
- ✅ Key rotation will handle automatically
- ✅ Add more API keys to `.env`
- ✅ Wait 1 minute for reset

### "Invalid API key"
- ✅ Verify `.env` file has valid keys
- ✅ Check keys at [Groq Console](https://console.groq.com/)
- ✅ Regenerate keys if needed

---

## Model Performance (Free Tier)

| Model | Speed | Quality | Tokens | Best For |
|-------|-------|---------|--------|----------|
| llama-3.1-8b ⭐ | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 131K | Fast, free |
| gpt-oss-20b | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 131K | GPT-style |
| qwen3.6-27b | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 131K | Larger model |

**Note**: All models above are free tier. Enterprise models require paid plan.

---

## Current Configuration

✅ **Model**: qwen/qwen3.6-27b (Free, Available)  
✅ **Provider**: Groq  
✅ **Keys**: 4 (with rotation)  
✅ **Context**: 131K tokens  
✅ **Speed**: 500 tokens/second  
✅ **Status**: Working  

**AI is ready to chat! 🤖**
