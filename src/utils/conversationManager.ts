// Conversation Manager - AI Chat Context & Memory

import fs from 'fs';
import path from 'path';

/* ─────────────────────────── Types ─────────────────────────── */

export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  role: Role;
  content: string;
  timestamp: number;
}

export interface Conversation {
  userId: string;
  guildId: string;
  messages: Message[];
  lastActivity: number;
  model: string;
}

export interface ConversationConfig {
  maxHistory: number;
  contextTimeout: number; // minutes
  systemPrompt: string;
  autoReplyOnMention: boolean;
  allowedChannels: string[];
  blacklistedUsers: string[];
}

export interface ConversationStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
}

/* ───────────────────────── Constants ───────────────────────── */

const MINUTE = 60 * 1000;
const CLEANUP_INTERVAL = 30 * MINUTE;
const SAVE_DEBOUNCE = 5 * 1000;
const CONFIG_PATH = './data/conversation-config.json';
const CONVERSATIONS_PATH = './data/conversations.json';

/* ──────────────────────── System prompt ────────────────────── */

const BOT_COMMANDS_KNOWLEDGE = `
# KIẾN THỨC VỀ CÁC LỆNH CỦA BOT (95 lệnh, 26 modules)

═══════════════════════════════════════════════════
📱 TIỆN ÍCH CƠ BẢN (Basic Utilities)
═══════════════════════════════════════════════════

## � Utility (9 lệnh)
- /help — Menu trợ giúp theo category
- /information — Thông tin bot (version, uptime, số server, lệnh)
- /user-info [user] — ID, ngày tham gia, roles, avatar
- /server-info — Owner, members, channels, roles, emojis, boosts
- /avatar [user] — Avatar độ phân giải cao
- /calc expression — Máy tính (vd: 2+2*5, sin(30), sqrt(16))
- /random min max — Số ngẫu nhiên
- /choose options — Chọn ngẫu nhiên 1 trong "a, b, c"
- /poll question options — Tạo poll bằng reactions

## 💤 AFK (3 lệnh)
- /afk [reason] [silent] — Đặt AFK, nickname đổi thành "[AFK] TÊN", tự tắt khi nhắn tin
- /afk-remove — Gỡ AFK thủ công
- /afk-list — Danh sách người đang AFK

## 👀 Snipe (2 lệnh)
- /snipe — Tin nhắn bị xóa gần nhất
- /editsnipe — Tin nhắn bị sửa gần nhất

## 💬 Social (7 lệnh - có GIF)
/hug · /pat · /kiss · /slap · /highfive · /poke · /wave

═══════════════════════════════════════════════════
🤖 AI & TỰ ĐỘNG HÓA (AI & Automation)
═══════════════════════════════════════════════════

## 🤖 AI Chat (2 lệnh + @bot)
- /ai message model style clear_memory — Chat với AI có memory
  Models: Groq (GPT-OSS 20B/120B, Llama 3.1), Gemini (2.0 Flash, 1.5 Pro/Flash)
  Styles: Default, Creative, Professional, Casual, Technical
- /ai-memory view|clear — Xem/xóa lịch sử hội thoại
- @bot + câu hỏi — Chat trực tiếp (GPT-OSS 20B)

## 🔄 Autoresponder (6 lệnh)
- /autoresponder-add trigger response match_type — Tạo auto-reply
  Placeholders: {user.mention} {user.username} {user.tag} {server} {server.members} {channel}
- /autoresponder-list · /autoresponder-view id
- /autoresponder-edit id · /autoresponder-remove id
- /autoresponder-test trigger

═══════════════════════════════════════════════════
💰 KINH TẾ & SHOP (Economy & Shop)
═══════════════════════════════════════════════════

## 💰 Economy (4 lệnh)
- /balance [user] — Xem xu, vé vàng, streak
- /transaction-history [user] [limit] — Lịch sử giao dịch (max 50)
- /convert amount from — Đổi tiền: 1 Vé Vàng = 10,000 Xu
- /coins — Quản lý coins (admin)

## 📅 Daily (3 lệnh)
- /daily — Điểm danh nhận 1000-5000 xu + 0-2 vé vàng (streak tăng thưởng)
- /daily-stats — Thống kê cá nhân
- /daily-leaderboard — Top 10 điểm danh

## 🎯 Quest (1 lệnh)
- /quest — Sổ nhiệm vụ: xem tiến độ, nhận thưởng (tin nhắn, voice, reaction)

## 🛒 Shop (4 lệnh)
- /shop — Xem items (roles, trang trí)
- /buy id — Mua bằng xu
- /inventory — Xem items đã mua
- /shop-revoke user role — Thu hồi (admin)

## 👑 VIP (6 lệnh)
- /vipinfo — Quyền lợi VIP (VIP 1-10, Premium, Ultimate)
- /vip-bonus — Bonus tuần 5000 xu (VIP 7%+)
- /vip-lottery tickets — Vé số VIP (10k xu/vé, trúng x10)
- /vip-stats · /vip-leaderboard
- /vip-transfer user amount — Chuyển xu (VIP 5%+)

## 🎨 Custom Role (7 lệnh)
- /customrole-panel — Panel quản lý role
- /customrole-create name color — Tạo role (#hex)
- /customrole-edit name|color|icon
- /customrole-delete · /customrole-transfer user
- /customrole-list · /customrole-config (admin)

═══════════════════════════════════════════════════
🛡️ QUẢN LÝ SERVER (Server Management)
═══════════════════════════════════════════════════

## 🛡️ Moderation (6 lệnh - cần quyền)
- /moderation-kick user reason
- /moderation-ban user reason delete-days — Ban + xóa tin (max 7 ngày)
- /moderation-timeout user duration reason — Timeout 1 phút - 28 ngày
- /moderation-clear amount — Xóa 1-100 tin nhắn
- /moderation-lock [channel] reason · /moderation-unlock [channel]

## 🔒 Security (2 lệnh)
- /lock-invites check|lock|unlock — Quản lý invite links
- /performance memory|cache|diagnostics — Hiệu suất bot

## 🎫 Ticket (5 lệnh + button)
- /ticket-setup — Panel "Mở Ticket" (kênh private)
- /ticket-close [reason] · /ticket-add user · /ticket-remove user
- /ticket-stats

## 📋 Quick Report (7 lệnh)
- /quickreport-setup channel role
- /report issue — Gửi báo cáo
- /quickreport-view · /quickreport-list
- /quickreport-resolve id · /quickreport-delete id
- /quickreport-disable

## 📌 Sticky Messages (7 lệnh)
- /sticky-create message — Tin luôn ở cuối kênh
- /sticky-edit message · /sticky-remove
- /sticky-list · /sticky-view
- /sticky-enable · /sticky-disable

## 📜 Rule (2 lệnh)
- /rule-setup [force] — Tạo category "📜 Luật Server"
- /rule [số] — Xem điều luật cụ thể

## 🖥️ Server Generator (2 cách)
- /generator — AI tạo cấu trúc server (categories, channels, permissions)
- !gen [mô tả] — Text command

═══════════════════════════════════════════════════
🎉 GIẢI TRÍ & EVENT (Entertainment & Events)
═══════════════════════════════════════════════════

## 🎁 Giveaway (1 lệnh + button)
- /giveaway-create prize duration winners — Users bấm "🎉 Tham gia"

## 💸 Donation (7 lệnh)
- /donation-setup role threshold — Thiết lập thưởng
- /donation-add user amount · /donation-leaderboard
- /donation-stats [user] · /donation-remove user
- /donation-config · /donation-disable

## 🎮 Games (1 lệnh)
- /guessing-game — Đoán số 1-100 với gợi ý

## ⛏️ Minecraft (2 lệnh)
- /minecraft-server address — Status (players, version, MOTD)
- /minecraft-custom-server-banner address — Banner với nền Minecraft

## 🎵 Music (prefix !bc - 13 lệnh)
- !bc play [tên/link] — YouTube, Spotify, SoundCloud, Apple Music
- !bc skip · stop · pause · resume
- !bc queue · nowplaying
- !bc volume [0-100] · shuffle · loop [off/track/queue]
- !bc remove [số] · seek [giây]
- !bc pin · pinned — Ghim bài yêu thích

═══════════════════════════════════════════════════
👑 ADMIN (2 lệnh - Owner only)
═══════════════════════════════════════════════════
- /givegold user amount — Tặng/thu hồi Vé Vàng
- /checkgold [user] — Kiểm tra Vé Vàng

═══════════════════════════════════════════════════
📌 HƯỚNG DẪN TRẢ LỜI
═══════════════════════════════════════════════════

**QUAN TRỌNG: Khi user hỏi "các lệnh của bot" / "danh sách lệnh" / "bot có lệnh gì" / "lệnh gì":**

→ BẮT BUỘC trả lời CHÍNH XÁC theo format này (KHÔNG thay đổi):

"🤖 Bot có 95 lệnh chia thành 5 nhóm chính:

📱 TIỆN ÍCH CƠ BẢN (20 lệnh)
• Utility, AFK, Snipe, Social

🤖 AI & TỰ ĐỘNG HÓA (9 lệnh)
• AI Chat, Autoresponder

💰 KINH TẾ & SHOP (25 lệnh)
• Economy, Daily, Quest, Shop, VIP, Custom Role

🛡️ QUẢN LÝ SERVER (29 lệnh)
• Moderation, Security, Ticket, Report, Sticky, Rule, Generator

🎉 GIẢI TRÍ & EVENT (23 lệnh)
• Giveaway, Donation, Games, Minecraft, Music

💡 Hỏi cụ thể về nhóm nào để xem chi tiết!
   Hoặc dùng /help trong Discord."

→ TUYỆT ĐỐI KHÔNG tạo bảng markdown
→ TUYỆT ĐỐI KHÔNG liệt kê từng lệnh
→ Copy CHÍNH XÁC format trên

**Khi user hỏi về 1 nhóm cụ thể (vd: "lệnh economy", "nhóm AI"):**
→ Liệt kê 3-5 lệnh quan trọng nhất, không liệt kê hết

**Khi user hỏi về 1 lệnh cụ thể (vd: "/daily"):**
→ Giải thích chi tiết với ví dụ

═══════════════════════════════════════════════════
📌 LƯU Ý QUAN TRỌNG
═══════════════════════════════════════════════════
- KHÔNG BAO GIỜ tạo bảng chi tiết khi hỏi tổng quan
- Economy có rate limit chống spam
- Moderation cần quyền admin/moderator
- Bot hỗ trợ Việt + Anh
- Luôn trả lời bằng ngôn ngữ của user
`.trim();

