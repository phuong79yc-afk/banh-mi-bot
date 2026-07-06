import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits,
  TextChannel,
  EmbedBuilder
} from 'discord.js';
import { hasModeratorAccess } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('🔒 Khóa kênh')
  .addChannelOption(option =>
    option
      .setName('channel')
      .setDescription('Kênh cần khóa (mặc định: kênh hiện tại)')
      .addChannelTypes(0) // Text channel
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Lý do khóa kênh')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option
      .setName('duration')
      .setDescription('Tự động mở khóa sau X phút (0 = vĩnh viễn)')
      .setMinValue(0)
      .setMaxValue(1440)
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
  const duration = interaction.options.getInteger('duration') || 0;

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
      content: '❌ Chỉ có thể khóa text channel!',
      ephemeral: true
    });
    return;
  }

  // Check if channel is already locked
  const everyoneRole = interaction.guild?.roles.everyone;
  if (!everyoneRole) {
    await interaction.reply({
      content: '❌ Không thể tìm thấy role @everyone!',
      ephemeral: true
    });
    return;
  }

  const permissions = targetChannel.permissionOverwrites.cache.get(everyoneRole.id);
  if (permissions && permissions.deny.has(PermissionFlagsBits.SendMessages)) {
    await interaction.reply({
      content: `⚠️ Kênh ${targetChannel} đã bị khóa rồi!`,
      ephemeral: true
    });
    return;
  }

  try {
    // Lock the channel
    await targetChannel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: false
    });

    const lockEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🔒 ⸻ KÊNH ĐÃ BỊ KHÓA ⸻ 🔒')
      .setDescription(
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  **Kênh này đã bị khóa**\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `> 🔒 **Kênh:** ${targetChannel}\n` +
        `> 👤 **Khóa bởi:** ${interaction.user}\n` +
        `> 📝 **Lý do:** ${reason}\n` +
        `> ⏰ **Thời gian:** <t:${Math.floor(Date.now() / 1000)}:R>\n` +
        (duration > 0 
          ? `> ⏳ **Tự động mở khóa:** <t:${Math.floor(Date.now() / 1000) + (duration * 60)}:R>\n\n`
          : '\n') +
        `⚠️ **Chỉ staff mới có thể gửi tin nhắn**`
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({
        text: `Khóa bởi ${interaction.user.tag}`,
        iconURL: interaction.guild?.iconURL() || undefined
      })
      .setTimestamp();

    await interaction.reply({ embeds: [lockEmbed] });

    // Auto unlock after duration
    if (duration > 0) {
      setTimeout(async () => {
        try {
          await targetChannel.permissionOverwrites.edit(everyoneRole, {
            SendMessages: null
          });

          const autoUnlockEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('🔓 ⸻ TỰ ĐỘNG MỞ KHÓA ⸻ 🔓')
            .setDescription(
              `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
              `┃  **Kênh đã được mở khóa tự động**\n` +
              `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
              `> 🔓 **Kênh:** ${targetChannel}\n` +
              `> ⏱️ **Đã khóa:** ${duration} phút\n` +
              `> 👤 **Khóa bởi:** ${interaction.user}\n\n` +
              `✅ **Mọi người có thể gửi tin nhắn lại!**`
            )
            .setFooter({
              text: `Hệ thống tự động`,
              iconURL: interaction.guild?.iconURL() || undefined
            })
            .setTimestamp();

          await targetChannel.send({ embeds: [autoUnlockEmbed] });
        } catch (error) {
          console.error('Lỗi khi tự động mở khóa:', error);
        }
      }, duration * 60 * 1000);
    }

  } catch (error) {
    console.error('Lỗi khi khóa kênh:', error);
    await interaction.reply({
      content: '❌ Không thể khóa kênh! Kiểm tra quyền của bot.',
      ephemeral: true
    });
  }
}
