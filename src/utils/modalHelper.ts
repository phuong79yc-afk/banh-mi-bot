import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { emojis } from '../config/emojis';

/**
 * Modal Helper - Tạo modal forms cho các commands
 */
export class ModalHelper {
  /**
   * Tạo control panel với buttons để mở modals
   */
  static createControlPanel(type: 'moderation' | 'fun' | 'utility' | 'music') {
    const embed = new EmbedBuilder().setTimestamp();

    const buttons: ButtonBuilder[] = [];

    switch (type) {
      case 'moderation':
        embed
          .setColor(0xef4444)
          .setAuthor({ 
            name: '⚔️ MODERATION CONTROL PANEL',
            iconURL: 'https://cdn.discordapp.com/emojis/1234567890.png'
          })
          .setDescription(
            '> **Quản lý server với các công cụ moderation mạnh mẽ**\n\n' +
            '**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**'
          )
          .addFields(
            {
              name: '🔨 User Actions',
              value: '```\n• Kick    • Ban     • Unban\n• Timeout • Mute    • Unmute\n• Warn    • Warnings\n```',
              inline: true
            },
            {
              name: '🧹 Cleanup',
              value: '```\n• Clear Messages\n• Purge Bulk\n• Nuke Channel\n```',
              inline: true
            },
            {
              name: '🔒 Channel Control',
              value: '```\n• Lock Channel\n• Unlock Channel\n• Set Slowmode\n```',
              inline: true
            }
          )
          .setFooter({ text: '⚠️ Yêu cầu permissions để sử dụng' })
          .setImage('https://i.imgur.com/placeholder.png');

        buttons.push(
          new ButtonBuilder()
            .setCustomId('modal_kick')
            .setLabel('Kick')
            .setEmoji('🔨')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_ban')
            .setLabel('Ban')
            .setEmoji('⛔')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_unban')
            .setLabel('Unban')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_timeout')
            .setLabel('Timeout')
            .setEmoji('⏰')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_warn')
            .setLabel('Warn')
            .setEmoji('⚠️')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_warnings')
            .setLabel('Warnings')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_mute')
            .setLabel('Mute')
            .setEmoji(emojis.mute ?? '🔇')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_unmute')
            .setLabel('Unmute')
            .setEmoji(emojis.unmute ?? '🔊')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_clear')
            .setLabel('Clear')
            .setEmoji('🧹')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_purge')
            .setLabel('Purge')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_lock')
            .setLabel('Lock')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_unlock')
            .setLabel('Unlock')
            .setEmoji('🔓')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_slowmode')
            .setLabel('Slowmode')
            .setEmoji('🐌')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_nuke')
            .setLabel('Nuke')
            .setEmoji('💥')
            .setStyle(ButtonStyle.Primary)
        );
        break;

      case 'fun':
        embed
          .setColor(0x10b981)
          .setAuthor({ 
            name: '🎮 FUN COMMANDS PANEL',
          })
          .setDescription(
            '> **Vui vẻ và giải trí cùng các mini-games**\n\n' +
            '**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**'
          )
          .addFields(
            {
              name: '🎲 Mini Games',
              value: '```\n• Roll Dice\n• Coinflip\n• Magic 8ball\n```',
              inline: true
            },
            {
              name: '😂 Entertainment',
              value: '```\n• Random Jokes\n• Funny Memes\n• Daily Fun\n```',
              inline: true
            },
            {
              name: '🎁 Events',
              value: '```\n• Giveaways\n• Contests\n• Rewards\n```',
              inline: true
            }
          )
          .setFooter({ text: '🎉 Have fun and enjoy!' });

        buttons.push(
          new ButtonBuilder()
            .setCustomId('modal_roll')
            .setLabel('Roll')
            .setEmoji('🎲')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_coinflip')
            .setLabel('Coinflip')
            .setEmoji('🪙')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_8ball')
            .setLabel('8ball')
            .setEmoji('🔮')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_joke')
            .setLabel('Joke')
            .setEmoji('😂')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_meme')
            .setLabel('Meme')
            .setEmoji('🤣')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_giveaway')
            .setLabel('Giveaway')
            .setEmoji('🎁')
            .setStyle(ButtonStyle.Primary)
        );
        break;

      case 'utility':
        embed
          .setColor(0x3b82f6)
          .setAuthor({ 
            name: '⚙️ UTILITY CONTROL PANEL',
          })
          .setDescription(
            '> **Công cụ tiện ích cho mọi tình huống**\n\n' +
            '**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**'
          )
          .addFields(
            {
              name: '🎫 Support System',
              value: '```\n• Create Ticket\n• Help Menu\n• Support Info\n```',
              inline: true
            },
            {
              name: '👤 User Information',
              value: '```\n• User Info\n• Avatar\n• Server Info\n```',
              inline: true
            },
            {
              name: '🎨 Customization',
              value: '```\n• Custom Emoji\n• TTS Speak\n• Personalize\n```',
              inline: true
            },
            {
              name: '📊 Bot Information',
              value: '```\n• Statistics  • Ping      • Uptime\n• Invite Link • Dashboard • Status\n```',
              inline: false
            },
            {
              name: '💰 Economy System',
              value: '```\n• Check Balance\n• Daily Rewards\n• Shop Items\n```',
              inline: false
            }
          )
          .setFooter({ text: '💡 Explore all features!' });

        buttons.push(
          new ButtonBuilder()
            .setCustomId('modal_ticket')
            .setLabel('Ticket')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_emoji')
            .setLabel('Emoji')
            .setEmoji('😊')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_userinfo')
            .setLabel('User Info')
            .setEmoji('👤')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_avatar')
            .setLabel('Avatar')
            .setEmoji('🖼️')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_serverinfo')
            .setLabel('Server')
            .setEmoji('📊')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_speak')
            .setLabel('Speak')
            .setEmoji('🎤')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_help')
            .setLabel('Help')
            .setEmoji('📚')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_invite')
            .setLabel('Invite')
            .setEmoji('🔗')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_support')
            .setLabel('Support')
            .setEmoji('💬')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_stats')
            .setLabel('Stats')
            .setEmoji('📊')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_ping')
            .setLabel('Ping')
            .setEmoji('🏓')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_uptime')
            .setLabel('Uptime')
            .setEmoji('⏰')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_balance')
            .setLabel('Balance')
            .setEmoji('💰')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_daily')
            .setLabel('Daily')
            .setEmoji('💵')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_shop')
            .setLabel('Shop')
            .setEmoji('🛒')
            .setStyle(ButtonStyle.Primary)
        );
        break;

      case 'music':
        embed
          .setColor(0x8b5cf6)
          .setAuthor({ 
            name: '🎵 MUSIC PLAYER CONTROL',
          })
          .setDescription(
            '> **Điều khiển nhạc chuyên nghiệp với đầy đủ tính năng**\n\n' +
            '**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**'
          )
          .addFields(
            {
              name: '▶️ Playback Controls',
              value: '```\n• Play Song    • Pause\n• Stop Player  • Skip Track\n```',
              inline: true
            },
            {
              name: '🎚️ Audio Settings',
              value: '```\n• Volume Control\n• Loop Modes\n• Shuffle Queue\n```',
              inline: true
            },
            {
              name: '📋 Queue Management',
              value: '```\n• Now Playing\n• View Queue\n• Song Lyrics\n```',
              inline: true
            }
          )
          .setFooter({ text: '🎶 Enjoy your music!' });

        buttons.push(
          new ButtonBuilder()
            .setCustomId('modal_play')
            .setLabel('Play')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('button_pause')
            .setLabel('Pause')
            .setEmoji('⏸️')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('button_stop')
            .setLabel('Stop')
            .setEmoji('⏹️')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('button_skip')
            .setLabel('Skip')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_volume')
            .setLabel('Volume')
            .setEmoji('🔊')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_loop')
            .setLabel('Loop')
            .setEmoji('🔁')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('button_shuffle')
            .setLabel('Shuffle')
            .setEmoji('🔀')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('button_nowplaying')
            .setLabel('Now Playing')
            .setEmoji('🎵')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('button_queue')
            .setLabel('Queue')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modal_lyrics')
            .setLabel('Lyrics')
            .setEmoji('🎤')
            .setStyle(ButtonStyle.Primary)
        );
        break;
    }

    return { embed, buttons };
  }

