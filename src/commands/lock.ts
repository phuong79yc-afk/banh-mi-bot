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
  .setDescription('🔒 Khóa/Mở khóa kênh')
  .addSubcommand(subcommand =>
    subcommand
      .setName('channel')
      .setDescription('🔒 Khóa kênh')
      .addChannelOption(option =>
        option
          .setName('target')
          .setDescription('Kênh cần khóa (mặc định: kênh hiện tại)')
          .addChannelTypes(0)
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
          .setDescription('Tự động mở sau X phút (0 = vĩnh viễn)')
          .setMinValue(0)
          .setMaxValue(1440)
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('unlock')
      .setDescription('🔓 Mở khóa kênh')
      .addChannelOption(option =>
        option
          .setName('target')
          .setDescription('Kênh cần mở khóa (mặc định: kênh hiện tại)')
          .addChannelTypes(0)
          .setRequired(false)
      )
      .addStringOption(option =>
        option
          .setName('reason')
          .setDescription('Lý do mở khóa')
          .setRequired(false)
      )
  )
  .setDefaultMemberPermissions(null)
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const executor = interaction.guild?.members.cache.get(interaction.user.id);
  if (!executor || !hasModeratorAccess(executor)) {
    await interaction.reply({ 
      content: '❌ Bạn không có quyền sử dụng lệnh này!', 
      ephemeral: true 
    });
    return;
  }

  const subcommand = interaction.options.getSubcommand();
  const targetChannel = (interaction.options.getChannel('target') as TextChannel) || (interaction.channel as TextChannel);
  const reason = interaction.options.getString('reason') || 'Không có lý do';

  if (!targetChannel || targetChannel.type !== 0) {
    await interaction.reply({
      content: '❌ Chỉ có thể khóa/mở text channel!',
      ephemeral: true
    });
    return;
  }

  const everyoneRole = interaction.guild?.roles.everyone;
  if (!everyoneRole) {
    await interaction.reply({
      content: '❌ Không thể tìm thấy role @everyone!',
      ephemeral: true
    });
    return;
  }

  const permissions = targetChannel.permissionOverwrites.cache.get(everyoneRole.id);
  const isLocked = permissions && permissions.deny.has(PermissionFlagsBits.SendMessages);

  try {
    if (subcommand === 'channel') {
      // Lock channel
      if (isLocked) {
        await interaction.reply({
          content: `⚠️ Kênh ${targetChannel} đã bị khóa rồi!`,
          ephemeral: true
        });
        return;
      }

      const duration = interaction.options.getInteger('duration') || 0;
      
      await targetChannel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: false
      });

      const lockEmbed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('🔒 KÊNH ĐÃ BỊ KHÓA')
        .setDescription(
          `> 🔒 **Kênh:** ${targetChannel}\n` +
          `> 👤 **Khóa bởi:** ${interaction.user}\n` +
          `> 📝 **Lý do:** ${reason}\n` +
          `> ⏰ **Thời gian:** <t:${Math.floor(Date.now() / 1000)}:R>\n` +
          (duration > 0 
            ? `> ⏳ **Tự động mở:** <t:${Math.floor(Date.now() / 1000) + (duration * 60)}:R>\n\n`
            : '\n') +
          `⚠️ **Chỉ staff mới có thể gửi tin nhắn**`
        )
        .setFooter({
          text: `Khóa bởi ${interaction.user.tag}`,
          iconURL: interaction.guild?.iconURL() || undefined
        })
        .setTimestamp();

      await interaction.reply({ embeds: [lockEmbed] });

      // Auto unlock
      if (duration > 0) {
        setTimeout(async () => {
          try {
            await targetChannel.permissionOverwrites.edit(everyoneRole, {
              SendMessages: null
            });

            const autoUnlockEmbed = new EmbedBuilder()
              .setColor(0x57F287)
              .setTitle('🔓 TỰ ĐỘNG MỞ KHÓA')
              .setDescription(
                `> 🔓 **Kênh:** ${targetChannel}\n` +
                `> ⏱️ **Đã khóa:** ${duration} phút\n` +
                `> 👤 **Khóa bởi:** ${interaction.user}\n\n` +
                `✅ **Mọi người có thể gửi tin nhắn lại!**`
              )
              .setTimestamp();

            await targetChannel.send({ embeds: [autoUnlockEmbed] });
          } catch (error) {
            console.error('Lỗi khi tự động mở khóa:', error);
          }
        }, duration * 60 * 1000);
      }

    } else if (subcommand === 'unlock') {
      // Unlock channel
      if (!isLocked) {
        await interaction.reply({
          content: `⚠️ Kênh ${targetChannel} chưa bị khóa!`,
          ephemeral: true
        });
        return;
      }

      await targetChannel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: null
      });

      const unlockEmbed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('🔓 KÊNH ĐÃ MỞ KHÓA')
        .setDescription(
          `> 🔓 **Kênh:** ${targetChannel}\n` +
          `> 👤 **Mở bởi:** ${interaction.user}\n` +
          `> 📝 **Lý do:** ${reason}\n` +
          `> ⏰ **Thời gian:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
          `✅ **Mọi người có thể gửi tin nhắn lại!**`
        )
        .setFooter({
          text: `Mở khóa bởi ${interaction.user.tag}`,
          iconURL: interaction.guild?.iconURL() || undefined
        })
        .setTimestamp();

      await interaction.reply({ embeds: [unlockEmbed] });
    }

  } catch (error) {
    console.error('Lỗi khi khóa/mở kênh:', error);
    await interaction.reply({
      content: '❌ Không thể thực hiện! Kiểm tra quyền của bot.',
      ephemeral: true
    });
  }
}
