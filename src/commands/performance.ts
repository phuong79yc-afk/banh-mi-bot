import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { memoryOptimizer } from '../utils/memoryOptimizer';
import os from 'os';

export const data = new SlashCommandBuilder()
  .setName('performance')
  .setDescription('📊 Kiểm tra hiệu suất và memory của bot')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub
      .setName('stats')
      .setDescription('Xem thống kê hiệu suất'))
  .addSubcommand(sub =>
    sub
      .setName('cleanup')
      .setDescription('Dọn dẹp memory ngay lập tức'))
  .addSubcommand(sub =>
    sub
      .setName('report')
      .setDescription('Xem báo cáo chi tiết'));

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'stats') {
    await showStats(interaction);
  } else if (subcommand === 'cleanup') {
    await performCleanup(interaction);
  } else if (subcommand === 'report') {
    await showReport(interaction);
  }
}

async function showStats(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: 64 });

  const mem = process.memoryUsage();
  const uptime = process.uptime();
  const stats = memoryOptimizer.getStats();

  // Calculate uptime
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('📊 Bot Performance Stats')
    .addFields(
      {
        name: '⏱️ Uptime',
        value: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        inline: true
      },
      {
        name: '💾 Heap Used',
        value: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        inline: true
      },
      {
        name: '💾 Heap Total',
        value: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        inline: true
      },
      {
        name: '📦 RSS',
        value: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
        inline: true
      },
      {
        name: '🔗 External',
        value: `${(mem.external / 1024 / 1024).toFixed(2)} MB`,
        inline: true
      },
      {
        name: '🖥️ System Memory',
        value: `${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        inline: true
      }
    )
    .setTimestamp();

  // Add cleanup history if available
  if (stats.history.length > 0) {
    const lastCleanup = stats.history[stats.history.length - 1];
    embed.addFields({
      name: '🧹 Last Cleanup',
      value: `Freed ${lastCleanup.freed > 0 ? '+' : ''}${lastCleanup.freed.toFixed(2)} MB`,
      inline: false
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function performCleanup(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: 64 });

  const before = process.memoryUsage().heapUsed / 1024 / 1024;
  
  // Perform cleanup
  memoryOptimizer.cleanup();

  const after = process.memoryUsage().heapUsed / 1024 / 1024;
  const freed = before - after;

  const embed = new EmbedBuilder()
    .setColor(freed > 0 ? '#00ff00' : '#ffaa00')
    .setTitle('🧹 Memory Cleanup Complete')
    .addFields(
      {
        name: 'Before',
        value: `${before.toFixed(2)} MB`,
        inline: true
      },
      {
        name: 'After',
        value: `${after.toFixed(2)} MB`,
        inline: true
      },
      {
        name: 'Freed',
        value: `${freed > 0 ? '+' : ''}${freed.toFixed(2)} MB`,
        inline: true
      }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function showReport(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: 64 });

  const stats = memoryOptimizer.getStats();
  const mem = stats.current;

  let description = '```\n';
  description += `Heap Used:  ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
  description += `Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB\n`;
  description += `RSS:        ${(mem.rss / 1024 / 1024).toFixed(2)} MB\n`;
  description += `External:   ${(mem.external / 1024 / 1024).toFixed(2)} MB\n`;

  if (stats.history.length > 0) {
    const totalFreed = stats.history.reduce((sum, stat) => sum + stat.freed, 0);
    const avgFreed = totalFreed / stats.history.length;
    description += `\nCleanup History: ${stats.history.length} runs\n`;
    description += `Total Freed:     ${totalFreed.toFixed(2)} MB\n`;
    description += `Average Freed:   ${avgFreed.toFixed(2)} MB\n`;
  }

  description += '```';

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('📋 Detailed Memory Report')
    .setDescription(description)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
