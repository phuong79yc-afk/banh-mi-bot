/**
 * Test Emoji Command - Kiểm tra 50 animated emoji
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { emojis } from '../../config/emojis';

export default {
  data: new SlashCommandBuilder()
    .setName('test-emoji')
    .setDescription('Kiểm tra cách hiển thị các emoji của bot'),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle(`${emojis.sparkles} Test 50 Animated Emoji`)
      .setDescription(
        `**Core Status (5):**\n` +
        `${emojis.success} success | ${emojis.error} error | ${emojis.loading} loading\n` +
        `${emojis.warning} warning | ${emojis.info} info\n\n` +
        
        `**Actions (12):**\n` +
        `${emojis.export} export | ${emojis.delete} delete | ${emojis.refresh} refresh\n` +
        `${emojis.edit} edit | ${emojis.save} save | ${emojis.search} search\n` +
        `${emojis.add} add | ${emojis.remove} remove | ${emojis.copy} copy\n` +
        `${emojis.unlock} unlock | ${emojis.lock} lock | ${emojis.cloud} cloud\n\n` +
        
        `**UI/Content (11):**\n` +
        `${emojis.art} art | ${emojis.document} document | ${emojis.folder} folder\n` +
        `${emojis.sparkles} sparkles | ${emojis.chart} chart | ${emojis.menu} menu\n` +
        `${emojis.image} image | ${emojis.music} music | ${emojis.video} video\n` +
        `${emojis.star} star | ${emojis.trophy} trophy\n\n` +
        
        `**Social/User (7):**\n` +
        `${emojis.user} user | ${emojis.users} users | ${emojis.message} message\n` +
        `${emojis.bell} bell | ${emojis.heart} heart | ${emojis.crown} crown\n` +
        `${emojis.shield} shield\n\n` +
        
        `**System/Tech (10):**\n` +
        `${emojis.terminal} terminal | ${emojis.database} database | ${emojis.server} server\n` +
        `${emojis.wifi} wifi | ${emojis.calendar} calendar | ${emojis.clock} clock\n` +
        `${emojis.pin} pin | ${emojis.key} key | ${emojis.tag} tag | ${emojis.flag} flag\n\n` +
        
        `**Special (5):**\n` +
        `${emojis.gift} gift | ${emojis.link} link | ${emojis.cache} cache\n` +
        `${emojis.rocket} rocket | ${emojis.coin} coin`
      )
      .setColor(0x5865F2)
      .setFooter({ text: `Total: 50 animated emoji • Bot cache: ${interaction.client.emojis.cache.size} emojis` });

    await interaction.reply({ embeds: [embed] });
  }
};
