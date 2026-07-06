import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder
} from 'discord.js';
import { useQueue } from 'discord-player';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Xem danh sách nhạc đang chờ'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = useQueue(interaction.guildId!);

    if (!queue || !queue.currentTrack) {
      return interaction.reply({
        content: '❌ Không có nhạc nào đang phát!',
        ephemeral: true
      });
    }

    const currentTrack = queue.currentTrack;
    const tracks = queue.tracks.toArray();

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🎵 Hàng Đợi Phát Nhạc')
      .setDescription(
        `**Đang phát:**\n` +
        `[${currentTrack.title}](${currentTrack.url})\n` +
        `${currentTrack.author} • ${currentTrack.duration}\n\n` +
        (tracks.length > 0
          ? `**Tiếp theo:**\n${tracks
              .slice(0, 10)
              .map((track, i) => `${i + 1}. [${track.title}](${track.url}) • ${track.duration}`)
              .join('\n')}`
          : '*Không có bài hát nào trong hàng đợi*')
      )
      .setThumbnail(currentTrack.thumbnail)
      .setFooter({ text: `Tổng cộng ${tracks.length + 1} bài hát` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
