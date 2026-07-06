import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import { useMainPlayer } from 'discord-player';
import { loadEmojiConfig } from '../utils/emojiManager.js';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Phát nhạc từ YouTube, Spotify, SoundCloud')
  .addStringOption(option =>
    option
      .setName('query')
      .setDescription('Tên bài hát hoặc URL (YouTube, Spotify, SoundCloud)')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const query = interaction.options.getString('query', true);
  const member = interaction.member as GuildMember;

  // Check if user is in voice channel
  if (!member.voice.channel) {
    return interaction.reply({ 
      content: '❌ Bạn cần vào voice channel trước!', 
      ephemeral: true 
    });
  }

  // Check bot permissions
  const permissions = member.voice.channel.permissionsFor(interaction.guild!.members.me!);
  if (!permissions?.has(['Connect', 'Speak'])) {
    return interaction.reply({ 
      content: '❌ Bot không có quyền `Connect` hoặc `Speak` trong voice channel này!', 
      ephemeral: true 
    });
  }

  await interaction.deferReply();

  try {
    const player = useMainPlayer();
    
    if (!player) {
      return interaction.editReply({ 
        content: '❌ Music player chưa được khởi tạo! Vui lòng restart bot.' 
      });
    }

    // Search for the track
    const searchResult = await player.search(query, { 
      requestedBy: interaction.user 
    });

    if (!searchResult || !searchResult.hasTracks()) {
      return interaction.editReply({ 
        content: `❌ Không tìm thấy kết quả cho: **${query}**` 
      });
    }

    // Play the track with maximum stability and performance
    const { track, queue } = await player.play(member.voice.channel, searchResult, {
      nodeOptions: {
        metadata: {
          channel: interaction.channel,
          client: interaction.client,
          requestedBy: interaction.user
        },
        
        // === OPTIMIZED CONNECTION SETTINGS ===
        leaveOnEnd: false, // Stay for continuous playback
        leaveOnStop: true,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 120000, // 2 minutes (longer for better UX)
        
        // === OPTIMIZED AUDIO SETTINGS ===
        bufferingTimeout: 7000, // 7 seconds (maximum stability)
        connectionTimeout: 30000, // 30 seconds connection timeout
        volume: 80, // Higher volume for better clarity
        selfDeaf: true, // Reduce bandwidth
        
        // === PERFORMANCE SETTINGS ===
        maxSize: 1000, // Max queue size
        maxHistorySize: 100, // Limit history to save memory
        
        // === AUDIO QUALITY ===
        preferBridgedMetadata: true, // Use bridged metadata for reliability
        disableBiquad: false // Keep audio filters enabled
      }
    });

    // Create simple clean embed like the image
    const isPlayingNow = queue.size === 0;
    
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle('Now Playing')
      .setDescription(
        `**[${track.title}](${track.url})**\n\n` +
        `**Duration**   **Requested by**   **Author**\n` +
        `\`${track.duration}\`   ${interaction.user}   [${track.author}](${track.url})`
      )
      .setThumbnail(track.thumbnail || null);

    // Load emoji config for animated button emojis
    const emojiConfig = loadEmojiConfig();
    const getButtonEmoji = (name: string, fallback: string): any => {
      if (emojiConfig && emojiConfig.emojis[name]) {
        return { id: emojiConfig.emojis[name], animated: true };
      }
      return fallback; // Fallback to Unicode emoji if not uploaded yet
    };

    // Helper function to create button rows
    const createButtonRow = (pauseEmoji: string = '⏸️') => {
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('music_previous')
            .setEmoji(getButtonEmoji('previous_button', '⏮️'))
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('music_pause')
            .setEmoji(getButtonEmoji(pauseEmoji === '▶️' ? 'play_button' : 'pause_button', pauseEmoji))
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('music_stop')
            .setEmoji(getButtonEmoji('stop_button', '⏹️'))
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('music_skip')
            .setEmoji(getButtonEmoji('skip_button', '⏭️'))
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('music_loop')
            .setEmoji(getButtonEmoji('loop_button', '🔁'))
            .setStyle(ButtonStyle.Secondary)
        );
    };

    // Create control buttons with animated custom emojis (or Unicode fallback)
    const row = createButtonRow();

    const response = await interaction.editReply({ 
      embeds: [embed], 
      components: [row] 
    });

    // Button collector
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 600000 // 10 minutes
    });

    collector.on('collect', async i => {
      if (!i.member || !(i.member instanceof GuildMember)) {
        await i.reply({ content: '❌ Không thể xác định thành viên!', ephemeral: true });
        return;
      }

      // Check if user is in voice channel
      if (!i.member.voice.channel) {
        await i.reply({ 
          content: '❌ Bạn cần vào voice channel để điều khiển nhạc!', 
          ephemeral: true 
        });
        return;
      }

      // Check if bot is playing in the same channel
      const botVoiceChannel = i.guild?.members.me?.voice.channel;
      if (botVoiceChannel && botVoiceChannel.id !== i.member.voice.channel.id) {
        await i.reply({ 
          content: '❌ Bạn cần ở cùng voice channel với bot!', 
          ephemeral: true 
        });
        return;
      }

      const player = useMainPlayer();
      const queue = player?.queues.get(i.guildId!);

      if (!queue || !queue.currentTrack) {
        await i.reply({ content: '❌ Không có nhạc đang phát!', ephemeral: true });
        return;
      }

      try {
        switch (i.customId) {
          case 'music_previous':
            if (queue.history.tracks.data.length === 0) {
              await i.reply({ content: '❌ Không có bài trước đó!', ephemeral: true });
              return;
            }
            await queue.history.previous();
            await i.reply({ content: '⏮️ Đã quay lại bài trước!', ephemeral: true });
            break;

          case 'music_pause':
            if (queue.node.isPaused()) {
              queue.node.resume();
              await i.reply({ content: '▶️ Đã tiếp tục phát nhạc!', ephemeral: true });
              await response.edit({ components: [createButtonRow('⏸️')] });
            } else {
              queue.node.pause();
              await i.reply({ content: '⏸️ Đã tạm dừng nhạc!', ephemeral: true });
              await response.edit({ components: [createButtonRow('▶️')] });
            }
            break;

          case 'music_stop':
            queue.delete();
            await i.reply({ content: '⏹️ Đã dừng nhạc và xóa queue!', ephemeral: true });
            collector.stop();
            break;

          case 'music_skip':
            if (queue.size === 0) {
              queue.delete();
              await i.reply({ content: '⏭️ Đã skip bài cuối cùng!', ephemeral: true });
              collector.stop();
            } else {
              queue.node.skip();
              await i.reply({ content: '⏭️ Đã skip bài hiện tại!', ephemeral: true });
            }
            break;

          case 'music_loop': {
            const currentMode = queue.repeatMode;
            const { QueueRepeatMode } = await import('discord-player');
            let newMode: any;
            let modeText = '';
            
            if (currentMode === QueueRepeatMode.OFF) {
              newMode = QueueRepeatMode.TRACK;
              modeText = '🔂 Lặp lại bài hiện tại';
            } else if (currentMode === QueueRepeatMode.TRACK) {
              newMode = QueueRepeatMode.QUEUE;
              modeText = '🔁 Lặp lại queue';
            } else {
              newMode = QueueRepeatMode.OFF;
              modeText = '➡️ Tắt lặp lại';
            }
            
            queue.setRepeatMode(newMode);
            await i.reply({ content: modeText, ephemeral: true });
            break;
          }
        }
      } catch (error) {
        console.error('Button interaction error:', error);
        await i.reply({ 
          content: '❌ Đã xảy ra lỗi khi thực hiện lệnh!', 
          ephemeral: true 
        }).catch(() => {});
      }
    });

    collector.on('end', () => {
      // Disable all buttons after timeout
      const disabledRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('music_previous')
            .setEmoji(getButtonEmoji('previous_button', '⏮️'))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('music_pause')
            .setEmoji(getButtonEmoji('pause_button', '⏸️'))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('music_stop')
            .setEmoji(getButtonEmoji('stop_button', '⏹️'))
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('music_skip')
            .setEmoji(getButtonEmoji('skip_button', '⏭️'))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('music_loop')
            .setEmoji(getButtonEmoji('loop_button', '🔁'))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
      
      response.edit({ components: [disabledRow] }).catch(() => {});
    });

  } catch (error) {
    console.error('Play command error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await interaction.editReply({ 
      content: `❌ Đã xảy ra lỗi khi phát nhạc:\n\`\`\`${errorMessage}\`\`\`` 
    }).catch(() => {});
  }

  return;
}
