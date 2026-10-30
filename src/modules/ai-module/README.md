# 🤖 AI Chat Module

**Version:** 1.0.0  
**Status:** ✅ Active  
**Commands:** 3

---

## 📋 Overview

Enhanced AI chat system with:
- **Context Memory** - Remembers last 10 messages per channel
- **Multiple Models** - 7 AI models (Groq + Gemini)
- **Multiple Styles** - 5 response styles
- **Auto Key Rotation** - Failover between API keys
- **Usage Tracking** - Rate limiting (50/day free)

---

## 🎯 Commands

### `/image` - Tạo ảnh bằng AI

Tạo ảnh từ mô tả bằng Gemini Nano Banana Flash. Bot cần Gemini API key có quyền truy cập model `gemini-2.5-flash-image`.

**Tùy chọn:**
- `prompt` (bắt buộc) - Mô tả ảnh cần tạo

```text
/image prompt:Một tiệm bánh cuốn Việt Nam phong cách tranh màu nước
```

### 1. `/ai` - Chat with AI

**Main chat command with full features**

**Options:**
- `message` (required) - Your message
- `model` (optional) - AI model to use
  - ⚡ Llama 3.3 70B (Fast) - Default
  - 🧠 Llama 3.1 70B (Smart)
  - 🚀 Llama 3.1 8B (Quick)
  - 🎨 Mixtral 8x7B (Creative)
  - ✨ Gemini 2.0 Flash (New)
  - 💎 Gemini 1.5 Pro
  - ⚡ Gemini 1.5 Flash
- `style` (optional) - Response style
  - 📝 Default (Helpful)
  - 🎨 Creative
  - 💼 Professional
  - 😄 Casual
  - 💻 Technical
- `clear_memory` (optional) - Clear conversation history

**Examples:**
```bash
# Basic chat
/ai message:What is quantum computing?

# With specific model
/ai message:Write a poem model:groq:mixtral-8x7b style:creative

# Clear memory and start fresh
/ai message:New topic clear_memory:True

# Professional response
/ai message:Explain blockchain style:professional model:gemini:gemini-1.5-pro
```

**Features:**
- Remembers context from previous messages in channel
- Supports 2000 token responses
- Auto-saves to conversation history
- Shows model, style, and history count
- Sends as file if response > 4000 characters

---

### 2. `/ai-memory` - Manage Memory

**View or clear conversation history**

**Subcommands:**

#### `/ai-memory view`
- Shows conversation history in current channel
- Displays last messages with roles (user/assistant)
- Ephemeral (only you can see)

#### `/ai-memory clear`
- Clears all conversation history in current channel
- Starts fresh conversation
- Ephemeral confirmation

**Examples:**
```bash
# View what AI remembers
/ai-memory view

# Clear and start fresh
/ai-memory clear
```

---

## 🧠 How Context Memory Works

### Memory Storage
- **Per Channel** - Each channel has separate memory
- **Max 10 Messages** - Keeps last 10 user-AI exchanges (20 total)
- **Auto-Cleanup** - Oldest messages removed automatically
- **Persistent** - Lasts until bot restart or manual clear

### Example Flow
```
User: /ai message:What is AI?
AI: [Response] (Memory: 1 msg)

User: /ai message:Tell me more
AI: [Response using context from previous] (Memory: 2 msgs)

User: /ai message:clear_memory:True
AI: Memory cleared! (Memory: 0 msgs)
```

---

## 🎨 Response Styles

### 📝 Default (Helpful)
- Balanced and informative
- Good for general questions
- Temperature: 0.7

### 🎨 Creative
- Imaginative and original
- Good for stories, poems, ideas
- Temperature: 1.2

### 💼 Professional
- Formal and detailed
- Good for business, reports
- Temperature: 0.7

### 😄 Casual
- Relaxed and friendly
- Uses emojis, informal language
- Temperature: 0.7

### 💻 Technical
- Detailed with code examples
- Good for programming, tech
- Temperature: 0.7

---

## 🤖 Available Models

### Groq Models (Lightning Fast)

**llama-3.3-70b** ⚡ (Default)
- Latest Llama 3.3
- Best balance of speed/quality
- ~1-2 second response

**llama-3.1-70b** 🧠
- Versatile general purpose
- High quality responses
- ~2-3 seconds

