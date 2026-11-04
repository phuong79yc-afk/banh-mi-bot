// Free Fire Module - Entry Point (Components V2)
// Fetches latest news and game updates from the official Garena Free Fire Vietnam website.
// Data is extracted from the Nuxt.js SSR __NUXT__ payload embedded in the page HTML.

import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ChannelType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
  InteractionContextType,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  escapeMarkdown,
} from 'discord.js';
import { emojis } from '../../config/emojis';
import { getTursoDatabase } from '../../database/turso';

// ==================== COMPONENTS V2 HELPERS ====================
const V2 = MessageFlags.IsComponentsV2;
const NO_PING = { parse: [] as never[] };

const txt = (content: string) => new TextDisplayBuilder().setContent(content);
const sep = () => new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

// ==================== TYPES ====================
interface FreeFireArticle {
  id: number;
  link: string;
  title: string;
  cover: string;
  time: number;
  desc?: string;
  category: string;
}

interface ArticleDetail {
  id: number;
  title: string;
  abstract: string;
  image_cover: string;
  content: string;
  categorys: Array<{ id: number; name: string }>;
}

interface NewsData {
  newsList: FreeFireArticle[];
  newsPageList: FreeFireArticle[];
  categories: Array<{ id: number; name: string }>;
}

// ==================== CONSTANTS ====================
const FF_BASE_URL = 'https://ff.garena.com';
const FF_NEWS_URL = `${FF_BASE_URL}/vn/news`;
const FF_ARTICLE_URL = (id: number) => `${FF_BASE_URL}/vn/article/${id}/`;

// Discord text display limit
const MAX_TEXT_LENGTH = 4000;
// Truncate article content preview to leave room for other UI elements
const CONTENT_PREVIEW_LENGTH = 3000;
const NOTIFICATION_POLL_INTERVAL = 10 * 60 * 1000;

// ==================== CACHE ====================
let newsCache: { data: NewsData; timestamp: number } | null = null;
const NEWS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const articleCache = new Map<number, { data: ArticleDetail; timestamp: number }>();
const ARTICLE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ==================== DATA FETCHING ====================

/**
 * Fetches and parses the __NUXT__ SSR payload from the Free Fire news page.
 *
 * The official Garena website is a Nuxt.js SPA that server-side renders all
 * article data into a __NUXT__ function embedded in the HTML. We extract and
 * evaluate this function to get structured article data (titles, dates,
 * categories, cover images, links).
 *
 * Security note: The __NUXT__ function is a pure data function — it only
 * references its own arguments and local variables, makes no network calls,
 * and accesses no globals. It originates from the official Garena domain
 * (a trusted source). Using `new Function` here is equivalent to evaluating
 * a JSON response that happens to be wrapped in JS syntax.
 */
function parseNuxtPayload(html: string): any {
  const startMarker = '__NUXT__=';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error('Không tìm thấy dữ liệu tin tức (NUXT payload missing)');
  }

  const scriptEnd = html.indexOf('</script>', startIdx);
  if (scriptEnd === -1) {
    throw new Error('Dữ liệu tin tức không hợp lệ (script tag not closed)');
  }

  const nuxtCode = html.substring(startIdx + startMarker.length, scriptEnd).trim();

  // The NUXT payload is a self-executing function that returns a data object.
  // Evaluate it in an isolated scope to extract the structured data.
  const fn = new Function('return ' + nuxtCode);
  return fn();
}

