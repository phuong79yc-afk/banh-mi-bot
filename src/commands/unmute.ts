import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { hasModeratorAccess } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('unmute')
  .setDescription('Remove timeout from a member')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('The member to unmute')
      .setRequired(true)
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
  const member = interaction.guild?.members.cache.get(user.id);

  if (!member) {
    await interaction.reply({ content: 'Member not found!', ephemeral: true });
    return;
  }

  if (!member.isCommunicationDisabled()) {
    await interaction.reply({ content: 'This member is not muted!', ephemeral: true });
    return;
  }

  try {
    await member.timeout(null);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('Member Unmuted')
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${user.tag}`, inline: true },
        { name: 'Unmuted By', value: interaction.user.tag, inline: true },
        { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      )
      .setTimestamp()
      .setFooter({ text: `Unmuted by ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await interaction.reply({ content: 'Failed to unmute member!', ephemeral: true });
  }
}
