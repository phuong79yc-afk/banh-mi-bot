// TikTok Module - Tự tạo thẻ đẹp khi có link TikTok + lệnh /tiktok

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
  ActionRowBuilder,
  // ===== Components V2 =====
  ContainerBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
} from 'discord.js';
import { emojis } from '../../config/emojis';
import { spawn } from 'child_process';
import { promises as fsp } from 'fs';
import os from 'os';
import path from 'path';

// ==================== CONFIG ====================
/** Tự động tạo thẻ khi có người gửi link TikTok trong tin nhắn */
const AUTO_EMBED = true;
/** Ẩn embed mặc định của Discord ở tin nhắn gốc (bot cần quyền Manage Messages) */
const SUPPRESS_ORIGINAL = true;
/** Số link tối đa xử lý trong một tin nhắn */
const MAX_LINKS_PER_MESSAGE = 2;
/** Số ảnh tối đa hiển thị cho bài đăng dạng ảnh */
const MAX_IMAGES = 4;
/**
 * Domain proxy giúp Discord phát video trực tiếp (dịch vụ bên thứ ba).
 * Để chuỗi rỗng '' nếu không muốn hiện nút "Xem video".
 */
const PLAYABLE_HOST = 'vxtiktok.com';
/**
 * API dự phòng (dịch vụ bên thứ ba) để lấy số tim / bình luận / chia sẻ khi trang TikTok không trả về.
 * Chỉ được gọi khi các nguồn chính không có số liệu. Để chuỗi rỗng '' để tắt hoàn toàn.
 */
const STATS_API = 'https://www.tikwm.com/api/';
/**
 * Tải video về và đính kèm để xem trực tiếp trong Discord.
 * Cần STATS_API (để lấy link video không watermark). Video lớn hơn giới hạn upload của server sẽ chỉ hiện ảnh bìa.
 */
const ATTACH_VIDEO = true;
const VIDEO_TIMEOUT_MS = 30000;
/**
 * Nén video nặng bằng ffmpeg cho vừa giới hạn upload (cần cài ffmpeg trên máy chạy bot).
 * Không có ffmpeg thì tự bỏ qua, bot chỉ hiện link tải video.
 */
const COMPRESS_VIDEO = true;
const MAX_COMPRESS_SOURCE_BYTES = 60 * 1024 * 1024; // chỉ nén video gốc tối đa 60MB
const COMPRESS_TIMEOUT_MS = 60000;
/** Thời gian lưu cache kết quả (ms) */
const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Màu viền + kiểu tim theo số tim (ít -> nhiều)
const LIKE_TIERS = [
  { min: 10_000_000, color: 0xe91e63, heart: '❤️‍🔥' }, // ≥ 10M  : tim lửa (siêu viral)
  { min: 1_000_000, color: 0xfe2c55, heart: '❤️' }, //     ≥ 1M   : tim đỏ
  { min: 100_000, color: 0xe67e22, heart: '🧡' }, //       ≥ 100K : tim cam
  { min: 10_000, color: 0x2ecc71, heart: '💚' }, //        ≥ 10K  : tim xanh lá
  { min: 1_000, color: 0x3498db, heart: '💙' }, //         ≥ 1K   : tim xanh dương
  { min: 0, color: 0x95a5a6, heart: '🤍' }, //             < 1K   : tim trắng
];
const COLOR_UNKNOWN = 0x4e5058; // không lấy được số tim
const COLOR_RED = 0xed4245;
const tierOf = (likes: number) => LIKE_TIERS.find((t) => likes >= t.min)!;

function colorByLikes(likes?: number): number {
  return likes === undefined ? COLOR_UNKNOWN : tierOf(likes).color;
}

/** Kiểu tim đổi theo số tim, khớp với màu viền */
function heartByLikes(likes?: number): string {
  return likes === undefined ? '❤️' : tierOf(likes).heart;
}

// ==================== COMPONENTS V2 HELPERS ====================
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

// ==================== TIKTOK HELPERS ====================
// Bắt link tiktok.com (kể cả vm./vt./m./www. và dạng tiktok.com/t/xxxx), bỏ qua link bọc trong <...>
const TIKTOK_REGEX = /(?<!<)https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/[^\s<>)\]]+/gi;

