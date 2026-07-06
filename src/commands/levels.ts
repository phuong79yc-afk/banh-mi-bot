import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getLevelLeaderboard } from '../utils/levelSystem';

export const data = new SlashCommandBuilder()
  .setName('levels')
  .setDescription('Xem bảng xếp hạng level')
  .addIntegerOption(option =>
    option
      .setName('page')
      .setDescription('Trang (mỗi trang 10 người)')
      .setMinValue(1)
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const page = interaction.options.getInteger('page') || 1;
  const perPage = 10;
  const start = (page - 1) * perPage;

  const leaderboard = getLevelLeaderboard(1000);
  const pageData = leaderboard.slice(start, start + perPage);

  if (pageData.length === 0) {
    await interaction.editReply({
      content: 'Không có dữ liệu cho trang này!'
    });
    return;
  }

  const totalPages = Math.ceil(leaderboard.length / perPage);

  // Tạo description với ranking
  let description = '';
  
  for (let i = 0; i < pageData.length; i++) {
    const user = pageData[i];
    const rank = start + i + 1;
    
    // Medal cho top 3
    let medal = '';
    if (rank === 1) medal = '🥇';
    else if (rank === 2) medal = '🥈';
    else if (rank === 3) medal = '🥉';
    else medal = `**#${rank}**`;

    try {
      const discordUser = await interaction.client.users.fetch(user.userId);
      description += `${medal} **${discordUser.username}**\n`;
      description += `└ Level ${user.level} • ${user.totalXp.toLocaleString()} XP • ${user.messageCount.toLocaleString()} messages\n\n`;
    } catch (error) {
      description += `${medal} Unknown User\n`;
      description += `└ Level ${user.level} • ${user.totalXp.toLocaleString()} XP\n\n`;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({
      name: `${interaction.guild?.name} - Level Leaderboard`,
      iconURL: interaction.guild?.iconURL() || undefined
    })
    .setTitle(`Top Levels - Page ${page}/${totalPages}`)
    .setDescription(description || 'Chưa có ai có level!')
    .setFooter({
      text: `Tổng ${leaderboard.length} người • Chat để lên level!`,
      iconURL: interaction.client.user?.displayAvatarURL()
    })
    .setTimestamp();

  // Thêm thông tin user hiện tại
  const userRank = leaderboard.findIndex(u => u.userId === interaction.user.id) + 1;
  if (userRank > 0) {
    const userData = leaderboard[userRank - 1];
    embed.addFields({
      name: 'Vị trí của bạn',
      value: `Rank #${userRank} • Level ${userData.level} • ${userData.totalXp.toLocaleString()} XP`,
      inline: false
    });
  }

  await interaction.editReply({ embeds: [embed] });
}