  /**
   * Tạo modal cho từng loại command
   */
  static createModal(commandName: string): ModalBuilder | null {
    const modal = new ModalBuilder().setTitle(`${commandName.toUpperCase()}`);

    switch (commandName) {
      // MODERATION
      case 'kick':
        modal.setCustomId('modal_submit_kick').setTitle('🔨 Kick User');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('User ID hoặc Mention')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('123456789012345678 hoặc @user')
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('Lý do')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Vi phạm rule...')
              .setRequired(false)
          )
        );
        break;

      case 'ban':
        modal.setCustomId('modal_submit_ban').setTitle('🔨 Ban User');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('User ID hoặc Mention')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('123456789012345678 hoặc @user')
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('Lý do')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Vi phạm nghiêm trọng...')
              .setRequired(false)
          )
        );
        break;

      case 'timeout':
        modal.setCustomId('modal_submit_timeout').setTitle('⏰ Timeout User');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('User ID hoặc Mention')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('duration')
              .setLabel('Thời gian (phút)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('60')
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('Lý do')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
          )
        );
        break;

      case 'warn':
        modal.setCustomId('modal_submit_warn').setTitle('⚠️ Warn User');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('User ID hoặc Mention')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('Lý do')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Spam, toxic, ...')
              .setRequired(true)
          )
        );
        break;

      case 'purge':
        modal.setCustomId('modal_submit_purge').setTitle('🧹 Purge Messages');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('amount')
              .setLabel('Số lượng messages (1-100)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('10')
              .setRequired(true)
          )
        );
        break;

      // FUN
      case 'roll':
        modal.setCustomId('modal_submit_roll').setTitle('🎲 Roll Dice');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('sides')
              .setLabel('Số mặt (mặc định: 6)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('6')
              .setRequired(false)
          )
        );
        break;

      case '8ball':
        modal.setCustomId('modal_submit_8ball').setTitle('🔮 Magic 8 Ball');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('question')
              .setLabel('Câu hỏi của bạn')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Hôm nay có may mắn không?')
              .setRequired(true)
          )
        );
        break;

      case 'giveaway':
        modal.setCustomId('modal_submit_giveaway').setTitle('🎁 Create Giveaway');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('prize')
              .setLabel('Giải thưởng')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Nitro 1 tháng')
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('duration')
              .setLabel('Thời gian (giây)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('3600')
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('winners')
              .setLabel('Số người thắng')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('1')
              .setRequired(true)
          )
        );
        break;

      // UTILITY
      case 'ticket':
        modal.setCustomId('modal_submit_ticket').setTitle('🎫 Tạo Ticket');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('Lý do tạo ticket')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Mô tả vấn đề của bạn...')
              .setRequired(true)
              .setMinLength(10)
              .setMaxLength(500)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('category')
              .setLabel('Loại (bug/question/suggestion/report)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('bug')
              .setRequired(false)
          )
        );
        break;

      case 'emoji':
        modal.setCustomId('modal_submit_emoji').setTitle('😊 Add Custom Emoji');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('name')
              .setLabel('Tên emoji')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('my_emoji')
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('url')
              .setLabel('URL ảnh (PNG/JPG/GIF)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('https://...')
              .setRequired(true)
          )
        );
        break;

      case 'userinfo':
        modal.setCustomId('modal_submit_userinfo').setTitle('👤 User Info');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('User ID (để trống = chính bạn)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('123456789012345678')
              .setRequired(false)
          )
        );
        break;

      case 'speak':
        modal.setCustomId('modal_submit_speak').setTitle('🎤 TTS Speak');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('message')
              .setLabel('Tin nhắn')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Hello everyone!')
              .setRequired(true)
              .setMaxLength(200)
          )
        );
        break;

      // MUSIC
      case 'play':
        modal.setCustomId('modal_submit_play').setTitle('▶️ Play Music');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('query')
              .setLabel('Tên bài hát hoặc URL')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('YouTube URL hoặc tên bài')
              .setRequired(true)
          )
        );
        break;

      case 'volume':
        modal.setCustomId('modal_submit_volume').setTitle('🔊 Set Volume');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('volume')
              .setLabel('Âm lượng (0-100)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('50')
              .setRequired(true)
          )
        );
        break;

      case 'lyrics':
        modal.setCustomId('modal_submit_lyrics').setTitle('🎤 Search Lyrics');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('song')
              .setLabel('Tên bài hát (để trống = bài đang phát)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Song name')
              .setRequired(false)
          )
        );
        break;

      // MORE MUSIC
      case 'loop':
        modal.setCustomId('modal_submit_loop').setTitle('🔁 Loop Mode');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('mode')
              .setLabel('Mode (off/track/queue)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('track')
              .setRequired(true)
          )
        );
        break;

      // MORE MODERATION
      case 'mute':
        modal.setCustomId('modal_submit_mute').setTitle('Mute User');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('User ID hoặc Mention')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('Lý do')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
          )
        );
        break;

      case 'unmute':
        modal.setCustomId('modal_submit_unmute').setTitle('Unmute User');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('User ID hoặc Mention')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
        break;

      case 'unban':
        modal.setCustomId('modal_submit_unban').setTitle('Unban User');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('User ID')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('123456789012345678')
              .setRequired(true)
          )
        );
        break;

      case 'slowmode':
        modal.setCustomId('modal_submit_slowmode').setTitle('🐌 Set Slowmode');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('seconds')
              .setLabel('Thời gian (giây, 0 = tắt)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('5')
              .setRequired(true)
          )
        );
        break;

      case 'lock':
        modal.setCustomId('modal_submit_lock').setTitle('🔒 Lock Channel');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('Lý do (optional)')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
          )
        );
        break;

      case 'unlock':
        modal.setCustomId('modal_submit_unlock').setTitle('🔓 Unlock Channel');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('Lý do (optional)')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
          )
        );
        break;

      case 'clear':
        modal.setCustomId('modal_submit_clear').setTitle('🧹 Clear Messages');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('amount')
              .setLabel('Số lượng (1-100)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('10')
              .setRequired(true)
          )
        );
        break;

      case 'nuke':
        modal.setCustomId('modal_submit_nuke').setTitle('💥 Nuke Channel');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('confirm')
              .setLabel('Gõ "CONFIRM" để xác nhận')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('CONFIRM')
              .setRequired(true)
          )
        );
        break;

      // ECONOMY
      case 'daily':
        modal.setCustomId('modal_submit_daily').setTitle('💰 Daily Reward');
        // No inputs needed - direct claim
        break;

      case 'balance':
        modal.setCustomId('modal_submit_balance').setTitle('💰 Check Balance');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('User ID (để trống = chính bạn)')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
          )
        );
        break;

      case 'shop':
        modal.setCustomId('modal_submit_shop').setTitle('🛒 Shop');
        // Direct show shop - no inputs
        break;

      // UTILITY MORE
      case 'avatar':
        modal.setCustomId('modal_submit_avatar').setTitle('🖼️ User Avatar');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('User ID (để trống = chính bạn)')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
          )
        );
        break;

      case 'serverinfo':
        modal.setCustomId('modal_submit_serverinfo').setTitle('📊 Server Info');
        // Direct show - no inputs
        break;

      case 'invite':
        modal.setCustomId('modal_submit_invite').setTitle('🔗 Invite Bot');
        // Direct show invite link - no inputs
        break;

      case 'support':
        modal.setCustomId('modal_submit_support').setTitle('💬 Support');
        // Direct show support info - no inputs
        break;

      case 'ping':
        modal.setCustomId('modal_submit_ping').setTitle('🏓 Ping');
        // Direct show ping - no inputs
        break;

      case 'stats':
        modal.setCustomId('modal_submit_stats').setTitle('📊 Bot Stats');
        // Direct show stats - no inputs
        break;

      case 'uptime':
        modal.setCustomId('modal_submit_uptime').setTitle('⏰ Bot Uptime');
        // Direct show uptime - no inputs
        break;

      case 'help':
        modal.setCustomId('modal_submit_help').setTitle('📚 Help Menu');
        // Direct show help - no inputs
        break;

      // MORE FUN
      case 'joke':
        modal.setCustomId('modal_submit_joke').setTitle('😂 Random Joke');
        // Direct show joke - no inputs
        break;

      case 'meme':
        modal.setCustomId('modal_submit_meme').setTitle('😂 Random Meme');
        // Direct show meme - no inputs
        break;

      case 'warnings':
        modal.setCustomId('modal_submit_warnings').setTitle('⚠️ View Warnings');
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('User ID (để trống = chính bạn)')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
          )
        );
        break;

      default:
        return null;
    }

    return modal;
  }
}