**llama-3.1-8b** 🚀
- Ultra-fast responses
- Good for simple queries
- <1 second

**mixtral-8x7b** 🎨
- Creative responses
- Good for writing
- ~2-3 seconds

### Gemini Models (Google)

**gemini-2.0-flash-exp** ✨
- Latest experimental model
- Advanced reasoning
- ~3-5 seconds

**gemini-1.5-pro** 💎
- Most advanced Gemini
- Best for complex tasks
- ~5-7 seconds

**gemini-1.5-flash** ⚡
- Fast Gemini
- Good balance
- ~2-3 seconds

---

## 🔑 Key Rotation System

### How It Works
1. Bot loads all API keys from `.env`
2. Uses keys in rotation
3. If key fails → auto-switches to next
4. Blocked keys auto-unblock after 5 minutes

### Key Format
```env
# Groq keys
GROQ_API_KEY=key1
GROQ_API_KEY_2=key2
GROQ_API_KEY_3=key3

# Gemini keys
GOOGLE_API_KEY=key1
GOOGLE_API_KEY_2=key2
```

### Status Monitoring
- Console logs rotation events
- Automatic failover (no downtime)

---

## 📊 Usage Tracking

### Rate Limits
- **Free Users:** 50 requests/day
- **Premium:** Unlimited

### Checking Usage
```bash
/ai-usage
```

Shows:
- Requests today
- Remaining quota
- Daily limit
- Premium status

---

## 🛠️ Technical Details

### Memory Implementation
```typescript
Map<channelId, Array<{role, content}>>
```
- In-memory storage
- Cleared on bot restart
- Per-channel isolation

### Message Format
```typescript
{
  role: 'user' | 'assistant',
  content: string
}
```

### API Integration
- **Groq SDK** - `groq-sdk` package
- **Gemini SDK** - `@google/generative-ai` package
- Automatic retry on failure
- Key rotation on rate limit

---

## 🐛 Error Handling

### Common Errors

**"Rate Limit"**
- Solution: Wait or upgrade to premium
- Shows remaining quota

**"Groq is not initialized"**
- Solution: Check `.env` for GROQ_API_KEY
- Add valid API key

**"Gemini is not initialized"**
- Solution: Check `.env` for GOOGLE_API_KEY
- Add valid API key

**"Invalid model provider"**
- Solution: Use correct model format
- Chọn model hợp lệ trong slash command `/ai`

---

## 📈 Performance

### Response Times
- **Groq Llama 3.1 8B:** <1 second
- **Groq Llama 3.3 70B:** 1-2 seconds
- **Gemini Flash:** 2-3 seconds
- **Gemini Pro:** 5-7 seconds

### Memory Usage
- ~100 KB per channel with history
- Max 200 KB total (if 100 channels active)
- Cleared on restart

---

## 🎯 Use Cases

### 1. Quick Q&A
```bash
/ai message:What's the weather API? model:groq:llama-3.1-8b
```

### 2. Creative Writing
```bash
/ai message:Write a sci-fi story style:creative model:groq:mixtral-8x7b
```

### 3. Technical Help
```bash
/ai message:Explain async/await in JS style:technical
```

### 4. Conversational Chat
```bash
User: /ai message:Hi, what can you do?
AI: [Response]

User: /ai message:Tell me more about feature X
AI: [Response with context from previous]
```

### 5. Start Fresh
```bash
/ai message:New topic clear_memory:True
```

---

## 🚀 Future Enhancements

- [ ] Image generation (DALL-E, Stable Diffusion)
- [ ] Voice chat (speech-to-text)
- [ ] Persistent memory (database)
- [ ] Custom system prompts per user
- [ ] Multi-turn conversations with buttons
- [ ] Streaming responses
- [ ] Code execution sandbox

---

## 📝 Changelog

### v1.0.0 (2024-01-XX)
- ✨ Initial release
- 🤖 7 AI models supported
- 💭 Context memory (10 messages)
- 🎨 5 response styles
- 🔑 Auto key rotation
- 📊 Usage tracking

---

## 📞 Support

**Commands:**
- `/ai` - Main chat
- `/ai-memory view` - Check memory

**Troubleshooting:**
1. Check API keys in `.env`
2. Verify key rotation from console logs
3. Check usage with `/ai-usage`
4. Clear memory with `/ai-memory clear`

---

**Ready to chat with AI! 🤖**
