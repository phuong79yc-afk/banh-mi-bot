import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import { getCustomEmoji } from '../utils/customEmoji';

export const data = new SlashCommandBuilder()
  .setName('lock-invites')
  .setDescription('Khóa/mở khóa tất cả invite links / Lock/unlock all invite links')
  .addSubcommand(subcommand =>
    subcommand
      .setName('lock')
      .setDescription('Vô hiệu hóa tất cả invite links / Disable all invite links')
      .addBooleanOption(option =>
        option
          .setName('delete_existing')
          .setDescription('Xóa tất cả invite hiện có / Delete all existing invites')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('unlock')
      .setDescription('Cho phép tạo invite links lại / Allow creating invite links again')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('status')
      .setDescription('Kiểm tra trạng thái invite lock / Check invite lock status')
  );

// Store lock state per guild
const inviteLockState = new Map<string, boolean>();

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    return interaction.editReply({ content: '❌ Lệnh này chỉ dùng trong máy chủ!' });
  }

  // Check if user is owner or has administrator
  const member = interaction.member;
  if (!member) {
    return interaction.editReply({ content: '❌ Không thể xác định quyền của bạn!' });
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'lock') {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

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
        .setTitle(`${getCustomEmoji('SECURITY_LOCK')} Invites  Kha`)
        .setDescription('🔒 Tất cả invite links đã bị vô hiệu hóa')
        .addFields(
          { name: '📊 Kênh đã khóa', value: `${lockedCount} kênh`, inline: true },
          { name: '🗑️ Invite đã xóa', value: `${deletedInvites} invite`, inline: true },
          { name: '⚠️ Lưu ý', value: 'Chỉ administrators mới có thể tạo invite', inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `Bi: ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      console.error('Lock invites error:', error);
      await interaction.editReply({ content: ` Li khi kha invites: ${error.message}` });
    }
  } else if (subcommand === 'unlock') {
    if (!interaction.deferred && !interaction.replied) {
    }

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
        .setTitle(`${getCustomEmoji('SECURITY_UNLOCK')} Invites  M Kha`)
        .setDescription('🔓 Thành viên có thể tạo invite links trở lại')
        .addFields(
          { name: '📊 Kênh đã mở khóa', value: `${unlockedCount} kênh`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Bi: ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      console.error('Unlock invites error:', error);
      await interaction.editReply({ content: ` Li khi m kha invites: ${error.message}` });
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
        .setTitle(`${getCustomEmoji('SECURITY_INFO')} Trng Thi Invite Lock`)
        .setDescription(
          isLocked 
            ? '🔒 **LOCKED** - Invites bị vô hiệu hóa'
            : '🔓 **UNLOCKED** - Invites hoạt động bình thường'
        )
        .addFields(
          { name: '📊 Kênh bị khóa', value: `${lockedChannels} kênh`, inline: true },
          { name: '🔗 Invite hoạt động', value: `${activeInvites} invite`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      console.error('Status check error:', error);
      await interaction.editReply({ 
        content: ` Li khi kim tra trng thi: ${error.message}` });
    }
  }
}

// Export for other modules
export function isInviteLocked(guildId: string): boolean {
  return inviteLockState.get(guildId) || false;
}
