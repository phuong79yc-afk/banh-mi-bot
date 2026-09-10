/**
 * Test Emoji Command - Kiểm tra 46 animated emoji
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { emojis } from '../../config/emojis';

export default {
  data: new SlashCommandBuilder()
    .setName('test-emoji')
    .setDescription('🎨 Kiểm tra tất cả animated emoji'),

  async execute(interaction: ChatInputCommandInteraction) {
    // Get emoji directly from client cache
    const getDisplayEmoji = (emojiId: string) => {
      const emoji = interaction.client.emojis.cache.get(emojiId);
      return emoji ? emoji.toString() : '❓';
    };

    const embed = new EmbedBuilder()
      .setTitle(`${emojis.sparkles} Test 46 Animated Emoji`)
      .setDescription(
        `**Core Status (5):**\n` +
        `${emojis.success} success | ${emojis.error} error | ${emojis.loading} loading\n` +
        `${emojis.warning} warning | ${emojis.info} info\n\n` +
        
        `**Actions (9):**\n` +
        `${emojis.export} export | ${emojis.delete} delete | ${emojis.refresh} refresh\n` +
        `${emojis.edit} edit | ${emojis.save} save | ${emojis.search} search\n` +
        `${emojis.add} add | ${emojis.remove} remove | ${emojis.copy} copy\n\n` +
        
        `**Categories (9):**\n` +
        `${emojis.art} art | ${emojis.document} document | ${emojis.folder} folder\n` +
        `${emojis.sparkles} sparkles | ${emojis.chart} chart | ${emojis.menu} menu\n` +
        `${emojis.image} image | ${emojis.music} music | ${emojis.video} video\n\n` +
        
        `**Social (10):**\n` +
        `${emojis.user} user | ${emojis.users} users | ${emojis.message} message\n` +
        `${emojis.bell} bell | ${emojis.heart} heart | ${emojis.star} star\n` +
        `${emojis.trophy} trophy | ${emojis.gift} gift | ${emojis.crown} crown\n` +
        `${emojis.shield} shield\n\n` +
        
        `**Tools (8):**\n` +
        `${emojis.terminal} terminal | ${emojis.database} database | ${emojis.server} server\n` +
        `${emojis.cloud} cloud | ${emojis.wifi} wifi | ${emojis.unlock} unlock\n` +
        `${emojis.key} key | ${emojis.link} link\n\n` +
        
        `**Misc (5):**\n` +
        `${emojis.calendar} calendar | ${emojis.clock} clock | ${emojis.pin} pin\n` +
        `${emojis.tag} tag | ${emojis.flag} flag`
      )
      .setColor(0x5865F2)
      .setFooter({ text: `Total: 46 animated emoji • Bot cache: ${interaction.client.emojis.cache.size} emojis` });

    await interaction.reply({ embeds: [embed] });
  }
};
