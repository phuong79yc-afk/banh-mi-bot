import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  Message,
  MessageFlags,
  TextDisplayBuilder,
  GatewayIntentBits,
  IntentsBitField,
} from 'discord.js';
import axios from 'axios';
import { spawn } from 'child_process';
import { promises as fsp } from 'fs';
import os from 'os';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';

// ==================== CONFIG ====================
/** true = hiện thanh viền màu theo từng nền tảng; false = card không viền */
const USE_ACCENT = false;
/** Số link tối đa xử lý trong một tin nhắn */
const MAX_LINKS_PER_MESSAGE = 4;
/** Video gốc tối đa được tải về để nén */
const MAX_VIDEO_SOURCE_BYTES = 60 * 1024 * 1024;
const COMPRESS_TIMEOUT_MS = 60000;

const V2 = MessageFlags.IsComponentsV2;

interface SocialEmbedPlatform {
  name: string;
  hosts: string[];
  rewrite: (url: URL) => string;
}

const PLATFORMS: SocialEmbedPlatform[] = [
  {
    name: 'Instagram',
    hosts: ['instagram.com', 'www.instagram.com'],
    rewrite: (url) => `https://www.instagram.com${url.pathname.replace(/\/$/, '')}/embed/captioned/`,
  },
  {
    name: 'Twitter / X',
    hosts: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com', 'mobile.twitter.com'],
    rewrite: (url) => `https://fxtwitter.com${url.pathname}${url.search}`,
  },
  {
    name: 'Reddit',
    hosts: ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'redd.it'],
    rewrite: (url) => `https://rxddit.com${url.pathname}${url.search}`,
  },
  {
    name: 'Threads',
    hosts: ['threads.net', 'www.threads.net', 'threads.com', 'www.threads.com'],
    rewrite: (url) => `https://www.threads.com${url.pathname}${url.search}`,
  },
  {
    name: 'Facebook',
    hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'mbasic.facebook.com', 'l.facebook.com', 'lm.facebook.com', 'fb.watch', 'www.fb.watch'],
    rewrite: (url) => url.toString(),
  },
];

/** Biểu tượng + màu theo nền tảng */
const PLATFORM_STYLE: Record<string, { icon: string; color: number }> = {
  Instagram: { icon: '📸', color: 0xe1306c },
  'Twitter / X': { icon: '🐦', color: 0x1da1f2 },
  Reddit: { icon: '👽', color: 0xff4500 },
  Threads: { icon: '🧵', color: 0x6c6c70 },
  Facebook: { icon: '📘', color: 0x1877f2 },
};

// Bỏ qua link bọc trong <...> (người dùng cố ý tắt embed)
const SOCIAL_URL_REGEX = /(?<!<)https?:\/\/[^\s<>()]+/gi;
const TIKTOK_HOSTS = new Set(['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com']);

function detectSocialPlatform(hostname: string): SocialEmbedPlatform | undefined {
  const host = hostname.toLowerCase().replace(/^m\./, '').replace(/^mobile\./, '').replace(/^old\./, '');

  if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.watch' || host.endsWith('.fb.watch')) {
    return PLATFORMS.find((platform) => platform.name === 'Facebook');
  }
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
    return PLATFORMS.find((platform) => platform.name === 'Instagram');
  }
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return undefined;

  return PLATFORMS.find((platform) => platform.hosts.includes(host));
}

// ==================== METADATA ====================

