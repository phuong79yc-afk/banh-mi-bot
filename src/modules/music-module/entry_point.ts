/**
 * Music Module - Discord Player v7 with Components V2
 * Prefix commands only: !bc play, !bc skip, !bc pause, etc.
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  ContainerBuilder,
  GuildMember,
  Message,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextChannel,
  TextDisplayBuilder,
  ThumbnailBuilder,
  VoiceBasedChannel,
} from 'discord.js';
import { GuildQueue, Player, Track, useMainPlayer, useQueue, QueryType } from 'discord-player';
import { emojis, EMOJI_IDS } from '../../config/emojis';

const V2 = MessageFlags.IsComponentsV2;
const PREFIX = '!bc';

/* ───────────────────────────── UI Helpers ───────────────────────────── */

const text = (content: string) => new TextDisplayBuilder().setContent(content);

// Thẻ thông báo gọn (lỗi / dừng / hết nhạc)
const notice = (content: string) =>
  new ContainerBuilder().addTextDisplayComponents(text(content));

const controls = (paused = false) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('music:toggle')
      .setEmoji({ id: paused ? EMOJI_IDS.arrow_forward : EMOJI_IDS.pause_button, name: paused ? 'arrow_forward' : 'pause_button', animated: true })
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('music:skip')
      .setEmoji({ id: EMOJI_IDS.track_next, name: 'track_next', animated: true })
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music:queue')
      .setEmoji({ id: EMOJI_IDS.scroll, name: 'scroll', animated: true })
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music:stop')
      .setEmoji({ id: EMOJI_IDS.stop_button, name: 'stop_button', animated: true })
      .setStyle(ButtonStyle.Danger),
  );

const SOURCES: Record<string, string> = {
  youtube: 'YouTube',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  apple_music: 'Apple Music',
};

const sourceName = (s?: string) => (s ? SOURCES[s] ?? s[0].toUpperCase() + s.slice(1) : 'Nhạc');

// Đánh dấu bài đã có thẻ hiện ra, để event playerStart không gửi trùng
const markShown = (queue: GuildQueue | null, track: Track | { id: string }) => {
  if (queue?.metadata) {
    (queue.metadata as any).shownTrackId = track.id;
  }
};

// Kiểm tra xem bài đã được show chưa (không reset)
const alreadyShown = (queue: GuildQueue, id: string) => {
  const metadata = queue.metadata as any;
  return metadata?.shownTrackId === id;
};

// position = 0: đang phát (có nút) · position > 0: vừa thêm vào hàng chờ
// opts.queue: để hiện âm lượng và số bài chờ · opts.upcoming: ghi đè số bài chờ (dùng khi vừa skip)
const nowPlaying = (
  track: Track,
  options: { paused?: boolean; position?: number; queue?: GuildQueue; upcoming?: number } = {},
) => {
  const { paused = false, position = 0, queue, upcoming } = options;
  const left = upcoming ?? queue?.tracks.size ?? 0;
  const status = paused 
    ? `${emojis.pause_button} ĐÃ TẠM DỪNG` 
    : position 
    ? `${emojis.add} ĐÃ THÊM VÀO HÀNG CHỜ` 
    : `${emojis.arrow_forward} ĐANG PHÁT`;

  const chips = position
    ? [`${emojis.clock} \`${track.duration}\``, `${emojis.pin} vị trí \`#${position}\``]
    : [
        `${emojis.clock} \`${track.duration}\``,
        queue ? `${emojis.bell} \`${queue.node.volume}%\`` : null,
        `${emojis.scroll} \`${left}\` bài chờ`,
      ].filter(Boolean);

  const info = [
    text(`-# ${status} · ${sourceName(track.raw.source)}`),
    text(`## [${track.title.slice(0, 90)}](${track.url})\n**${track.author}**`),
    text(chips.join('  ·  ')),
  ];

  const card = new ContainerBuilder();

  if (track.thumbnail) {
    card.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(...info)
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(track.thumbnail)),
    );
  } else {
    card.addTextDisplayComponents(...info);
  }

  if (!position) {
    card
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      .addActionRowComponents(controls(paused));
  }

  return card.addTextDisplayComponents(text(`-# ${emojis.user} ${track.requestedBy?.displayName ?? 'không rõ'}`));
};