interface TikTokStats {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

interface TikTokData {
  url: string; // link đã làm sạch
  isPhoto: boolean;
  postId?: string;
  caption: string;
  tags: string[];
  authorName: string;
  authorHandle?: string;
  authorUrl?: string;
  /** Ảnh để hiển thị: ảnh bìa (video) hoặc các ảnh của bài đăng (photo) */
  imageUrls: string[];
  totalImages: number;
  stats?: TikTokStats;
  music?: string;
  videoUrl?: string;
  videoSize?: number; // bytes (nếu API cho biết)
  duration?: number; // giây
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

/** Bỏ tham số theo dõi, chuẩn hóa domain */
function cleanUrl(raw: string): string {
  const u = new URL(raw);
  u.search = '';
  u.hash = '';
  if (u.hostname === 'm.tiktok.com') u.hostname = 'www.tiktok.com';
  return u.toString().replace(/\/$/, '');
}

/** Link rút gọn (vm./vt./tiktok.com/t/) -> link đầy đủ */
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

/** Nguồn 1: oEmbed công khai (ổn định nhưng ít dữ liệu, bài ảnh thường thiếu caption/ảnh) */
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

/**
 * Nguồn 2: đọc dữ liệu nhúng trong trang bài đăng (có caption đầy đủ, thống kê, ảnh của bài photo).
 * Cấu trúc trang do TikTok quyết định và có thể thay đổi nên mọi bước đều được bảo vệ bằng try/catch.
 */
async function fetchPageData(url: string): Promise<Partial<TikTokData> | null> {
  try {
    const res = await fetchWithTimeout(url, {
      headers: { 'Accept-Language': 'en-US,en;q=0.9', Accept: 'text/html,application/xhtml+xml' },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // --- Cách 1: JSON nhúng ---
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
        // bỏ qua, thử cách 2
      }
    }

    // --- Cách 2: thẻ Open Graph ---
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

/** Nguồn 3 (dự phòng): API bên thứ ba, chỉ dùng khi thiếu số liệu */
async function fetchApiData(url: string): Promise<Partial<TikTokData> | null> {
  if (!STATS_API) return null;
  try {
    const res = await fetchWithTimeout(`${STATS_API}?url=${encodeURIComponent(url)}&hd=0`);
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
      duration: num(d.duration),
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

  // Gọi song song oEmbed và trang bài đăng, nguồn nào lỗi thì bỏ qua
  const [oembed, page] = await Promise.all([fetchOEmbed(url), fetchPageData(url)]);

  // Thiếu số tim -> hỏi thêm API dự phòng
  const isPhotoUrl = /\/photo\//.test(url);
  const needVideo = ATTACH_VIDEO && !isPhotoUrl;
  const needApi = !!STATS_API && (page?.stats?.likes === undefined || needVideo);
  const api = needApi ? await fetchApiData(url) : null;

  console.log(
    `[TikTok] nguồn dữ liệu: oembed=${oembed ? 'ok' : 'lỗi'} | trang=${page?.stats ? 'ok' : page ? 'không có số liệu' : 'lỗi'} | api=${needApi ? (api ? 'ok' : 'lỗi') : 'bỏ qua'}`
  );

  if (!oembed && !page && !api) {
    throw new Error('Không lấy được thông tin bài đăng (có thể đã bị xóa, để riêng tư hoặc TikTok đang chặn truy cập).');
  }

  // Thứ tự ưu tiên: trang > API dự phòng > oEmbed
  const sources = [page, api, oembed];
  const pick = <K extends keyof TikTokData>(key: K): TikTokData[K] | undefined => {
    for (const src of sources) {
      const v = src?.[key];
      if (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '') return v as TikTokData[K];
    }
    return undefined;
  };

  const imageUrls = pick('imageUrls') ?? [];
  const stats = [page?.stats, api?.stats].find((st) => st?.likes !== undefined) ?? page?.stats ?? api?.stats;

  const data: TikTokData = {
    url,
    isPhoto: /\/photo\//.test(url),
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
    duration: pick('duration'),
  };

  cache.set(url, { at: Date.now(), data });
  return data;
}

/** Tải ảnh về để đính kèm (link ảnh của TikTok có chữ ký và hết hạn nhanh) */
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

/** Giới hạn dung lượng upload theo cấp boost của server (trừ chút dư địa) */
function uploadLimitBytes(guild?: Guild | null): number {
  const tier = guild?.premiumTier ?? 0;
  const limitMb = tier >= 3 ? 100 : tier === 2 ? 50 : 10;
  return limitMb * 1024 * 1024 - 512 * 1024;
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')}MB`;

/** Tải video về bộ nhớ, dừng ngay nếu vượt giới hạn dung lượng */
async function downloadVideoBuffer(url: string, maxBytes: number): Promise<{ buffer?: Buffer; tooBig?: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VIDEO_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': BROWSER_UA, Referer: 'https://www.tiktok.com/' },
    });

    if (!res.ok || !res.body) return {};

    const declared = Number(res.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > maxBytes) return { tooBig: true };

    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = res.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maxBytes) {
        controller.abort();
        return { tooBig: true };
      }
      chunks.push(value);
    }

    return { buffer: Buffer.concat(chunks) };
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Nén video bằng ffmpeg (tùy chọn) ----------
let ffmpegAvailable: boolean | null = null;

async function hasFfmpeg(): Promise<boolean> {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  ffmpegAvailable = await new Promise<boolean>((resolve) => {
    const proc = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
  if (!ffmpegAvailable) console.log('[TikTok] Không tìm thấy ffmpeg, bỏ qua nén video');
  return ffmpegAvailable;
}

// Chỉ nén từng video một để không làm nghẽn CPU
let compressQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = compressQueue.then(fn, fn);
  compressQueue = run.catch(() => {});
  return run;
}

/** Nén video xuống dưới `maxBytes`. Trả về null nếu không thể nén tới mức chấp nhận được. */
async function compressVideo(input: Buffer, durationSec: number, maxBytes: number): Promise<Buffer | null> {
  if (!durationSec || durationSec <= 0) return null;

  const audioKbps = 96;
  // Dư ~8% cho phần overhead của container
  const totalKbps = Math.floor((maxBytes * 8 * 0.92) / durationSec / 1000);
  const videoKbps = totalKbps - audioKbps;

  if (videoKbps < 250) return null; // video quá dài, nén xuống sẽ quá mờ

  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'tiktok-'));
  const inFile = path.join(dir, 'in.mp4');
  const outFile = path.join(dir, 'out.mp4');

  try {
    await fsp.writeFile(inFile, input);

    const args = [
      '-y', '-i', inFile,
      '-c:v', 'libx264', '-preset', 'veryfast',
      '-b:v', `${videoKbps}k`, '-maxrate', `${videoKbps}k`, '-bufsize', `${videoKbps * 2}k`,
      '-vf', "scale='min(720,iw)':-2",
      '-c:a', 'aac', '-b:a', `${audioKbps}k`,
      '-movflags', '+faststart',
      outFile,
    ];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('ffmpeg', args, { stdio: 'ignore' });
      const timer = setTimeout(() => {
        proc.kill('SIGKILL');
        reject(new Error('ffmpeg quá thời gian'));
      }, COMPRESS_TIMEOUT_MS);

      proc.on('error', (e) => {
        clearTimeout(timer);
        reject(e);
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        code === 0 ? resolve() : reject(new Error(`ffmpeg thoát với mã ${code}`));
      });
    });

