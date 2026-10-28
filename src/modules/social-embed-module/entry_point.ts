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
    rewrite: (url) => `https://ddinstagram.com${url.pathname}${url.search}`,
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
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function getMeta(html: string, property: string): string | undefined {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'));
  return tag?.[1] ? decodeHtml(tag[1]) : undefined;
}

async function fetchSocialMetadata(proxyUrl: string): Promise<SocialMetadata> {
  try {
    const response = await axios.get(proxyUrl, {
      timeout: 8000,
      maxContentLength: 2 * 1024 * 1024,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DiscordSocialEmbed/1.0)' },
      responseType: 'text',
    });
    const html = String(response.data ?? '');
    return {
      title: getMeta(html, 'og:title') || getMeta(html, 'twitter:title'),
      description: getMeta(html, 'og:description') || getMeta(html, 'twitter:description'),
      image: getMeta(html, 'og:image') || getMeta(html, 'twitter:image'),
      video: getMeta(html, 'og:video') || getMeta(html, 'og:video:url') || getMeta(html, 'twitter:player:stream'),
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

        const platform = PLATFORMS.find((item) => item.hosts.includes(hostname));
        if (!platform || seen.has(rawLink)) continue;
        seen.add(rawLink);

        const proxyUrl = platform.rewrite(url);
        const metadata = await fetchSocialMetadata(proxyUrl);

        const video = await downloadMedia(metadata.video, 24 * 1024 * 1024);
        const image = video ? null : await downloadMedia(metadata.image, 24 * 1024 * 1024);
        const media = video || image;

        const container = new ContainerBuilder();
        const title = metadata.title?.trim() ? metadata.title.trim().replace(/\s+/g, ' ') : platform.name;
        container.addTextDisplayComponents(text(`## ${platform.name}\n${title}`));

        if (media) {
          container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
              new MediaGalleryItemBuilder().setURL(`attachment://${media.name}`),
            ),
          );
        }

        const description = metadata.description?.trim().replace(/\s+/g, ' ');
        if (description) {
          container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
          container.addTextDisplayComponents(text(description.length > 500 ? `${description.slice(0, 497)}…` : description));
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