async function fetchFreeFireNews(): Promise<NewsData> {
  // Check cache first
  if (newsCache && Date.now() - newsCache.timestamp < NEWS_CACHE_TTL) {
    return newsCache.data;
  }

  const response = await fetch(FF_NEWS_URL, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const data = parseNuxtPayload(html);

  // data.data is an array:
  //   [0] = {} (empty placeholder)
  //   [1] = { newsList: [...], newsModuleInfo }  — version update articles
  //   [2] = { newsPageList: [...], categories, menu, ... } — general news + metadata
  const newsList: FreeFireArticle[] = data.data[1]?.newsList || [];
  const newsPageList: FreeFireArticle[] = data.data[2]?.newsPageList || [];
  const categories: Array<{ id: number; name: string }> = data.data[2]?.categories || [];

  const result: NewsData = { newsList, newsPageList, categories };

  newsCache = { data: result, timestamp: Date.now() };
  return result;
}

async function fetchArticleDetail(id: number): Promise<ArticleDetail> {
  // Check cache
  const cached = articleCache.get(id);
  if (cached && Date.now() - cached.timestamp < ARTICLE_CACHE_TTL) {
    return cached.data;
  }

  const url = FF_ARTICLE_URL(id);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const data = parseNuxtPayload(html);

  // Article detail is in data.data[1].detail
  const detail: ArticleDetail = data.data[1]?.detail;
  if (!detail) {
    throw new Error('Không tìm thấy nội dung bài viết');
  }

  articleCache.set(id, { data: detail, timestamp: Date.now() });
  return detail;
}

// ==================== HTML TO TEXT ====================

/**
 * Converts article HTML content to Discord-friendly markdown text.
 * Handles common tags: headings, paragraphs, lists, bold/italic, line breaks.
 * Removes SVG, style, script, and image tags.
 */
function htmlToMarkdown(html: string): string {
  let text = html
    // Remove SVG, style, and script blocks entirely
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Remove images (they reference external CDN URLs not suitable for inline display)
    .replace(/<img[^>]*>/gi, '')
    // Convert headings to markdown
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n## $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n### $1\n')
    // Convert paragraphs to double newlines
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    // Convert list items to bullet points
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n')
    .replace(/<\/?[ou]l[^>]*>/gi, '')
    // Convert line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert bold
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    // Convert italic
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    // Convert links to markdown
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    // Strip all remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Clean up whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

// ==================== HELPERS ====================

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function categoryEmoji(category: string): string {
  switch (category) {
    case 'Cập nhật':
      return '🔄';
    case 'Sự Kiện':
      return '🎉';
    case 'Bản Tin':
      return '📰';
    case 'Hợp Tác':
      return '🤝';
    case 'Hỗ Trợ':
      return '🛟';
    default:
      return '📌';
  }
}

/**
 * Truncates text to a max length, cutting at the last word boundary.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const cut = text.substring(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return cut.substring(0, lastSpace > maxLen * 0.7 ? lastSpace : maxLen).trim() + '...';
}

/**
 * Gets all unique articles merged and sorted by date (newest first).
 */
function getAllArticles(newsData: NewsData): FreeFireArticle[] {
  const seen = new Set<number>();
  const merged = [...newsData.newsList, ...newsData.newsPageList];
  return merged
    .filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    })
    .sort((a, b) => b.time - a.time);
}

// ==================== MODULE ====================

