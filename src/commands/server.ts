import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('server')
  .setDescription('📊 Xem thông tin chi tiết về server')
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;

  if (!guild) {
    return interaction.reply({ content: '❌ Lệnh này chỉ dùng được trong server!', ephemeral: true });
  }

  await interaction.deferReply();

  // Fetch full guild data
  const fetchedGuild = await guild.fetch();
  const owner = await guild.fetchOwner();

  // Count channels
  const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
  const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
  const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;

  // Count members
  const members = guild.memberCount;
  const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;

  // Boost info
  const boostLevel = guild.premiumTier;
  const boostCount = guild.premiumSubscriptionCount || 0;

  // Roles
  const roles = guild.roles.cache.size;

  // Emojis
  const emojis = guild.emojis.cache.size;

  // Create server icon URL
  const serverIcon = guild.iconURL({ size: 256 });

  // Verification level
  const verificationLevels = {
    0: 'Không',
    1: 'Thấp',
    2: 'Trung bình',
    3: 'Cao',
    4: 'Rất cao'
  };

  const embed = new EmbedBuilder()
    .setColor(0xff1744)
    .setTitle(`📊 ${guild.name}`)
    .setThumbnail(serverIcon)
    .addFields(
      {
        name: '👑 Owner',
        value: `${owner.user.tag}\n<@${owner.id}>`,
        inline: true
      },
      {
        name: '📅 Ngày Tạo',
        value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
        inline: true
      },
      {
        name: '🆔 Server ID',
        value: guild.id,
        inline: true
      },
      {
        name: '👥 Thành Viên',
        value: `**Tổng:** ${members.toLocaleString()}\n**Online:** ${onlineMembers.toLocaleString()}`,
        inline: true
      },
      {
        name: '📢 Kênh',
        value: 
          `**Text:** ${textChannels}\n` +
          `**Voice:** ${voiceChannels}\n` +
          `**Categories:** ${categories}`,
        inline: true
      },
      {
        name: '🎭 Roles',
        value: `${roles} roles`,
        inline: true
      },
      {
        name: '😀 Emojis',
        value: `${emojis} emojis`,
        inline: true
      },
      {
        name: '🔐 Verification',
        value: verificationLevels[guild.verificationLevel] || 'Không rõ',
        inline: true
      },
      {
        name: '💎 Server Boost',
        value: 
          `**Level:** ${boostLevel}\n` +
          `**Boosts:** ${boostCount}`,
        inline: true
      }
    )
    .setFooter({ 
      text: `Yêu cầu bởi ${interaction.user.tag}`, 
      iconURL: interaction.user.displayAvatarURL() 
    })
    .setTimestamp();

  // Add server banner if exists
  const banner = guild.bannerURL({ size: 1024 });
  if (banner) {
    embed.setImage(banner);
  }

  // Add description if exists
  if (guild.description) {
    embed.setDescription(`📝 ${guild.description}`);
  }

  await interaction.editReply({ embeds: [embed] });

  return;
}
