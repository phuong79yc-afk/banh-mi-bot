import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const CLIENT_ID = process.env.CLIENT_ID || '1498700400327528498';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Xem danh sách các lệnh và hướng dẫn sử dụng')
  .setDMPermission(true);

export async function execute(interaction: ChatInputCommandInteraction) {
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;
  const supportServer = 'https://discord.gg/phocaviet';
  const website = 'https://banh-mi-bot.onrender.com';
  
  const embed = new EmbedBuilder()
    .setColor(0xFF1744)
    .setAuthor({ 
      name: `${interaction.client.user?.username || 'Bot'} - Command Guide`, 
      iconURL: interaction.client.user?.displayAvatarURL() 
    })
    .setTitle('📚 Hướng Dẫn Sử Dụng')
    .setDescription(
      `Bot Discord đa năng với **${interaction.client.commands?.size || 34} lệnh**\n` +
      `Sử dụng \`/\` + tên lệnh để xem chi tiết và options\n\u200b`
    )
    .setThumbnail(interaction.client.user?.displayAvatarURL() || '')
    .addFields(
      { 
        name: '🛡️ **Moderation & Security**', 
        value: '`/ban` `/kick` `/warn` `/mute` `/unmute` `/timeout`\n' +
               '`/antiraid` `/antispam` `/antimrbeast` `/raid`\n' +
               '`/purge` `/clear` `/lock` `/unlock` `/slowmode` `/nuke`', 
        inline: false 
      },
      { 
        name: 'ℹ️ **Thông Tin & Tiện Ích**', 
        value: '`/help` `/info` `/stats` `/ping` `/invite`\n' +
               '`/serverinfo` `/user` `/avatar` `/dashboard`', 
        inline: false 
      },
      { 
        name: '⚙️ **Setup & Config**', 
        value: '`/setup` `/setup-voice` `/setup-control-emojis`\n' +
               '`/linkpreview` `/verify` `/ticket` `/maintenance`', 
        inline: false 
      },
      { 
        name: '🎵 **Music Player**', 
        value: '`/play` `/voice` - Phát nhạc từ YouTube, Spotify, SoundCloud\n' +
               'Control: Play, Pause, Skip, Stop, Loop, Queue', 
        inline: false 
      },
      { 
        name: '🏆 **Level & Economy**', 
        value: '`/rank` `/leaderboard` `/levels` - Hệ thống XP\n' +
               'Coming soon: `/balance` `/daily` `/shop`', 
        inline: false 
      },
      { 
        name: '🔗 **Social Media Links**', 
        value: 'Auto-fix TikTok, Twitter, Instagram, Reddit links\n' +
               'Download videos và hiển thị embed đẹp (như Bot Keto)', 
        inline: false 
      },
      { 
        name: '📞 **Links & Support**', 
        value: 
          `[🤖 Mời Bot](${inviteUrl}) • ` +
          `[🌐 Website](${website}) • ` +
          `[💬 Support](${supportServer})`,
        inline: false 
      }
    )
    .setFooter({ 
      text: `Requested by ${interaction.user.tag} • Made with ❤️ in Vietnam`, 
      iconURL: interaction.user.displayAvatarURL() 
    })
    .setTimestamp();
  
  // Add action buttons
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Mời Bot')
        .setStyle(ButtonStyle.Link)
        .setURL(inviteUrl)
        .setEmoji('🤖'),
      new ButtonBuilder()
        .setLabel('Website')
        .setStyle(ButtonStyle.Link)
        .setURL(website)
        .setEmoji('🌐'),
      new ButtonBuilder()
        .setLabel('Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL(supportServer)
        .setEmoji('💬')
    );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}
