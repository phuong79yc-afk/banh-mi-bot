/**
 * AI Module - Enhanced AI chat with context memory (Components V2)
 * Supports: Groq (GPT-OSS, Llama), Gemini (Google)
 */

import {
  Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction, ButtonInteraction,
  AttachmentBuilder, ContainerBuilder, FileBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, User,
  ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction,
} from 'discord.js';
import { getEmoji, emojis } from '../../config/emojis';
import { V2, V2_EPHEMERAL, txt, sep, gallery } from '../../utils/v2Helper';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { keyRotator } from '../../utils/aiKeyRotator';
import { aiUsageTracker } from '../../utils/aiUsageTracker';
import { getCustomEmoji } from '../../utils/customEmoji';

type Provider = 'groq' | 'gemini';
type ChatMessage = { role: 'user' | 'assistant'; content: string };

// Conversation memory (channel-based)
const conversationHistory = new Map<string, ChatMessage[]>();
const MAX_HISTORY = 10; // Keep last 10 exchanges per channel

// Giới hạn hiển thị (message V2 tối đa 4000 ký tự text)
const MAX_DISPLAY = 3200;
const IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell';
const IMAGE_EDIT_MODEL = '@cf/black-forest-labs/flux-2-klein-4b';
const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const IMAGE_EDIT_CACHE_MAX = 10;
const IMAGE_EDIT_CACHE_TTL = 30 * 60 * 1000;
const IMAGE_CREDIT = 'Generated with FLUX.1 Schnell · Cloudflare Workers AI';

interface CachedImage {
  ownerId: string;
  buffer: Buffer;
  mimeType: string;
  expiresAt: number;
}

// Cache câu trả lời gần đây để nút "Tạo lại" hoạt động
interface CachedAnswer {
  question: string;
  provider: Provider;
  modelId: string;
  style: string;
  snapshot: ChatMessage[];
}

const answerCache = new Map<string, CachedAnswer>();
const MAX_CACHE = 200;
let answerSeq = 0;

// Available AI models
const AI_MODELS = {
  groq: {
    'openai/gpt-oss-20b': 'GPT-OSS 20B (Fastest, 1000 T/s)',
    'openai/gpt-oss-120b': 'GPT-OSS 120B (Smart, 500 T/s)',
    'llama-3.1-8b-instant': 'Llama 3.1 8B (Fast)',
  },
  gemini: {
    'gemini-2.0-flash-exp': 'Gemini 2.0 Flash (Latest)',
    'gemini-1.5-pro': 'Gemini 1.5 Pro (Advanced)',
    'gemini-1.5-flash': 'Gemini 1.5 Flash (Fast)',
  },
} as const;

const PROVIDER_COLOR: Record<Provider, number> = { groq: 0xf55036, gemini: 0x4285f4 };
const PROVIDER_EMOJI: Record<Provider, string> = { groq: '⚡', gemini: '💎' };

const STYLE_LABELS: Record<string, string> = {
  default: '📝 Default',
  creative: `${emojis.art} Creative`,
  professional: '💼 Professional',
  casual: '😄 Casual',
  technical: `${emojis.terminal} Technical`,
};

