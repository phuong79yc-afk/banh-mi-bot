import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { hasModeratorAccess } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('timeout')
  .setDescription('Timeout member (Admin only)')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('User cần timeout')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('duration')
      .setDescription('Thời gian timeout (phút)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(40320) // 28 ngày
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Lý do timeout')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(null)
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
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
  const duration = interaction.options.getInteger('duration', true);
  const reason = interaction.options.getString('reason') || 'Không có lý do';

  const member = interaction.guild?.members.cache.get(user.id);

  if (!member) {
    await interaction.reply({
      content: 'Không tìm thấy member!',
      ephemeral: true
    });
    return;
  }

  if (member.id === interaction.user.id) {
    await interaction.reply({
      content: 'Bạn không thể timeout chính mình!',
      ephemeral: true
    });
    return;
  }

  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'Không thể timeout admin!',
      ephemeral: true
    });
    return;
  }

  try {
    await member.timeout(duration * 60 * 1000, reason);

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('⏱️ Member đã bị Timeout')
      .setDescription(
        `**User:** ${user}\n` +
        `**Thời gian:** \`${duration}\` phút\n` +
        `**Lý do:** ${reason}\n` +
        `**Bởi:** ${interaction.user}`
      )
      .setThumbnail(user.displayAvatarURL())
      .setFooter({
        text: `Timeout bởi ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await interaction.reply({
      content: 'Không thể timeout member!',
      ephemeral: true
    });
  }
}
