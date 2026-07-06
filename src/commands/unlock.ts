import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits,
  TextChannel,
  EmbedBuilder
} from 'discord.js';
import { hasModeratorAccess } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('unlock')
  .setDescription('🔓 Mở khóa kênh')
  .addChannelOption(option =>
    option
      .setName('channel')
      .setDescription('Kênh cần mở khóa (mặc định: kênh hiện tại)')
      .addChannelTypes(0) // Text channel
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Lý do mở khóa kênh')
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

  const targetChannel = (interaction.options.getChannel('channel') as TextChannel) || (interaction.channel as TextChannel);
  const reason = interaction.options.getString('reason') || 'Không có lý do';

  if (!targetChannel) {
    await interaction.reply({
      content: '❌ Không thể xác định kênh!',
      ephemeral: true
    });
    return;
  }

  // Check if it's a text channel
  if (targetChannel.type !== 0) {
    await interaction.reply({
      content: '❌ Chỉ có thể mở khóa text channel!',
      ephemeral: true
    });
    return;
  }

  // Check if channel is locked
  const everyoneRole = interaction.guild?.roles.everyone;
  if (!everyoneRole) {
    await interaction.reply({
      content: '❌ Không thể tìm thấy role @everyone!',
      ephemeral: true
    });
    return;
  }

  const permissions = targetChannel.permissionOverwrites.cache.get(everyoneRole.id);
  if (!permissions || !permissions.deny.has(PermissionFlagsBits.SendMessages)) {
    await interaction.reply({
      content: `⚠️ Kênh ${targetChannel} chưa bị khóa!`,
      ephemeral: true
    });
    return;
  }

  try {
    // Unlock the channel
    await targetChannel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: null
    });

    const unlockEmbed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🔓 ⸻ KÊNH ĐÃ MỞ KHÓA ⸻ 🔓')
      .setDescription(
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  **Kênh đã được mở khóa**\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `> 🔓 **Kênh:** ${targetChannel}\n` +
        `> 👤 **Mở bởi:** ${interaction.user}\n` +
        `> 📝 **Lý do:** ${reason}\n` +
        `> ⏰ **Thời gian:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
        `✅ **Mọi người có thể gửi tin nhắn lại!**`
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({
        text: `Mở khóa bởi ${interaction.user.tag}`,
        iconURL: interaction.guild?.iconURL() || undefined
      })
      .setTimestamp();

    await interaction.reply({ embeds: [unlockEmbed] });

  } catch (error) {
    console.error('Lỗi khi mở khóa kênh:', error);
    await interaction.reply({
      content: '❌ Không thể mở khóa kênh! Kiểm tra quyền của bot.',
      ephemeral: true
    });
  }
}
