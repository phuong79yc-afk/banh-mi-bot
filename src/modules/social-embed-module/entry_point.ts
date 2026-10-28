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
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from 'discord.js';
import axios from 'axios';

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
    rewrite: (url) => {
      if (url.hostname === 'redd.it') return `https://rxddit.com${url.pathname}${url.search}`;
      return `https://rxddit.com${url.pathname}${url.search}`;
    },
  },
  {
    name: 'Threads',
    hosts: ['threads.net', 'www.threads.net', 'threads.com', 'www.threads.com'],
    rewrite: (url) => `https://vxthreads.net${url.pathname}${url.search}`,
  },
  {
    name: 'Facebook',
    hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch'],
    rewrite: (url) => url.toString(),
  },
];

const SOCIAL_URL_REGEX = /https?:\/\/[^\s<>()]+/gi;
const TIKTOK_HOSTS = new Set(['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com']);
const V2 = MessageFlags.IsComponentsV2;

interface SocialMetadata {
  title?: string;
  description?: string;
  image?: string;
  video?: string;
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

function getJsonMediaUrl(html: string, key: 'display_url' | 'video_url'): string | undefined {
  const match = html.match(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\])*)"`, 'i'));
  if (!match) return undefined;
  try {
    const parsed = JSON.parse(`"${match[1]}"`);
    return typeof parsed === 'string' && /^https?:\/\//i.test(parsed) ? parsed : undefined;
  } catch {
    return match[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\\\/g, '\\');
  }
}

function getJsonText(html: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const match = html.match(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\])*)"`, 'i'));
    if (!match) continue;
    try {
      const parsed = JSON.parse(`"${match[1]}"`);
      const clean = typeof parsed === 'string' ? cleanSocialText(parsed, 'Instagram') : undefined;
      if (clean) return clean;
    } catch {}
  }
  return undefined;
}

async function fetchSocialMetadata(proxyUrl: string): Promise<SocialMetadata> {
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
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    const cleanTitleTag = /^Instagram$/i.test(titleTag?.trim() ?? '') ? undefined : titleTag;
    return {
      title: getMeta(html, 'og:title') || getMeta(html, 'twitter:title') || getJsonText(html, ['caption', 'text']) || cleanTitleTag,
      description: getMeta(html, 'og:description') || getMeta(html, 'twitter:description') || getMeta(html, 'description') || getJsonText(html, ['caption_text', 'accessibility_caption']),
      image: getMeta(html, 'og:image:secure_url') || getMeta(html, 'og:image') || getMeta(html, 'twitter:image') || getMeta(html, 'twitter:image:src') || getJsonMediaUrl(html, 'display_url'),
      video: getMeta(html, 'og:video:secure_url') || getMeta(html, 'og:video') || getMeta(html, 'og:video:url') || getMeta(html, 'twitter:player:stream') || getJsonMediaUrl(html, 'video_url'),
    };
  } catch {
    return {};
  }
}

async function downloadMedia(url: string | undefined, maxBytes: number): Promise<AttachmentBuilder | null> {
  if (!url) return null;
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: maxBytes,
      maxBodyLength: maxBytes,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DiscordSocialEmbed/1.0)' },
    });
    const buffer = Buffer.from(response.data);
    if (buffer.length === 0 || buffer.length > maxBytes) return null;

    const contentType = String(response.headers['content-type'] ?? '').toLowerCase();
    const extension = contentType.includes('mp4') ? 'mp4'
      : contentType.includes('webm') ? 'webm'
      : contentType.includes('png') ? 'png'
      : contentType.includes('gif') ? 'gif'
      : contentType.includes('jpeg') ? 'jpg'
      : 'jpg';
    return new AttachmentBuilder(buffer, { name: `social-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}` });
  } catch {
    return null;
  }
}

function text(value: string): TextDisplayBuilder {
  return new TextDisplayBuilder().setContent(value);
}

function linkButton(label: string, url: string, emoji?: string): ButtonBuilder {
  const button = new ButtonBuilder().setLabel(label).setStyle(ButtonStyle.Link).setURL(url);
  if (emoji) button.setEmoji(emoji);
  return button;
}

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

      const seen = new Set<string>();

      await message.suppressEmbeds(true).catch(() => {});
      if (!('send' in message.channel)) return;

      for (const rawLink of matches.slice(0, 4)) {
        let url: URL;
        try {
          url = new URL(rawLink);
        } catch {
          continue;
        }

        const hostname = url.hostname.toLowerCase();
        if (TIKTOK_HOSTS.has(hostname) || hostname.endsWith('.tiktok.com')) continue;

        const platform = PLATFORMS.find((item) => item.hosts.includes(hostname)
          || item.hosts.some((host) => host.startsWith('www.') && hostname === host.slice(4))
          || hostname.endsWith('.instagram.com')
          || hostname.endsWith('.facebook.com')
          || hostname.endsWith('.threads.net'));
        if (!platform || seen.has(rawLink)) continue;
        seen.add(rawLink);

        const proxyUrl = platform.rewrite(url);
        let metadata = await fetchSocialMetadata(platform.name === 'Instagram' ? url.toString() : proxyUrl);
        if (platform.name === 'Instagram') {
          const embedMetadata = await fetchSocialMetadata(proxyUrl);
          metadata = {
            title: metadata.title || embedMetadata.title,
            description: metadata.description || embedMetadata.description,
            image: metadata.image || embedMetadata.image,
            video: metadata.video || embedMetadata.video,
          };
        }

        let mediaUrl = metadata.video || metadata.image;
        if (mediaUrl && !/^https?:\/\//i.test(mediaUrl)) {
          try { mediaUrl = new URL(mediaUrl, proxyUrl).toString(); } catch { mediaUrl = undefined; }
        }

        const video = await downloadMedia(metadata.video && /^https?:\/\//i.test(metadata.video)
          ? new URL(metadata.video, proxyUrl).toString()
          : undefined, 24 * 1024 * 1024);
        const image = video ? null : await downloadMedia(mediaUrl && mediaUrl !== metadata.video ? mediaUrl : undefined, 24 * 1024 * 1024);
        const media = video || image;

        const container = new ContainerBuilder();
        const title = cleanSocialText(metadata.title, platform.name);
        const inaccessible = platform.name === 'Instagram' && !media && !title && !metadata.description;
        container.addTextDisplayComponents(text(`## ${platform.name}\n${title ?? (inaccessible ? 'Bài đăng không tồn tại hoặc riêng tư' : platform.name)}`));

        if (media) {
          container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
              new MediaGalleryItemBuilder().setURL(`attachment://${media.name}`),
            ),
          );
        }

        const description = cleanSocialText(metadata.description, platform.name);
        if (description && description !== title) {
          container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
          container.addTextDisplayComponents(text(description));
        }

        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        container.addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            linkButton('Xem bài gốc', rawLink, '🔗'),
            linkButton(video ? 'Mở video' : 'Mở embed', proxyUrl, video ? '🎬' : '↗️'),
          ),
        );

        await message.channel.send({
          components: [container],
          flags: V2,
          files: media ? [media] : [],
          allowedMentions: { repliedUser: false, parse: [] },
        }).catch((error) => {
          console.error(`[SocialEmbed] Không thể gửi thẻ ${platform.name}:`, error);
        });
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
