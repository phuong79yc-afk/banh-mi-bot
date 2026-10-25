// TikTok Module - Tự tạo thẻ đẹp khi có link TikTok + lệnh /tiktok

import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  User,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
} from 'discord.js';
import { emojis } from '../../config/emojis';

// ==================== CONFIG ====================
const AUTO_EMBED = true;
const SUPPRESS_ORIGINAL = true;
const MAX_LINKS_PER_MESSAGE = 2;
const MAX_IMAGES = 4;
const PLAYABLE_HOST = 'vxtiktok.com';
const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const COLOR_TIKTOK = 0xfe2c55;
const COLOR_RED = 0xed4245;

// ==================== COMPONENTS V2 HELPERS ====================
const V2 = MessageFlags.IsComponentsV2;
const NO_PING = { parse: [] as never[], repliedUser: false };
const text = (content: string) => new TextDisplayBuilder().setContent(content);
const divider = (size: SeparatorSpacingSize = SeparatorSpacingSize.Small) =>
  new SeparatorBuilder().setDivider(true).setSpacing(size);

const linkButton = (label: string, url: string, emoji?: string) => {
  const b = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(label).setURL(url);
  if (emoji) b.setEmoji(emoji);
  return b;
};

const errorPayload = (content: string) => ({
  components: [new ContainerBuilder().setAccentColor(COLOR_RED).addTextDisplayComponents(text(`${emojis.error || '❌'} ${content}`))],
  flags: V2 as any,
  allowedMentions: NO_PING,
});

// ==================== TIKTOK HELPERS ====================
const TIKTOK_REGEX = /(?<!<)https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/[^\s<>)\]]+/gi;

