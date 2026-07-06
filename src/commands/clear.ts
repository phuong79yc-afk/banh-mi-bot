import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, TextChannel } from 'discord.js';
import { hasModeratorAccess } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Xóa tin nhắn trong channel (giống /purge)')
  .addIntegerOption(option =>
    option
      .setName('amount')
      .setDescription('Số lượng tin nhắn cần xóa (1-100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Chỉ xóa tin nhắn của user này (tùy chọn)')
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

  await interaction.deferReply({ ephemeral: true });

  const amount = interaction.options.getInteger('amount', true);
  const targetUser = interaction.options.getUser('user');
  const channel = interaction.channel as TextChannel;

  try {
    const messages = await channel.messages.fetch({ limit: amount + 1 });
    
    let messagesToDelete = Array.from(messages.values());
    
    if (targetUser) {
      messagesToDelete = messagesToDelete.filter(msg => msg.author.id === targetUser.id);
    }

    // Xóa tin nhắn (Discord chỉ cho xóa tin nhắn dưới 14 ngày)
    const deleted = await channel.bulkDelete(messagesToDelete, true);

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🗑️ Đã xóa tin nhắn')
      .setDescription(
        `**Đã xóa:** \`${deleted.size}\` tin nhắn\n` +
        `**Kênh:** ${channel}\n` +
        `${targetUser ? `**User:** ${targetUser}` : '**User:** Tất cả'}\n` +
        `**Bởi:** ${interaction.user}`
      )
      .setFooter({
        text: `Xóa bởi ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    await interaction.editReply({
      content: '❌ Không thể xóa tin nhắn! (Tin nhắn có thể quá cũ - trên 14 ngày)'
    });
  }
}