    const out = await fsp.readFile(outFile);
    return out.length <= maxBytes ? out : null;
  } catch (error) {
    console.error('[TikTok] Nén video thất bại:', error instanceof Error ? error.message : error);
    return null;
  } finally {
    await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/** 1234 -> 1,2K · 1500000 -> 1,5M */
function compact(n?: number): string {
  if (n === undefined) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace('.', ',')}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace('.', ',')}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace('.', ',')}K`;
  return String(n);
}

/** Dựng thẻ TikTok (bố cục gọn, màu viền theo số tim) */
async function buildTikTokPayload(rawUrl: string, requester: User, guild?: Guild | null) {
  const data = await fetchTikTok(rawUrl);

  // Thử đính kèm video để xem trực tiếp (nén nếu quá nặng); thất bại thì dùng ảnh bìa
  let files: AttachmentBuilder[] = [];
  let videoNote: string | undefined;

  if (ATTACH_VIDEO && !data.isPhoto && data.videoUrl) {
    const limit = uploadLimitBytes(guild);
    const canCompress = COMPRESS_VIDEO && !!data.duration && (await hasFfmpeg());
    const fetchCap = canCompress ? MAX_COMPRESS_SOURCE_BYTES : limit;

    if (data.videoSize && data.videoSize > fetchCap) {
      videoNote = `⚠️ Video ${mb(data.videoSize)} vượt giới hạn upload ${mb(limit)}`;
    } else {
      const dl = await downloadVideoBuffer(data.videoUrl, fetchCap);

      if (dl.buffer && dl.buffer.length <= limit) {
        files = [new AttachmentBuilder(dl.buffer, { name: 'tiktok-video.mp4' })];
      } else if (dl.buffer && canCompress) {
        const original = dl.buffer;
        const small = await enqueue(() => compressVideo(original, data.duration!, limit));

        if (small) {
          files = [new AttachmentBuilder(small, { name: 'tiktok-video.mp4' })];
          videoNote = `🗜️ Đã nén ${mb(original.length)} → ${mb(small.length)}`;
        } else {
          videoNote = `⚠️ Video ${mb(original.length)} quá nặng, không nén được`;
        }
      } else if (dl.buffer || dl.tooBig) {
        videoNote = `⚠️ Video vượt giới hạn upload ${mb(limit)}`;
      } else {
        videoNote = '⚠️ Không tải được video, hiển thị ảnh bìa';
      }
    }
  }

  if (!files.length) files = await downloadImages(data.imageUrls, data.isPhoto ? MAX_IMAGES : 1);

  const container = new ContainerBuilder().setAccentColor(colorByLikes(data.stats?.likes));

  // Video / ảnh ở trên cùng
  if (files.length) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        ...files.map((f) => new MediaGalleryItemBuilder().setURL(`attachment://${f.name}`))
      )
    );
  }

  const authorLabel = data.authorUrl ? `[${data.authorName}](${data.authorUrl})` : data.authorName;
  const hasVideoFile = files.some((f) => f.name === 'tiktok-video.mp4');

  // Nội dung: tác giả + caption + hashtag, sau đó là thống kê và chân thẻ.
  const lines: string[] = [`### ${data.isPhoto ? '📸' : '🎬'} ${authorLabel}`];
  if (data.caption) lines.push(truncate(data.caption.replace(/\s*\n\s*/g, ' '), 120));
  if (data.tags.length) lines.push(`-# ${data.tags.slice(0, 3).join(' ')}`);

  const st = data.stats;
  if (st && (st.likes !== undefined || st.comments !== undefined || st.shares !== undefined)) {
    lines.push(`${heartByLikes(st.likes)} **${compact(st.likes)}** · 💬 ${compact(st.comments)} · 🔁 ${compact(st.shares)}`);
  }

  const foot: string[] = [];
  if (data.isPhoto && data.totalImages > files.length) foot.push(`📷 +${data.totalImages - files.length} ảnh`);
  if (videoNote) foot.push(videoNote);
  foot.push(`Chia sẻ bởi ${requester.username}`);
  lines.push(`-# ${foot.join(' • ')}`);
  container.addTextDisplayComponents(text(lines.join('\n')));

  // Nút hành động chính đứng trước; nút video chỉ hiện khi chưa đính kèm video.
  const buttons = [linkButton('Mở TikTok', data.url, '🎵')];
  if (!data.isPhoto && !hasVideoFile) {
    if (PLAYABLE_HOST) {
      const playable = new URL(data.url);
      playable.hostname = PLAYABLE_HOST;
      buttons.push(linkButton('Xem video', playable.toString(), '▶️'));
    }
    if (data.videoUrl) buttons.push(linkButton('Tải video', data.videoUrl, '⬇️'));
  }
  container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons));

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
  version = '1.8.0';
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
          await interaction.editReply(await buildTikTokPayload(match[0], interaction.user, interaction.guild));
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

      // Hiện "đang nhập..." trong lúc tải video
      if ('sendTyping' in message.channel) message.channel.sendTyping().catch(() => {});

      let posted = 0;
      for (const link of links) {
        try {
          const payload = await buildTikTokPayload(link, message.author, message.guild);
          await message.reply(payload);
          posted++;
        } catch (error) {
          // Chế độ tự động: lỗi thì im lặng, chỉ ghi log để không làm phiền kênh chat
          console.error(`[TikTok] Không tạo được thẻ cho ${link}:`, error instanceof Error ? error.message : error);
        }
      }

      // Ẩn embed mặc định nếu đã gửi thẻ thành công
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
