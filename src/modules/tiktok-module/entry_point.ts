// TikTok Module - Auto-embed with video download

import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  User,
  Guild,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
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
const ATTACH_VIDEO = true;
const VIDEO_TIMEOUT_MS = 30000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const LIKE_TIERS = [
  { min: 1_000_000, color: 0xfe2c55 },
  { min: 100_000, color: 0xe67e22 },
  { min: 10_000, color: 0x2ecc71 },
  { min: 1_000, color: 0x3498db },
  { min: 0, color: 0x95a5a6 },
];
const COLOR_UNKNOWN = 0x4e5058;
const COLOR_RED = 0xed4245;

function colorByLikes(likes?: number): number {
  if (likes === undefined) return COLOR_UNKNOWN;
  return LIKE_TIERS.find((t) => likes >= t.min)!.color;
}

// ==================== HELPERS ====================
const V2 = MessageFlags.IsComponentsV2;
const NO_PING = { parse: [] as never[], repliedUser: false };
const text = (content: string) => new TextDisplayBuilder().setContent(content);
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
  videoUrl?: string;
  videoSize?: number;
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
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml',
        'Referer': 'https://www.tiktok.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
      },
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
        // fallback
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

async function fetchApiData(url: string): Promise<Partial<TikTokData> | null> {
  try {
    const res = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=0`);
    if (!res.ok) return null;
    const json: any = await res.json();
    const d = json?.data;
    if (json?.code !== 0 || !d) return null;

    const { caption, tags } = splitCaption((d.title ?? '').toString());
    const photos: string[] = Array.isArray(d.images) ? d.images.filter(Boolean) : [];
    const cover: string | undefined = d.origin_cover || d.cover;
    const imageUrls = photos.length ? photos : cover ? [cover] : [];
    const handle: string | undefined = d.author?.unique_id;
    const abs = (u?: string) => (u ? (u.startsWith('/') ? `https://www.tikwm.com${u}` : u) : undefined);

    return {
      postId: d.id,
      caption,
      tags,
      authorName: d.author?.nickname || handle,
      authorHandle: handle ? `@${handle}` : undefined,
      authorUrl: handle ? `https://www.tiktok.com/@${handle}` : undefined,
      imageUrls,
      totalImages: imageUrls.length,
      stats: {
        views: num(d.play_count),
        likes: num(d.digg_count),
        comments: num(d.comment_count),
        shares: num(d.share_count),
      },
      music: d.music_info?.title ? `${d.music_info.title}${d.music_info.author ? ` — ${d.music_info.author}` : ''}` : undefined,
      videoUrl: abs(d.play || d.hdplay),
      videoSize: num(d.size) ?? num(d.hd_size),
    };
  } catch {
    return null;
  }
}

const cache = new Map<string, { at: number; data: TikTokData }>();

async function fetchTikTok(rawUrl: string): Promise<TikTokData> {
  const url = await resolveUrl(rawUrl);
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const isPhotoUrl = /\/photo\//.test(url);
  const needVideo = ATTACH_VIDEO && !isPhotoUrl;

  const [api, oembed, page] = await Promise.all([fetchApiData(url), fetchOEmbed(url), fetchPageData(url)]);

  console.log(`[TikTok] api=${api ? 'ok' : 'fail'} | oembed=${oembed ? 'ok' : 'fail'} | page=${page ? 'ok' : 'fail'}`);

  if (!api && !oembed && !page) {
    throw new Error('Không lấy được thông tin bài đăng (có thể đã bị xóa, để riêng tư hoặc TikTok đang chặn truy cập).');
  }

  const sources = [api, page, oembed];
  const pick = <K extends keyof TikTokData>(key: K): TikTokData[K] | undefined => {
    for (const src of sources) {
      const v = src?.[key];
      if (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '') return v as TikTokData[K];
    }
    return undefined;
  };

  const imageUrls = pick('imageUrls') ?? [];
  const stats = api?.stats ?? page?.stats ?? oembed?.stats;

  const data: TikTokData = {
    url,
    isPhoto: isPhotoUrl,
    postId: pick('postId') ?? url.match(/\/(?:video|photo)\/(\d+)/)?.[1],
    caption: pick('caption') ?? '',
    tags: pick('tags') ?? [],
    authorName: pick('authorName') ?? 'Không rõ',
    authorHandle: pick('authorHandle'),
    authorUrl: pick('authorUrl'),
    imageUrls,
    totalImages: pick('totalImages') ?? imageUrls.length,
    stats,
    music: pick('music'),
    videoUrl: pick('videoUrl'),
    videoSize: pick('videoSize'),
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

function uploadLimitBytes(guild?: Guild | null): number {
  const tier = guild?.premiumTier ?? 0;
  const limitMb = tier >= 3 ? 100 : tier === 2 ? 50 : 10;
  return limitMb * 1024 * 1024 - 512 * 1024;
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

async function downloadVideo(url: string, maxBytes: number): Promise<AttachmentBuilder | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VIDEO_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': BROWSER_UA, Referer: 'https://www.tikwm.com/' },
    });

    if (!res.ok || !res.body) return null;

    const declared = Number(res.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > maxBytes) return null;

    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = res.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maxBytes) {
        controller.abort();
        return null;
      }
      chunks.push(value);
    }

    return new AttachmentBuilder(Buffer.concat(chunks), { name: 'tiktok.mp4' });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

