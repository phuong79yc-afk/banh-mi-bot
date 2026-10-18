/**
 * Smart Reply Helper - Stable EmbedBuilder replies
 * No Components V2 - discord.js 14.27.0 doesn't support it yet
 */

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder
} from 'discord.js';

interface SmartReplyOptions {
  title: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: string;
  thumbnail?: string;
  image?: string;
  ephemeral?: boolean;
  components?: ActionRowBuilder<ButtonBuilder>[];
}

/**
 * Reply with EmbedBuilder
 */
export async function smartReply(
  interaction: ChatInputCommandInteraction,
  options: SmartReplyOptions
): Promise<void> {
  const { title, description, color = 0x5865f2, fields, footer, thumbnail, image, ephemeral, components } = options;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title);

  if (description) embed.setDescription(description);
  if (fields) embed.addFields(fields);
  if (footer) embed.setFooter({ text: footer });
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);

  await interaction.reply({
    embeds: [embed],
    components,
    ephemeral: ephemeral || false
  });
}

/**
 * Edit reply with EmbedBuilder
 */
export async function smartEditReply(
  interaction: ChatInputCommandInteraction,
  options: SmartReplyOptions
): Promise<void> {
  const { title, description, color = 0x5865f2, fields, footer, thumbnail, image, components } = options;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title);

  if (description) embed.setDescription(description);
  if (fields) embed.addFields(fields);
  if (footer) embed.setFooter({ text: footer });
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);

  await interaction.editReply({
    embeds: [embed],
    components
  });
}

/**
 * Simple error reply
 */
export async function errorReply(
  interaction: ChatInputCommandInteraction,
  message: string
): Promise<void> {
  await smartReply(interaction, {
    title: '❌ Lỗi',
    description: message,
    color: 0xed4245,
    ephemeral: true
  });
}

/**
 * Simple success reply
 */
export async function successReply(
  interaction: ChatInputCommandInteraction,
  message: string
): Promise<void> {
  await smartReply(interaction, {
    title: '✅ Thành công',
    description: message,
    color: 0x57f287,
    ephemeral: false
  });
}