const failCard = (query: string) => notice(`${emojis.error} Không phát được \`${query.slice(0, 80)}\`.`);

const queueCard = (queue: GuildQueue) => {
  const cur = queue.currentTrack;
  if (!cur) return notice(`${emojis.error} Không có bài nào đang phát.`);

  const tracks = queue.tracks.toArray();
  const list =
    tracks
      .slice(0, 10)
      .map((t, i) => `\`${i + 1}.\` ${t.title.slice(0, 60)} · \`${t.duration}\``)
      .join('\n') || '*Hàng chờ trống*';
  const more = tracks.length > 10 ? `\n-# …và ${tracks.length - 10} bài nữa` : '';

  return new ContainerBuilder().addTextDisplayComponents(
      text(`### ${emojis.scroll} Hàng chờ`),
      text(`**Đang phát:** [${cur.title.slice(0, 80)}](${cur.url}) · \`${cur.duration}\``),
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(text(list + more));
};

/* ───────────────────────────── Playback Logic ───────────────────────────── */

interface PlaybackOptions {
  voiceChannel: VoiceBasedChannel;
  textChannel: TextChannel;
  user: any;
  query: string;
}

async function startPlayback({ voiceChannel, textChannel, user, query }: PlaybackOptions) {
  const player = useMainPlayer();
  
  // Clean YouTube Radio/Mix links (keep only video ID)
  let cleanQuery = query;
  let isRadioLink = false;
  
  if (query.includes('youtube.com') || query.includes('youtu.be')) {
    // Detect YouTube Radio/Mix patterns
    if (query.includes('start_radio=1') || query.match(/[&?]list=RD/)) {
      isRadioLink = true;
      const videoIdMatch = query.match(/[?&]v=([^&]+)/);
      if (videoIdMatch) {
        cleanQuery = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
      }
    }
  }
  
  // Search for the track/playlist
  const searchResult = await player.search(cleanQuery, {
    requestedBy: user,
    searchEngine: QueryType.YOUTUBE_SEARCH, // Force YouTube instead of auto (SoundCloud has issues)
  });

  if (!searchResult || !searchResult.hasTracks()) {
    throw new Error('Không tìm thấy bài hát nào!');
  }

  // Check if it's a playlist (but not Radio)
  const isPlaylist = searchResult.playlist && !isRadioLink;
  
  if (isPlaylist) {
    // Play entire playlist - mark first track trước
    const firstTrackId = searchResult.playlist!.tracks[0]?.id;
    
    const result = await player.play(voiceChannel, searchResult.playlist!, {
      requestedBy: user,
      nodeOptions: {
        metadata: { 
          channel: textChannel,
          shownTrackId: firstTrackId
        },
        volume: 70,
        selfDeaf: true,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 60_000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 60_000,
        bufferingTimeout: 10000, // 10s buffer
        connectionTimeout: 45_000, // 45s connection
        maxSize: 500,
        maxHistorySize: 0,
        pauseOnEmpty: false,
      },
    });

    const queue = result.queue;
    const firstTrack = queue.currentTrack;

    // Return playlist info
    const container = new ContainerBuilder().addTextDisplayComponents(
        text(
          [
            `# 📋 Playlist đã thêm`,
            `**${searchResult.playlist!.title}**`,
            ``,
            `${emojis.music} **${searchResult.playlist!.tracks.length}** bài hát`,
            `${emojis.user} Yêu cầu: ${user.displayName}`,
            ``,
            `-# Đang phát: ${firstTrack?.title || 'N/A'}`,
          ].join('\n'),
        ),
      );

    return container;
  } else {
    // Single track (hoặc Radio link đã clean)
    // Pre-mark track để prevent duplicate card từ playerStart event
    const trackToPlay = searchResult.tracks[0];
    
    const { track, queue } = await player.play(voiceChannel, trackToPlay, {
      requestedBy: user,
      nodeOptions: {
        metadata: { 
          channel: textChannel,
          shownTrackId: trackToPlay.id
        },
        volume: 70,
        selfDeaf: true,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 60_000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 60_000,
        bufferingTimeout: 10000, // 10s buffer để tránh giật
        connectionTimeout: 45_000, // 45s connection
        maxSize: 500,
        maxHistorySize: 0,
        pauseOnEmpty: false,
      },
    });

    const position = queue.currentTrack?.id === track.id ? 0 : queue.tracks.size;

    return nowPlaying(track, { position, queue });
  }
}

/* ───────────────────────────── Module Class ───────────────────────────── */

// Global flag to prevent duplicate handlers across restarts
let messageHandlerRegistered = false;

export default class MusicModule {
  public readonly name = 'music-module';
  public readonly version = '1.0.0';

  private client: Client;
  private player!: Player;
  private messageHandlerBound: ((message: Message) => void) | null = null;

  constructor(client: Client) {
    this.client = client;
  }

  async initialize(): Promise<void> {

    // Setup discord-player với cấu hình tối ưu cho audio streaming
    this.player = new Player(this.client, {
      skipFFmpeg: false,
    });

    // Load extractors (discord-player v7+)
    try {
      const { DefaultExtractors } = await import('@discord-player/extractor');
      await this.player.extractors.loadMulti(DefaultExtractors);
      console.log('  ✅ Default extractors loaded');
    } catch (err) {
      console.error('  ❌ Default extractors failed:', err);
    }

    // Register multiple YouTube extractors for better reliability
    let youtubeRegistered = false;

    // Try @discord-player/extractor
    try {
      const extractorModule: any = await import('@discord-player/extractor');
      const Extractor = extractorModule.YouTubeExtractor || extractorModule.YoutubeiExtractor || extractorModule.default?.YouTubeExtractor;
      
      if (Extractor) {
        await this.player.extractors.register(Extractor, {});
        console.log('  ✅ @discord-player/extractor YouTube registered');
        youtubeRegistered = true;
      }
    } catch (err) {
      console.log('  ⚠️ @discord-player/extractor not available');
    }

    // Fallback: Try discord-player-youtubei
    if (!youtubeRegistered) {
      try {
        // @ts-ignore - ESM module
        const youtubeModule = await import('discord-player-youtubei');
        const YoutubeExtractor = youtubeModule.YoutubeExtractor || youtubeModule.default;
        
        if (YoutubeExtractor) {
          await this.player.extractors.register(YoutubeExtractor, {});
          console.log('  ✅ discord-player-youtubei registered');
          youtubeRegistered = true;
        }
      } catch (err) {
        console.log('  ⚠️ discord-player-youtubei not available');
      }
    }

    if (!youtubeRegistered) {
      console.log('  ⚠️ No YouTube extractor available - using default extractors only');
    }

    // Spotify extractor is already included in @discord-player/extractor
    // It will automatically bridge Spotify links to YouTube
    console.log('  ✅ Spotify extractor ready (built-in, bridges to YouTube)');
    
    // Log all registered extractors
    console.log('  📋 Registered extractors:', this.player.extractors.store.map(e => e.identifier || e.constructor.name).join(', '));

    // Setup player events
    this.setupPlayerEvents();

    // Setup message handler for prefix commands (only once globally)
    if (!messageHandlerRegistered) {
      this.messageHandlerBound = (message: Message) => this.handleMessage(message);
      this.client.on('messageCreate', this.messageHandlerBound);
      messageHandlerRegistered = true;
      console.log('  ✅ Message handler registered (first time)');
    } else {
      console.log('  ⚠️ Message handler already registered (skipping)');
    }

    console.log('🎵 Music module initialized (prefix only: !bc)');
  }

  private setupPlayerEvents() {
    // Send helper - lưu message để có thể update sau
    const send = async (queue: GuildQueue, card: ContainerBuilder) => {
      const channel = (queue.metadata as any)?.channel;
      if (!channel) return;
      
      try {
        const msg = await channel.send({ components: [card], flags: V2 as any, allowedMentions: { parse: [] } });
        (queue.metadata as any).nowPlayingMessage = msg;
      } catch (e) {
        console.error('[send] Error sending card:', e);
      }
    };

    // Tự chuyển sang bài kế tiếp - CHỈ gửi nếu track KHÔNG được mark (tức là auto-play từ queue)
    this.player.events.on('playerStart', (queue, track) => {
      const metadata = queue.metadata as any;
      const wasMarked = metadata?.shownTrackId === track.id;
      
      if (wasMarked) {
        // Clear the mark after checking
        delete metadata.shownTrackId;
      } else {
        send(queue, nowPlaying(track, { queue }));
      }
      
      // Cập nhật card cũ nếu có (để update số bài chờ)
      if (metadata?.nowPlayingMessage && wasMarked) {
        try {
          metadata.nowPlayingMessage.edit({
            components: [nowPlaying(track, { paused: queue.node.isPaused(), queue })],
            flags: V2 as any,
          }).catch(() => {});
        } catch (e) {
          console.log('[playerStart] Could not update previous card');
        }
      }
    });

    // Thêm cả playlist
    this.player.events.on('audioTracksAdd', (queue, tracks) => {
      send(queue, notice(`${emojis.add} Đã thêm **${tracks.length}** bài vào hàng chờ.`));
      
      // Cập nhật card đang phát để hiện số bài chờ mới
      const metadata = queue.metadata as any;
      if (metadata?.nowPlayingMessage && queue.currentTrack) {
        try {
          metadata.nowPlayingMessage.edit({
            components: [nowPlaying(queue.currentTrack, { paused: queue.node.isPaused(), queue })],
            flags: V2 as any,
          }).catch(() => {});
        } catch (e) {
          console.log('[audioTracksAdd] Could not update now playing card');
        }
      }
    });

    // Hết hàng chờ
    this.player.events.on('emptyQueue', (queue) => {
      if (!alreadyShown(queue, 'end')) {
        send(queue, notice(`${emojis.success} Đã phát hết hàng chờ.\n-# Bot sẽ tự động rời kênh sau 60 giây.`));
      }
    });

    this.player.events.on('emptyChannel', (queue) =>
      send(queue, notice(`${emojis.warning} Kênh thoại không còn ai, bot đã rời kênh.`)),
    );

    // Thông báo khi bot rời kênh thoại
    this.player.events.on('disconnect', (queue) => {
      send(queue, notice(`${emojis.info} Bot đã rời kênh thoại. Hẹn gặp lại! 👋`));
    });

    // Tối ưu error handling - auto skip on error
    this.player.events.on('playerError', (queue, err) => {
      // Ignore AbortError from discord-voip (voice connection timeout)
      if (err.name === 'AbortError' || (err as any).code === 'ABORT_ERR') return;
      // Ignore "Cannot perform IP discovery - socket closed" from discord-voip
      if (err.message?.includes('Cannot perform IP discovery') || err.message?.includes('socket closed')) return;
      
      console.error('[playerError]', err.name, err.message);
      
      // Auto skip to next track on error
      if (queue.tracks.size > 0) {
        queue.node.skip();
      } else {
        send(queue, notice(`${emojis.error} Có lỗi khi phát bài này và không còn bài trong hàng chờ.`));
      }
    });

    this.player.events.on('error', (queue, err) => {
      // Ignore AbortError from discord-voip
      if (err.name === 'AbortError' || (err as any).code === 'ABORT_ERR') return;
      // Ignore "Cannot perform IP discovery - socket closed" from discord-voip
      if (err.message?.includes('Cannot perform IP discovery') || err.message?.includes('socket closed')) return;
      
      console.error('[error]', err.name, err.message);
      send(queue, notice(`${emojis.error} Bot gặp lỗi khi phát nhạc.`));
    });

    // Thêm event khi connection bị disconnect
    this.player.events.on('disconnect', (queue) => {
      console.log('[disconnect] Voice connection disconnected');
      send(queue, notice(`${emojis.info} Bot đã rời kênh thoại. Hẹn gặp lại! 👋`));
    });

    // Debug event để track audio quality - chỉ log errors
    this.player.events.on('debug', (queue, message) => {
      // Chỉ log errors và warnings
      if (message.includes('error') || message.includes('fail') || message.includes('warning')) {
        console.log(`[debug] ${message}`);
      }
    });

    console.log('  ✅ Player events registered');
  }

  // Button handler cho music:* buttons (chỉ từ prefix commands)
  private async handleButton(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith('music:')) return;

    const queue = useQueue(interaction.guildId!);
    const deny = (content: string) =>
      interaction.reply({
        components: [notice(content)],
        flags: (V2 | MessageFlags.Ephemeral) as any,
      });

    if (!queue?.currentTrack) return deny(`${emojis.error} Hiện không có bài nào đang phát.`);

    if (interaction.customId === 'music:queue') {
      return interaction.reply({
        components: [queueCard(queue)],
        flags: (V2 | MessageFlags.Ephemeral) as any,
      });
    }

    const member = interaction.member as GuildMember;
    if (member.voice.channelId !== queue.channel?.id) {
      return deny(`${emojis.warning} Bạn cần ở cùng kênh thoại với bot.`);
    }

    switch (interaction.customId) {
      case 'music:toggle': {
        queue.node.setPaused(!queue.node.isPaused());
        return interaction.update({
          components: [nowPlaying(queue.currentTrack, { paused: queue.node.isPaused(), queue })],
          flags: V2 as any,
        });
      }

      case 'music:skip': {
        const next = queue.tracks.at(0);
        markShown(queue, next ?? { id: 'end' });
        queue.node.skip();
        return interaction.update({
          components: [next ? nowPlaying(next, { queue, upcoming: queue.tracks.size - 1 }) : notice(`${emojis.success} Đã hết hàng chờ.`)],
          flags: V2 as any,
        });
      }

      case 'music:stop': {
        queue.delete();
        return interaction.update({
          components: [notice(`${emojis.stop_button} Đã dừng nhạc bởi ${interaction.user.displayName}.`)],
          flags: V2 as any,
        });
      }
    }
  }

  // Prefix command handler: !bc <play|skip|stop|queue|pause|resume|volume>
  private async handleMessage(message: Message) {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const cmd = args.shift()?.toLowerCase();
    if (!cmd) return;

    const reply = (card: ContainerBuilder) => {
      return message.reply({ components: [card], flags: V2 as any, allowedMentions: { repliedUser: false } });
    };

    // !bc play <query>
    if (['play', 'p'].includes(cmd)) {
      const query = args.join(' ').trim();
      if (!query) return reply(notice(`${emojis.info} Cách dùng: \`${PREFIX} play <tên bài hoặc link>\``));

      const member = message.member as GuildMember;
      const voiceChannel = member?.voice.channel;
      if (!voiceChannel) return reply(notice(`${emojis.warning} Bạn cần vào kênh thoại trước đã.`));

      const loading = await reply(notice(`${emojis.loading} Đang tìm bài...`));

      try {
        const card = await startPlayback({
          voiceChannel,
          textChannel: message.channel as TextChannel,
          user: message.author,
          query,
        });
        
        // Delete loading message then send new card to prevent duplicate
        await loading.delete().catch(() => {});
        const response = await message.reply({ components: [card], flags: V2 as any, allowedMentions: { repliedUser: false } });

        // Lưu message để update khi volume thay đổi
        const queue = useQueue(message.guildId!);
        if (queue?.metadata) {
          (queue.metadata as any).nowPlayingMessage = response;
        }

        // Setup button collector for prefix command
        const collector = response.createMessageComponentCollector({ time: 300000 });
        collector.on('collect', async (i) => {
          if (i.isButton()) {
            await this.handleButton(i);
          }
        });
      } catch (err) {
        console.error('[!bc play]', err);
        await loading.edit({ components: [failCard(query)], flags: V2 as any });
      }
      return;
    }

    // Other commands need queue
    if (!['skip', 'sk', 'next', 'stop', 'queue', 'q', 'pause', 'resume', 'volume', 'vol', 'v', 'loop', 'repeat', 'shuffle', 'nowplaying', 'np', 'seek', 'lyrics', 'pin', 'pinned'].includes(cmd)) return;

    const queue = useQueue(message.guildId!);
    if (!queue?.currentTrack) return reply(notice(`${emojis.error} Hiện không có bài nào đang phát.`));

    if (['queue', 'q'].includes(cmd)) return reply(queueCard(queue));

    const member = message.member as GuildMember;
    if (member.voice.channelId !== queue.channel?.id) {
      return reply(notice(`${emojis.warning} Bạn cần ở cùng kênh thoại với bot.`));
    }

    if (['skip', 'sk', 'next'].includes(cmd)) {
      const next = queue.tracks.at(0);
      markShown(queue, next ?? { id: 'end' });
      queue.node.skip();
      return reply(next ? nowPlaying(next, { queue, upcoming: queue.tracks.size - 1 }) : notice(`${emojis.success} Đã hết hàng chờ.`));
    }

    if (cmd === 'pause' || cmd === 'resume') {
      const pause = cmd === 'pause';
      if (queue.node.isPaused() === pause) {
        return reply(notice(pause ? `${emojis.pause_button} Nhạc đã tạm dừng rồi.` : `${emojis.music} Nhạc đang phát rồi.`));
      }
      queue.node.setPaused(pause);
      return reply(nowPlaying(queue.currentTrack, { paused: pause, queue }));
    }

    if (['volume', 'vol', 'v'].includes(cmd)) {
      if (!args[0]) return reply(notice(`${emojis.bell} Âm lượng hiện tại: **${queue.node.volume}%**`));

      const vol = Number(args[0]);
      if (!Number.isInteger(vol) || vol < 1 || vol > 100) {
        return reply(notice(`${emojis.info} Cách dùng: \`${PREFIX} volume <1-100>\``));
      }

      queue.node.setVolume(vol);
      
      // Cập nhật card đang phát nếu có
      const metadata = queue.metadata as any;
      if (metadata?.nowPlayingMessage && queue.currentTrack) {
        try {
          await metadata.nowPlayingMessage.edit({
            components: [nowPlaying(queue.currentTrack, { paused: queue.node.isPaused(), queue })],
            flags: V2 as any,
          });
        } catch (e) {
          console.log('[volume] Could not update now playing card');
        }
      }
      
      return reply(notice(`${emojis.bell} Đã chỉnh âm lượng: **${vol}%**`));
    }

    if (['loop', 'repeat'].includes(cmd)) {
      const modes = [
        { value: 0, name: 'Tắt', emoji: '▶️' },
        { value: 1, name: 'Lặp bài', emoji: '🔂' },
        { value: 2, name: 'Lặp queue', emoji: '🔁' },
      ];
      
      const current = queue.repeatMode;
      
      // Nếu không có arg, toggle qua các mode: 0 → 1 → 2 → 0
      if (!args[0]) {
        const next = (current + 1) % 3;
        queue.setRepeatMode(next as any);
        const mode = modes[next];
        return reply(notice(`${mode.emoji} **${mode.name}** ${queue.currentTrack ? `\n-# ${queue.currentTrack.title}` : ''}`));
      }
      
      // Nếu có arg, set mode cụ thể: 0, 1, 2 hoặc off/track/queue
      let targetMode = -1;
      const arg = args[0].toLowerCase();
      
      if (['0', 'off', 'none'].includes(arg)) targetMode = 0;
      else if (['1', 'track', 'song', 'one'].includes(arg)) targetMode = 1;
      else if (['2', 'queue', 'all'].includes(arg)) targetMode = 2;
      
      if (targetMode === -1) {
        return reply(notice(`${emojis.info} Cách dùng: \`${PREFIX} loop\` hoặc \`${PREFIX} loop <0|1|2>\`\n-# 0=Tắt, 1=Lặp bài, 2=Lặp queue`));
      }
      
      queue.setRepeatMode(targetMode as any);
      const mode = modes[targetMode];
      return reply(notice(`${mode.emoji} **${mode.name}** ${queue.currentTrack ? `\n-# ${queue.currentTrack.title}` : ''}`));
    }

    // !bc shuffle - Trộn queue
    if (cmd === 'shuffle') {
      if (queue.tracks.size < 2) {
        return reply(notice(`${emojis.warning} Cần ít nhất 2 bài trong queue để trộn.`));
      }
      queue.tracks.shuffle();
      return reply(notice(`${emojis.success} 🔀 Đã trộn **${queue.tracks.size}** bài trong queue!`));
    }

    // !bc nowplaying / np - Xem bài đang phát
    if (['nowplaying', 'np'].includes(cmd)) {
      return reply(nowPlaying(queue.currentTrack, { paused: queue.node.isPaused(), queue }));
    }

    // !bc seek [giây] - Tua đến thời điểm
    if (cmd === 'seek') {
      if (!args[0]) {
        return reply(notice(`${emojis.info} Cách dùng: \`${PREFIX} seek <giây>\`\n-# Ví dụ: ${PREFIX} seek 30`));
      }
      
      const seconds = Number(args[0]);
      if (!Number.isInteger(seconds) || seconds < 0) {
        return reply(notice(`${emojis.error} Số giây phải là số nguyên dương.`));
      }
      
      const durationMs = queue.currentTrack.durationMS;
      const seekMs = seconds * 1000;
      
      if (seekMs >= durationMs) {
        return reply(notice(`${emojis.error} Thời điểm vượt quá độ dài bài hát (${Math.floor(durationMs / 1000)}s).`));
      }
      
      await queue.node.seek(seekMs);
      return reply(notice(`⏩ Đã tua đến **${seconds}s**\n-# ${queue.currentTrack.title}`));
    }


    // !bc pin - Ghim bài hiện tại
    if (cmd === 'pin') {
      // Lưu vào file JSON hoặc database
      const fs = require('fs');
      const path = require('path');
      const pinnedFile = path.join(process.cwd(), 'data', 'pinned-songs.json');
      
      let pinned: any = {};
      try {
        if (fs.existsSync(pinnedFile)) {
          pinned = JSON.parse(fs.readFileSync(pinnedFile, 'utf8'));
        }
      } catch (e) {
        pinned = {};
      }
      
      const userId = message.author.id;
      if (!pinned[userId]) pinned[userId] = [];
      
      const song = {
        title: queue.currentTrack.title,
        author: queue.currentTrack.author,
        url: queue.currentTrack.url,
        duration: queue.currentTrack.duration,
        thumbnail: queue.currentTrack.thumbnail,
        pinnedAt: new Date().toISOString(),
      };
      
      // Kiểm tra xem đã ghim chưa
      const exists = pinned[userId].find((s: any) => s.url === song.url);
      if (exists) {
        return reply(notice(`${emojis.warning} Bài này đã được ghim rồi!`));
      }
      
      pinned[userId].push(song);
      
      // Giới hạn 50 bài/user
      if (pinned[userId].length > 50) {
        pinned[userId] = pinned[userId].slice(-50);
      }
      
      fs.writeFileSync(pinnedFile, JSON.stringify(pinned, null, 2));
      
      return reply(notice(`${emojis.success} 📌 Đã ghim: **${song.title}**\n-# by ${song.author}`));
    }

    // !bc pinned - Xem danh sách đã ghim
    if (cmd === 'pinned') {
      const fs = require('fs');
      const path = require('path');
      const pinnedFile = path.join(process.cwd(), 'data', 'pinned-songs.json');
      
      let pinned: any = {};
      try {
        if (fs.existsSync(pinnedFile)) {
          pinned = JSON.parse(fs.readFileSync(pinnedFile, 'utf8'));
        }
      } catch (e) {
        return reply(notice(`${emojis.error} Chưa có bài nào được ghim.`));
      }
      
      const userId = message.author.id;
      const userPinned = pinned[userId] || [];
      
      if (userPinned.length === 0) {
        return reply(notice(`${emojis.info} Bạn chưa ghim bài nào.\n-# Dùng \`${PREFIX} pin\` để ghim bài đang phát.`));
      }
      
      const list = userPinned.slice(-10).reverse().map((s: any, i: number) => {
        return `**${i + 1}.** ${s.title}\n-# by ${s.author} · ${s.duration}`;
      }).join('\n\n');
      
      return reply(notice(`📌 **Bài hát đã ghim** (${userPinned.length})\n\n${list}\n\n-# Dùng: \`${PREFIX} play <tên bài>\` để phát`));
    }

    // stop
    queue.delete();
    return reply(notice(`${emojis.stop_button} Đã dừng nhạc bởi ${message.author.displayName}.`));
  }

  async shutdown(): Promise<void> {
    // Remove message handler
    if (this.messageHandlerBound) {
      this.client.removeListener('messageCreate', this.messageHandlerBound);
      this.messageHandlerBound = null;
      messageHandlerRegistered = false; // Reset global flag
      console.log('  🗑️ Message handler removed');
    }
    
    this.player.destroy();
    console.log('🎵 Music module shutdown');
  }
}

