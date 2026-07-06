import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { useQueue } from 'discord-player';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Dừng phát nhạc và xóa hàng đợi'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = useQueue(interaction.guildId!);

    if (!queue || !queue.currentTrack) {
      return interaction.reply({
        content: '❌ Không có nhạc nào đang phát!',
        ephemeral: true
      });
    }

    queue.delete();

    return interaction.reply({
      content: '⏹️ Đã dừng phát nhạc và xóa hàng đợi!'
    });
  },
};
