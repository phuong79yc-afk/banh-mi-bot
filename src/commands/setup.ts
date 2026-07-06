import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  PermissionFlagsBits,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Thiết lập bot cho server của bạn')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({ content: '❌ Lệnh này chỉ dùng được trong server!', ephemeral: true });
  }

  const guild = interaction.guild;
  const setupEmbed = new EmbedBuilder()
    .setColor(0xff1744)
    .setTitle('⚙️ Thiết Lập Bot')
    .setDescription(
      `Chào mừng bạn đến với hệ thống thiết lập **${interaction.client.user.username}**!\n\n` +
      `Bot đã sẵn sàng hoạt động với các tính năng mặc định. ` +
      `Dưới đây là hướng dẫn thiết lập chi tiết cho server **${guild.name}**:`
    )
    .addFields(
      {
        name: '🛡️ Bước 1: Cấp Quyền',
        value: 
          '• Bot cần quyền **Administrator** để hoạt động tốt nhất\n' +
          '• Hoặc tối thiểu: `Manage Messages`, `Manage Roles`, `Ban Members`, `Kick Members`\n' +
          '• Di chuyển role bot lên cao hơn các roles cần quản lý',
        inline: false
      },
      {
        name: '📢 Bước 2: Kênh Logs (Optional)',
        value: 
          '• Tạo channel `#mod-logs` để bot ghi lại hành động quản trị\n' +
          '• Bot sẽ tự động phát hiện channel có tên chứa `log` hoặc `mod`\n' +
          '• Sử dụng `/config set-log-channel` để chỉ định channel cụ thể',
        inline: false
      },
      {
        name: '🎭 Bước 3: Auto-Roles (Optional)',
        value:
          '• Thiết lập role tự động cho thành viên mới\n' +
          '• Sử dụng: `/config autorole @role`\n' +
          '• Xóa: `/config autorole remove`',
        inline: false
      },
      {
        name: '👋 Bước 4: Welcome Messages (Optional)',
        value:
          '• Thiết lập tin nhắn chào mừng tự động\n' +
          '• Sử dụng: `/config welcome #channel [message]`\n' +
          '• Biến có sẵn: `{user}`, `{server}`, `{membercount}`',
        inline: false
      },
      {
        name: '🎮 Bước 5: Level System',
        value:
          '• Hệ thống level đã tự động bật\n' +
          '• Thiết lập level roles: `/levelroles add [level] @role`\n' +
          '• Vô hiệu hóa: `/levels disable`',
        inline: false
      },
      {
        name: '🔐 Bước 6: Anti-Raid',
        value:
          '• Bật bảo vệ anti-raid: `/antiraid enable`\n' +
          '• Thiết lập ngưỡng: `/antiraid config`\n' +
          '• Xem logs: `/antiraid logs`',
        inline: false
      }
    )
    .addFields(
      {
        name: '⚡ Các Lệnh Hữu Ích',
        value: 
          '`/help` - Xem tất cả lệnh\n' +
          '`/ping` - Kiểm tra độ trễ\n' +
          '`/serverinfo` - Thông tin server\n' +
          '`/userinfo` - Thông tin user',
        inline: true
      },
      {
        name: '🎵 Lệnh Âm Nhạc',
        value:
          '`/play` - Phát nhạc\n' +
          '`/queue` - Xem hàng chờ\n' +
          '`/skip` - Bỏ qua bài\n' +
          '`/stop` - Dừng nhạc',
        inline: true
      }
    )
    .setFooter({ 
      text: `Thiết lập bởi ${interaction.user.tag}`, 
      iconURL: interaction.user.displayAvatarURL() 
    })
    .setTimestamp();

  // Buttons
  const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel('📚 Tài Liệu')
        .setStyle(ButtonStyle.Link)
        .setURL('http://localhost:3002/docs'),
      new ButtonBuilder()
        .setLabel('💬 Support')
        .setStyle(ButtonStyle.Link)
        .setURL('http://localhost:3002/support'),
      new ButtonBuilder()
        .setLabel('✅ Hoàn Tất')
        .setCustomId('setup_complete')
        .setStyle(ButtonStyle.Success)
    );

  await interaction.reply({ 
    embeds: [setupEmbed],
    components: [buttons]
  });

  // Button collector
  const collector = interaction.channel?.createMessageComponentCollector({
    time: 60000 // 1 minute
  });

  collector?.on('collect', async (i) => {
    if (i.customId === 'setup_complete' && i.user.id === interaction.user.id) {
      const completeEmbed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('✅ Thiết Lập Hoàn Tất!')
        .setDescription(
          `Bot đã sẵn sàng hoạt động trong **${guild.name}**!\n\n` +
          `Gõ \`/help\` để xem danh sách lệnh đầy đủ.\n` +
          `Cần trợ giúp? Truy cập [Trang Support](http://localhost:3002/support)`
        )
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setTimestamp();

      await i.update({ 
        embeds: [completeEmbed], 
        components: [] 
      });
    }
  });

  return;
}
