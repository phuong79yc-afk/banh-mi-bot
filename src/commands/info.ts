import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Xem thông tin chi tiết về bot');

export async function execute(interaction: ChatInputCommandInteraction) {
  const client = interaction.client;
  const uptime = client.uptime ? Math.floor(client.uptime / 1000) : 0;
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  const totalMemory = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ 
      name: 'Thông tin Bot', 
      iconURL: client.user?.displayAvatarURL() 
    })
    .setTitle(client.user?.username || 'Discord Bot')
    .setDescription(
      `**Discord Bot Management Platform**\n` +
      `Quản lý và tự động hóa server Discord\n\n` +
      `**Bot:** ${client.user?.tag}\n` +
      `**ID:** \`${client.user?.id}\``
    )
    .setThumbnail(client.user?.displayAvatarURL({ size: 256 }) || null)
    .addFields(
      { 
        name: 'Uptime', 
        value: `\`${days}d ${hours}h ${minutes}m ${seconds}s\``, 
        inline: true 
      },
      { 
        name: 'Ping', 
        value: `\`${client.ws.ping}ms\``, 
        inline: true 
      },
      { 
        name: 'Servers', 
        value: `\`${client.guilds.cache.size}\``, 
        inline: true 
      },
      { 
        name: 'Users', 
        value: `\`${client.users.cache.size}\``, 
        inline: true 
      },
      { 
        name: 'Commands', 
        value: `\`26 lệnh\``, 
        inline: true 
      },
      { 
        name: 'Memory', 
        value: `\`${memoryUsage}MB / ${totalMemory}MB\``, 
        inline: true 
      },
      { 
        name: 'Node.js', 
        value: `\`${process.version}\``, 
        inline: true 
      },
      { 
        name: 'Created', 
        value: `<t:${Math.floor((client.user?.createdTimestamp || 0) / 1000)}:R>`, 
        inline: true 
      },
      { 
        name: 'Platform', 
        value: `\`${process.platform}\``, 
        inline: true 
      }
    )
    .setFooter({ 
      text: `Requested by ${interaction.user.tag} • Bot v1.0`, 
      iconURL: interaction.user.displayAvatarURL() 
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
