import { ChatInputCommandInteraction, PermissionFlagsBits, PermissionsBitField, GuildMember } from 'discord.js';

/**
 * Check if current channel is a ticket channel
 */
export function isTicketChannel(interaction: ChatInputCommandInteraction): boolean {
  const channel = interaction.channel;
  if (!channel || !('name' in channel) || !channel.name) return false;
  return channel.name.startsWith('ticket-');
}

/**
 * Check if user has moderator permissions
 */
export function isModerator(interaction: ChatInputCommandInteraction): boolean {
  const member = interaction.member;
  if (!member || !(member instanceof GuildMember)) return false;
  
  const permissions = member.permissions;
  if (typeof permissions === 'string' || !permissions) return false;
  
  return permissions.has(PermissionFlagsBits.ModerateMembers) ||
         permissions.has(PermissionFlagsBits.ManageChannels) ||
         permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Check if command should be blocked in ticket channel
 * Returns true if command should be blocked
 */
export function shouldBlockCommandInTicket(
  interaction: ChatInputCommandInteraction,
  commandName: string
): boolean {
  // If not in ticket channel, allow all commands
  if (!isTicketChannel(interaction)) {
    return false;
  }

  // Allowed commands in ticket channels (for everyone)
  const allowedCommands = ['ticket', 'close'];

  // If command is allowed, don't block
  if (allowedCommands.includes(commandName)) {
    return false;
  }

  // If user is moderator/admin, allow all commands
  if (isModerator(interaction)) {
    return false;
  }

  // Block all other commands for regular members in ticket channels
  return true;
}

/**
 * Send blocked message to user
 */
export async function sendBlockedMessage(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.reply({
    embeds: [{
      color: 0xef4444,
      author: {
        name: '❌ Command Blocked',
        icon_url: interaction.user.displayAvatarURL()
      },
      description: 
        `**Bạn không thể dùng lệnh này trong ticket channel!**\n\n` +
        `> ℹ️ Trong ticket, bạn chỉ có thể dùng:\n` +
        `> • \`/ticket close\` - Đóng ticket\n` +
        `> • \`/ticket add @user\` - Thêm người (nếu là owner)\n` +
        `> • \`/ticket remove @user\` - Xóa người (nếu là owner)\n\n` +
        `> 👮 Staff/Moderators có thể dùng tất cả lệnh.`,
      footer: {
        text: 'Vui lòng tập trung vào vấn đề trong ticket'
      },
      timestamp: new Date().toISOString()
    }],
    ephemeral: true
  });
}
