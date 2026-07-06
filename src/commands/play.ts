import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  GuildMember,
  EmbedBuilder
} from 'discord.js';
import { useMainPlayer } from 'discord-player';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Phát nhạc từ YouTube, Spotify, SoundCloud')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Tên bài hát hoặc URL')
        .setRequired(true)
    ),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const player = useMainPlayer();
    
    // Check if user is in voice channel
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;
    
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ Bạn cần vào voice channel trước!',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const query = interaction.options.getString('query', true);

    try {
      const { track, searchResult } = await player.play(voiceChannel, query, {
        nodeOptions: {
          metadata: {
            channel: interaction.channel,
            client: interaction.guild?.members.me,
            requestedBy: interaction.user
          }
        }
      });

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎵 Đã thêm vào hàng đợi')
        .setDescription(`[${track.title}](${track.url})`)
        .addFields(
          { name: '👤 Kênh', value: track.author, inline: true },
          { name: '⏱️ Thời lượng', value: track.duration, inline: true },
          { name: '📝 Yêu cầu bởi', value: interaction.user.tag, inline: true }
        )
        .setThumbnail(track.thumbnail)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Play error:', error);
      return interaction.editReply({
        content: '❌ Không thể phát nhạc. Vui lòng thử lại!'
      });
    }
  },
};
