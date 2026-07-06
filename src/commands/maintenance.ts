import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, ActivityType } from 'discord.js';

// Biến lưu trạng thái bảo trì
let maintenanceMode = false;
let maintenanceReason = '';
let maintenanceStartTime: Date | null = null;
let maintenanceEndTime: Date | null = null;

export const data = new SlashCommandBuilder()
  .setName('maintenance')
  .setDescription('🔧 Quản lý chế độ bảo trì của bot')
  .addSubcommand(subcommand =>
    subcommand
      .setName('enable')
      .setDescription('Bật chế độ bảo trì')
      .addStringOption(option =>
        option
          .setName('reason')
          .setDescription('Lý do bảo trì')
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('duration')
          .setDescription('Thời gian bảo trì dự kiến (phút)')
          .setMinValue(1)
          .setMaxValue(1440)
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('disable')
      .setDescription('Tắt chế độ bảo trì')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('status')
      .setDescription('Kiểm tra trạng thái bảo trì')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'enable') {
    const reason = interaction.options.getString('reason') || 'Đang bảo trì hệ thống';
    const duration = interaction.options.getInteger('duration');
    
    maintenanceMode = true;
    maintenanceReason = reason;
    maintenanceStartTime = new Date();
    maintenanceEndTime = duration ? new Date(Date.now() + duration * 60 * 1000) : null;

    // Update bot status
    interaction.client.user?.setPresence({
      status: 'dnd',
      activities: [{
        name: '🔧 Đang bảo trì',
        type: ActivityType.Custom
      }]
    });

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('🔧 ⸻ CHẾ ĐỘ BẢO TRÌ ⸻ 🔧')
      .setDescription(
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  **Bot đang bảo trì**\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `> 🔧 **Trạng thái:** Đang bảo trì\n` +
        `> 📝 **Lý do:** ${reason}\n` +
        `> ⏰ **Bắt đầu:** <t:${Math.floor(maintenanceStartTime.getTime() / 1000)}:F>\n` +
        (maintenanceEndTime 
          ? `> ⏳ **Dự kiến xong:** <t:${Math.floor(maintenanceEndTime.getTime() / 1000)}:R>\n`
          : `> ⏳ **Thời gian:** Chưa xác định\n`) +
        `> 👨‍💼 **Bởi:** ${interaction.user}\n\n` +
        `⚠️ **Bot sẽ từ chối lệnh từ user thông thường**`
      )
      .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
      .setFooter({
        text: `Admin: ${interaction.user.tag}`,
        iconURL: interaction.guild?.iconURL() || undefined
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Auto disable maintenance if duration is set
    if (duration && maintenanceEndTime) {
      setTimeout(async () => {
        if (maintenanceMode) {
          maintenanceMode = false;
          
          // Reset bot status
          interaction.client.user?.setPresence({
            status: 'dnd',
            activities: [{
              name: 'Không làm phiền',
              type: ActivityType.Custom
            }]
          });

          // Send notification
          try {
            const channel = interaction.channel;
            if (channel && 'send' in channel) {
              const autoEndEmbed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('✅ ⸻ HOÀN TẤT BẢO TRÌ ⸻ ✅')
                .setDescription(
                  `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                  `┃  **Bảo trì tự động kết thúc**\n` +
                  `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                  `> ✅ **Trạng thái:** Hoạt động bình thường\n` +
                  `> ⏱️ **Thời gian bảo trì:** ${duration} phút\n` +
                  `> 📝 **Lý do:** ${reason}\n\n` +
                  `🎉 **Bot đã hoạt động trở lại!**`
                )
                .setTimestamp();

              await channel.send({ embeds: [autoEndEmbed] });
            }
          } catch (error) {
            console.error('Không thể gửi thông báo kết thúc bảo trì:', error);
          }
        }
      }, duration * 60 * 1000);
    }

  } else if (subcommand === 'disable') {
    if (!maintenanceMode) {
      await interaction.reply({ 
        content: '❌ Bot không ở trong chế độ bảo trì!', 
        ephemeral: true 
      });
      return;
    }

    const duration = maintenanceStartTime 
      ? Math.floor((Date.now() - maintenanceStartTime.getTime()) / 1000)
      : 0;

    maintenanceMode = false;
    const oldReason = maintenanceReason;
    maintenanceReason = '';
    maintenanceStartTime = null;
    maintenanceEndTime = null;

    // Reset bot status
    interaction.client.user?.setPresence({
      status: 'dnd',
      activities: [{
        name: 'Không làm phiền',
        type: ActivityType.Custom
      }]
    });

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('✅ ⸻ HOÀN TẤT BẢO TRÌ ⸻ ✅')
      .setDescription(
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  **Bảo trì đã kết thúc**\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `> ✅ **Trạng thái:** Hoạt động bình thường\n` +
        `> 📝 **Lý do bảo trì:** ${oldReason}\n` +
        `> ⏱️ **Thời gian bảo trì:** ${formatDuration(duration)}\n` +
        `> 👨‍💼 **Kết thúc bởi:** ${interaction.user}\n` +
        `> ⏰ **Thời gian:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
        `🎉 **Bot đã hoạt động trở lại!**`
      )
      .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
      .setFooter({
        text: `Admin: ${interaction.user.tag}`,
        iconURL: interaction.guild?.iconURL() || undefined
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'status') {
    if (!maintenanceMode) {
      const uptime = interaction.client.uptime || 0;
      const uptimeSeconds = Math.floor(uptime / 1000);

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('✅ ⸻ HOẠT ĐỘNG BÌNH THƯỜNG ⸻ ✅')
        .setDescription(
          `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
          `┃  **Bot đang hoạt động**\n` +
          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
          `> ✅ **Trạng thái:** Online\n` +
          `> 🔧 **Chế độ bảo trì:** Tắt\n` +
          `> ⏱️ **Uptime:** ${formatDuration(uptimeSeconds)}\n` +
          `> 📊 **Servers:** ${interaction.client.guilds.cache.size}\n` +
          `> 👥 **Users:** ${interaction.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}\n` +
          `> ⚡ **Ping:** ${interaction.client.ws.ping}ms\n` +
          `> 💻 **Commands:** ${interaction.client.commands?.size || 0}`
        )
        .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      const duration = maintenanceStartTime 
        ? Math.floor((Date.now() - maintenanceStartTime.getTime()) / 1000)
        : 0;

      const embed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle('🔧 ⸻ ĐANG BẢO TRÌ ⸻ 🔧')
        .setDescription(
          `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
          `┃  **Bot đang bảo trì**\n` +
          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
          `> 🔧 **Trạng thái:** Đang bảo trì\n` +
          `> 📝 **Lý do:** ${maintenanceReason}\n` +
          `> ⏰ **Bắt đầu:** <t:${Math.floor((maintenanceStartTime?.getTime() || 0) / 1000)}:F>\n` +
          `> ⏱️ **Thời gian:** ${formatDuration(duration)}\n` +
          (maintenanceEndTime 
            ? `> ⏳ **Dự kiến xong:** <t:${Math.floor(maintenanceEndTime.getTime() / 1000)}:R>\n`
            : `> ⏳ **Thời gian dự kiến:** Chưa xác định\n`) +
          `\n⚠️ **Chỉ admin mới dùng bot được**`
        )
        .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

// Hàm kiểm tra xem bot có đang bảo trì không
export function isMaintenanceMode(): boolean {
  return maintenanceMode;
}

// Hàm lấy thông tin bảo trì
export function getMaintenanceInfo() {
  return {
    enabled: maintenanceMode,
    reason: maintenanceReason,
    startTime: maintenanceStartTime,
    endTime: maintenanceEndTime
  };
}

// Hàm format thời gian
function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0) parts.push(`${minutes} phút`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} giây`);

  return parts.join(' ');
}
