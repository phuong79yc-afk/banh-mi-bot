import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  Collection,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  Message,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  TextDisplayBuilder,
  User,
} from 'discord.js';
import { emojis } from '../../config/emojis';

const AUTO_EMBED = true;
const SUPPRESS_ORIGINAL = true;
const MAX_LINKS_PER_MESSAGE = 2;
const PLAYABLE_HOST = 'vxtiktok.com';
const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

const COLOR_TIKTOK = 0xfe2c55;
const COLOR_RED = 0xed4245;
const V2 = MessageFlags.IsComponentsV2;
const NO_PING = { parse: [] as never[], repliedUser: false };

const text = (content: string) => new TextDisplayBuilder().setContent(content);

const divider = (size: SeparatorSpacingSize = SeparatorSpacingSize.Small) =>
  new SeparatorBuilder().setDivider(true).setSpacing(size);

const linkButton = (label: string, url: string, emoji?: string) => {
  const button = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(label).setURL(url);
  if (emoji) button.setEmoji(emoji);
  return button;
};

const errorPayload = (content: string) => ({
  components: [
    new ContainerBuilder()
      .setAccentColor(COLOR_RED)
      .addTextDisplayComponents(text(`${emojis.error || '❌'} ${content}`)),
  ],
  flags: V2 as any,
  allowedMentions: NO_PING,
});

const TIKTOK_REGEX = /(?<!<)https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/[^\s<>)\]]+/gi;

interface TikTokData {
  url: string;
  isPhoto: boolean;
  videoId?: string;
  caption: string;
  tags: string[];
  authorName: string;
  authorUrl?: string;
  thumbUrl?: string;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Banhcuon-bot)', ...(init.headers ?? {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

function cleanUrl(raw: string): string {
  const url = new URL(raw);
  url.search = '';
  url.hash = '';
  if (url.hostname === 'm.tiktok.com') url.hostname = 'www.tiktok.com';
  return url.toString().replace(/\/$/, '');
}

async function resolveUrl(raw: string): Promise<string> {
  const url = new URL(raw);
  const isShort = /^(vm|vt)\.tiktok\.com$/i.test(url.hostname) || /^\/t\//.test(url.pathname);
  if (!isShort) return cleanUrl(raw);

  const response = await fetchWithTimeout(raw, { redirect: 'follow' });
  return cleanUrl(response.url || raw);
}

const cache = new Map<string, { at: number; data: TikTokData }>();

async function fetchTikTok(rawUrl: string): Promise<TikTokData> {
  const url = await resolveUrl(rawUrl);
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const parsedUrl = new URL(url);
  const photoMatch = parsedUrl.pathname.match(/^\/@([^/]+)\/photo\/(\d+)/i);
  const response = await fetchWithTimeout(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    if (photoMatch) {
      const data: TikTokData = {
        url,
        isPhoto: true,
        videoId: photoMatch[2],
        caption: '',
        tags: [],
        authorName: `@${photoMatch[1]}`,
        authorUrl: `https://www.tiktok.com/@${photoMatch[1]}`,
      };
      cache.set(url, { at: Date.now(), data });
      return data;
    }
    throw new Error('Không lấy được thông tin video (có thể đã bị xóa hoặc để riêng tư).');
  }

  const json: any = await response.json();
  const title: string = (json.title ?? '').toString();

  const tags = Array.from(new Set(title.match(/#[^\s#]+/g) ?? [])).slice(0, 8);
  const caption = title.replace(/#[^\s#]+/g, '').replace(/\s+/g, ' ').trim();

  const data: TikTokData = {
    url,
    isPhoto: Boolean(photoMatch),
    videoId: json.embed_product_id ?? url.match(/\/(?:video|photo)\/(\d+)/)?.[1],
    caption,
    tags,
    authorName: json.author_name ?? 'Không rõ',
    authorUrl: json.author_url,
    thumbUrl: json.thumbnail_url,
  };

  cache.set(url, { at: Date.now(), data });
  return data;
}

async function downloadThumbnail(url?: string): Promise<AttachmentBuilder | null> {
  if (!url) return null;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return new AttachmentBuilder(buffer, { name: 'tiktok-thumb.jpg' });
  } catch {
    return null;
  }
}

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

async function buildTikTokPayload(rawUrl: string, requester: User) {
  const data = await fetchTikTok(rawUrl);
  const thumb = await downloadThumbnail(data.thumbUrl);

  const container = new ContainerBuilder().setAccentColor(COLOR_TIKTOK);
  container.addTextDisplayComponents(text('-# 🎵 TIKTOK'));

  const authorLabel = data.authorUrl ? `[${data.authorName}](${data.authorUrl})` : data.authorName;
  container.addTextDisplayComponents(text(`# ${data.isPhoto ? '📸' : '🎬'} ${authorLabel}`));

  if (thumb) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL('attachment://tiktok-thumb.jpg'),
      ),
    );
  }

  const body: string[] = [];
  if (data.caption) {
    body.push(
      truncate(data.caption, 350)
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n'),
    );
  }
  if (data.tags.length) body.push(`-# ${data.tags.join(' ')}`);

  if (body.length) {
    container
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(body.join('\n')));
  }

  const info = [`👤 **Tác giả:** ${authorLabel}`];
  if (data.videoId) info.push(`🆔 **${data.isPhoto ? 'Bài đăng ID' : 'Video ID'}:** \`${data.videoId}\``);

  container
    .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(text(info.join('\n')));

  const buttons = [linkButton('Mở TikTok', data.url, '🎵')];
  if (PLAYABLE_HOST && !data.isPhoto) {
    const playable = new URL(data.url);
    playable.hostname = PLAYABLE_HOST;
    buttons.push(linkButton('Xem video', playable.toString(), '▶️'));
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
    files: thumb ? [thumb] : [],
  };
}

export default class TikTokModule {
  name = 'tiktok-module';
  description = 'Tạo thẻ đẹp cho link TikTok';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  private messageHandler?: (message: Message) => Promise<void>;

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
        .addStringOption((option) =>
          option.setName('link').setDescription('Link video TikTok').setRequired(true),
        ),

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
            errorPayload('Link không hợp lệ! Hãy gửi link dạng `https://www.tiktok.com/@user/video/...`'),
          );
          return;
        }

        try {
          await interaction.editReply(await buildTikTokPayload(match[0], interaction.user));
        } catch (error) {
          console.error('[TikTok] /tiktok error:', error);
          await interaction.editReply(
            errorPayload(
              error instanceof Error ? error.message : 'Không thể tạo thẻ TikTok, hãy thử lại sau!',
            ),
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
          posted += 1;
        } catch (error) {
          console.error(`[TikTok] Không tạo được thẻ cho ${link}:`, error instanceof Error ? error.message : error);
        }
      }

      if (SUPPRESS_ORIGINAL && posted > 0) {
        message.suppressEmbeds(true).catch(() => undefined);
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
