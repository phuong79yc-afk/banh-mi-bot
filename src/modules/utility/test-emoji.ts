/**
 * Test Emoji Command - Kiểm tra toàn bộ custom emoji của bot
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { PIXEL_EMOJI_IDS, emojis } from '../../config/emojis';

export default {
  data: new SlashCommandBuilder()
    .setName('test-emoji')
    .setDescription('Hiển thị toàn bộ icon custom của bot'),

  async execute(interaction: ChatInputCommandInteraction) {
    const emojiNames = Object.keys(PIXEL_EMOJI_IDS)
      .sort()
      .map((name) => `${emojis[`bc_${name}`]} \`${name}\``);
    const embeds = [];
    for (let index = 0; index < emojiNames.length; index += 30) {
      embeds.push(
        new EmbedBuilder()
          .setTitle(`${emojis.sparkles} Bộ icon pixel • ${emojiNames.length} emoji`)
          .setDescription(emojiNames.slice(index, index + 30).join('  '))
          .setColor(0x5865F2)
          .setFooter({
            text: `Trang ${Math.floor(index / 30) + 1}/${Math.ceil(emojiNames.length / 30)} • Bot có ${interaction.client.emojis.cache.size} emoji trong cache`,
          }),
      );
    }

    await interaction.reply({ embeds });
  }
};
