import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { useQueue } from 'discord-player';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Tạm dừng/tiếp tục phát nhạc'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = useQueue(interaction.guildId!);

    if (!queue || !queue.currentTrack) {
      return interaction.reply({
        content: '❌ Không có nhạc nào đang phát!',
        ephemeral: true
      });
    }

    if (queue.node.isPaused()) {
      queue.node.resume();
      return interaction.reply('▶️ Đã tiếp tục phát nhạc!');
    } else {
      queue.node.pause();
      return interaction.reply('⏸️ Đã tạm dừng phát nhạc!');
    }
  },
};
