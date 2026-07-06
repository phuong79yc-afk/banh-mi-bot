import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  GuildMember
} from 'discord.js';
import { createCanvas } from 'canvas';
import { drawSVGIcon } from '../utils/svgIcons';
import { AttachmentBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

/**
 * Load voice emoji config
 */
function loadVoiceEmojiConfig(): Record<string, string> | null {
  try {
    const configPath = path.join(process.cwd(), 'voice-emoji-config.json');
    
    if (!fs.existsSync(configPath)) {
      return null;
    }

    const data = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(data);
    return config.emojis || null;
  } catch (error) {
    console.error('Failed to load voice emoji config:', error);
    return null;
  }
}

/**
 * Get custom emoji string or fallback to Unicode
 */
function getVoiceEmoji(name: string, fallback: string, isAnimated: boolean = false): string {
  const emojis = loadVoiceEmojiConfig();
  
  if (!emojis || !emojis[name]) {
    return fallback;
  }

  return `<${isAnimated ? 'a' : ''}:${name}:${emojis[name]}>`;
}

export const data = new SlashCommandBuilder()
  .setName('setup-voice')
  .setDescription('Thiết lập hệ thống TempVoice với giao diện đẹp')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

/**
 * Create SVG icons table image
 */
async function createVoiceSettingsImage(): Promise<Buffer> {
  const canvas = createCanvas(600, 450);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, 450);
  gradient.addColorStop(0, '#2C2F33');
  gradient.addColorStop(1, '#23272A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 450);

  // Title section background
  ctx.fillStyle = '#1E2124';
  ctx.fillRect(0, 0, 600, 70);

  // Bot icon circle (placeholder)
  ctx.beginPath();
  ctx.arc(40, 35, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#7289DA';
  ctx.fill();

  // Title text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('TempVoice Interface', 75, 32);
  
  // Subtitle
  ctx.fillStyle = '#B9BBBE';
  ctx.font = '14px Arial';
  ctx.fillText('This interface can be used to manage temporary voice channels.', 75, 52);

  // Options grid background
  ctx.fillStyle = '#2C2F33';
  ctx.fillRect(20, 90, 560, 280);

  // Border
  ctx.strokeStyle = '#202225';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 90, 560, 280);

  // Draw option labels in 3 rows
  const options = [
    { icon: 'name_tag', label: 'NAME', x: 40, y: 120, color: '#7289DA' },
    { icon: 'users_limit', label: 'LIMIT', x: 160, y: 120, color: '#7289DA' },
    { icon: 'privacy_lock', label: 'PRIVACY', x: 280, y: 120, color: '#7289DA' },
    { icon: 'waiting_time', label: 'WAITING R.', x: 400, y: 120, color: '#7289DA' },
    { icon: 'thread_hash', label: 'THREAD', x: 520, y: 120, color: '#7289DA' },
    
    { icon: 'user_trust', label: 'TRUST', x: 40, y: 200, color: '#43B581' },
    { icon: 'user_untrust', label: 'UNTRUST', x: 160, y: 200, color: '#F04747' },
    { icon: 'phone_invite', label: 'INVITE', x: 280, y: 200, color: '#43B581' },
    { icon: 'kick_boot', label: 'KICK', x: 400, y: 200, color: '#F04747' },
    { icon: 'globe_region', label: 'REGION', x: 520, y: 200, color: '#7289DA' },
    
    { icon: 'block_x', label: 'BLOCK', x: 40, y: 280, color: '#F04747' },
    { icon: 'unblock_check', label: 'UNBLOCK', x: 160, y: 280, color: '#43B581' },
    { icon: 'crown_claim', label: 'CLAIM', x: 280, y: 280, color: '#F1C40F' },
    { icon: 'transfer_arrow', label: 'TRANSFER', x: 400, y: 280, color: '#F1C40F' },
    { icon: 'trash_delete', label: 'DELETE', x: 520, y: 280, color: '#F04747' },
  ];

  // Draw each option
  for (const opt of options) {
    // Draw icon
    await drawSVGIcon(ctx, opt.icon as any, opt.x, opt.y, 24);
    
    // Draw label
    ctx.fillStyle = opt.color;
    ctx.font = 'bold 11px Arial';
    ctx.fillText(opt.label, opt.x + 32, opt.y + 17);
  }

  // Bottom instruction text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Press the buttons below to use the interface', 300, 400);

  return canvas.toBuffer('image/png');
}

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({ 
      content: '❌ Lệnh này chỉ dùng được trong server!', 
      flags: 64
    });
  }

  const member = interaction.member as GuildMember;

  // Check if user is in a voice channel
  if (!member.voice.channelId) {
    return interaction.reply({ 
      content: '❌ Bạn cần vào voice channel trước! Dùng `/voice create` để tạo voice channel mới.', 
      flags: 64
    });
  }

  // Check if it's a temp voice channel
  const configPath = path.join(process.cwd(), 'temp-voice-channels.json');
  let isOwner = false;
  
  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, 'utf-8');
      const configs = JSON.parse(data);
      const channelConfig = configs[member.voice.channelId];
      
      if (channelConfig && channelConfig.ownerId === member.id) {
        isOwner = true;
      }
    } catch (error) {
      console.error('Failed to check voice ownership:', error);
    }
  }

  if (!isOwner) {
    return interaction.reply({ 
      content: '❌ Bạn không phải owner của voice channel này! Dùng `/voice create` để tạo voice channel của riêng bạn.', 
      flags: 64
    });
  }

  await interaction.deferReply();

  try {
    // Generate the settings image
    const imageBuffer = await createVoiceSettingsImage();
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'voice-settings.png' });

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x7289DA)
      .setTitle('🎙️ TempVoice Interface')
      .setDescription(
        'This **interface** can be used to manage temporary voice channels.\n' +
        'More options are available with `/voice` commands.'
      )
      .setImage('attachment://voice-settings.png')
      .setFooter({ 
        text: `Requested by ${interaction.user.tag}`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();

    // Create buttons for first row (NAME to THREAD)
    const emojis = loadVoiceEmojiConfig();
    const hasCustomEmojis = emojis !== null;

    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('voice_name')
          .setEmoji(hasCustomEmojis && emojis.vc_name ? { id: emojis.vc_name } : '🏷️')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('voice_limit')
          .setEmoji(hasCustomEmojis && emojis.vc_limit ? { id: emojis.vc_limit } : '👥')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('voice_privacy')
          .setEmoji(hasCustomEmojis && emojis.vc_privacy ? { id: emojis.vc_privacy } : '🔒')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('voice_waiting')
          .setEmoji(hasCustomEmojis && emojis.vc_waiting ? { id: emojis.vc_waiting } : '⏰')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('voice_thread')
          .setEmoji(hasCustomEmojis && emojis.vc_thread ? { id: emojis.vc_thread } : '#️⃣')
          .setStyle(ButtonStyle.Secondary)
      );

    // Create buttons for second row (TRUST to REGION)
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('voice_trust')
          .setEmoji(hasCustomEmojis && emojis.vc_trust ? { id: emojis.vc_trust } : '✅')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('voice_untrust')
          .setEmoji(hasCustomEmojis && emojis.vc_untrust ? { id: emojis.vc_untrust } : '❌')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('voice_invite')
          .setEmoji(hasCustomEmojis && emojis.vc_invite ? { id: emojis.vc_invite } : '📞')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('voice_kick')
          .setEmoji(hasCustomEmojis && emojis.vc_kick ? { id: emojis.vc_kick } : '👢')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('voice_region')
          .setEmoji(hasCustomEmojis && emojis.vc_region ? { id: emojis.vc_region } : '🌐')
          .setStyle(ButtonStyle.Secondary)
      );

    // Create buttons for third row (BLOCK to DELETE)
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('voice_block')
          .setEmoji(hasCustomEmojis && emojis.vc_block ? { id: emojis.vc_block } : '🚫')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('voice_unblock')
          .setEmoji(hasCustomEmojis && emojis.vc_unblock ? { id: emojis.vc_unblock } : '✔️')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('voice_claim')
          .setEmoji(hasCustomEmojis && emojis.vc_claim ? { id: emojis.vc_claim } : '👑')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('voice_transfer')
          .setEmoji(hasCustomEmojis && emojis.vc_transfer ? { id: emojis.vc_transfer } : '🔄')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('voice_delete')
          .setEmoji(hasCustomEmojis && emojis.vc_delete ? { id: emojis.vc_delete } : '🗑️')
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.editReply({ 
      embeds: [embed], 
      files: [attachment],
      components: [row1, row2, row3]
    });

    // Button interaction handler
    const collector = interaction.channel?.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000 // 5 minutes
    });

    collector?.on('collect', async (i) => {
      try {
        if (i.user.id !== interaction.user.id) {
          await i.reply({ 
            content: '❌ Chỉ owner của voice channel mới có thể sử dụng buttons này!', 
            flags: 64
          });
          return;
        }

        // Get voice channel
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
          await i.reply({ 
            content: '❌ Bạn không còn trong voice channel!', 
            flags: 64
          });
          return;
        }

        // Load config
        const configPath = path.join(process.cwd(), 'temp-voice-channels.json');
        if (!fs.existsSync(configPath)) {
          await i.reply({ 
            content: '❌ Không tìm thấy config file!', 
            flags: 64
          });
          return;
        }

        const configs = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const config = configs[voiceChannel.id];

        if (!config) {
          await i.reply({ 
            content: '❌ Voice channel không hợp lệ!', 
            flags: 64
          });
          return;
        }

        // Handle button actions
        switch (i.customId) {
          case 'voice_name':
            await i.reply({ 
              content: '✏️ Dùng lệnh `/voice rename <tên mới>` để đổi tên voice channel!\n\n**Ví dụ:** `/voice rename Phòng Game`', 
              flags: 64
            });
            break;

          case 'voice_limit':
            await i.reply({ 
              content: '👥 Dùng lệnh `/voice limit <số>` để đổi giới hạn người!\n\n**Ví dụ:** `/voice limit 5` (tối đa 5 người)\n`/voice limit 0` (không giới hạn)', 
              flags: 64
            });
            break;

          case 'voice_privacy':
            // Toggle lock/unlock
            const isLocked = config.settings?.isLocked || false;
            if (isLocked) {
              await voiceChannel.permissionOverwrites.edit(interaction.guild!.id, {
                Connect: true
              });
              config.settings.isLocked = false;
              fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
              await i.reply({ 
                content: '🔓 **Voice channel đã mở khóa!**\n\nMọi người có thể vào được.', 
                flags: 64
              });
            } else {
              await voiceChannel.permissionOverwrites.edit(interaction.guild!.id, {
                Connect: false
              });
              if (!config.settings) config.settings = { userLimit: 0, isLocked: false, trustedUsers: [], blockedUsers: [] };
              config.settings.isLocked = true;
              fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
              await i.reply({ 
                content: '🔒 **Voice channel đã khóa!**\n\nChỉ bạn và trusted users mới vào được.\n\nDùng `/voice trust @user` để thêm người tin tưởng.', 
                flags: 64
              });
            }
            break;

          case 'voice_waiting':
            await i.reply({ 
              content: '⏰ **Tính năng Waiting Room**\n\nĐang được phát triển...\n\nSẽ cho phép tạo phòng chờ trước khi vào voice channel chính.', 
              flags: 64
            });
            break;

          case 'voice_thread':
            await i.reply({ 
              content: '#️⃣ **Tính năng Thread**\n\nĐang được phát triển...\n\nSẽ tự động tạo text thread cho voice channel.', 
              flags: 64
            });
            break;

          case 'voice_trust':
            await i.reply({ 
              content: '✅ **Trust User**\n\nDùng lệnh `/voice trust @user` để cho phép user vào khi channel bị lock!\n\n**Ví dụ:** `/voice trust @Friend`', 
              flags: 64
            });
            break;

          case 'voice_untrust':
            await i.reply({ 
              content: '❌ **Untrust User**\n\nDùng lệnh `/voice untrust @user` để bỏ trust user!\n\n**Ví dụ:** `/voice untrust @Friend`', 
              flags: 64
            });
            break;

          case 'voice_invite':
            await i.reply({ 
              content: '📞 **Invite User**\n\nĐang được phát triển...\n\nSẽ gửi invite notification cho user.', 
              flags: 64
            });
            break;

          case 'voice_kick':
            await i.reply({ 
              content: '👢 **Kick User**\n\nDùng lệnh `/voice kick @user` để kick user ra khỏi voice channel!\n\n**Ví dụ:** `/voice kick @Spammer`', 
              flags: 64
            });
            break;

          case 'voice_region':
            await i.reply({ 
              content: '🌐 **Change Region**\n\nĐang được phát triển...\n\nSẽ cho phép đổi voice region (Singapore, US, Europe...).', 
              flags: 64
            });
            break;

          case 'voice_block':
            await i.reply({ 
              content: '🚫 **Block User**\n\nDùng lệnh `/voice block @user` để chặn user không cho vào voice channel!\n\n**Ví dụ:** `/voice block @Toxic`\n\nUser sẽ bị kick ngay lập tức nếu đang trong channel.', 
              flags: 64
            });
            break;

          case 'voice_unblock':
            await i.reply({ 
              content: '✔️ **Unblock User**\n\nDùng lệnh `/voice unblock @user` để bỏ chặn user!\n\n**Ví dụ:** `/voice unblock @Friend`', 
              flags: 64
            });
            break;

          case 'voice_claim':
            // Check if original owner is still in channel
            const owner = interaction.guild!.members.cache.get(config.ownerId);
            if (owner?.voice.channelId === voiceChannel.id) {
              await i.reply({ 
                content: '❌ **Không thể claim!**\n\nOwner vẫn còn trong voice channel.', 
                flags: 64
              });
              return;
            }

            // Claim ownership
            await voiceChannel.permissionOverwrites.edit(i.user.id, {
              ManageChannels: true
            });
            if (config.ownerId) {
              try {
                await voiceChannel.permissionOverwrites.delete(config.ownerId);
              } catch (e) {
                // Ignore if old owner permission doesn't exist
              }
            }
            
            config.ownerId = i.user.id;
            fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
            
            await i.reply({ 
              content: '👑 **Claim thành công!**\n\nBạn giờ là owner của voice channel này!', 
              flags: 64
            });
            break;

          case 'voice_transfer':
            await i.reply({ 
              content: '🔄 **Transfer Ownership**\n\nDùng lệnh `/voice transfer @user` để chuyển quyền sở hữu cho người khác!\n\n**Ví dụ:** `/voice transfer @NewOwner`\n\n⚠️ Bạn sẽ mất quyền owner sau khi transfer!', 
              flags: 64
            });
            break;

          case 'voice_delete':
            // Confirm delete
            await voiceChannel.delete(`Deleted by owner ${i.user.tag}`);
            delete configs[voiceChannel.id];
            fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
            await i.reply({ 
              content: '🗑️ **Voice channel đã xóa!**\n\nChannel đã bị xóa thành công.', 
              flags: 64
            });
            break;

          default:
            await i.reply({ 
              content: '⚠️ Tính năng đang được phát triển...', 
              flags: 64
            });
        }
      } catch (error) {
        console.error('Button interaction error:', error);
        try {
          await i.reply({ 
            content: `❌ Đã xảy ra lỗi: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            flags: 64
          });
        } catch (e) {
          // Ignore if can't reply
        }
      }
    });

    collector?.on('end', async () => {
      try {
        // Disable all buttons after timeout
        const disabledButtons = [row1, row2, row3].map(row => {
          const newRow = new ActionRowBuilder<ButtonBuilder>();
          row.components.forEach(button => {
            newRow.addComponents(
              ButtonBuilder.from(button).setDisabled(true)
            );
          });
          return newRow;
        });

        await interaction.editReply({ 
          components: disabledButtons
        });
      } catch (error) {
        // Ignore errors when editing expired interactions
      }
    });

  } catch (error) {
    console.error('Setup-voice command error:', error);
    
    await interaction.editReply({ 
      content: '❌ Đã xảy ra lỗi khi tạo giao diện TempVoice.' 
    }).catch(() => {});
  }

  return;
}