// System prompts (with auto language detection)
const BOT_COMMANDS_KNOWLEDGE = `
Bot Commands Knowledge (use when user asks about bot commands):

**🤖 AI Chat:**
- /ai message:[câu hỏi] model:[optional] style:[optional] - Chat với AI có memory. Models: GPT-OSS 20B/120B (Groq), Llama 3.1 8B, Gemini 2.0 Flash/1.5 Pro/Flash. Styles: default, creative, professional, casual, technical
- /ai-memory view/clear - Xem hoặc xóa lịch sử hội thoại trong kênh
- /image prompt:[mô tả] - Tạo ảnh bằng FLUX trên Cloudflare Workers AI
- !ai [câu hỏi] - Prefix command, dùng model mặc định GPT-OSS 20B

**💰 Economy & Shop:**
- /balance - Xem số xu, vé vàng, streak điểm danh
- /shop - Xem shop items (roles, decorative items) và mua
- /buy - Mua items từ shop bằng xu
- /convert - Đổi vé vàng thành xu (1 vé = 1000 xu)
- /inventory - Xem items đã mua
- /vipinfo - Xem quyền lợi và hạng VIP (dựa trên số vé vàng)

**📅 Daily & VIP:**
- /daily - Điểm danh hàng ngày, nhận xu và vé vàng. Streak bonus mỗi 7 ngày
- /daily-stats - Xem thống kê điểm danh của bạn
- /daily-leaderboard - Bảng xếp hạng điểm danh
- /vip-bonus - Nhận bonus VIP hàng tuần (5000 xu cho VIP 7%+)
- /vip-lottery tickets:[số vé] - Mua vé xổ số (10k xu/vé), quay số hàng ngày

**🎯 Quest System:**
- /quest - Mở sổ nhiệm vụ, xem tiến độ và nhận thưởng
- Nhiệm vụ tự động cập nhật khi hoàn thành (chat, reaction, voice, invite)

**😴 AFK System:**
- /afk [lý do] - Bật chế độ AFK, nickname đổi thành [AFK] TÊN. Tự động tắt khi chat. Lưu mentions.
- /afk-remove - Tắt AFK thủ công
- /afk-list - Xem danh sách người đang AFK

**🤝 Custom Role:**
- /customrole panel - Xem role riêng của bạn
- /customrole create name:[tên] color:[#hex] - Tạo role riêng (yêu cầu có role được phép)
- /customrole edit name:[tên mới] color:[#hex mới] - Chỉnh sửa role
- /customrole delete - Xóa role của bạn
- /customrole setup/config - Cấu hình tính năng (admin)

**🤖 Autoresponder:**
- /autoresponder-add trigger:[từ khóa] response:[trả lời] mode:[exact/contains/starts/ends] - Tự động trả lời. Hỗ trợ {user.mention}, {user.name}, {server}, {channel}, {random:a,b,c}
- /autoresponder-list - Danh sách autoresponders
- /autoresponder-view trigger:[từ khóa] - Xem chi tiết
- /autoresponder-remove trigger:[từ khóa] - Xóa autoresponder

**🎮 Games:**
- /rps [rock/paper/scissors] - Kéo búa bao với bot
- /coinflip [heads/tails] - Tung đồng xu
- /8ball [câu hỏi] - Hỏi quả cầu thần kỳ
- /trivia - Trắc nghiệm kiến thức (có thưởng xu)
- /guess - Đoán số (1-100)

**🎁 Giveaway:**
- /giveaway-create prize:[phần thưởng] duration:[phút] winners:[số người] - Tạo giveaway
- /giveaway-end giveaway-id:[ID] - Kết thúc sớm
- /giveaway-reroll giveaway-id:[ID] - Chọn lại người thắng
- /giveaway-delete giveaway-id:[ID] - Xóa giveaway

**🎨 Minecraft:**
- /minecraft-server address:[địa chỉ] template:[optional] - Banner Minecraft server với MOTD, players, status. Templates: classic, modern, gradient, neon
- /minecraft-templates - Xem tất cả templates
- /minecraft-gallery - Xem gallery các banner đã tạo

**🛠️ Server Generator:**
- /generator - Menu tạo server tự động (channels, categories, roles, welcome/goodbye). Có preview trước khi apply
- !gen [mô tả] - Prefix command tạo server structure

**🎫 Ticket System:**
- /ticket-setup - Tạo panel ticket trong kênh
- /ticket-panel - Tạo panel tùy chỉnh với button
- /ticket-stats - Xem thống kê ticket
- !ticket [mô tả] - Tạo ticket nhanh

**🔨 Moderation:**
- /kick user:[user] reason:[lý do] - Đuổi thành viên
- /ban user:[user] reason:[lý do] delete-days:[0-7] - Cấm vĩnh viễn
- /timeout user:[user] duration:[phút] reason:[lý do] - Cấm chat tạm thời (max 28 ngày)
- /clear amount:[1-100] user:[optional] - Xóa hàng loạt tin nhắn
- /lock channel:[kênh] reason:[lý do] - Khóa kênh
- /unlock channel:[kênh] - Mở khóa kênh
- /snipe - Xem tin nhắn vừa bị xóa
- /slowmode seconds:[0-21600] - Bật slowmode

**📊 Sticky Messages:**
- /sticky-set message:[nội dung] - Đặt tin nhắn sticky trong kênh (tự động ghim dưới cùng)
- /sticky-remove - Xóa sticky message

**⚙️ Settings & Logs:**
- /log-setup - Cấu hình logging (message delete/edit, member join/leave, mod actions)
- /serverstats-setup - Tạo kênh thống kê tự động (members, bots, channels, roles)
- /rule-setup - Tạo danh mục và kênh rules
- /rule [số thứ tự] - Xem luật cụ thể

**📝 Quick Report:**
- /quickreport-setup category:[danh mục] role:[role quản lý] - Cấu hình report nhanh
- !report user:[user] reason:[lý do] - Report thành viên nhanh

**🎵 Music (Prefix Commands):**
- !bc play [tên bài/URL] - Phát nhạc (YouTube, Spotify, SoundCloud)
- !bc skip - Bỏ qua bài hiện tại
- !bc stop - Dừng và xóa queue
- !bc pause - Tạm dừng
- !bc resume - Tiếp tục
- !bc queue - Xem hàng đợi
- !bc nowplaying - Xem bài đang phát
- !bc volume [0-100] - Điều chỉnh âm lượng
- !bc loop - Bật/tắt loop bài hiện tại
- !bc shuffle - Trộn queue
- !bc lyrics - Xem lời bài hát

**🔧 Utility:**
- /help - Menu trợ giúp đầy đủ
- /user-info user:[optional] - Thông tin user
- /server-info - Thông tin server
- /avatar user:[optional] - Xem avatar
- /banner user:[optional] - Xem banner
- /poll question:[câu hỏi] options:[lựa chọn] - Tạo bình chọn
- /choose options:[lựa chọn] - Bot chọn ngẫu nhiên
- /random min:[số] max:[số] - Số ngẫu nhiên
- /calc expression:[biểu thức] - Máy tính
- /remind time:[phút] message:[nội dung] - Nhắc nhở sau X phút
- /ping - Kiểm tra độ trễ bot

**🔒 Security:**
- /security-scan - Quét bảo mật server (permissions, roles, channels)
- /security-report - Xem báo cáo bảo mật chi tiết

When user asks about a command, explain it clearly in their language (Vietnamese or English). For commands with many options, mention the required ones first.
`;

const SYSTEM_PROMPTS = {
  default: `You are a helpful AI assistant in a Discord server. Automatically detect the language of the user's message and respond in the SAME language (Vietnamese or English). Be concise, friendly, and informative.

${BOT_COMMANDS_KNOWLEDGE}`,
  creative: `You are a creative AI that thinks outside the box. Automatically detect the user's language and respond in the same language. Be imaginative and original.

${BOT_COMMANDS_KNOWLEDGE}`,
  professional: `You are a professional AI assistant. Automatically detect the user's language and respond in the same language. Be formal, accurate, and detailed.

${BOT_COMMANDS_KNOWLEDGE}`,
  casual: `You are a casual friend chatting in Discord. Automatically detect the user's language and respond in the same language. Be relaxed, use emojis, and keep it fun!

${BOT_COMMANDS_KNOWLEDGE}`,
  technical: `You are a technical expert. Automatically detect the user's language and respond in the same language. Provide detailed, accurate technical information with examples.

${BOT_COMMANDS_KNOWLEDGE}`,
};

