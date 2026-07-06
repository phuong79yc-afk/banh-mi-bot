import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { hasModeratorAccess } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Warn a member')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('The member to warn')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Reason for warning')
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
  const reason = interaction.options.get('reason')?.value as string || 'No reason provided';
  const member = interaction.guild?.members.cache.get(user.id);

  if (!member) {
    await interaction.reply({ content: 'Member not found!', ephemeral: true });
    return;
  }

  if (member.id === interaction.user.id) {
    await interaction.reply({ content: 'You cannot warn yourself!', ephemeral: true });
    return;
  }

  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: 'You cannot warn an administrator!', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xFFA500)
    .setTitle('Member Warned')
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: 'User', value: `${user.tag}`, inline: true },
      { name: 'User ID', value: user.id, inline: true },
      { name: 'Warned By', value: interaction.user.tag, inline: true },
      { name: 'Reason', value: reason, inline: false },
      { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: `Warned by ${interaction.user.tag}` });

  try {
    await member.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFFA500)
          .setTitle('You Have Been Warned')
          .setDescription(`You have been warned in **${interaction.guild?.name}**`)
          .addFields(
            { name: 'Reason', value: reason },
            { name: 'Warned By', value: interaction.user.tag }
          )
          .setTimestamp()
      ]
    });
  } catch (error) {
    // User has DMs disabled
  }

  await interaction.reply({ embeds: [embed] });
}