export default class FreeFireModule {
  name = 'freefire-module';
  description = 'Free Fire - Cập nhật và tin tức game';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;
  private notificationTimer: NodeJS.Timeout | null = null;
  private pollingNotifications = false;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('🔥 Free Fire module initialized');
    this.registerCommands();
    this.startNotificationPolling();
    console.log(`✅ Free Fire module registered ${this.commands.size} commands`);
  }

  private startNotificationPolling() {
    if (this.notificationTimer) clearInterval(this.notificationTimer);
    this.notificationTimer = setInterval(() => {
      void this.pollNotifications();
    }, NOTIFICATION_POLL_INTERVAL);
    this.notificationTimer.unref();
    void this.pollNotifications();
  }

  private async pollNotifications() {
    if (this.pollingNotifications) return;
    this.pollingNotifications = true;

    try {
      const db = getTursoDatabase();
      const configs = await db.execute(
        'SELECT guild_id, channel_id FROM freefire_notification_config WHERE enabled = 1',
      );
      if (!configs.rows.length) return;

      const news = getAllArticles(await fetchFreeFireNews()).sort((a, b) => a.time - b.time);
      for (const row of configs.rows) {
        const guildId = String(row[configs.columns.indexOf('guild_id')]);
        const channelId = String(row[configs.columns.indexOf('channel_id')]);

        try {
          const channel = await this.client.channels.fetch(channelId);
          if (!channel || !channel.isTextBased() || !('send' in channel)) {
            console.error(`[Free Fire] Notification channel ${channelId} is unavailable for guild ${guildId}`);
            continue;
          }

          const seenResult = await db.execute({
            sql: 'SELECT article_id FROM freefire_notified_articles WHERE guild_id = ?',
            args: [guildId],
          });
          const seen = new Set(
            seenResult.rows.map((seenRow: any) =>
              String(seenRow[seenResult.columns.indexOf('article_id')]),
            ),
          );
          const unseenArticles = news.filter((article) => !seen.has(String(article.id)));

          for (const article of unseenArticles) {
            await channel.send({
              components: [this.buildNotification(article)],
              flags: V2,
              allowedMentions: NO_PING,
            });
            await db.execute({
              sql: 'INSERT OR IGNORE INTO freefire_notified_articles (guild_id, article_id) VALUES (?, ?)',
              args: [guildId, String(article.id)],
            });
          }
        } catch (error) {
          if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 10003
          ) {
            await db.execute({
              sql: 'UPDATE freefire_notification_config SET enabled = 0 WHERE guild_id = ? AND channel_id = ?',
              args: [guildId, channelId],
            });
            console.warn(
              `[Free Fire] Disabled notifications for guild ${guildId}: channel ${channelId} no longer exists`,
            );
            continue;
          }
          console.error(`[Free Fire] Failed to notify guild ${guildId}:`, error);
        }
      }
    } catch (error) {
      console.error('[Free Fire] Notification polling failed:', error);
    } finally {
      this.pollingNotifications = false;
    }
  }

  private buildNotification(article: FreeFireArticle): ContainerBuilder {
    const card = new ContainerBuilder().addTextDisplayComponents(
      txt(`## 🔥 Free Fire có tin mới`),
      txt(
        `### ${categoryEmoji(article.category)} ${escapeMarkdown(article.title)}\n` +
          `📅 ${formatDate(article.time)} • 🏷️ **${escapeMarkdown(article.category)}**\n` +
          (article.desc ? `${escapeMarkdown(truncate(article.desc, 250))}\n` : '') +
          `🔗 [Đọc chi tiết](${FF_BASE_URL}${article.link})`,
      ),
    );

    if (article.cover) {
      card.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(article.cover)),
      );
    }
    return card;
  }

  private registerCommands() {
    const notificationCommand = {
      data: new SlashCommandBuilder()
        .setName('freefire-notify')
        .setDescription('Cài đặt thông báo tin Free Fire')
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption((option) =>
          option
            .setName('action')
            .setDescription('Thao tác cấu hình thông báo')
            .setRequired(true)
            .addChoices(
              { name: 'Bật thông báo', value: 'enable' },
              { name: 'Tắt thông báo', value: 'disable' },
              { name: 'Xem trạng thái', value: 'status' },
            ),
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Kênh nhận thông báo (bắt buộc khi bật)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false),
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const guildId = interaction.guildId;
        if (!guildId) {
          return interaction.editReply('Lệnh này chỉ dùng được trong máy chủ Discord.');
        }

        const action = interaction.options.getString('action', true);
        const db = getTursoDatabase();
        try {
          if (action === 'enable') {
            const channel = interaction.options.getChannel('channel');
            if (!channel || !('send' in channel)) {
              return interaction.editReply('Hãy chọn một kênh văn bản hợp lệ để nhận thông báo.');
            }

            const articles = getAllArticles(await fetchFreeFireNews());
            await db.execute({
              sql: `INSERT INTO freefire_notification_config (guild_id, channel_id, enabled)
                    VALUES (?, ?, 1)
                    ON CONFLICT(guild_id) DO UPDATE SET channel_id = excluded.channel_id, enabled = 1`,
              args: [guildId, channel.id],
            });
            for (const article of articles) {
              await db.execute({
                sql: 'INSERT OR IGNORE INTO freefire_notified_articles (guild_id, article_id) VALUES (?, ?)',
                args: [guildId, String(article.id)],
              });
            }

            return interaction.editReply(
              `Đã bật thông báo Free Fire tại <#${channel.id}>. Bot kiểm tra tin mới mỗi 10 phút; tin đã đăng trước đó sẽ không được gửi lại.`,
            );
          }

          if (action === 'disable') {
            await db.execute({
              sql: 'UPDATE freefire_notification_config SET enabled = 0 WHERE guild_id = ?',
              args: [guildId],
            });
            return interaction.editReply('Đã tắt thông báo Free Fire tự động cho máy chủ này.');
          }

          const result = await db.execute({
            sql: 'SELECT channel_id, enabled FROM freefire_notification_config WHERE guild_id = ?',
            args: [guildId],
          });
          if (!result.rows.length) {
            return interaction.editReply('Máy chủ chưa cấu hình thông báo Free Fire. Dùng action `Bật thông báo` và chọn kênh.');
          }

          const row = result.rows[0];
          const channelId = String(row[result.columns.indexOf('channel_id')]);
          const enabled = Number(row[result.columns.indexOf('enabled')]) === 1;
          return interaction.editReply(
            `Thông báo Free Fire: **${enabled ? 'Đang bật' : 'Đang tắt'}**\nKênh: <#${channelId}>\nChu kỳ kiểm tra: 10 phút.`,
          );
        } catch (error) {
          console.error(`[Free Fire] Notification configuration failed for guild ${guildId}:`, error);
          return interaction.editReply('Không thể cập nhật cấu hình thông báo Free Fire. Vui lòng thử lại sau.');
        }
      },
    };
    this.commands.set('freefire-notify', notificationCommand);

    // ========================================
    // /freefire — Browse latest news & updates
    // ========================================
    const freefireCommand = {
      data: new SlashCommandBuilder()
        .setName('freefire')
        .setDescription('Xem tin Free Fire mới nhất')
        .addStringOption((option) =>
          option
            .setName('loại')
            .setDescription('Lọc theo loại tin tức')
            .addChoices(
              { name: '📋 Tất cả', value: 'all' },
              { name: '🔄 Cập nhật (phiên bản)', value: 'Cập nhật' },
              { name: '🎉 Sự Kiện', value: 'Sự Kiện' },
              { name: '📰 Bản Tin', value: 'Bản Tin' },
              { name: '🤝 Hợp Tác', value: 'Hợp Tác' },
            ),
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062 || error.code === 40060) return;
          throw error;
        }

        const filter = interaction.options.getString('loại') || 'all';

        try {
          const newsData = await fetchFreeFireNews();
          let articles = getAllArticles(newsData);

          // Filter by category if specified
          if (filter !== 'all') {
            articles = articles.filter((a) => a.category === filter);
          }

          if (articles.length === 0) {
            const noDataCard = new ContainerBuilder().addTextDisplayComponents(
              txt(`${emojis.error} Không tìm thấy tin tức nào cho mục này.`),
            );
            return interaction.editReply({ components: [noDataCard], flags: V2, allowedMentions: NO_PING });
          }

          // Build the message card
          const card = new ContainerBuilder();
          const displayCount = Math.min(articles.length, 10);
          const displayArticles = articles.slice(0, displayCount);
          const latest = displayArticles[0];

          // Header
          const filterLabel =
            filter === 'all'
              ? 'Tin tức và cập nhật mới nhất'
              : `Lọc theo: **${filter}**`;
          card.addTextDisplayComponents(txt(`## 🔥 Free Fire — Cập Nhật & Tin Tức`), txt(filterLabel));
          card.addSeparatorComponents(sep());

          // Featured article with cover image
          if (latest.cover) {
            card.addMediaGalleryComponents(
              new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(latest.cover)),
            );
          }

          let featuredText = `### ${categoryEmoji(latest.category)} ${escapeMarkdown(latest.title)}\n`;
          featuredText += `📅 ${formatDate(latest.time)}  •  🏷️ **${latest.category}**\n`;
          if (latest.desc) {
            featuredText += `${escapeMarkdown(truncate(latest.desc, 150))}\n`;
          }
          featuredText += `🔗 [Đọc chi tiết](${FF_BASE_URL}${latest.link})`;
          card.addTextDisplayComponents(txt(featuredText));

          // List of remaining articles
          if (displayArticles.length > 1) {
            card.addSeparatorComponents(sep());

            let listText = '### 📋 Tin tức khác\n';
            for (const article of displayArticles.slice(1)) {
              const title = truncate(escapeMarkdown(article.title), 70);
              listText += `${categoryEmoji(article.category)} **${title}**\n`;
              listText += `-# 📅 ${formatDate(article.time)} • 🏷️ ${article.category} • [Xem chi tiết](${FF_BASE_URL}${article.link})\n`;
            }
            card.addTextDisplayComponents(txt(listText));
          }

          // Footer
          card.addSeparatorComponents(sep());
          card.addTextDisplayComponents(
            txt(
              `-# 📌 Nguồn: [ff.garena.com](${FF_NEWS_URL}) • Cập nhật lúc ${new Date().toLocaleTimeString('vi-VN')}\n` +
                `-# 💡 Dùng \`/freefire-article\` để đọc nội dung chi tiết. Dùng \`/freefire loại:\` để lọc tin tức.`,
            ),
          );

          await interaction.editReply({ components: [card], flags: V2, allowedMentions: NO_PING });
        } catch (error) {
          console.error('Free Fire news error:', error);
          const errorCard = new ContainerBuilder().addTextDisplayComponents(
            txt(
              `${emojis.error} Không thể tải tin tức Free Fire lúc này.\n` +
                `Vui lòng thử lại sau hoặc truy cập [ff.garena.com](${FF_NEWS_URL}) trực tiếp.`,
            ),
          );
          return interaction.editReply({ components: [errorCard], flags: V2, allowedMentions: NO_PING });
        }
      },
    };

    // ========================================
    // /freefire-article — Read a specific article
    // ========================================
    const freefireArticleCommand = {
      data: new SlashCommandBuilder()
        .setName('freefire-article')
        .setDescription('Đọc bài viết Free Fire')
        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('ID bài viết — dùng autocomplete để tìm nhanh')
            .setRequired(true)
            .setAutocomplete(true),
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062 || error.code === 40060) return;
          throw error;
        }

        const articleId = interaction.options.getInteger('id', true);

        try {
          const detail = await fetchArticleDetail(articleId);
          const newsData = await fetchFreeFireNews().catch(() => null);
          const allArticles = newsData ? getAllArticles(newsData) : [];
          const articleMeta = allArticles.find((a) => a.id === articleId);
          const category = articleMeta?.category || detail.categorys?.[0]?.name || 'Tin tức';
          const timestamp = articleMeta?.time;

          const card = new ContainerBuilder();

          // Title
          card.addTextDisplayComponents(
            txt(`## 🔥 ${escapeMarkdown(detail.title)}`),
            txt(
              `🏷️ **${category}**` +
                (timestamp ? `  •  📅 ${formatDate(timestamp)}` : '') +
                `  •  [Xem trên web](${FF_ARTICLE_URL(articleId)})`,
            ),
          );
          card.addSeparatorComponents(sep());

          // Cover image
          if (detail.image_cover) {
            card.addMediaGalleryComponents(
              new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL(detail.image_cover),
              ),
            );
          }

          // Abstract
          if (detail.abstract) {
            card.addTextDisplayComponents(txt(`> ${escapeMarkdown(detail.abstract)}`));
            card.addSeparatorComponents(sep());
          }

          // Content (converted from HTML to markdown)
          if (detail.content) {
            const contentText = htmlToMarkdown(detail.content);
            if (contentText) {
              const truncated = truncate(contentText, CONTENT_PREVIEW_LENGTH);

              // Split into chunks if the content exceeds the text display limit
              if (truncated.length > MAX_TEXT_LENGTH) {
                // Split at paragraph boundaries
                const paragraphs = truncated.split('\n\n');
                let currentChunk = '';

                for (const para of paragraphs) {
                  if (currentChunk.length + para.length + 2 > MAX_TEXT_LENGTH) {
                    if (currentChunk) {
                      card.addTextDisplayComponents(txt(currentChunk));
                      card.addSeparatorComponents(sep());
                    }
                    currentChunk = para;
                  } else {
                    currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
                  }
                }
                if (currentChunk) {
                  card.addTextDisplayComponents(txt(currentChunk));
                }
              } else {
                card.addTextDisplayComponents(txt(truncated));
              }

              // Check if content was truncated
              if (contentText.length > CONTENT_PREVIEW_LENGTH) {
                card.addSeparatorComponents(sep());
                card.addTextDisplayComponents(
                  txt(`🔗 [Đọc toàn bộ bài viết tại đây](${FF_ARTICLE_URL(articleId)})`),
                );
              }
            }
          }

          // Footer
          card.addSeparatorComponents(sep());
          card.addTextDisplayComponents(
            txt(
              `-# 📌 Nguồn: [ff.garena.com](${FF_ARTICLE_URL(articleId)})\n` +
                `-# 💡 Dùng \`/freefire\` để xem danh sách tin tức mới nhất`,
            ),
          );

          await interaction.editReply({ components: [card], flags: V2, allowedMentions: NO_PING });
        } catch (error) {
          console.error('Free Fire article error:', error);
          const errorCard = new ContainerBuilder().addTextDisplayComponents(
            txt(
              `${emojis.error} Không thể tải bài viết này.\n` +
                `Kiểm tra lại ID bài viết hoặc truy cập [ff.garena.com](${FF_NEWS_URL}) trực tiếp.`,
            ),
          );
          return interaction.editReply({ components: [errorCard], flags: V2, allowedMentions: NO_PING });
        }
      },

      autocomplete: async (interaction: AutocompleteInteraction) => {
        try {
          const newsData = await fetchFreeFireNews();
          const articles = getAllArticles(newsData);
          const focused = interaction.options.getFocused().toString().toLowerCase().trim();

          const choices = articles
            .filter(
              (a) =>
                !focused ||
                a.title.toLowerCase().includes(focused) ||
                String(a.id).includes(focused),
            )
            .slice(0, 25)
            .map((a) => ({
              name: `${truncate(a.title, 85)} (${formatDate(a.time)})`,
              value: a.id,
            }));

          await interaction.respond(choices);
        } catch (error) {
          console.error('Free Fire autocomplete error:', error);
          await interaction.respond([]);
        }
      },
    };

    this.commands.set('freefire', freefireCommand);
    this.commands.set('freefire-article', freefireArticleCommand);
  }

  async cleanup() {
    console.log('🧹 Free Fire module cleanup');
    if (this.notificationTimer) {
      clearInterval(this.notificationTimer);
      this.notificationTimer = null;
    }
    newsCache = null;
    articleCache.clear();
  }
}