// ───────── UI helpers ─────────

const modelName = (provider: Provider, modelId: string) =>
  (AI_MODELS[provider] as Record<string, string>)[modelId] || modelId;

const simple = (color: number, title: string, subtitle?: string) => {
  const c = new ContainerBuilder().addTextDisplayComponents(txt(title));
  if (subtitle) c.addTextDisplayComponents(txt(subtitle));
  return c;
};

const loadingCard = (provider: Provider, modelId: string, style: string) =>
  new ContainerBuilder().addTextDisplayComponents(
      txt(`## ${emojis.loading} Đang suy nghĩ...`),
      txt(`-# ${PROVIDER_EMOJI[provider]} ${modelName(provider, modelId)} • ${STYLE_LABELS[style] || style}`),
    );

const rateLimitCard = (userId: string) => {
  const usage = aiUsageTracker.getUsage(userId);
  return new ContainerBuilder().addTextDisplayComponents(txt(`## ${getCustomEmoji('ERROR')} Rate Limit`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      txt(`${emojis.clock} Bạn đã đạt giới hạn **${usage.limit}** requests/ngày`),
      txt('-# 💎 Upgrade Premium để unlimited!'),
    );
};

const errorCard = (message: string) =>
  new ContainerBuilder().addTextDisplayComponents(txt(`## ${emojis.error} AI Error`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(message.slice(0, 1500)))
    .addTextDisplayComponents(txt('-# Thử đổi model bằng option `model:`'));

const clearedCard = () =>
  simple(0x57f287, '## 🧹 Đã xóa bộ nhớ', '-# Lịch sử hội thoại của kênh này đã được reset.');

export default class AIModule {
  name = 'ai-module';
  description = 'Enhanced AI chat with memory and multiple models';

  /**
   * Check if a provider is available (has at least one working key)
   */
  private checkProviderAvailable(provider: Provider): boolean {
    if (provider === 'groq') return keyRotator.getGroqKey() !== null;
    if (provider === 'gemini') return keyRotator.getGeminiKey() !== null;
    return false;
  }
  version = '1.2.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;
  private readonly imageEditCache = new Map<string, CachedImage>();

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('  🤖 AI Module initializing...');
    this.checkKeys();
    this.registerCommands();
    this.registerEvents();
    console.log('  ✅ AI Module ready');
  }

  private cacheImageForEditing(ownerId: string, buffer: Buffer, mimeType: string): string {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    this.storeImageForEditing(id, ownerId, buffer, mimeType, Date.now() + IMAGE_EDIT_CACHE_TTL);
    return id;
  }

  private storeImageForEditing(
    id: string,
    ownerId: string,
    buffer: Buffer,
    mimeType: string,
    expiresAt: number,
  ) {
    const now = Date.now();
    for (const [id, image] of this.imageEditCache) {
      if (image.expiresAt <= now) this.imageEditCache.delete(id);
    }

    while (this.imageEditCache.size >= IMAGE_EDIT_CACHE_MAX) {
      const oldest = this.imageEditCache.keys().next().value;
      if (!oldest) break;
      this.imageEditCache.delete(oldest);
    }

    this.imageEditCache.set(id, {
      ownerId,
      buffer,
      mimeType,
      expiresAt,
    });
  }

  private async getImageForEditing(
    id: string,
    ownerId: string,
    message: ButtonInteraction['message'] | ModalSubmitInteraction['message'],
  ): Promise<CachedImage | null> {
    const cached = this.imageEditCache.get(id);
    if (cached?.ownerId === ownerId && cached.expiresAt > Date.now()) return cached;
    if (cached) this.imageEditCache.delete(id);

    if (!message) return null;
    const expiresAt = message.createdTimestamp + IMAGE_EDIT_CACHE_TTL;
    if (expiresAt <= Date.now()) return null;

    const attachment = message.attachments.find(file =>
      /^generated-image\.(?:png|jpe?g|webp)$/i.test(file.name ?? ''),
    );
    if (!attachment) return null;

    const mimeType = attachment.contentType?.split(';', 1)[0].toLowerCase()
      ?? (attachment.name.toLowerCase().endsWith('.png')
        ? 'image/png'
        : attachment.name.toLowerCase().endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) return null;

    const response = await axios.get<ArrayBuffer>(attachment.url, {
      responseType: 'arraybuffer',
      timeout: 15_000,
      maxContentLength: IMAGE_MAX_BYTES,
    });
    const buffer = Buffer.from(response.data);
    if (buffer.length === 0 || buffer.length > IMAGE_MAX_BYTES) return null;

    this.storeImageForEditing(id, ownerId, buffer, mimeType, expiresAt);
    return this.imageEditCache.get(id) ?? null;
  }

  private buildImageResult(
    buffer: Buffer,
    mimeType: string,
    ownerId: string,
    credit = IMAGE_CREDIT,
  ) {
    const extensionByMime: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
    };
    const extension = extensionByMime[mimeType];
    if (!extension) throw new Error(`Định dạng ảnh không được hỗ trợ: ${mimeType}`);

    const fileName = `generated-image.${extension}`;
    const imageId = this.cacheImageForEditing(ownerId, buffer, mimeType);
    const container = new ContainerBuilder()
      .addMediaGalleryComponents(gallery(`attachment://${fileName}`))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(credit))
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`image_edit:${ownerId}:${imageId}`)
            .setLabel('Sửa ảnh')
            .setEmoji(getEmoji('edit_image'))
            .setStyle(ButtonStyle.Secondary),
        ),
      );

    return { container, fileName };
  }

  private checkKeys() {
    const groqAvailable = keyRotator.getGroqKey() !== null;
    const geminiAvailable = keyRotator.getGeminiKey() !== null;
    
    if (groqAvailable) {
      console.log('  ✅ Groq API keys loaded');
    } else {
      console.warn('  ⚠️  No Groq keys available - Groq models disabled');
    }
    
    if (geminiAvailable) {
      console.log('  ✅ Gemini API keys loaded');
    } else {
      console.warn('  ⚠️  No Gemini keys available - Gemini models disabled');
    }
    
    if (!groqAvailable && !geminiAvailable) {
      console.error('  ❌ NO AI PROVIDERS AVAILABLE - /ai command will not work');
      console.error('  💡 Add GROQ_API_KEYS or GEMINI_API_KEY to environment variables');
    }
  }

  private registerCommands() {
    // /ai - Main chat command
    const aiCommand = {
      data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Trò chuyện với AI; cuộc trò chuyện có lưu ngữ cảnh')
        .addStringOption(o => o.setName('message').setDescription('Nội dung bạn muốn hỏi hoặc yêu cầu AI').setRequired(true))
        .addStringOption(o =>
          o.setName('model').setDescription('Chọn mô hình AI (mặc định bot tự chọn)').setRequired(false)
            .addChoices(
              { name: '⚡ GPT-OSS 20B (Fastest)', value: 'groq:openai/gpt-oss-20b' },
              { name: '🧠 GPT-OSS 120B (Smart)', value: 'groq:openai/gpt-oss-120b' },
              { name: `${emojis.rocket} Llama 3.1 8B (Fast)`, value: 'groq:llama-3.1-8b-instant' },
              { name: `${emojis.sparkles} Gemini 2.0 Flash (New)`, value: 'gemini:gemini-2.0-flash-exp' },
              { name: '💎 Gemini 1.5 Pro', value: 'gemini:gemini-1.5-pro' },
              { name: '⚡ Gemini 1.5 Flash', value: 'gemini:gemini-1.5-flash' },
            ),
        )
        .addStringOption(o =>
          o.setName('style').setDescription('Chọn phong cách trả lời của AI').setRequired(false)
            .addChoices(
              { name: '📝 Default (Helpful)', value: 'default' },
              { name: `${emojis.art} Creative`, value: 'creative' },
              { name: '💼 Professional', value: 'professional' },
              { name: '😄 Casual', value: 'casual' },
              { name: `${emojis.terminal} Technical`, value: 'technical' },
            ),
        )
        .addBooleanOption(o =>
          o.setName('clear_memory').setDescription('Xóa ngữ cảnh hội thoại đã lưu sau khi trả lời').setRequired(false),
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await this.handleAIChat(interaction);
      },
    };

    // /ai-memory - View/manage conversation memory
    const memoryCommand = {
      data: new SlashCommandBuilder()
        .setName('ai-memory')
        .setDescription('Xem hoặc xóa ngữ cảnh trò chuyện AI đã lưu')
        .addSubcommand(s => s.setName('view').setDescription('Xem lịch sử trò chuyện AI của bạn'))
        .addSubcommand(s => s.setName('clear').setDescription('Xóa lịch sử trò chuyện AI đã lưu')),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await this.handleMemoryCommand(interaction);
      },
    };

    const imageCommand = {
      data: new SlashCommandBuilder()
        .setName('image')
        .setDescription('Tạo ảnh bằng FLUX qua Cloudflare Workers AI')
        .addStringOption(option =>
          option
            .setName('prompt')
            .setDescription('Mô tả hình ảnh bạn muốn tạo')
            .setMinLength(3)
            .setMaxLength(2000)
            .setRequired(true),
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await this.handleImageGeneration(interaction);
      },
    };

    this.commands.set('ai', aiCommand);
    this.commands.set('ai-memory', memoryCommand);
    this.commands.set('image', imageCommand);
  }

  private async handleImageGeneration(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply();
    } catch (error: any) {
      if (error.code === 10062 || error.code === 40060) return;
      throw error;
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
    if (!accountId || !apiToken) {
      await interaction.editReply(
        'Tính năng tạo ảnh chưa được cấu hình. Hãy đặt CLOUDFLARE_ACCOUNT_ID và CLOUDFLARE_API_TOKEN.',
      );
      return;
    }

    const prompt = interaction.options.getString('prompt', true).trim();
    if (prompt.length < 3) {
      await interaction.editReply('Mô tả ảnh cần có ít nhất 3 ký tự.');
      return;
    }

    try {
      const { data } = await axios.post<{
        success?: boolean;
        result?: { image?: string };
        errors?: Array<{ code?: number; message?: string }>;
      }>(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${IMAGE_MODEL}`,
        { prompt },
        {
          headers: { Authorization: `Bearer ${apiToken}` },
          timeout: 120_000,
        },
      );

      if (!data.success || !data.result?.image) {
        const detail = data.errors?.map(error => error.message).filter(Boolean).join('\n').slice(0, 800);
        await interaction.editReply(detail || 'Cloudflare Workers AI không trả về ảnh. Hãy thử lại sau.');
        return;
      }

      const mimeType = 'image/jpeg';
      const imageBuffer = Buffer.from(data.result.image, 'base64');
      if (imageBuffer.length === 0) {
        await interaction.editReply('Cloudflare Workers AI trả về dữ liệu ảnh không hợp lệ. Vui lòng thử lại sau.');
        return;
      }
      if (imageBuffer.length > IMAGE_MAX_BYTES) {
        await interaction.editReply('Ảnh tạo ra vượt quá giới hạn tệp 8 MB của bot.');
        return;
      }

      const { container, fileName } = this.buildImageResult(imageBuffer, mimeType, interaction.user.id);

      await interaction.editReply({
        components: [container],
        files: [new AttachmentBuilder(imageBuffer, { name: fileName })],
        flags: V2,
      } as any);
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const providerMessage = axios.isAxiosError(error)
        ? error.response?.data?.errors?.map((entry: { message?: string }) => entry.message).filter(Boolean).join('; ')
        : undefined;
      console.error('[Image Generation] Cloudflare Workers AI request failed:', {
        status,
        providerMessage,
        message: error instanceof Error ? error.message : String(error),
      });

      const quotaExceeded = status === 429 || /quota|neurons|daily allocation|rate limit/i.test(providerMessage ?? '');
      const message = quotaExceeded
        ? 'Cloudflare Workers AI đã hết quota hoặc đang giới hạn yêu cầu. Hạn mức miễn phí được làm mới hằng ngày.'
        : status === 401 || status === 403
          ? 'Cloudflare API token không hợp lệ hoặc thiếu quyền Workers AI.'
          : status === 404
            ? `Không tìm thấy model ${IMAGE_MODEL} hoặc Account ID không đúng.`
            : 'Không thể tạo ảnh bằng Cloudflare Workers AI lúc này. Vui lòng thử lại sau.';
      await interaction.editReply(message).catch(editError => {
        console.error('[Image Generation] Failed to send error response:', editError);
      });
    }
  }

  // ───────── Nút bấm (Tạo lại / Xóa bộ nhớ) ─────────
  private registerEvents() {
    // Button interactions
    this.client.on('interactionCreate', async interaction => {
      try {
        if (interaction.isButton() && interaction.customId.startsWith('image_edit:')) {
          await this.handleImageEditButton(interaction);
        } else if (interaction.isModalSubmit() && interaction.customId.startsWith('image_edit_modal:')) {
          await this.handleImageEditSubmit(interaction);
        } else if (interaction.isButton() && interaction.customId.startsWith('ai_')) {
          await this.handleButton(interaction);
        }
      } catch (error) {
        console.error('AI interaction error:', error);
        if (interaction.isRepliable()) {
          try {
            if (interaction.deferred || interaction.replied) {
              await interaction.editReply('Không thể xử lý tương tác AI lúc này.');
            } else {
              await interaction.reply({
                content: 'Không thể xử lý tương tác AI lúc này.',
                flags: MessageFlags.Ephemeral,
              });
            }
          } catch (responseError) {
            console.error('AI interaction error response failed:', responseError);
          }
        }
      }
    });

    // Bot mention listener disabled - using main index.ts listener instead
  }

  private async handleImageEditButton(interaction: ButtonInteraction) {
    const [, ownerId, imageId] = interaction.customId.split(':');
    if (interaction.user.id !== ownerId) {
      await interaction.reply({ content: 'Chỉ người tạo ảnh mới có thể sửa ảnh này.', flags: MessageFlags.Ephemeral });
      return;
    }

    const image = await this.getImageForEditing(imageId, ownerId, interaction.message);
    if (!image) {
      await interaction.reply({
        content: 'Ảnh đã hết hạn khỏi bộ nhớ tạm. Hãy dùng `/image` để tạo ảnh mới rồi thử lại.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const promptInput = new TextInputBuilder()
      .setCustomId('edit_prompt')
      .setLabel('Bạn muốn chỉnh sửa ảnh như thế nào?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ví dụ: thêm chiếc nơ đỏ cho con mèo')
      .setMinLength(3)
      .setMaxLength(1000)
      .setRequired(true);
    const modal = new ModalBuilder()
      .setCustomId(`image_edit_modal:${ownerId}:${imageId}`)
      .setTitle('Sửa ảnh bằng Cloudflare AI')
      .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(promptInput));

    await interaction.showModal(modal);
  }

  private async handleImageEditSubmit(interaction: ModalSubmitInteraction) {
    const [, ownerId, imageId] = interaction.customId.split(':');
    if (interaction.user.id !== ownerId) {
      await interaction.reply({ content: 'Chỉ người tạo ảnh mới có thể sửa ảnh này.', flags: MessageFlags.Ephemeral });
      return;
    }

    const sourceImage = await this.getImageForEditing(imageId, ownerId, interaction.message);
    if (!sourceImage) {
      await interaction.reply({
        content: 'Ảnh đã hết hạn khỏi bộ nhớ tạm. Hãy dùng `/image` để tạo ảnh mới rồi thử lại.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
    if (!accountId || !apiToken) {
      await interaction.editReply(
        'Tính năng sửa ảnh chưa được cấu hình. Hãy đặt CLOUDFLARE_ACCOUNT_ID và CLOUDFLARE_API_TOKEN.',
      );
      return;
    }

    const editPrompt = interaction.fields.getTextInputValue('edit_prompt').trim();
    if (editPrompt.length < 3) {
      await interaction.editReply('Yêu cầu chỉnh sửa cần có ít nhất 3 ký tự.');
      return;
    }

    try {
      const formData = new FormData();
      formData.set('prompt', editPrompt);
      formData.set(
        'image',
        new Blob([new Uint8Array(sourceImage.buffer)], { type: sourceImage.mimeType }),
        `source-image.${sourceImage.mimeType.split('/')[1]}`,
      );
      const response = await axios.post<ArrayBuffer>(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${IMAGE_EDIT_MODEL}`,
        formData,
        {
          headers: { Authorization: `Bearer ${apiToken}` },
          responseType: 'arraybuffer',
          timeout: 120_000,
          maxContentLength: Math.ceil(IMAGE_MAX_BYTES * 4 / 3) + 1024,
        },
      );

      const contentTypeHeader = response.headers['content-type'];
      const contentType = typeof contentTypeHeader === 'string'
        ? contentTypeHeader.split(';', 1)[0].toLowerCase()
        : undefined;
      let imageBuffer = Buffer.from(response.data);
      let mimeType = contentType ?? 'image/png';

      if (contentType?.includes('application/json')) {
        const result = JSON.parse(imageBuffer.toString('utf8')) as {
          result?: { image?: string };
          errors?: Array<{ message?: string }>;
        };
        const image = result.result?.image;
        if (!image) {
          const detail = result.errors?.map(error => error.message).filter(Boolean).join('\n').slice(0, 800);
          await interaction.editReply(detail || 'Cloudflare Workers AI không trả về ảnh đã chỉnh sửa.');
          return;
        }
        imageBuffer = Buffer.from(image, 'base64');
        mimeType = 'image/jpeg';
      }

      if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
        await interaction.editReply(`Cloudflare trả về định dạng ảnh không hỗ trợ: ${mimeType}.`);
        return;
      }
      if (imageBuffer.length === 0 || imageBuffer.length > IMAGE_MAX_BYTES) {
        await interaction.editReply('Ảnh đã sửa vượt quá giới hạn tệp 8 MB của bot.');
        return;
      }

      const { container, fileName } = this.buildImageResult(
        imageBuffer,
        mimeType,
        ownerId,
        'Edited with FLUX.2 Klein · Cloudflare Workers AI',
      );
      await interaction.editReply({
        components: [container],
        files: [new AttachmentBuilder(imageBuffer, { name: fileName })],
        flags: V2,
      } as any);
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const responseData = axios.isAxiosError(error) && error.response?.data
        ? Buffer.from(error.response.data as ArrayBuffer).toString('utf8')
        : '';
      let providerMessage: string | undefined;
      if (responseData) {
        try {
          const parsed = JSON.parse(responseData) as { errors?: Array<{ message?: string }> };
          providerMessage = parsed.errors?.map(entry => entry.message).filter(Boolean).join('; ');
        } catch {
          providerMessage = responseData.slice(0, 500);
        }
      }
      console.error('[Image Edit] Cloudflare Workers AI request failed:', {
        status,
        providerMessage,
        message: error instanceof Error ? error.message : String(error),
      });
      const message = status === 429
        ? 'Cloudflare Workers AI đang giới hạn yêu cầu. Vui lòng đợi một chút rồi thử lại.'
        : status === 403
          ? 'Cloudflare API token chưa được cấp quyền Workers AI hoặc model chưa được bật.'
          : status === 404
            ? `Không tìm thấy model chỉnh ảnh ${IMAGE_EDIT_MODEL} trong tài khoản Cloudflare.`
            : providerMessage
              ? `Cloudflare Workers AI: ${providerMessage}`
              : 'Không thể sửa ảnh lúc này. Vui lòng thử lại sau.';
      await interaction.editReply(message).catch(editError => {
        console.error('[Image Edit] Failed to send error response:', editError);
      });
    }
  }

  private async handleButton(interaction: ButtonInteraction) {
    const [action, ownerId, id] = interaction.customId.split(':');

    if (interaction.user.id !== ownerId) {
      await interaction.reply({
        components: [simple(0xed4245, `${emojis.error} Nút này không phải của bạn!`)],
        flags: V2_EPHEMERAL,
      } as any);
      return;
    }

    if (action === 'ai_clear') {
      conversationHistory.delete(interaction.channelId);
      await interaction.reply({ components: [clearedCard()], flags: V2_EPHEMERAL } as any);
      return;
    }

    if (action === 'ai_regen') {
      const entry = answerCache.get(id);
      if (!entry) {
        await interaction.reply({
          components: [simple(0xfee75c, '## ⌛ Đã hết hạn', '-# Câu trả lời này không còn trong bộ nhớ, hãy dùng `/ai` để hỏi lại.')],
          flags: V2_EPHEMERAL,
        } as any);
        return;
      }

      if (!(await aiUsageTracker.canUse(ownerId))) {
        await interaction.reply({ components: [rateLimitCard(ownerId)], flags: V2_EPHEMERAL } as any);
        return;
      }

      await interaction.update({
        components: [loadingCard(entry.provider, entry.modelId, entry.style)],
        flags: V2,
      } as any);

      try {
        const started = Date.now();
        const response = await this.generate(entry.provider, entry.modelId, entry.style, entry.snapshot);
        await aiUsageTracker.trackUsage(ownerId);

        const history = conversationHistory.get(interaction.channelId);
        const payload = this.buildAnswer({
          id, user: interaction.user, question: entry.question, response,
          provider: entry.provider, modelId: entry.modelId, style: entry.style,
          elapsedMs: Date.now() - started,
          historyCount: Math.floor((history?.length ?? entry.snapshot.length + 1) / 2),
        });

        await interaction.editReply({ ...payload, attachments: [], flags: V2 } as any);
      } catch (error: any) {
        console.error('AI regen error:', error);
        await interaction
          .editReply({
            components: [errorCard(String(error.message || 'Unknown error'))],
            attachments: [],
            flags: V2,
          } as any)
          .catch(() => {});
      }
    }
  }

  // ───────── Dựng thẻ trả lời (Components V2 cho interaction) ─────────
  private buildAnswer(o: {
    id: string; user: User; question: string; response: string;
    provider: Provider; modelId: string; style: string; elapsedMs: number; historyCount: number;
  }) {
    const tooLong = o.response.length > MAX_DISPLAY;
    const shown = tooLong ? o.response.slice(0, MAX_DISPLAY).replace(/\s+\S*$/, '') + '…' : o.response;

    const container = new ContainerBuilder().addTextDisplayComponents(txt(shown));

    const files: AttachmentBuilder[] = [];

    if (tooLong) {
      files.push(new AttachmentBuilder(Buffer.from(o.response), { name: 'ai-response.txt' }));
      container
        .addSeparatorComponents(sep(false, false))
        .addTextDisplayComponents(txt('-# 📎 Câu trả lời đầy đủ trong file đính kèm'))
        .addFileComponents(new FileBuilder().setURL('attachment://ai-response.txt'));
    }

    return { components: [container], files };
  }

  // ───────── Dựng text reply cho message mention (không phải interaction) ─────────
  private buildTextAnswer(o: {
    id: string; user: User; question: string; response: string;
    provider: Provider; modelId: string; style: string; elapsedMs: number; historyCount: number;
  }) {
    const tooLong = o.response.length > 1800;
    const shown = tooLong ? o.response.slice(0, 1800).replace(/\s+\S*$/, '') + '…' : o.response;

    let content = shown;

    const files: AttachmentBuilder[] = [];
    if (tooLong) {
      files.push(new AttachmentBuilder(Buffer.from(o.response), { name: 'ai-response.txt' }));
      content += '\n\n📎 *Câu trả lời đầy đủ trong file đính kèm*';
    }

    return { content, files };
  }

  private cacheAnswer(entry: CachedAnswer): string {
    const id = (++answerSeq).toString(36);
    answerCache.set(id, entry);
    if (answerCache.size > MAX_CACHE) {
      const oldest = answerCache.keys().next().value;
      if (oldest !== undefined) answerCache.delete(oldest);
    }
    return id;
  }

  // ───────── /ai ─────────
  private async handleAIChat(interaction: ChatInputCommandInteraction): Promise<void> {
    console.log(`[AI] handleAIChat called by ${interaction.user.tag} (${interaction.user.id})`);
    
    // DEFER IMMEDIATELY to prevent timeout
    try { await interaction.deferReply(); }
    catch (error: any) { if (error.code === 10062 || error.code === 40060) return; throw error; }

    // Start typing indicator
    const typingInterval = setInterval(() => {
      if (interaction.channel && 'sendTyping' in interaction.channel) {
        interaction.channel.sendTyping().catch(() => {});
      }
    }, 5000);

    try {
      const message = interaction.options.getString('message', true);
      const modelOption = interaction.options.getString('model') || 'groq:openai/gpt-oss-20b';
      const style = interaction.options.getString('style') || 'default';
      const clearMemory = interaction.options.getBoolean('clear_memory') || false;
      const channelId = interaction.channelId;

      let history: ChatMessage[] | undefined;

      try {
        // Clear memory if requested
        if (clearMemory) {
          conversationHistory.delete(channelId);
          await interaction.editReply({ components: [clearedCard()], flags: V2 } as any);
          return;
        }

        // Check usage limits
        if (!(await aiUsageTracker.canUse(interaction.user.id))) {
          await interaction.editReply({ components: [rateLimitCard(interaction.user.id)], flags: V2 } as any);
          return;
        }

        // Parse model
        const idx = modelOption.indexOf(':');
        const provider = modelOption.slice(0, idx) as Provider;
        const modelId = modelOption.slice(idx + 1);

        // Check if provider is available BEFORE showing loading card
        if (!this.checkProviderAvailable(provider)) {
          // Try auto-fallback to alternate provider
          const alternateProvider: Provider = provider === 'groq' ? 'gemini' : 'groq';
          if (this.checkProviderAvailable(alternateProvider)) {
            console.log(`[AI] Auto-switching from ${provider} to ${alternateProvider}`);
            // Use default model of alternate provider
            const alternateModel = alternateProvider === 'groq' 
              ? 'openai/gpt-oss-20b' 
              : 'gemini-2.0-flash-exp';
            
            await interaction.editReply({ 
              components: [simple(0xfee75c, `⚠️ ${provider} không khả dụng`, `-# Đã tự động chuyển sang ${alternateProvider}`)], 
              flags: V2 
            } as any);
            
            // Wait 1s then continue with alternate provider
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Recursive call with alternate provider - create new interaction-like object
            const newModelOption = `${alternateProvider}:${alternateModel}`;
            const modifiedInteraction = Object.create(interaction);
            modifiedInteraction.options = {
              ...interaction.options,
              getString: (name: string, required?: boolean) => {
                if (name === 'model') return newModelOption;
                return interaction.options.getString(name, required);
              },
              getBoolean: interaction.options.getBoolean.bind(interaction.options)
            };
            return this.handleAIChat(modifiedInteraction);
          } else {
            // No providers available
            await interaction.editReply({
              components: [errorCard(`${provider} không khả dụng và không có provider thay thế. Vui lòng thử lại sau.`)],
              flags: V2
            } as any);
            return;
          }
        }

        // Hiện thẻ "đang suy nghĩ" kèm tên model
        await interaction.editReply({ components: [loadingCard(provider, modelId, style)], flags: V2 } as any);

        // Get or create conversation history
        history = conversationHistory.get(channelId);
        if (!history) {
          history = [];
          conversationHistory.set(channelId, history);
        }

        // Add user message, keep only last MAX_HISTORY exchanges
        history.push({ role: 'user', content: message });
        while (history.length > MAX_HISTORY * 2) history.shift();
        while (history[0]?.role === 'assistant') history.shift();

        const snapshot = history.slice();

        // Generate response
        const started = Date.now();
        const response = await this.generate(provider, modelId, style, history);
        history.push({ role: 'assistant', content: response });
        await aiUsageTracker.trackUsage(interaction.user.id);

        const id = this.cacheAnswer({ question: message, provider, modelId, style, snapshot });

        const payload = this.buildAnswer({
          id, user: interaction.user, question: message, response, provider, modelId, style,
          elapsedMs: Date.now() - started,
          historyCount: Math.floor(history.length / 2),
        });

        await interaction.editReply({ ...payload, flags: V2 } as any);

      } catch (error: any) {
        console.error('AI chat error:', error);

        // Bỏ tin nhắn user vừa thêm nếu AI lỗi, tránh 2 tin 'user' liên tiếp
        if (history && history[history.length - 1]?.role === 'user') history.pop();

        await interaction
          .editReply({
            components: [errorCard(String(error.message || 'Unknown error'))],
            files: [],
            flags: V2,
          } as any)
          .catch(() => {});
      } finally {
        clearInterval(typingInterval);
      }
    } catch (error: any) { 
      if (error.code === 10062 || error.code === 40060) return; 
      throw error; 
    }
  }

  private generate(provider: Provider, modelId: string, style: string, history: ChatMessage[]): Promise<string> {
    if (provider === 'groq') return this.chatWithGroq(modelId, style, history);
    if (provider === 'gemini') return this.chatWithGemini(modelId, style, history);
    return Promise.reject(new Error('Invalid model provider'));
  }

  private async chatWithGroq(model: string, style: string, history: ChatMessage[]): Promise<string> {
    const key = keyRotator.getGroqKey();
    if (!key) throw new Error('Groq không khả dụng (không có API key hoặc tất cả keys bị rate limit)');

    const systemPrompt = SYSTEM_PROMPTS[style as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.default;
    const messages = [{ role: 'system', content: systemPrompt }, ...history];

    try {
      // Tạo client theo key hiện tại để key rotation thực sự có hiệu lực
      const groq = new Groq({ apiKey: key });
      const completion = await groq.chat.completions.create({
        model, // dùng nguyên model id, không sửa tên
        messages: messages as any,
        temperature: style === 'creative' ? 1.2 : 0.7,
        max_tokens: 2000,
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error: any) {
      keyRotator.markFailed('groq', key, error);
      throw error;
    }
  }

  private async chatWithGemini(model: string, style: string, history: ChatMessage[]): Promise<string> {
    const key = keyRotator.getGeminiKey();
    if (!key) throw new Error('Gemini không khả dụng (không có API key hoặc tất cả keys bị rate limit)');

    const systemPrompt = SYSTEM_PROMPTS[style as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.default;

    try {
      const genAI = new GoogleGenerativeAI(key);
      const geminiModel = genAI.getGenerativeModel({ model, systemInstruction: systemPrompt });

      // Lịch sử (không gồm tin cuối) -> format Gemini, phải bắt đầu bằng 'user'
      const chatHistory = history.slice(0, -1).map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

      while (chatHistory[0]?.role === 'model') chatHistory.shift();

      const chat = geminiModel.startChat({
        history: chatHistory,
        generationConfig: {
          temperature: style === 'creative' ? 1.2 : 0.7,
          maxOutputTokens: 2000,
        },
      });

      const result = await chat.sendMessage(history[history.length - 1].content);
      return result.response.text();
    } catch (error: any) {
      keyRotator.markFailed('gemini', key, error);
      throw error;
    }
  }

  // ───────── /ai-memory ─────────
  private async handleMemoryCommand(interaction: ChatInputCommandInteraction) {
    try { await interaction.deferReply({ flags: MessageFlags.Ephemeral }); }
    catch (error: any) { if (error.code === 10062 || error.code === 40060) return; throw error; }

    const subcommand = interaction.options.getSubcommand();
    const channelId = interaction.channelId;

    if (subcommand === 'view') {
      const history = conversationHistory.get(channelId);

      if (!history || history.length === 0) {
        await interaction.editReply({
          components: [simple(0xfee75c, '## 📭 Chưa có lịch sử', '-# Chưa có hội thoại nào trong kênh này.')],
          flags: V2,
        } as any);
        return;
      }

      let list = history
        .map((msg, i) => {
          const preview = msg.content.replace(/\s+/g, ' ').slice(0, 150);
          const dots = msg.content.length > 150 ? '...' : '';
          const who = msg.role === 'user' ? `${emojis.user} User` : '🤖 AI';
          return `**${i + 1}. ${who}**\n-# ${preview}${dots}`;
        })
        .join('\n');

      if (list.length > 3200) list = list.slice(0, 3200).replace(/\n[^\n]*$/, '') + '\n…';

      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .addTextDisplayComponents(txt('## 💭 Conversation Memory'), txt(`-# ${history.length} messages stored • tối đa ${MAX_HISTORY * 2}`))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(list))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(`-# Dùng \`/ai\` với \`clear_memory: True\` để xóa`)),
        ],
        flags: V2,
      } as any);
    } else if (subcommand === 'clear') {
      conversationHistory.delete(channelId);
      await interaction.editReply({ components: [clearedCard()], flags: V2 } as any);
    }
  }

  async shutdown() {
    console.log('  🛑 AI Module shutting down...');
    conversationHistory.clear();
    answerCache.clear();
  }
}

// Named export for module loader
export { AIModule };
