import { EmbedBuilder } from 'discord.js';
import { emojis } from '../config/emojis';

/**
 * Enhanced Embed Helper - Create beautiful, consistent embeds
 * Inspired by GlitchBucket style
 */

export interface EnhancedEmbedOptions {
  title?: string;
  description?: string;
  color?: number | 'random' | 'success' | 'error' | 'warning' | 'info';
  thumbnail?: string;
  image?: string;
  footer?: string | { text: string; iconURL?: string };
  timestamp?: boolean;
  author?: { name: string; iconURL?: string; url?: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

// Predefined color schemes
const COLORS = {
  success: 0x10b981,  // Green
  error: 0xef4444,    // Red
  warning: 0xfbbf24,  // Yellow/Orange
  info: 0x3b82f6,     // Blue
  primary: 0x667eea,  // Purple
};

/**
 * Generate random vibrant color
 */
export function getRandomColor(): number {
  return Math.floor(Math.random() * 0xFFFFFF);
}

/**
 * Create enhanced embed with modern styling
 */
export function createEnhancedEmbed(options: EnhancedEmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder();

  // Color handling
  let color: number;
  if (options.color === 'random') {
    color = getRandomColor();
  } else if (typeof options.color === 'string') {
    color = COLORS[options.color as keyof typeof COLORS] || COLORS.primary;
  } else {
    color = options.color || getRandomColor();
  }
  embed.setColor(color);

  // Basic content
  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.author) embed.setAuthor(options.author);

  // Fields
  if (options.fields && options.fields.length > 0) {
    embed.addFields(options.fields);
  }

  // Footer with bot branding
  if (options.footer) {
    if (typeof options.footer === 'string') {
      embed.setFooter({ text: `Supporter • ${options.footer}` });
    } else {
      embed.setFooter({
        text: `Supporter • ${options.footer.text}`,
        iconURL: options.footer.iconURL
      });
    }
  } else {
    embed.setFooter({ text: 'Supporter' });
  }

  // Timestamp
  if (options.timestamp !== false) {
    embed.setTimestamp();
  }

  return embed;
}

/**
 * Quick embed creators for common use cases
 */
export const EmbedTemplates = {
  success: (title: string, description: string) =>
    createEnhancedEmbed({
      title: `${emojis.success} ${title}`,
      description,
      color: 'success',
    }),

  error: (title: string, description: string) =>
    createEnhancedEmbed({
      title: `❌ ${title}`,
      description,
      color: 'error',
    }),

  warning: (title: string, description: string) =>
    createEnhancedEmbed({
      title: `⚠️ ${title}`,
      description,
      color: 'warning',
    }),

  info: (title: string, description: string) =>
    createEnhancedEmbed({
      title: `ℹ️ ${title}`,
      description,
      color: 'info',
    }),
};
