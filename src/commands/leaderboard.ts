import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getLeaderboard, getBalance } from '../utils/economy';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Bảng xếp hạng giàu nhất server');

export async function execute(interaction: ChatInputCommandInteraction) {
  const leaderboard = getLeaderboard(10);

  if (leaderboard.length === 0) {
    await interaction.reply({
      content: 'Chưa có ai trong bảng xếp hạng!',
      ephemeral: true
    });
    return;
  }

  const leaderboardText = await Promise.all(
    leaderboard.map(async (entry, index) => {
      const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      return `${medal} **${user?.username || 'Unknown'}** - \`${entry.balance.toLocaleString()}\` coins`;
    })
  );

  const userBalance = getBalance(interaction.user.id);
  const userRank = leaderboard.findIndex(e => e.userId === interaction.user.id) + 1;

  const embed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle('💰 Bảng Xếp Hạng')
    .setDescription(leaderboardText.join('\n'))
    .addFields({
      name: 'Vị trí của bạn',
      value: userRank > 0 
        ? `**#${userRank}** - \`${userBalance.toLocaleString()}\` coins`
        : `Chưa có trong top 10 - \`${userBalance.toLocaleString()}\` coins`,
      inline: false
    })
    .setFooter({
      text: `${interaction.guild?.name}`,
      iconURL: interaction.guild?.iconURL() || undefined
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
