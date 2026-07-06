import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { readFileSync } from 'fs';
import { join } from 'path';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Xem thống kê bot')
  .setDMPermission(true);

function formatUptime(ms: number): string {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
}

function getMemoryUsage(): { used: number; total: number } {
  const mem = process.memoryUsage();
  return {
    used: Math.round(mem.heapUsed / 1024 / 1024),
    total: Math.round(mem.heapTotal / 1024 / 1024)
  };
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const client = interaction.client;
  
  // Calculate stats
  const serverCount = client.guilds.cache.size;
  const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
  const channelCount = client.channels.cache.size;
  const commandCount = client.commands?.size || 34;
  
  const uptime = client.uptime ? formatUptime(client.uptime) : 'Unknown';
  const ping = client.ws.ping;
  const memory = getMemoryUsage();
  
  // Get Node.js version
  const nodeVersion = process.version;
  
  // Get package version
  let botVersion = '1.0.0';
  try {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
    botVersion = packageJson.version || '1.0.0';
  } catch (err) {
    // Ignore
  }
  
  const embed = new EmbedBuilder()
    .setColor(0xFF1744)
    .setTitle('📊 Thống Kê Bot')
    .setThumbnail(client.user?.displayAvatarURL() || '')
    .addFields(
      {
        name: '🏠 Servers',
        value: `\`${serverCount.toLocaleString()}\` servers`,
        inline: true
      },
      {
        name: '👥 Users',
        value: `\`${userCount.toLocaleString()}\` users`,
        inline: true
      },
      {
        name: '📝 Channels',
        value: `\`${channelCount.toLocaleString()}\` channels`,
        inline: true
      },
      {
        name: '⚡ Commands',
        value: `\`${commandCount}\` commands`,
        inline: true
      },
      {
        name: '🕐 Uptime',
        value: `\`${uptime}\``,
        inline: true
      },
      {
        name: '🏓 Ping',
        value: `\`${ping}ms\``,
        inline: true
      },
      {
        name: '💾 Memory',
        value: `\`${memory.used}MB / ${memory.total}MB\``,
        inline: true
      },
      {
        name: '📌 Version',
        value: `\`v${botVersion}\``,
        inline: true
      },
      {
        name: '🟢 Node.js',
        value: `\`${nodeVersion}\``,
        inline: true
      }
    )
    .setFooter({
      text: `${client.user?.username || 'Bot'} • Made with ❤️ in Vietnam`,
      iconURL: client.user?.displayAvatarURL()
    })
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed] });
}
