import { EmbedBuilder, User, Guild, GuildMember } from 'discord.js';

export class EmbedTemplates {
  // Moderation action colors
  static readonly COLORS = {
    BAN: 0xef4444,      // Red
    KICK: 0xf97316,     // Orange
    MUTE: 0xf59e0b,     // Amber
    WARN: 0xfbbf24,     // Yellow
    SUCCESS: 0x10b981,  // Green
    INFO: 0x3b82f6,     // Blue
    MUSIC: 0x8b5cf6,    // Purple
    ERROR: 0xef4444,    // Red
    WARNING: 0xfbbf24,  // Yellow
    NEUTRAL: 0x6b7280   // Gray
  };

  // Create confirmation embed for dangerous actions
  static createConfirmation(options: {
    action: string;
    target: User | GuildMember;
    reason: string;
    moderator: User;
    extraInfo?: string;
    color?: number;
  }): EmbedBuilder {
    const { action, target, reason, moderator, extraInfo, color } = options;
    const targetUser = target instanceof GuildMember ? target.user : target;

    return new EmbedBuilder()
      .setColor(color || this.COLORS.WARNING)
      .setAuthor({
        name: `⚠️ Xác Nhận ${action}`,
        iconURL: moderator.displayAvatarURL()
      })
      .setDescription(
        `**Bạn có chắc chắn muốn ${action.toLowerCase()} user này?**\n\n` +
        `**Target:** ${targetUser} (\`${targetUser.tag}\`)\n` +
        `**ID:** \`${targetUser.id}\`\n` +
        `**Reason:** ${reason}\n` +
        (extraInfo ? `${extraInfo}\n` : '')
      )
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setFooter({
        text: 'Hành động này có thể không thể hoàn tác!',
        iconURL: moderator.displayAvatarURL({ size: 64 })
      })
      .setTimestamp();
  }

  // Create success embed for moderation actions
  static createModerationSuccess(options: {
    action: string;
    target: User | GuildMember;
    moderator: User;
    reason: string;
    guild: Guild;
    caseId?: string;
    extraFields?: Array<{ name: string; value: string; inline?: boolean }>;
    color?: number;
  }): EmbedBuilder {
    const { action, target, moderator, reason, guild, caseId, extraFields, color } = options;
    const targetUser = target instanceof GuildMember ? target.user : target;

    const embed = new EmbedBuilder()
      .setColor(color || this.COLORS.SUCCESS)
      .setAuthor({
        name: `<a:white_check_mark:1555921911395909722> ${action} Successfully`,
        iconURL: targetUser.displayAvatarURL()
      })
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: '👤 Target User',
          value: `${targetUser.tag}\n\`${targetUser.id}\``,
          inline: true
        },
        {
          name: '👮 Moderator',
          value: `${moderator.tag}\n\`${moderator.id}\``,
          inline: true
        },
        {
          name: '⏰ Time',
          value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
          inline: true
        },
        {
          name: '📝 Reason',
          value: reason,
          inline: false
        }
      )
      .setFooter({
        text: `${guild.name} • Moderation System`,
        iconURL: guild.iconURL() || undefined
      })
      .setTimestamp();

    if (caseId) {
      embed.addFields({
        name: '🔍 Case ID',
        value: `\`${caseId}\``,
        inline: true
      });
    }

    if (extraFields) {
      embed.addFields(...extraFields);
    }

    return embed;
  }

  // Create error embed
  static createError(message: string, moderator?: User): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(this.COLORS.ERROR)
      .setDescription(`❌ **${message}**`)
      .setTimestamp();

    if (moderator) {
      embed.setFooter({
        text: moderator.tag,
        iconURL: moderator.displayAvatarURL({ size: 64 })
      });
    }

    return embed;
  }

  // Create info embed
  static createInfo(options: {
    title: string;
    description: string;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    color?: number;
    thumbnail?: string;
    footer?: string;
  }): EmbedBuilder {
    const { title, description, fields, color, thumbnail, footer } = options;

    const embed = new EmbedBuilder()
      .setColor(color || this.COLORS.INFO)
      .setAuthor({ name: title })
      .setDescription(description)
      .setTimestamp();

    if (fields) {
      embed.addFields(...fields);
    }

    if (thumbnail) {
      embed.setThumbnail(thumbnail);
    }

    if (footer) {
      embed.setFooter({ text: footer });
    }

    return embed;
  }

  // Create music embed
  static createMusic(options: {
    title: string;
    description?: string;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    thumbnail?: string;
    requester?: User;
  }): EmbedBuilder {
    const { title, description, fields, thumbnail, requester } = options;

    const embed = new EmbedBuilder()
      .setColor(this.COLORS.MUSIC)
      .setAuthor({ name: title })
      .setTimestamp();

    if (description) {
      embed.setDescription(description);
    }

    if (fields) {
      embed.addFields(...fields);
    }

    if (thumbnail) {
      embed.setThumbnail(thumbnail);
    }

    if (requester) {
      embed.setFooter({
        text: `Requested by ${requester.username}`,
        iconURL: requester.displayAvatarURL({ size: 64 })
      });
    }

    return embed;
  }

  // Create timeout/cancel embed
  static createTimeout(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(this.COLORS.NEUTRAL)
      .setDescription(`⏱️ **${message}**`)
      .setTimestamp();
  }

  // Create cancel embed
  static createCancel(action: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(this.COLORS.NEUTRAL)
      .setDescription(`❌ **Đã hủy ${action}.**`)
      .setTimestamp();
  }
}
