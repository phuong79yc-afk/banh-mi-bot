/**
 * Smart Reply Helper - Auto fallback từ Components V2 sang EmbedBuilder
 * Giải quyết vấn đề V2 không ổn định trên Railway
 */

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from 'discord.js';

const V2 = MessageFlags.IsComponentsV2;

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
 * Reply với auto-fallback: V2 → Embed
 */
export async function smartReply(
  interaction: ChatInputCommandInteraction,
  options: SmartReplyOptions
): Promise<void> {
  const { title, description, color = 0x5865f2, fields, footer, thumbnail, image, ephemeral, components } = options;

  try {
    // TRY V2 FIRST
    const container = new ContainerBuilder().setPrimaryColor(color);

    let content = `## ${title}`;
    if (description) content += `\n${description}`;

    if (fields && fields.length > 0) {
      content += '\n\n';
      for (const field of fields) {
        content += `**${field.name}**\n${field.value}\n\n`;
      }
    }

    if (footer) content += `\n-# ${footer}`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

    await interaction.reply({
      components: [container],
      flags: ephemeral ? (V2 | 64) : V2,
      allowedMentions: { parse: [] }
    } as any);

  } catch (error) {
    // FALLBACK TO EMBED
    console.warn('[SmartReply] V2 failed, falling back to Embed:', error);

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
}

/**
 * Edit reply với auto-fallback
 */
export async function smartEditReply(
  interaction: ChatInputCommandInteraction,
  options: SmartReplyOptions
): Promise<void> {
  const { title, description, color = 0x5865f2, fields, footer, thumbnail, image, components } = options;

  try {
    // TRY V2 FIRST
    const container = new ContainerBuilder().setPrimaryColor(color);

    let content = `## ${title}`;
    if (description) content += `\n${description}`;

    if (fields && fields.length > 0) {
      content += '\n\n';
      for (const field of fields) {
        content += `**${field.name}**\n${field.value}\n\n`;
      }
    }

    if (footer) content += `\n-# ${footer}`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

    await interaction.editReply({
      components: [container],
      allowedMentions: { parse: [] }
    } as any);

  } catch (error) {
    // FALLBACK TO EMBED
    console.warn('[SmartReply] V2 failed, falling back to Embed:', error);

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
