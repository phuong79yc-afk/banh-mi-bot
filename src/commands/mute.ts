import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { hasModeratorAccess } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Timeout a member')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('The member to mute')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('duration')
      .setDescription('Duration in minutes (1-1440)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(1440)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Reason for muting')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(null)
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check if user has moderator access
  const executor = interaction.guild?.members.cache.get(interaction.user.id);
  if (!executor || !hasModeratorAccess(executor)) {
    await interaction.reply({ 
      content: '❌ Bạn không có quyền sử dụng lệnh này!', 
      ephemeral: true 
    });
    return;
  }

  const user = interaction.options.getUser('user', true);
  const duration = interaction.options.get('duration')?.value as number;
  const reason = interaction.options.get('reason')?.value as string || 'No reason provided';
  const member = interaction.guild?.members.cache.get(user.id);

  if (!member) {
    await interaction.reply({ content: 'Member not found!', ephemeral: true });
    return;
  }

  if (member.id === interaction.user.id) {
    await interaction.reply({ content: 'You cannot mute yourself!', ephemeral: true });
    return;
  }

  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: 'You cannot mute an administrator!', ephemeral: true });
    return;
  }

  try {
    await member.timeout(duration * 60 * 1000, reason);

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('Member Muted')
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${user.tag}`, inline: true },
        { name: 'Duration', value: `${duration} minutes`, inline: true },
        { name: 'Muted By', value: interaction.user.tag, inline: true },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Expires', value: `<t:${Math.floor((Date.now() + duration * 60 * 1000) / 1000)}:R>`, inline: false }
      )
      .setTimestamp()
      .setFooter({ text: `Muted by ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await interaction.reply({ content: 'Failed to mute member!', ephemeral: true });
  }
}
