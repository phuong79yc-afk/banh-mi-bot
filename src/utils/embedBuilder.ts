import { EmbedBuilder } from 'discord.js';
import { emojis } from '../config/emojis';

export const Colors = {
  Primary: 0x667eea,
  Success: 0x10b981,
  Warning: 0xf59e0b,
  Error: 0xef4444,
  Info: 0x3b82f6,
  Music: 0x8b5cf6
};

export function createSuccessEmbed(title: string, description: string, footer?: string) {
  const embed = new EmbedBuilder()
    .setColor(Colors.Success)
    .setTitle(`${emojis.success} ${title}`)
    .setDescription(description)
    .setTimestamp();
  
  if (footer) {
    embed.setFooter({ text: footer });
  }
  
  return embed;
}

export function createErrorEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(Colors.Error)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function createInfoEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(Colors.Info)
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function createMusicEmbed(title: string, description: string, thumbnail?: string) {
  const embed = new EmbedBuilder()
    .setColor(Colors.Music)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
  
  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }
  
  return embed;
}

export function createModEmbed(action: string, target: string, moderator: string, reason: string, color: number, extra?: { name: string, value: string }[]) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(action)
    .addFields(
      { name: '👤 Target', value: target, inline: true },
      { name: '👮 Moderator', value: moderator, inline: true },
      { name: '📝 Reason', value: reason || 'No reason provided', inline: false }
    )
    .setTimestamp();
  
  if (extra) {
    extra.forEach(field => {
      embed.addFields({ name: field.name, value: field.value, inline: true });
    });
  }
  
  return embed;
}
