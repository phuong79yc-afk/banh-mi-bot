import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { useQueue } from 'discord-player';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Bỏ qua bài hát hiện tại'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = useQueue(interaction.guildId!);

    if (!queue || !queue.currentTrack) {
      return interaction.reply({
        content: '❌ Không có nhạc nào đang phát!',
        ephemeral: true
      });
    }

    const currentTrack = queue.currentTrack;
    queue.node.skip();

    return interaction.reply({
      content: `⏭️ Đã bỏ qua: **${currentTrack.title}**`
    });
  },
};
