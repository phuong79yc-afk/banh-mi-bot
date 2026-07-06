import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getUserLevel, createRankCard, getLevelLeaderboard, getXPForLevel } from '../utils/levelSystem';

export const data = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('Xem level và XP của bạn hoặc người khác')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Người dùng cần xem (để trống = xem của bạn)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const target = interaction.options.getUser('user') || interaction.user;
  
  if (target.bot) {
    await interaction.editReply({
      content: 'Bot không có level!'
    });
    return;
  }

  try {
    const userLevel = getUserLevel(target.id);
    const xpNeeded = getXPForLevel(userLevel.level);
    
    // Tính rank
    const leaderboard = getLevelLeaderboard(1000);
    const rank = leaderboard.findIndex(u => u.userId === target.id) + 1;

    // Tạo rank card
    const attachment = await createRankCard(
      target.username,
      target.displayAvatarURL({ extension: 'png', size: 256 }),
      userLevel.level,
      userLevel.xp,
      xpNeeded,
      rank || leaderboard.length + 1,
      userLevel.totalXp
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`Rank Card - ${target.username}`)
      .setImage('attachment://rank.png')
      .setFooter({
        text: `Rank #${rank || leaderboard.length + 1} • Chat để nhận XP!`,
        iconURL: interaction.guild?.iconURL() || undefined
      })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
      files: [attachment]
    });

  } catch (error) {
    console.error('Lỗi tạo rank card:', error);
    await interaction.editReply({
      content: 'Có lỗi khi tạo rank card!'
    });
  }
}