interface TikTokStats {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

interface TikTokData {
  url: string;
  isPhoto: boolean;
  postId?: string;
  caption: string;
  tags: string[];
  authorName: string;
  authorHandle?: string;
  authorUrl?: string;
  imageUrls: string[];
  totalImages: number;
  stats?: TikTokStats;
  music?: string;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { 'User-Agent': BROWSER_UA, ...((init.headers as Record<string, string>) ?? {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

function cleanUrl(raw: string): string {
  const u = new URL(raw);
  u.search = '';
  u.hash = '';
  if (u.hostname === 'm.tiktok.com') u.hostname = 'www.tiktok.com';
  return u.toString().replace(/\/$/, '');
}

async function resolveUrl(raw: string): Promise<string> {
  const u = new URL(raw);
  const isShort = /^(vm|vt)\.tiktok\.com$/i.test(u.hostname) || /^\/t\//.test(u.pathname);
  if (!isShort) return cleanUrl(raw);
  const res = await fetchWithTimeout(raw, { redirect: 'follow' });
  return cleanUrl(res.url || raw);
}

const decodeEntities = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const num = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

function splitCaption(raw: string) {
  const tags = Array.from(new Set(raw.match(/#[^\s#]+/g) ?? [])).slice(0, 8);
  const caption = raw.replace(/#[^\s#]+/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return { caption, tags };
}

async function fetchOEmbed(url: string): Promise<Partial<TikTokData> | null> {
  try {
    const res = await fetchWithTimeout(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const json: any = await res.json();
    const { caption, tags } = splitCaption((json.title ?? '').toString());
    return {
      postId: json.embed_product_id,
      caption,
      tags,
      authorName: json.author_name,
      authorUrl: json.author_url,
      imageUrls: json.thumbnail_url ? [json.thumbnail_url] : [],
    };
  } catch {
    return null;
  }
}

async function fetchPageData(url: string): Promise<Partial<TikTokData> | null> {
  try {
    const res = await fetchWithTimeout(url, {
      headers: { 'Accept-Language': 'en-US,en;q=0.9', Accept: 'text/html,application/xhtml+xml' },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const script = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    if (script) {
      try {
        const json = JSON.parse(script[1]);
        const item = json?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
        if (item) {
          const { caption, tags } = splitCaption((item.desc ?? '').toString());
          const photoUrls: string[] = (item.imagePost?.images ?? [])
            .map((img: any) => img?.imageURL?.urlList?.[0])
            .filter(Boolean);
          const cover: string | undefined = item.video?.originCover || item.video?.cover || item.video?.dynamicCover;
          const imageUrls = photoUrls.length ? photoUrls : cover ? [cover] : [];
          const handle: string | undefined = item.author?.uniqueId;
          return {
            postId: item.id,
            caption,
            tags,
            authorName: item.author?.nickname || handle,
            authorHandle: handle ? `@${handle}` : undefined,
            authorUrl: handle ? `https://www.tiktok.com/@${handle}` : undefined,
            imageUrls,
            totalImages: imageUrls.length,
            stats: {
              views: num(item.stats?.playCount),
              likes: num(item.stats?.diggCount),
              comments: num(item.stats?.commentCount),
              shares: num(item.stats?.shareCount),
            },
            music: item.music?.title ? `${item.music.title}${item.music.authorName ? ` — ${item.music.authorName}` : ''}` : undefined,
          };
        }
      } catch {
        // Try OG fallback
      }
    }

    const og = (prop: string) => {
      const m =
        html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']*)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:${prop}["']`, 'i'));
      return m ? decodeEntities(m[1]) : undefined;
    };

    const image = og('image');
    const title = og('title') ?? og('description');
    if (!image && !title) return null;
    const { caption, tags } = splitCaption(title ?? '');
    return { caption, tags, imageUrls: image ? [image] : [] };
  } catch {
    return null;
  }
}

const cache = new Map<string, { at: number; data: TikTokData }>();

async function fetchTikTok(rawUrl: string): Promise<TikTokData> {
  const url = await resolveUrl(rawUrl);
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const [oembed, page] = await Promise.all([fetchOEmbed(url), fetchPageData(url)]);

  if (!oembed && !page) {
    throw new Error('Không lấy được thông tin bài đăng (có thể đã bị xóa, để riêng tư hoặc TikTok đang chặn truy cập).');
  }

  const isPhoto = /\/photo\//.test(url);
  const imageUrls = page?.imageUrls?.length ? page.imageUrls : (oembed?.imageUrls ?? []);

  const data: TikTokData = {
    url,
    isPhoto,
    postId: page?.postId ?? oembed?.postId ?? url.match(/\/(?:video|photo)\/(\d+)/)?.[1],
    caption: page?.caption || oembed?.caption || '',
    tags: page?.tags?.length ? page.tags : (oembed?.tags ?? []),
    authorName: page?.authorName || oembed?.authorName || 'Không rõ',
    authorHandle: page?.authorHandle,
    authorUrl: page?.authorUrl || oembed?.authorUrl,
    imageUrls,
    totalImages: page?.totalImages ?? imageUrls.length,
    stats: page?.stats,
    music: page?.music,
  };

  cache.set(url, { at: Date.now(), data });
  return data;
}

async function downloadImages(urls: string[], max: number): Promise<AttachmentBuilder[]> {
  const results = await Promise.allSettled(
    urls.slice(0, max).map(async (u) => {
      const res = await fetchWithTimeout(u, { headers: { Referer: 'https://www.tiktok.com/' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    })
  );

  const files: AttachmentBuilder[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') files.push(new AttachmentBuilder(r.value, { name: `tiktok-${files.length}.jpg` }));
  }
  return files;
}

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

function compact(n?: number): string {
  if (n === undefined) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace('.', ',')}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace('.', ',')}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace('.', ',')}K`;
  return String(n);
}

async function buildTikTokPayload(rawUrl: string, requester: User) {
  const data = await fetchTikTok(rawUrl);
  const files = await downloadImages(data.imageUrls, data.isPhoto ? MAX_IMAGES : 1);

  const container = new ContainerBuilder().setAccentColor(COLOR_TIKTOK);
  container.addTextDisplayComponents(text(`-# 🎵 TIKTOK • ${data.isPhoto ? 'BÀI ĐĂNG ẢNH' : 'VIDEO'}`));

  const authorLabel = data.authorUrl ? `[${data.authorName}](${data.authorUrl})` : data.authorName;
  container.addTextDisplayComponents(text(`# ${data.isPhoto ? '📸' : '🎬'} ${authorLabel}`));

  if (files.length) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        ...files.map((f) => new MediaGalleryItemBuilder().setURL(`attachment://${f.name}`))
      )
    );
    if (data.isPhoto && data.totalImages > files.length) {
      container.addTextDisplayComponents(text(`-# 📷 Còn ${data.totalImages - files.length} ảnh khác trong bài đăng`));
    }
  }

  const body: string[] = [];
  if (data.caption) {
    body.push(
      truncate(data.caption, 350)
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n')
    );
  }
  if (data.tags.length) body.push(`-# ${data.tags.join(' ')}`);
  if (body.length) container.addSeparatorComponents(divider()).addTextDisplayComponents(text(body.join('\n')));

  if (data.stats && Object.values(data.stats).some((v) => v !== undefined)) {
    const s = data.stats;
    container
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(
        text(`👁️ **${compact(s.views)}**  ·  ❤️ **${compact(s.likes)}**  ·  💬 **${compact(s.comments)}**  ·  🔁 **${compact(s.shares)}**`)
      );
  }

  const info: string[] = [`👤 **Tác giả:** ${authorLabel}${data.authorHandle ? ` (${data.authorHandle})` : ''}`];
  if (data.music) info.push(`🎶 **Nhạc:** ${truncate(data.music, 80)}`);
  if (data.postId) info.push(`🆔 **${data.isPhoto ? 'Bài đăng' : 'Video'} ID:** \`${data.postId}\``);

  container
    .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(text(info.join('\n')));

  const buttons = [linkButton('Mở TikTok', data.url, '🎵')];
  if (PLAYABLE_HOST) {
    const playable = new URL(data.url);
    playable.hostname = PLAYABLE_HOST;
    buttons.push(linkButton(data.isPhoto ? 'Xem bài đăng' : 'Xem video', playable.toString(), '▶️'));
  }
  if (data.authorUrl) buttons.push(linkButton('Trang cá nhân', data.authorUrl, '👤'));

  container
    .addSeparatorComponents(divider())
    .addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons))
    .addTextDisplayComponents(text(`-# Chia sẻ bởi ${requester.username} • Banhcuon-bot`));

  return {
    components: [container],
    flags: V2 as any,
    allowedMentions: NO_PING,
    files,
  };
}

// ==================== MODULE ====================
export default class TikTokModule {
  name = 'tiktok-module';
  description = 'Tạo thẻ đẹp cho link TikTok';
  version = '1.1.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;
  private messageHandler?: (message: Message) => void;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('🎵 TikTok module initialized');
    this.registerCommands();
    if (AUTO_EMBED) this.registerEvents();
    console.log(`✅ TikTok module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    const tiktokCommand = {
      data: new SlashCommandBuilder()
        .setName('tiktok')
        .setDescription('🎵 Tạo thẻ đẹp từ link TikTok')
        .addStringOption((o) => o.setName('link').setDescription('Link video hoặc bài đăng TikTok').setRequired(true)),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }

        const link = interaction.options.getString('link', true).trim();
        const match = link.match(/https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/[^\s<>)\]]+/i);

        if (!match) {
          await interaction.editReply(
            errorPayload('Link không hợp lệ! Hãy gửi link dạng `https://www.tiktok.com/@user/video/...`')
          );
          return;
        }

        try {
          await interaction.editReply(await buildTikTokPayload(match[0], interaction.user));
        } catch (error) {
          console.error('[TikTok] /tiktok error:', error);
          await interaction.editReply(
            errorPayload(error instanceof Error ? error.message : 'Không thể tạo thẻ TikTok, hãy thử lại sau!')
          );
        }
      },
    };

    this.commands.set('tiktok', tiktokCommand);
  }

  private registerEvents() {
    this.messageHandler = async (message: Message) => {
      if (message.author.bot || !message.guild) return;

      const links = Array.from(new Set(message.content.match(TIKTOK_REGEX) ?? [])).slice(0, MAX_LINKS_PER_MESSAGE);
      if (!links.length) return;

      let posted = 0;
      for (const link of links) {
        try {
          const payload = await buildTikTokPayload(link, message.author);
          await message.reply(payload);
          posted++;
        } catch (error) {
          console.error(`[TikTok] Không tạo được thẻ cho ${link}:`, error instanceof Error ? error.message : error);
        }
      }

      if (SUPPRESS_ORIGINAL && posted > 0) {
        message.suppressEmbeds(true).catch(() => {});
      }
    };

    this.client.on('messageCreate', this.messageHandler);
  }

  async cleanup() {
    if (this.messageHandler) this.client.off('messageCreate', this.messageHandler);
    cache.clear();
    console.log('🧹 TikTok module cleanup');
  }
}
