import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import { emojis } from '../config/emojis';

export const data = new SlashCommandBuilder()
  .setName('lock-invites')
  .setDescription('🔒 Khóa/mở khóa tất cả invite links')
  .addSubcommand(subcommand =>
    subcommand
      .setName('lock')
      .setDescription('🔐 Vô hiệu hóa tất cả invite links')
      .addBooleanOption(option =>
        option
          .setName('delete_existing')
          .setDescription('🗑️ Xóa tất cả invite hiện có')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('unlock')
      .setDescription('🔓 Cho phép tạo invite links lại')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('status')
      .setDescription('🔍 Kiểm tra trạng thái invite lock')
  );

// Store lock state per guild
const inviteLockState = new Map<string, boolean>();

export async function execute(interaction: ChatInputCommandInteraction) {
  // Defer immediately to prevent timeout
  try {
    await interaction.deferReply();
  } catch (error: any) {
    if (error.code === 10062) return;
    throw error;
  }

  if (!interaction.guild) {
    return interaction.editReply({ content: `${emojis.error} Lệnh này chỉ dùng trong máy chủ!` });
  }

  // Check if user is owner or has administrator
  const member = interaction.member;
  if (!member) {
    return interaction.editReply({ content: `${emojis.error} Không thể xác định quyền của bạn!` });
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'lock') {
    const deleteExisting = interaction.options.getBoolean('delete_existing') || false;

    try {
      const channels = await interaction.guild.channels.fetch();
      let lockedCount = 0;
      let deletedInvites = 0;

      // Remove CREATE_INSTANT_INVITE permission from @everyone
      for (const [, channel] of channels) {
        if (!channel) continue;

        // Skip categories and unsupported channel types
        if (channel.type === ChannelType.GuildCategory) continue;

        try {
          // Get everyone role
          const everyoneRole = interaction.guild.roles.everyone;

          // Update permissions to deny CREATE_INSTANT_INVITE
          await channel.permissionOverwrites.edit(everyoneRole, {
            CreateInstantInvite: false
          });

          lockedCount++;
        } catch (err) {
          console.error(`Failed to lock invites in ${channel.name}:`, err);
        }
      }

      // Delete existing invites if requested
      if (deleteExisting) {
        try {
          const invites = await interaction.guild.invites.fetch();
          for (const [, invite] of invites) {
            try {
              await invite.delete('Invite lock - cleaning existing invites');
              deletedInvites++;
            } catch (err) {
              console.error(`Failed to delete invite ${invite.code}:`, err);
            }
          }
        } catch (err) {
          console.error('Failed to fetch/delete invites:', err);
        }
      }

      // Mark guild as locked
      inviteLockState.set(interaction.guild.id, true);

      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle(`${emojis.unlock} Invites Đã Khóa`)
        .setDescription(`${emojis.shield} Tất cả invite links đã bị vô hiệu hóa`)
        .addFields(
          { name: `${emojis.chart} Kênh đã khóa`, value: `${lockedCount} kênh`, inline: true },
          { name: `${emojis.delete} Invite đã xóa`, value: `${deletedInvites} invite`, inline: true },
          { name: `${emojis.warning} Lưu ý`, value: 'Chỉ administrators mới có thể tạo invite', inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `Bởi: ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      console.error('Lock invites error:', error);
      await interaction.editReply({ content: `${emojis.error} Lỗi khi khóa invites: ${error.message}` });
    }
  } else if (subcommand === 'unlock') {
    try {
      const channels = await interaction.guild.channels.fetch();
      let unlockedCount = 0;

      // Restore CREATE_INSTANT_INVITE permission to @everyone
      for (const [, channel] of channels) {
        if (!channel) continue;

        // Skip categories
        if (channel.type === ChannelType.GuildCategory) continue;

        try {
          // Get everyone role
          const everyoneRole = interaction.guild.roles.everyone;

          // Remove the deny override (reset to default/neutral)
          await channel.permissionOverwrites.edit(everyoneRole, {
            CreateInstantInvite: null
          });

          unlockedCount++;
        } catch (err) {
          console.error(`Failed to unlock invites in ${channel.name}:`, err);
        }
      }

      // Mark guild as unlocked
      inviteLockState.set(interaction.guild.id, false);

      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle(`${emojis.unlock} Invites Đã Mở Khóa`)
        .setDescription(`${emojis.success} Thành viên có thể tạo invite links trở lại`)
        .addFields(
          { name: `${emojis.chart} Kênh đã mở khóa`, value: `${unlockedCount} kênh`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Bởi: ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      console.error('Unlock invites error:', error);
      await interaction.editReply({ content: `${emojis.error} Lỗi khi mở khóa invites: ${error.message}` });
    }
  } else if (subcommand === 'status') {
    const isLocked = inviteLockState.get(interaction.guild.id) || false;

    try {
      // Count active invites
      const invites = await interaction.guild.invites.fetch();
      const activeInvites = invites.size;

      // Count channels with CreateInstantInvite denied
      const channels = await interaction.guild.channels.fetch();
      let lockedChannels = 0;
      
      const everyoneRole = interaction.guild.roles.everyone;
      
      for (const [, channel] of channels) {
        if (!channel || channel.type === ChannelType.GuildCategory) continue;

        const permissions = channel.permissionOverwrites.cache.get(everyoneRole.id);
        if (permissions && permissions.deny.has(PermissionFlagsBits.CreateInstantInvite)) {
          lockedChannels++;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(isLocked ? 0xef4444 : 0x10b981)
        .setTitle(`${emojis.info} Trạng Thái Invite Lock`)
        .setDescription(
          isLocked 
            ? `${emojis.unlock} **LOCKED** - Invites bị vô hiệu hóa`
            : `${emojis.success} **UNLOCKED** - Invites hoạt động bình thường`
        )
        .addFields(
          { name: `${emojis.chart} Kênh bị khóa`, value: `${lockedChannels} kênh`, inline: true },
          { name: `${emojis.link} Invite hoạt động`, value: `${activeInvites} invite`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      console.error('Status check error:', error);
      await interaction.editReply({ 
        content: `${emojis.error} Lỗi khi kiểm tra trạng thái: ${error.message}` });
    }
  }
}

// Export for other modules
export function isInviteLocked(guildId: string): boolean {
  return inviteLockState.get(guildId) || false;
}