const BASE_PROMPT =
  'Bạn là một trợ lý AI thông minh và thân thiện trên Discord. ' +
  'Bạn có thể nói cả tiếng Việt và tiếng Anh. ' +
  'Hãy trả lời hữu ích, ngắn gọn và chính xác. ' +
  'Khi được hỏi về bản thân, hãy giới thiệu là Discord Bot AI có thể chat và giúp đỡ users.';

const DEFAULT_CONFIG: ConversationConfig = {
  maxHistory: 20,
  contextTimeout: 30,
  systemPrompt: `${BASE_PROMPT}\n\n${BOT_COMMANDS_KNOWLEDGE}`,
  autoReplyOnMention: true,
  allowedChannels: [],
  blacklistedUsers: [],
};

/* ───────────────────────── File helpers ─────────────────────── */

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  // Ghi file tạm rồi rename để tránh hỏng file nếu bot crash giữa chừng
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, filePath);
}

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

/* ───────────────────────── Manager ──────────────────────────── */

class ConversationManager {
  private conversations = new Map<string, Conversation>();
  private config: ConversationConfig;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.config = this.loadConfig();
    this.loadConversations();
    setInterval(() => this.cleanup(), CLEANUP_INTERVAL).unref();
  }

  /* ── Config ── */

  private loadConfig(): ConversationConfig {
    const saved = readJson<Partial<ConversationConfig>>(CONFIG_PATH);
    if (saved) return { ...DEFAULT_CONFIG, ...saved };
    console.log('Using default conversation config');
    this.saveConfig(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }

  private saveConfig(config: ConversationConfig = this.config): void {
    writeJson(CONFIG_PATH, config);
  }

  getConfig(): ConversationConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ConversationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /* ── Persistence ── */

  private loadConversations(): void {
    const saved = readJson<Record<string, Conversation>>(CONVERSATIONS_PATH);
    if (!saved) {
      console.log('No existing conversations to load');
      return;
    }

    for (const [key, conv] of Object.entries(saved)) {
      this.conversations.set(key, conv);
    }

    console.log(`✅ Loaded ${this.conversations.size} conversation(s)`);
  }

  /** Lưu ngay lập tức. */
  flush(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    try {
      writeJson(CONVERSATIONS_PATH, Object.fromEntries(this.conversations));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  /** Gom nhiều thay đổi liên tiếp thành một lần ghi. */
  private scheduleSave(): void {
    if (this.saveTimer) return;

    this.saveTimer = setTimeout(() => this.flush(), SAVE_DEBOUNCE);
    this.saveTimer.unref();
  }

  /* ── Helpers ── */

  private key(userId: string, guildId: string): string {
    return `${guildId}-${userId}`;
  }

  private get timeoutMs(): number {
    return this.config.contextTimeout * MINUTE;
  }

  private isExpired(conv: Conversation, now = Date.now()): boolean {
    return now - conv.lastActivity > this.timeoutMs;
  }

  private systemMessage(timestamp = Date.now()): Message {
    return { role: 'system', content: this.config.systemPrompt, timestamp };
  }

  /* ── Conversations ── */

  getConversation(userId: string, guildId: string): Conversation | undefined {
    const key = this.key(userId, guildId);
    const conv = this.conversations.get(key);

    if (!conv) return undefined;

    if (this.isExpired(conv)) {
      console.log(`Conversation expired for ${userId}`);
      this.conversations.delete(key);
      this.scheduleSave();
      return undefined;
    }

    return conv;
  }

  createOrUpdateConversation(
    userId: string,
    guildId: string,
    userMessage: string,
    assistantMessage: string,
    model = 'groq'
  ): Conversation {
    const key = this.key(userId, guildId);
    const now = Date.now();

    const conv: Conversation = this.conversations.get(key) ?? {
      userId,
      guildId,
      messages: [this.systemMessage(now)],
      lastActivity: now,
      model,
    };

    conv.messages.push(
      { role: 'user', content: userMessage, timestamp: now },
      { role: 'assistant', content: assistantMessage, timestamp: now }
    );

    // Giữ system prompt + maxHistory tin nhắn gần nhất
    const { maxHistory } = this.config;
    if (conv.messages.length > maxHistory + 1) {
      conv.messages = [conv.messages[0], ...conv.messages.slice(-maxHistory)];
    }

    conv.lastActivity = now;
    this.conversations.set(key, conv);
    this.scheduleSave();

    return conv;
  }

  getContext(userId: string, guildId: string): Message[] {
    return this.getConversation(userId, guildId)?.messages ?? [this.systemMessage()];
  }

  clearConversation(userId: string, guildId: string): boolean {
    const deleted = this.conversations.delete(this.key(userId, guildId));
    if (deleted) this.scheduleSave();
    return deleted;
  }

  clearAllConversations(guildId?: string): number {
    let count = 0;

    for (const [key, conv] of this.conversations) {
      if (!guildId || conv.guildId === guildId) {
        this.conversations.delete(key);
        count++;
      }
    }

    this.scheduleSave();
    return count;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, conv] of this.conversations) {
      if (this.isExpired(conv, now)) {
        this.conversations.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired conversation(s)`);
      this.scheduleSave();
    }
  }

  /* ── Stats & access control ── */

  getStats(guildId?: string): ConversationStats {
    const now = Date.now();
    const list = [...this.conversations.values()].filter(
      (c) => !guildId || c.guildId === guildId
    );

    return {
      totalConversations: list.length,
      activeConversations: list.filter((c) => !this.isExpired(c, now)).length,
      totalMessages: list.reduce((sum, c) => sum + c.messages.length, 0),
    };
  }

  isUserBlacklisted(userId: string): boolean {
    return this.config.blacklistedUsers.includes(userId);
  }

  isChannelAllowed(channelId: string): boolean {
    const { allowedChannels } = this.config;
    return allowedChannels.length === 0 || allowedChannels.includes(channelId);
  }
}

export const conversationManager = new ConversationManager();