function compact(n?: number): string {
  if (n === undefined) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

async function buildTikTokPayload(rawUrl: string, requester: User, guild?: Guild | null) {
  const data = await fetchTikTok(rawUrl);

  let files: AttachmentBuilder[] = [];
  let videoNote: string | undefined;

  if (ATTACH_VIDEO && !data.isPhoto && data.videoUrl) {
    const limit = uploadLimitBytes(guild);
    if (data.videoSize && data.videoSize > limit) {
      videoNote = `⚠️ Video ${mb(data.videoSize)} vượt giới hạn ${mb(limit)}`;
    } else {
      const video = await downloadVideo(data.videoUrl, limit);
      if (video) {
        files = [video];
      } else {
        videoNote = '⚠️ Không tải được video';
      }
    }
  }

  if (!files.length) files = await downloadImages(data.imageUrls, data.isPhoto ? MAX_IMAGES : 1);

  const container = new ContainerBuilder().setAccentColor(colorByLikes(data.stats?.likes));

  if (files.length) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(...files.map((f) => new MediaGalleryItemBuilder().setURL(`attachment://${f.name}`)))
    );
  }

  const authorLabel = data.authorUrl ? `[${data.authorName}](${data.authorUrl})` : data.authorName;
  const hasVideoFile = files.some((f) => f.name === 'tiktok.mp4');

  const head: string[] = [`### ${data.isPhoto ? '📸' : '🎬'} ${authorLabel}`];
  if (data.caption) head.push(truncate(data.caption.replace(/\s*\n\s*/g, ' '), 120));
  if (data.tags.length) head.push(`-# ${data.tags.slice(0, 3).join(' ')}`);

  const tail: string[] = [];
  const st = data.stats;
  if (st && (st.likes !== undefined || st.comments !== undefined || st.shares !== undefined)) {
    tail.push(`❤️ **${compact(st.likes)}** · 💬 ${compact(st.comments)} · 🔁 ${compact(st.shares)}`);
  }

  const usePlayable = !!PLAYABLE_HOST && !data.isPhoto && !hasVideoFile;
  let buttonUrl = data.url;
  let buttonLabel = 'Mở TikTok';
  let buttonEmoji = '🎵';

  if (usePlayable) {
    const playable = new URL(data.url);
    playable.hostname = PLAYABLE_HOST;
    buttonUrl = playable.toString();
    buttonLabel = 'Xem video';
    buttonEmoji = '▶️';
  }

  const foot: string[] = [];
  if (usePlayable) foot.push(`[TikTok](${data.url})`);
  if (data.isPhoto && data.totalImages > files.length) foot.push(`📷 +${data.totalImages - files.length} ảnh`);
  if (videoNote) foot.push(videoNote);
  foot.push(`Chia sẻ bởi ${requester.username}`);
  tail.push(`-# ${foot.join(' • ')}`);

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(text(head.join('\n')), text(tail.join('\n')))
      .setButtonAccessory(linkButton(buttonLabel, buttonUrl, buttonEmoji))
  );

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
  description = 'TikTok auto-embed with video download';
  version = '1.5.0';
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
          await interaction.editReply(errorPayload('Link không hợp lệ! Hãy gửi link dạng `https://www.tiktok.com/@user/video/...`'));
          return;
        }

        try {
          await interaction.editReply(await buildTikTokPayload(match[0], interaction.user, interaction.guild));
        } catch (error) {
          console.error('[TikTok] /tiktok error:', error);
          await interaction.editReply(errorPayload(error instanceof Error ? error.message : 'Không thể tạo thẻ TikTok!'));
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

      if ('sendTyping' in message.channel) message.channel.sendTyping().catch(() => {});

      let posted = 0;
      for (const link of links) {
        try {
          const payload = await buildTikTokPayload(link, message.author, message.guild);
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
