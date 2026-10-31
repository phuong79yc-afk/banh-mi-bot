/**
 * Test Emoji Command - Kiểm tra toàn bộ custom emoji của bot
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { EMOJI_IDS, emojis } from '../../config/emojis';

export default {
  data: new SlashCommandBuilder()
    .setName('test-emoji')
    .setDescription('Hiển thị toàn bộ icon custom của bot'),

  async execute(interaction: ChatInputCommandInteraction) {
    const iconList = Object.keys(EMOJI_IDS)
      .sort()
      .map((name) => `${emojis[name]} \`${name}\``)
      .join('  ');

    const embed = new EmbedBuilder()
      .setTitle(`${emojis.sparkles} Bộ icon mới • ${Object.keys(EMOJI_IDS).length} emoji`)
      .setDescription(iconList)
      .setColor(0x5865F2)
      .setFooter({ text: `Bot có ${interaction.client.emojis.cache.size} emoji trong cache` });

    await interaction.reply({ embeds: [embed] });
  }
};
