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
  const supportServer = 'https://discord.gg/phocaviet';
  const website = 'https://banh-mi-bot.onrender.com';
  
  const setupEmbed = new EmbedBuilder()
    .setColor(0xff1744)
    .setTitle('🎉 Chào Mừng Đến Với Bánh Mì Bot!')
    .setDescription(
      `Cảm ơn bạn đã thêm **${interaction.client.user?.username || 'Bot'}** vào **${guild.name}**!\n\n` +
      `Bot đã sẵn sàng hoạt động ngay! Dưới đây là hướng dẫn thiết lập nhanh:\n\u200b`
    )
    .setThumbnail(guild.iconURL() || '')
    .addFields(
      {
        name: '✅ **Đã Kích Hoạt Sẵn**',
        value: 
          '✓ Anti-Spam & Anti-Raid (tự động phát hiện)\n' +
          '✓ Level System (XP tự động cho members)\n' +
          '✓ TikTok/Social Link Preview (giống Bot Keto)\n' +
          '✓ Music Player (phát nhạc từ YouTube, Spotify)\n' +
          '✓ Moderation Commands (ban, kick, mute, etc.)\n\u200b',
        inline: false
      },
      {
        name: '⚙️ **Tùy Chỉnh Nhanh** (Optional)',
        value: 
          '**Anti-Raid:** `/antiraid enable` - Bật chế độ bảo vệ server\n' +
          '**Link Preview:** `/linkpreview enable` - Auto-fix TikTok links\n' +
          '**Slowmode:** `/slowmode 5s` - Giới hạn spam trong channel\n' +
          '**Lock/Unlock:** `/lock` `/unlock` - Khóa channel tạm thời\n\u200b',
        inline: false
      },
      {
        name: '🎵 **Phát Nhạc**',
        value:
          '`/play [tên bài]` - Phát nhạc từ YouTube/Spotify\n' +
          '`/voice` - Xem voice controls với buttons\n' +
          'Hỗ trợ playlist, queue, loop, shuffle\n\u200b',
        inline: false
      },
      {
        name: '🏆 **Level & Ranking**',
        value:
          '`/rank` - Xem rank card của bạn\n' +
          '`/leaderboard` - Top users trong server\n' +
          '`/levels` - Quản lý level system\n\u200b',
        inline: false
      },
      {
        name: '🔒 **Bảo Mật & Quyền**',
        value:
          'Bot cần quyền **Administrator** hoặc tối thiểu:\n' +
          '• Manage Messages, Manage Roles\n' +
          '• Ban Members, Kick Members, Timeout Members\n' +
          '• Read/Send Messages, Embed Links\n\u200b',
        inline: false
      },
      {
        name: '📚 **Lệnh Hữu Ích**',
        value:
          '`/help` - Xem tất cả commands\n' +
          '`/stats` - Thống kê bot\n' +
          '`/invite` - Mời bot vào server khác\n' +
          '`/serverinfo` - Thông tin server',
        inline: false
      }
    )
    .setFooter({ 
      text: `Setup bởi ${interaction.user.tag} • Made with ❤️ in Vietnam`, 
      iconURL: interaction.user.displayAvatarURL() 
    })
    .setTimestamp();

  // Buttons
  const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel('📚 Hướng Dẫn')
        .setStyle(ButtonStyle.Link)
        .setURL(`${website}/docs`),
      new ButtonBuilder()
        .setLabel('💬 Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL(supportServer),
      new ButtonBuilder()
        .setLabel('✅ Đã Hiểu')
        .setCustomId('setup_complete')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setLabel('🎯 Quick Setup')
        .setCustomId('setup_quick')
        .setStyle(ButtonStyle.Primary)
    );

  await interaction.reply({ 
    embeds: [setupEmbed],
    components: [buttons]
  });

  // Button collector
  const collector = interaction.channel?.createMessageComponentCollector({
    time: 300000 // 5 minutes
  });

  collector?.on('collect', async (i) => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({ content: '❌ Chỉ người dùng lệnh mới được tương tác!', ephemeral: true });
      return;
    }

    if (i.customId === 'setup_complete') {
      const completeEmbed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('✅ Bot Đã Sẵn Sàng!')
        .setDescription(
          `**${interaction.client.user?.username || 'Bot'}** đang hoạt động trong **${guild.name}**!\n\n` +
          `🎮 Gõ \`/help\` để xem tất cả lệnh\n` +
          `📊 Gõ \`/stats\` để xem thống kê bot\n` +
          `🎵 Gõ \`/play [bài hát]\` để phát nhạc\n\n` +
          `Cần trợ giúp? [Support Server](${supportServer}) • [Website](${website})`
        )
        .setThumbnail(interaction.client.user?.displayAvatarURL() || '')
        .setTimestamp();

      await i.update({ 
        embeds: [completeEmbed], 
        components: [] 
      });
      collector.stop();
    } else if (i.customId === 'setup_quick') {
      const quickEmbed = new EmbedBuilder()
        .setColor(0xFF1744)
        .setTitle('⚡ Quick Setup - 3 Bước Nhanh')
        .setDescription('Thiết lập nhanh các tính năng phổ biến nhất:\n\u200b')
        .addFields(
          {
            name: '1️⃣ Bật Anti-Raid',
            value: '```/antiraid enable```\nBảo vệ server khỏi raid attacks',
            inline: false
          },
          {
            name: '2️⃣ Bật Link Preview',
            value: '```/linkpreview enable```\nAuto-fix TikTok, Twitter, Instagram links',
            inline: false
          },
          {
            name: '3️⃣ Test Music Player',
            value: '```/play never gonna give you up```\nThử phát nhạc để kiểm tra',
            inline: false
          }
        )
        .setFooter({ text: 'Copy & paste các lệnh trên để bắt đầu!' })
        .setTimestamp();

      await i.update({ 
        embeds: [quickEmbed], 
        components: [buttons] 
      });
    }
  });

  collector?.on('end', () => {
    // Remove buttons after timeout
    interaction.editReply({ components: [] }).catch(() => {});
  });

  return;
}
