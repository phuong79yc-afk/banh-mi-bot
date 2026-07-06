import { EmbedBuilder, ColorResolvable } from 'discord.js';

/**
 * Màu sắc theme cho bot
 */
export const BotColors = {
  primary: 0x5865f2,      // Discord Blurple
  success: 0x00ff00,      // Xanh lá
  error: 0xff0000,        // Đỏ
  warning: 0xffa500,      // Cam
  info: 0x00d9ff,         // Xanh dương nhạt
  secondary: 0x9b59b6,    // Tím
  gold: 0xffd700,         // Vàng
  pink: 0xff69b4,         // Hồng
} as const;

/**
 * Icons emoji cho bot
 */
export const BotIcons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  loading: '⏳',
  coin: '💰',
  user: '👤',
  server: '🖥️',
  stats: '📊',
  settings: '⚙️',
  shield: '🛡️',
  crown: '👑',
  star: '⭐',
  fire: '🔥',
  rocket: '🚀',
  check: '✔️',
  cross: '✖️',
  arrow: '➜',
  diamond: '💎',
  heart: '❤️',
  tada: '🎉',
  lock: '🔒',
  unlock: '🔓',
  pin: '📌',
  bell: '🔔',
  ticket: '🎫',
  game: '🎮',
  dice: '🎲',
  trophy: '🏆',
} as const;

/**
 * Tạo embed cơ bản với style thống nhất
 */
export class CustomEmbedBuilder extends EmbedBuilder {
  constructor() {
    super();
    this.setColor(BotColors.primary);
    this.setTimestamp();
  }

  /**
   * Set màu theo type
   */
  setType(type: 'success' | 'error' | 'warning' | 'info'): this {
    const colors = {
      success: BotColors.success,
      error: BotColors.error,
      warning: BotColors.warning,
      info: BotColors.info,
    };
    return this.setColor(colors[type]);
  }

  /**
   * Success embed với icon
   */
  setSuccess(title: string, description?: string): this {
    this.setColor(BotColors.success);
    this.setTitle(`${BotIcons.success} ${title}`);
    if (description) this.setDescription(description);
    return this;
  }

  /**
   * Error embed với icon
   */
  setError(title: string, description?: string): this {
    this.setColor(BotColors.error);
    this.setTitle(`${BotIcons.error} ${title}`);
    if (description) this.setDescription(description);
    return this;
  }

  /**
   * Warning embed với icon
   */
  setWarning(title: string, description?: string): this {
    this.setColor(BotColors.warning);
    this.setTitle(`${BotIcons.warning} ${title}`);
    if (description) this.setDescription(description);
    return this;
  }

  /**
   * Info embed với icon
   */
  setInfo(title: string, description?: string): this {
    this.setColor(BotColors.info);
    this.setTitle(`${BotIcons.info} ${title}`);
    if (description) this.setDescription(description);
    return this;
  }

  /**
   * Loading embed
   */
  setLoading(title: string, description?: string): this {
    this.setColor(BotColors.info);
    this.setTitle(`${BotIcons.loading} ${title}`);
    if (description) this.setDescription(description);
    return this;
  }

  /**
   * Set footer với bot branding
   */
  setBotFooter(text?: string, iconURL?: string): this {
    const footerText = text || 'Bánh Mì Bot';
    return this.setFooter({ text: footerText, iconURL });
  }

  /**
   * Thêm divider (đường kẻ) vào description
   */
  addDivider(): this {
    const current = this.data.description || '';
    return this.setDescription(current + '\n━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Format field value với icon
   */
  addIconField(icon: string, name: string, value: string, inline = false): this {
    return this.addFields({ name: `${icon} ${name}`, value, inline });
  }

  /**
   * Thêm nhiều fields với format đẹp
   */
  addStatsFields(stats: { icon: string; name: string; value: string }[]): this {
    stats.forEach(stat => {
      this.addIconField(stat.icon, stat.name, stat.value, true);
    });
    return this;
  }

  /**
   * Set thumbnail với fallback
   */
  setThumbnailSafe(url: string | null | undefined): this {
    if (url) {
      this.setThumbnail(url);
    }
    return this;
  }

  /**
   * Set author với user info
   */
  setUserAuthor(username: string, avatarURL?: string | null): this {
    return this.setAuthor({ 
      name: username, 
      iconURL: avatarURL || undefined 
    });
  }

  /**
   * Tạo embed game (cho các mini-game)
   */
  setGame(title: string, description: string): this {
    this.setColor(BotColors.gold);
    this.setTitle(`${BotIcons.game} ${title}`);
    this.setDescription(description);
    return this;
  }

  /**
   * Tạo embed economy (tiền, shop, etc)
   */
  setEconomy(title: string, description?: string): this {
    this.setColor(BotColors.gold);
    this.setTitle(`${BotIcons.coin} ${title}`);
    if (description) this.setDescription(description);
    return this;
  }

  /**
   * Tạo embed moderation
   */
  setModeration(title: string, description?: string): this {
    this.setColor(BotColors.error);
    this.setTitle(`${BotIcons.shield} ${title}`);
    if (description) this.setDescription(description);
    return this;
  }
}

/**
 * Quick builder functions
 */
export const createEmbed = {
  success: (title: string, description?: string) => 
    new CustomEmbedBuilder().setSuccess(title, description),
  
  error: (title: string, description?: string) => 
    new CustomEmbedBuilder().setError(title, description),
  
  warning: (title: string, description?: string) => 
    new CustomEmbedBuilder().setWarning(title, description),
  
  info: (title: string, description?: string) => 
    new CustomEmbedBuilder().setInfo(title, description),
  
  loading: (title: string, description?: string) => 
    new CustomEmbedBuilder().setLoading(title, description),
  
  game: (title: string, description: string) => 
    new CustomEmbedBuilder().setGame(title, description),
  
  economy: (title: string, description?: string) => 
    new CustomEmbedBuilder().setEconomy(title, description),
  
  moderation: (title: string, description?: string) => 
    new CustomEmbedBuilder().setModeration(title, description),
  
  basic: () => new CustomEmbedBuilder(),
};

/**
 * Format số với dấu phân cách
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('vi-VN');
}

/**
 * Format thời gian còn lại
 */
export function formatTimeRemaining(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ngày`;
  if (hours > 0) return `${hours} giờ`;
  if (minutes > 0) return `${minutes} phút`;
  return `${seconds} giây`;
}

/**
 * Tạo progress bar
 */
export function createProgressBar(current: number, max: number, length = 10): string {
  const percentage = Math.min(current / max, 1);
  const filled = Math.round(length * percentage);
  const empty = length - filled;
  
  const filledBar = '█'.repeat(filled);
  const emptyBar = '░'.repeat(empty);
  
  return `[${filledBar}${emptyBar}] ${Math.round(percentage * 100)}%`;
}

/**
 * Tạo rank badge theo level
 */
export function getRankBadge(level: number): string {
  if (level >= 100) return '👑';
  if (level >= 75) return '💎';
  if (level >= 50) return '🏆';
  if (level >= 25) return '⭐';
  if (level >= 10) return '🔥';
  return '🌱';
}