interface SocialMetadata {
  title?: string;
  description?: string;
  image?: string;
  images?: string[];
  video?: string;
  canonical?: string;
  blocked?: boolean;
  isVideoPost?: boolean;
  videoId?: string;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (_, decimal: string) => String.fromCodePoint(parseInt(decimal, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]*>/g, '')
    .replace(/\u0000/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSocialText(value: string | undefined, platformName: string): string | undefined {
  if (!value) return undefined;
  let text = decodeHtml(value).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (!text || /^https?:\/\//i.test(text)) return undefined;
  if (/&(#[xX]?[0-9a-f]+|[a-z]+);?/i.test(text)) return undefined;
  if (text.includes('\uFFFD')) return undefined;
  if (text.length > 500) text = `${text.slice(0, 497)}…`;
  if (text.toLowerCase() === platformName.toLowerCase()) return undefined;
  return text;
}

function getMeta(html: string, property: string): string | undefined {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'));
  return tag?.[1] ? decodeHtml(tag[1]) : undefined;
}

function getJsonString(html: string, key: string): string | undefined {
  const keyIndex = html.toLowerCase().indexOf(`"${key.toLowerCase()}"`);
  if (keyIndex < 0) return undefined;
  const colonIndex = html.indexOf(':', keyIndex);
  if (colonIndex < 0) return undefined;
  let quoteIndex = colonIndex + 1;
  while (quoteIndex < html.length && /\s/.test(html[quoteIndex])) quoteIndex++;
  if (html[quoteIndex] !== '"') return undefined;

  let escaped = false;
  let value = '';
  for (let i = quoteIndex + 1; i < html.length; i++) {
    const char = html[i];
    if (escaped) {
      value += `\\${char}`;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') break;
    value += char;
  }
  if (escaped) return undefined;

  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value.replace(/\\u0026/gi, '&').replace(/\\u002F/gi, '/').replace(/\\\//g, '/');
  }
}

function getCanonical(html: string): string | undefined {
  const link = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  const value = link?.[1] ? decodeHtml(link[1]) : undefined;
  if (!value || !/^https?:\/\//i.test(value)) return undefined;
  try {
    const parsed = new URL(value);
    if (/\/login(?:\/|$)|\/login\/|facebook\.com\/login/i.test(parsed.pathname + parsed.search)) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function getJsonMediaUrl(html: string, key: string): string | undefined {
  const value = getJsonString(html, key);
  if (!value) return undefined;
  const normalized = decodeHtml(value
    .replace(/\\\//g, '/')
    .replace(/\\u0026/gi, '&')
    .replace(/\\u002F/gi, '/')
    .replace(/\\u00253D/gi, '=')
    .replace(/\\u003D/gi, '=')
    .replace(/\\([\\])/g, '$1'));
  return /^https?:\/\//i.test(normalized) ? normalized : undefined;
}

function getFacebookVideoId(html: string, proxyUrl: string): string | undefined {
  const reel = proxyUrl.match(/\/reel[s]?\/(\d+)/i)?.[1];
  if (reel) return reel;
  const watch = proxyUrl.match(/[?&]v=(\d+)/i)?.[1];
  if (watch) return watch;
  const mediaId = html.match(/media_id=(\d+)/i)?.[1]
    ?? html.match(/["'](?:video_id|videoId)["']\s*[:=]\s*["']?(\d+)/i)?.[1];
  return mediaId;
}

function decodeFacebookVideoUrl(value: string): string | undefined {
  const decoded = value
    .replace(/\\\//g, '/')
    .replace(/\\u0026/gi, '&')
    .replace(/\\u002F/gi, '/')
    .replace(/\\u00253D/gi, '=')
    .replace(/\\u003D/gi, '=')
    .replace(/[),\]]+$/, '')
    .trim();
  if (!/^https?:\/\//i.test(decoded)) return undefined;
  try {
    const url = new URL(decoded);
    if (!/(?:fbcdn\.net|fbsbx\.com)/i.test(url.hostname)) return undefined;
    return /\.mp4(?:$|[?&])/i.test(url.pathname + url.search) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function getFacebookVideoUrl(html: string): string | undefined {
  const keys = [
    'hd_src', 'playable_url_quality_hd', 'browser_native_hd_url', 'browser_native_hd_src',
    'sd_src', 'playable_url_quality_sd', 'browser_native_sd_url', 'browser_native_sd_src',
    'playable_url', 'progressive_url', 'video_url',
  ];
  for (const key of keys) {
    const field = html.match(new RegExp(`["']${key}["']\\s*:\\s*["']([^"']+)`, 'i'));
    if (field?.[1]) {
      const url = decodeFacebookVideoUrl(field[1]);
      if (url) return url;
    }
    const url = getJsonMediaUrl(html, key);
    if (url && /^https?:\/\//i.test(url)) {
      const usable = decodeFacebookVideoUrl(url);
      if (usable) return usable;
    }
  }

  const escapedMatches = html.match(/https?:\\?\/\\?\/[^"'<>\s]+/gi) ?? [];
  for (const raw of escapedMatches) {
    let url = decodeHtml(raw.replace(/\\\//g, '/').replace(/\\u0026/gi, '&'));
    url = url.replace(/\\u002F/gi, '/').replace(/\\/g, '').replace(/[),\]]+$/, '');
    if (!/^https?:\/\//i.test(url)) continue;
    if (/\.mp4(?:$|[?&])/i.test(url) || /(?:video[^.]*\.fbcdn\.net|fbcdn\.net.*video)/i.test(url)) {
      return url;
    }
  }

  const encoded = html.match(/(?:playable_url[^:]*|video_url)[^"']*[:=][^"']{0,20}["'](https?:[^"']+)["']/gi) ?? [];
  for (const match of encoded) {
    const value = match.match(/https?:[^"']+/i)?.[0];
    if (!value) continue;
    const url = decodeHtml(value.replace(/\\\//g, '/').replace(/\\u0026/gi, '&'))
      .replace(/\\u002F/gi, '/').replace(/\\/g, '').replace(/[),\]]+$/, '');
    if (/^https?:\/\//i.test(url)) return url;
  }
  return undefined;
}

function getJsonText(html: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = getJsonString(html, key);
    const clean = typeof value === 'string' ? cleanSocialText(value, 'Instagram') : undefined;
    if (clean) return clean;
  }
  return undefined;
}

function isUsableFacebookImageUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (/^(?:static\.xx\.|connect\.facebook\.com$)/i.test(host)) return false;
    if (/facebook\.com\/login/i.test(parsed.pathname)) return false;
    if (isLikelyFaviconUrl(value)) return false;
    if (/\/(?:static|rsrc)\b|facebook_connect_logo|\/images\/login/i.test(parsed.pathname + parsed.search)) return false;
    return /(?:lookaside\.fbsbx\.com|scontent\.|fbcdn\.net|\.jpe?g(?:$|[?&])|\.png(?:$|[?&])|\.webp(?:$|[?&]))/i.test(value);
  } catch {
    return false;
  }
}

function getEmbeddedFacebookMedia(html: string, kind: 'image' | 'video'): string | undefined {
  const escapedUrls = html.match(/https?:\\?\/\\?\/[^"'<>\s]+/gi) ?? [];
  for (const raw of escapedUrls) {
    let url = decodeHtml(raw.replace(/\\\//g, '/').replace(/\\u0026/gi, '&'));
    url = url.replace(/\\u002F/gi, '/').replace(/\\/g, '').replace(/[),]+$/, '');
    if (!/^https?:\/\//i.test(url)) continue;
    if (kind === 'video') continue;
    if (kind === 'image' && isUsableFacebookImageUrl(url)) return url;
  }
  return undefined;
}

function getEmbeddedFacebookImages(html: string, ogImage?: string, limit = 10): string[] {
  const urls = new Set<string>();
  if (ogImage && isUsableFacebookImageUrl(ogImage)) urls.add(ogImage);

  const escapedUrls = html.match(/https?:\\?\/\\?\/[^"'<>\s]+/gi) ?? [];
  for (const raw of escapedUrls) {
    let url = decodeHtml(raw.replace(/\\\//g, '/').replace(/\\u0026/gi, '&'));
    url = url.replace(/\\u002F/gi, '/').replace(/\\/g, '').replace(/[),\]]+$/, '');
    if (!/^https?:\/\//i.test(url)) continue;
    if (!isUsableFacebookImageUrl(url)) continue;
    urls.add(url);
    if (urls.size >= limit) break;
  }
  return Array.from(urls).slice(0, limit);
}

function isLikelyFaviconUrl(value?: string): boolean {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return /favicon|\/icon(?:\.|\/)|\.(?:ico)(?:$|\?)/i.test(parsed.pathname + parsed.search);
  } catch {
    return false;
  }
}

async function fetchFacebookVideoUrl(videoId: string | undefined): Promise<string | undefined> {
  if (!videoId) return undefined;
  const endpoints = [
    `https://www.facebook.com/video/embed?video_id=${encodeURIComponent(videoId)}`,
    `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D${encodeURIComponent(videoId)}&show_text=false`,
    `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F${encodeURIComponent(videoId)}%2F&show_text=false`,
    `https://www.facebook.com/reel/${encodeURIComponent(videoId)}/`,
    `https://m.facebook.com/video.php?v=${encodeURIComponent(videoId)}`,
    `https://mbasic.facebook.com/video/video.php?v=${encodeURIComponent(videoId)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint, {
        timeout: 10000,
        maxContentLength: 2 * 1024 * 1024,
        responseType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          Referer: 'https://www.facebook.com/',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
        },
      });
      const html = String(response.data ?? '').replace(/\\u00253D/gi, '=');
      const videoUrl = getFacebookVideoUrl(html);
      if (videoUrl) {
        console.log('[SocialEmbed] Resolved Facebook video URL from embed endpoint', { videoId, endpoint });
        return videoUrl;
      }
    } catch (error: any) {
      console.warn('[SocialEmbed] Facebook embed video lookup failed', {
        videoId,
        endpoint,
        status: error?.response?.status,
        message: error?.message,
      });
    }
  }
  return undefined;
}

const FACEBOOK_HOST_RE = /(?:^|\.)(?:facebook\.com|fb\.watch)$/i;

function isFacebookUrl(value: string): boolean {
  try {
    return FACEBOOK_HOST_RE.test(new URL(value).hostname);
  } catch {
    return false;
  }
}

function isUsableImageUrl(value: string | undefined, facebook: boolean): value is string {
  if (!value) return false;
  return facebook ? isUsableFacebookImageUrl(value) : !isLikelyFaviconUrl(value);
}

async function fetchSocialMetadata(proxyUrl: string): Promise<SocialMetadata> {
  const facebook = isFacebookUrl(proxyUrl);
  try {
    const response = await axios.get(proxyUrl, {
      timeout: 8000,
      maxContentLength: 2 * 1024 * 1024,
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      },
      responseType: 'text',
    });
    const html = String(response.data ?? '');
    const finalUrl = String((response.request as any)?.res?.responseUrl ?? (response.request as any)?.responseUrl ?? proxyUrl);
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
    const blocked = /^(?:log in|login|facebook \u2013 log in)/i.test(titleTag ?? '')
      || /<div[^>]+id=["']loginform["']/i.test(html);
    if (blocked) {
      console.warn('[SocialEmbed] Facebook login shell detected; trying public embed resolution', { requestedUrl: proxyUrl, finalUrl });
    }
    console.log('[SocialEmbed] Metadata response', {
      url: proxyUrl,
      status: response.status,
      contentType: response.headers['content-type'],
      htmlBytes: Buffer.byteLength(html, 'utf8'),
    });
    const cleanTitleTag = /^Instagram$/i.test(titleTag ?? '') ? undefined : titleTag;
    const ogImage = getMeta(html, 'og:image:secure_url')
      || getMeta(html, 'og:image')
      || getMeta(html, 'og:image:url')
      || getMeta(html, 'twitter:image')
      || getMeta(html, 'twitter:image:src')
      || getJsonMediaUrl(html, 'display_url')
      || (facebook ? getEmbeddedFacebookMedia(html, 'image') : undefined);
    const images = facebook
      ? getEmbeddedFacebookImages(html, ogImage)
      : isUsableImageUrl(ogImage, false) ? [ogImage] : [];
    const rawCanonical = getMeta(html, 'og:url') || getCanonical(html);
    const canonical = rawCanonical && !/(?:\/login(?:\/|$)|facebook\.com\/login)/i.test(rawCanonical) ? rawCanonical : undefined;
    const ogType = getMeta(html, 'og:type')?.toLowerCase();
    const isVideoPost = !!ogType?.includes('video') || (facebook && /\/reel(?:s)?\/|[?&]v=\d+/i.test(proxyUrl));
    const hideImage = facebook && isVideoPost;
    const videoId = facebook ? getFacebookVideoId(html, proxyUrl) : undefined;
    let video = getMeta(html, 'og:video:secure_url')
      || getMeta(html, 'og:video')
      || getMeta(html, 'og:video:url')
      || getMeta(html, 'twitter:player:stream')
      || (facebook ? getFacebookVideoUrl(html) : undefined)
      || getJsonMediaUrl(html, 'video_url');
    if (facebook && isVideoPost && !video && videoId) {
      video = await fetchFacebookVideoUrl(videoId);
    }
    const metadata: SocialMetadata = {
      title: getMeta(html, 'og:title') || getMeta(html, 'twitter:title') || getJsonText(html, ['caption', 'text']) || cleanTitleTag,
      description: getMeta(html, 'og:description') || getMeta(html, 'twitter:description') || getMeta(html, 'description') || getJsonText(html, ['caption_text', 'accessibility_caption']),
      image: hideImage ? undefined : (isUsableImageUrl(ogImage, facebook) ? ogImage : undefined),
      images: hideImage ? [] : images,
      video,
      canonical,
      blocked,
      isVideoPost,
      videoId,
    };
    console.log('[SocialEmbed] Extracted metadata', {
      url: proxyUrl,
      hasTitle: !!metadata.title,
      hasDescription: !!metadata.description,
      hasImage: !!metadata.image,
      imageCount: metadata.images?.length ?? 0,
      hasVideo: !!metadata.video,
      isVideoPost: !!metadata.isVideoPost,
      videoId: metadata.videoId,
      mediaType: metadata.video || metadata.isVideoPost ? 'video' : metadata.image ? 'image' : 'none',
    });
    return metadata;
  } catch (error: any) {
    console.error('[SocialEmbed] Metadata fetch failed', {
      url: proxyUrl,
      status: error?.response?.status,
      message: error?.message,
      code: error?.code,
    });
    return {};
  }
}

// ==================== MEDIA ====================

/** Giới hạn upload theo cấp boost của server (trừ chút dư địa) */
function uploadLimitBytes(premiumTier: number | undefined): number {
  const limitMb = (premiumTier ?? 0) >= 3 ? 100 : premiumTier === 2 ? 50 : 10;
  return limitMb * 1024 * 1024 - 512 * 1024;
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')}MB`;

async function downloadMedia(url: string | undefined, maxBytes: number): Promise<AttachmentBuilder | null> {
  if (!url) return null;
  const isFacebookMedia = /(?:fbsbx\.com|fbcdn\.net)/i.test(url);
  const attempts = [
    {
      'User-Agent': isFacebookMedia
        ? 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
        : 'Mozilla/5.0 (compatible; DiscordSocialEmbed/1.0)',
      Referer: isFacebookMedia ? 'https://www.facebook.com/' : new URL(url).origin,
      Accept: 'image/webp,image/apng,image/jpeg,image/png,image/*;q=0.8,*/*;q=0.5',
    },
    {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
      Referer: 'https://www.facebook.com/',
      Accept: 'image/webp,image/apng,image/jpeg,image/png,image/*;q=0.8,*/*;q=0.5',
    },
  ];

  for (const headers of attempts) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        maxContentLength: maxBytes,
        maxBodyLength: maxBytes,
        headers,
      });
      const buffer = Buffer.from(response.data);
      if (buffer.length === 0 || buffer.length > maxBytes) continue;

      const contentType = String(response.headers['content-type'] ?? '').toLowerCase();
      if (contentType.includes('text/html') || contentType.includes('text/plain') || contentType.includes('image/x-icon')) continue;
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      const isGif = buffer.subarray(0, 6).toString('ascii').startsWith('GIF8');
      const isWebp = buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
      const extension = isPng ? 'png' : isGif ? 'gif' : isWebp ? 'webp' : isJpeg ? 'jpg' : null;
      if (!extension) {
        console.warn('[SocialEmbed] Unsupported image format', { url, contentType, bytes: buffer.length });
        continue;
      }
      const attachment = new AttachmentBuilder(buffer, { name: `social-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}` });
      console.log('[SocialEmbed] Image downloaded', { bytes: buffer.length, contentType, name: attachment.name, isFacebookMedia });
      return attachment;
    } catch (error: any) {
      console.error('[SocialEmbed] Image download attempt failed', {
        url,
        status: error?.response?.status,
        message: error?.message,
        code: error?.code,
        isFacebookMedia,
      });
    }
  }
  return null;
}

function randomFilename(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Đọc thời lượng video (giây) từ stderr của ffmpeg (ffmpeg-static không kèm ffprobe) */
function probeDuration(ffmpeg: string, file: string): Promise<number | null> {
  return new Promise((resolve) => {
    let stderr = '';
    const proc = spawn(ffmpeg, ['-i', file], { stdio: ['ignore', 'ignore', 'pipe'] });
    proc.stderr?.on('data', (chunk) => (stderr += chunk.toString()));
    proc.on('error', () => resolve(null));
    proc.on('close', () => {
      const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      resolve(m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null);
    });
  });
}

// Chỉ nén từng video một để không làm nghẽn CPU
let compressQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = compressQueue.then(fn, fn);
  compressQueue = run.catch(() => {});
  return run;
}

/**
 * Nén video xuống dưới `limitBytes` bằng bitrate tính theo thời lượng
 * (bản cũ dùng `-fs` nên video quá dài sẽ bị cắt cụt thay vì nén).
 */
async function compressSocialVideo(source: Buffer, limitBytes: number): Promise<Buffer | null> {
  if (!ffmpegPath) return null;
  const ffmpeg: string = ffmpegPath;

  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'social-video-'));
  const input = path.join(dir, 'input.bin');
  const output = path.join(dir, 'output.mp4');

  try {
    await fsp.writeFile(input, source);

    const duration = await probeDuration(ffmpeg, input);
    const audioKbps = 96;
    let rateArgs: string[];

    if (duration && duration > 0) {
      // Dư ~8% cho phần overhead của container
      const videoKbps = Math.floor((limitBytes * 8 * 0.92) / duration / 1000) - audioKbps;
      if (videoKbps < 250) return null; // quá dài, nén xuống sẽ quá mờ
      rateArgs = ['-b:v', `${videoKbps}k`, '-maxrate', `${videoKbps}k`, '-bufsize', `${videoKbps * 2}k`];
    } else {
      // Không biết thời lượng: dùng CRF và kiểm tra dung lượng sau khi nén
      rateArgs = ['-crf', '30'];
    }

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        ffmpeg,
        [
          '-y', '-i', input,
          '-vf', "scale='min(720,iw)':-2",
          '-c:v', 'libx264', '-preset', 'veryfast', ...rateArgs,
          '-c:a', 'aac', '-b:a', `${audioKbps}k`,
          '-movflags', '+faststart',
          output,
        ],
        { stdio: 'ignore' },
      );
      const timer = setTimeout(() => {
        proc.kill('SIGKILL');
        reject(new Error('Video compression timeout'));
      }, COMPRESS_TIMEOUT_MS);
      proc.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      proc.on('close', (code) => {
        clearTimeout(timer);
        code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`));
      });
    });

    const compressed = await fsp.readFile(output);
    if (!compressed.length || compressed.length > limitBytes) {
      console.warn('[SocialEmbed] Video compression produced no usable file', { compressedBytes: compressed.length, limitBytes });
      return null;
    }
    return compressed;
  } catch (error: any) {
    console.error('[SocialEmbed] Video compression failed', { message: error?.message });
    return null;
  } finally {
    await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

interface VideoResult {
  file: AttachmentBuilder | null;
  /** Ghi chú hiển thị ở chân thẻ (nén, quá nặng, ...) */
  note?: string;
}

async function downloadSocialVideo(url: string | undefined, limitBytes: number): Promise<VideoResult> {
  if (!url) return { file: null };

  try {
    const isFacebookMedia = /(?:fbsbx\.com|fbcdn\.net)/i.test(url);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: MAX_VIDEO_SOURCE_BYTES,
      maxBodyLength: MAX_VIDEO_SOURCE_BYTES,
      headers: (() => {
        const headers: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Referer: isFacebookMedia ? 'https://www.facebook.com/' : new URL(url).origin,
          Accept: 'video/mp4,video/webm,video/*,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
        };
        if (isFacebookMedia) headers.Origin = 'https://www.facebook.com';
        return headers;
      })(),
    });
    const source = Buffer.from(response.data);
    if (source.length === 0) return { file: null };

    const contentType = String(response.headers['content-type'] ?? '').toLowerCase();
    const isMp4 = source.subarray(4, 8).toString('ascii') === 'ftyp' || source.subarray(4, 12).toString('ascii').includes('ftyp');
    const isWebm = source.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    if (!isMp4 && !isWebm && !contentType.includes('video/')) {
      console.warn('[SocialEmbed] Rejected non-video response as video', {
        url,
        contentType,
        bytes: source.length,
      });
      return { file: null };
    }

    // Vừa giới hạn upload của server: đính kèm thẳng, không cần ffmpeg
    if (source.length <= limitBytes) {
      const attachment = new AttachmentBuilder(source, { name: `social-video-${randomFilename()}.mp4` });
      console.log('[SocialEmbed] Video attached directly', { bytes: source.length, name: attachment.name });
      return { file: attachment };
    }

    if (!ffmpegPath) {
      return { file: null, note: `⚠️ Video ${mb(source.length)} vượt giới hạn upload ${mb(limitBytes)}` };
    }

    const compressed = await enqueue(() => compressSocialVideo(source, limitBytes));
    if (!compressed) {
      return { file: null, note: `⚠️ Video ${mb(source.length)} quá nặng, không nén được` };
    }

    const attachment = new AttachmentBuilder(compressed, { name: `social-video-${randomFilename()}.mp4` });
    console.log('[SocialEmbed] Video compressed and attached', { originalBytes: source.length, compressedBytes: compressed.length, name: attachment.name });
    return { file: attachment, note: `🗜️ Đã nén ${mb(source.length)} → ${mb(compressed.length)}` };
  } catch (error: any) {
    console.error('[SocialEmbed] Video download or compression failed', {
      url,
      status: error?.response?.status,
      message: error?.message,
      code: error?.code,
    });
    return { file: null };
  }
}

// ==================== UI ====================

function text(value: string): TextDisplayBuilder {
  return new TextDisplayBuilder().setContent(value);
}

function linkButton(label: string, url: string, emoji?: string): ButtonBuilder {
  const button = new ButtonBuilder().setLabel(label).setStyle(ButtonStyle.Link).setURL(url);
  if (emoji) button.setEmoji(emoji);
  return button;
}

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/**
 * Instagram mô tả theo dạng: `1,234 likes, 56 comments - user on May 1, 2025: "caption"`.
 * Tách số tim / bình luận ra khỏi caption để hiển thị gọn hơn (best-effort, sai định dạng thì giữ nguyên).
 */
function parseInstagramDescription(description?: string): { caption?: string; stats?: string } {
  if (!description) return {};
  const full = description.match(/^([\d.,]+[KMkm]?)\s+likes?,\s*([\d.,]+[KMkm]?)\s+comments?\s*-\s*.+?:\s*["“](.*)["”]\.?$/s);
  if (full) return { stats: `❤️ **${full[1]}** · 💬 ${full[2]}`, caption: full[3].trim() || undefined };
  const statsOnly = description.match(/^([\d.,]+[KMkm]?)\s+likes?,\s*([\d.,]+[KMkm]?)\s+comments?/i);
  if (statsOnly) return { stats: `❤️ **${statsOnly[1]}** · 💬 ${statsOnly[2]}`, caption: description };
  return { caption: description };
}

interface CardOptions {
  platform: string;
  title?: string;
  description?: string;
  mediaName?: string | null;
  mediaNames?: string[];
  remoteImages?: string[];
  hasVideo: boolean;
  inaccessible: boolean;
  rawLink: string;
  sharedBy: string;
  notes: string[];
}

/** Card gọn: media ở trên, một khối chữ, hàng nút ở cuối */
function buildSocialCard(o: CardOptions) {
  const style = PLATFORM_STYLE[o.platform] ?? { icon: '🔗', color: 0x5865f2 };
  const container = new ContainerBuilder();
  if (USE_ACCENT) container.setAccentColor(style.color);

  // Video / ảnh ở trên cùng
  const galleryNames = o.mediaNames?.length ? o.mediaNames : o.mediaName ? [o.mediaName] : [];
  const galleryItems = [
    ...galleryNames.map((name) => `attachment://${name}`),
    ...(o.remoteImages ?? []),
  ].slice(0, 10);
  if (galleryItems.length) {
    const gallery = new MediaGalleryBuilder();
    for (const url of galleryItems) {
      gallery.addItems(new MediaGalleryItemBuilder().setURL(url));
    }
    container.addMediaGalleryComponents(gallery);
  }

  // Một khối chữ: nhãn nền tảng, tiêu đề, nội dung, thống kê, chân thẻ
  let caption = o.description;
  let stats: string | undefined;
  if (o.platform === 'Instagram') {
    const parsed = parseInstagramDescription(o.description);
    caption = parsed.caption;
    stats = parsed.stats;
  }

  const lines: string[] = [`-# ${style.icon} ${o.platform.toUpperCase()}`];
  lines.push(`### ${o.inaccessible ? 'Bài đăng không tồn tại hoặc riêng tư' : truncate(o.title ?? o.platform, 100)}`);
  if (caption && caption !== o.title) lines.push(truncate(caption, 220));
  if (stats) lines.push(stats);
  lines.push(`-# ${[...o.notes, `Chia sẻ bởi ${o.sharedBy}`].join(' • ')}`);
  container.addTextDisplayComponents(text(lines.join('\n')));

  // Hàng nút: link gốc trước; nút embed chỉ hiện khi video chưa nằm sẵn trong card
  const buttons = [linkButton('Xem bài gốc', o.rawLink, '🔗')];
  container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons));

  return container;
}

// ==================== MODULE ====================

export class SocialEmbedModule {
  private readonly client: Client;
  private messageHandler: ((message: Message) => Promise<void>) | null = null;

  constructor(client: Client) {
    this.client = client;
  }

  async initialize(): Promise<void> {
    this.messageHandler = async (message: Message) => {
      if (message.author.bot || !message.guild || message.webhookId) return;

      const matches = Array.from(message.content.matchAll(SOCIAL_URL_REGEX), (match) => match[0])
        .map((link) => link.replace(/[.,!?;:'\]}>]+$/g, ''));

      if (matches.length === 0) return;

      // Chỉ xử lý nếu có ít nhất một link của nền tảng được hỗ trợ.
      // (Bản cũ ẩn embed của MỌI tin nhắn có link, kể cả YouTube hay trang web khác.)
      const hasSupported = matches.some((link) => {
        try {
          const host = new URL(link).hostname.toLowerCase();
          return !TIKTOK_HOSTS.has(host) && !host.endsWith('.tiktok.com') && !!detectSocialPlatform(host);
        } catch {
          return false;
        }
      });
      if (!hasSupported) return;

      if (!('send' in message.channel)) {
        console.warn('[SocialEmbed] Channel does not support send', { channelId: message.channelId });
        return;
      }

      // Hiện "đang nhập..." trong lúc tải media
      (message.channel as any).sendTyping?.().catch?.(() => {});

      const seen = new Set<string>();
      const uploadLimit = uploadLimitBytes(message.guild.premiumTier);
      let posted = 0;

      for (const rawLink of matches.slice(0, MAX_LINKS_PER_MESSAGE)) {
        let url: URL;
        try {
          url = new URL(rawLink);
        } catch {
          continue;
        }

        const hostname = url.hostname.toLowerCase();
        if (TIKTOK_HOSTS.has(hostname) || hostname.endsWith('.tiktok.com')) continue;

        const platform = detectSocialPlatform(hostname);
        if (!platform || seen.has(rawLink)) continue;
        seen.add(rawLink);
        console.log('[SocialEmbed] Processing link', { platform: platform.name, hostname, guildId: message.guildId, channelId: message.channelId });

        const proxyUrl = platform.rewrite(url);
        const officialUrl = platform.name === 'Threads'
          ? `https://www.threads.com${url.pathname}${url.search}`
          : platform.name === 'Instagram'
            ? url.toString()
            : proxyUrl;
        let metadata = await fetchSocialMetadata(officialUrl);
        if (platform.name === 'Facebook' && metadata.canonical?.startsWith('https://') && metadata.canonical !== officialUrl) {
          const canonicalMetadata = await fetchSocialMetadata(metadata.canonical);
          if (!canonicalMetadata.blocked || canonicalMetadata.video) {
            metadata = {
              title: metadata.title?.startsWith('http') ? canonicalMetadata.title : metadata.title || canonicalMetadata.title,
              description: metadata.description || canonicalMetadata.description,
              image: metadata.image || canonicalMetadata.image,
              images: metadata.images?.length ? metadata.images : canonicalMetadata.images,
              video: metadata.video || canonicalMetadata.video,
              canonical: metadata.canonical,
              blocked: metadata.blocked && canonicalMetadata.blocked,
              isVideoPost: metadata.isVideoPost || canonicalMetadata.isVideoPost,
              videoId: metadata.videoId || canonicalMetadata.videoId,
            };
          } else {
            metadata = { ...metadata, canonical: undefined };
          }
        }
        if (platform.name === 'Instagram') {
          const embedMetadata = await fetchSocialMetadata(proxyUrl);
          metadata = {
            title: metadata.title || embedMetadata.title,
            description: metadata.description || embedMetadata.description,
            image: metadata.image || embedMetadata.image,
            video: metadata.video || embedMetadata.video,
          };
        }

        const videoUrl = metadata.video && /^https?:\/\//i.test(metadata.video)
          ? new URL(metadata.video, proxyUrl).toString()
          : undefined;

        // Giới hạn dung lượng theo cấp boost của server (bản cũ cố định 24MB nên server thường không gửi được)
        const videoResult = await downloadSocialVideo(videoUrl, uploadLimit);
        const video = videoResult.file;
        const imageUrls = (metadata.images?.length ? metadata.images : metadata.image ? [metadata.image] : [])
          .filter((imageUrl) => /^https?:\/\//i.test(imageUrl))
          .slice(0, platform.name === 'Facebook' ? 10 : 1);
        const imageAttachments: AttachmentBuilder[] = [];
        const remoteImages: string[] = [];
        if (!video) {
          console.log('[SocialEmbed] Image candidates', { platform: platform.name, imageUrls });
          for (const imageUrl of imageUrls) {
            const attachment = await downloadMedia(imageUrl, uploadLimit);
            if (attachment) imageAttachments.push(attachment);
            else remoteImages.push(imageUrl);
          }
        }
        const media = video || imageAttachments[0] || null;
        console.log('[SocialEmbed] Media result', {
          platform: platform.name,
          hasVideo: !!video,
          hasImage: imageAttachments.length > 0,
          imageCount: imageAttachments.length,
          attachmentName: media?.name ?? null,
        });

        const title = cleanSocialText(metadata.title, platform.name);
        const description = cleanSocialText(metadata.description, platform.name);
        const inaccessible = platform.name === 'Instagram' && !media && !title && !metadata.description;

        const cardFor = (attached: AttachmentBuilder[], remote: string[]) =>
          buildSocialCard({
            platform: platform.name,
            title,
            description,
            mediaNames: attached.map((file) => file.name).filter((name): name is string => !!name),
            remoteImages: remote,
            hasVideo: !!video && attached.includes(video),
            inaccessible,
            rawLink,
            sharedBy: message.author.username,
            notes: [
              ...(videoResult.note ? [videoResult.note] : []),
              ...(metadata.isVideoPost && !video ? [`🎬 Video ${platform.name}, xem ở bài gốc`] : []),
            ],
          });

        const send = (attached: AttachmentBuilder[], remote: string[] = []) =>
          (message.channel as any).send({
            components: [cardFor(attached, remote)],
            flags: V2,
            files: attached,
            allowedMentions: { repliedUser: false, parse: [] },
          });

        const attachedMedia = video ? [video] : imageAttachments;
        try {
          const sent = await send(attachedMedia, remoteImages);
          posted++;
          console.log('[SocialEmbed] Card sent', { platform: platform.name, messageId: sent.id, hasAttachment: !!media });
        } catch (error: any) {
          console.error(`[SocialEmbed] Không thể gửi thẻ ${platform.name}`, {
            guildId: message.guildId,
            channelId: message.channelId,
            code: error?.code,
            status: error?.status,
            message: error?.message,
          });

          // Lỗi file đính kèm: thử ảnh remote, sau đó gửi card text-only.
          for (const fallbackImages of [video ? [] : imageUrls, []]) {
            try {
              await send([], fallbackImages);
              posted++;
              console.log('[SocialEmbed] Card sent via fallback', { platform: platform.name, remoteImages: fallbackImages.length });
              break;
            } catch (retryError: any) {
              console.error('[SocialEmbed] Gửi lại thất bại', { message: retryError?.message });
            }
          }
        }
      }

      // Chỉ ẩn embed gốc khi đã gửi được ít nhất một card (bản cũ ẩn trước nên lỗi là mất cả embed)
      if (posted > 0) {
        await message.suppressEmbeds(true).catch((error) => {
          console.warn('[SocialEmbed] Could not suppress original embeds', { guildId: message.guildId, channelId: message.channelId, error: error?.message });
        });
      }
    };

    const intents = new IntentsBitField(this.client.options.intents);
    if (!intents.has(GatewayIntentBits.MessageContent)) {
      console.warn('[SocialEmbed] ⚠️ Client thiếu intent MessageContent: bot sẽ KHÔNG đọc được link trong tin nhắn. Thêm GatewayIntentBits.MessageContent và bật Message Content Intent trong Discord Developer Portal.');
    }

    const innerHandler = this.messageHandler;
    this.messageHandler = async (message: Message) => {
      try {
        await innerHandler(message);
      } catch (error: any) {
        console.error('[SocialEmbed] Unhandled error in message handler', { message: error?.message, code: error?.code });
      }
    };

    this.client.on('messageCreate', this.messageHandler);
    console.log('✅ Social Embed Module loaded');
  }

  async cleanup(): Promise<void> {
    if (this.messageHandler) {
      this.client.off('messageCreate', this.messageHandler);
      this.messageHandler = null;
    }
  }
}

export default function createModule(client: Client): SocialEmbedModule {
  return new SocialEmbedModule(client);
}