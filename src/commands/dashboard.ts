import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('dashboard')
  .setDescription('Xem bảng điều khiển của bot')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: 'Lệnh này chỉ dùng trong server!', ephemeral: true });
    return;
  }

  const client = interaction.client;
  const uptime = client.uptime ? Math.floor(client.uptime / 1000) : 0;
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  const onlineMembers = guild.members.cache.filter(m => m.presence?.status === 'online').size;
  const botCount = guild.members.cache.filter(m => m.user.bot).size;
  const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
  const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;

  // Main Dashboard Embed
  const dashboardEmbed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ 
      name: `Server Dashboard`, 
      iconURL: guild.iconURL() || undefined 
    })
    .setTitle(`${guild.name}`)
    .setDescription(
      `**Thống kê server theo thời gian thực**\n\n` +
      `**Server:** ${guild.name}\n` +
      `**ID:** \`${guild.id}\`\n` +
      `**Owner:** ${guild.members.cache.get(guild.ownerId)?.user.username || 'Unknown'}`
    )
    .setThumbnail(guild.iconURL({ size: 256 }) || null)
    .addFields(
      { 
        name: 'Thành viên', 
        value: `**Tổng:** ${guild.memberCount}\n**Online:** ${onlineMembers}\n**Bots:** ${botCount}`, 
        inline: true 
      },
      { 
        name: 'Kênh', 
        value: `**Tổng:** ${guild.channels.cache.size}\n**Text:** ${textChannels}\n**Voice:** ${voiceChannels}`, 
        inline: true 
      },
      { 
        name: 'Roles', 
        value: `**Tổng:** ${guild.roles.cache.size}`, 
        inline: true 
      }
    )
    .setFooter({ 
      text: `${interaction.user.tag}`, 
      iconURL: interaction.user.displayAvatarURL() 
    })
    .setTimestamp();

  // Bot Stats Embed
  const statsEmbed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('Thống kê Bot')
    .setDescription(
      `**Uptime:** \`${days}d ${hours}h ${minutes}m\`\n` +
      `**Độ trễ:** \`${client.ws.ping}ms\`\n` +
      `**Lệnh:** \`25 lệnh\`\n` +
      `**Bộ nhớ:** \`${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\`\n` +
      `**Servers:** \`${client.guilds.cache.size}\`\n` +
      `**Tổng Users:** \`${client.users.cache.size}\``
    );

  // Buttons
  const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Help')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('help_btn'),
      new ButtonBuilder()
        .setLabel('Web Dashboard')
        .setStyle(ButtonStyle.Link)
        .setURL('http://localhost:3001'),
      new ButtonBuilder()
        .setLabel('Invite Bot')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user?.id}&scope=bot%20applications.commands&permissions=8`)
    );

  await interaction.reply({ 
    embeds: [dashboardEmbed, statsEmbed], 
    components: [buttons]
  });
}
