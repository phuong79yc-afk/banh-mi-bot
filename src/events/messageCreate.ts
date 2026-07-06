import { Events, Message, EmbedBuilder, TextChannel } from 'discord.js';
import { addXP, getXPForLevel, createLevelUpImage } from '../utils/levelSystem';
import { shouldAutoReply, allowDMCommands, shouldShowTyping, useEmbedReplies } from '../utils/botSettings';
import { isSuspiciousMessage, getAntiMrBeastConfig } from '../commands/antimrbeast';

export const name = Events.MessageCreate;
export const once = false;

// Cooldown để tránh spam (1 phút)
const cooldowns = new Map<string, number>();
const COOLDOWN_TIME = 60000; // 1 phút

export async function execute(message: Message) {
  // Bỏ qua bot
  if (message.author.bot) return;

  // ===== ANTI-MRBEAST CHECK =====
  if (message.guild) {
    const antiMrBeastConfig = getAntiMrBeastConfig(message.guild.id);
    
    if (antiMrBeastConfig.enabled) {
      const member = message.member;
      
      // Kiểm tra whitelist
      const isWhitelisted = member && (
        antiMrBeastConfig.whitelistedUsers.includes(member.id) ||
        member.roles.cache.some(role => antiMrBeastConfig.whitelistedRoles.includes(role.id))
      );

      // Nếu không trong whitelist, kiểm tra tin nhắn
      if (!isWhitelisted) {
        const hasAttachments = message.attachments.size > 0;
        const hasEmbeds = message.embeds.length > 0;
        const embedUrls = message.embeds.map(e => e.url || e.image?.url || '').filter(u => u);
        
        // Import function kiểm tra ảnh
        const { isSuspiciousImageMessage } = require('../commands/antimrbeast');
        
        // Kiểm tra text hoặc ảnh nghi ngờ
        const isTextSuspicious = isSuspiciousMessage(message.content);
        const isImageSuspicious = isSuspiciousImageMessage(hasAttachments || hasEmbeds, message.content, embedUrls, antiMrBeastConfig.blockImageOnly);
        
        if (isTextSuspicious || isImageSuspicious) {
          const detectionType = isImageSuspicious ? 'Image/Embed' : 'Text';
          console.log(`🚨 [Anti-MrBeast] Phát hiện tin nhắn nghi ngờ (${detectionType}) từ ${message.author.tag} trong ${message.guild.name}`);
        
          try {
            // Log vào channel nếu được cấu hình
            if (antiMrBeastConfig.logChannelId) {
              const logChannel = message.guild.channels.cache.get(antiMrBeastConfig.logChannelId) as TextChannel;
              if (logChannel) {
                const attachmentInfo = hasAttachments 
                  ? `\n📎 **Attachments:** ${message.attachments.size} file(s)\n${message.attachments.map(a => `- ${a.name} (${a.contentType})`).join('\n')}`
                  : '';
                const embedInfo = hasEmbeds
                  ? `\n🔗 **Embeds:** ${message.embeds.length} embed(s)\n${embedUrls.map(url => `- ${url}`).join('\n')}`
                  : '';
                
                const logEmbed = new EmbedBuilder()
                  .setColor(0xef4444)
                  .setTitle(`🚨 Anti-MrBeast: Tin Nhắn Nghi Ngờ (${detectionType})`)
                  .setDescription(`Đã phát hiện và xử lý tin nhắn spam/scam`)
                  .addFields(
                    { name: '👤 Người gửi', value: `${message.author} (${message.author.tag})`, inline: true },
                    { name: '📍 Kênh', value: `${message.channel}`, inline: true },
                    { name: '� Loại', value: detectionType, inline: true },
                    { name: '�📝 Nội dung', value: message.content ? `\`\`\`${message.content.substring(0, 800)}\`\`\`` : '*Không có text*', inline: false }
                  )
                  .setFooter({ text: `Message ID: ${message.id}` })
                  .setTimestamp();

                // Thêm thumbnail nếu có ảnh
                if (hasAttachments) {
                  const firstImage = message.attachments.find(a => a.contentType?.startsWith('image/'));
                  if (firstImage) {
                    logEmbed.setImage(firstImage.url);
                  }
                }

                const logMessage = await logChannel.send({ 
                  embeds: [logEmbed],
                  content: attachmentInfo + embedInfo || undefined
                });
              }
            }

            // Gửi cảnh báo cho người dùng (DM) TRƯỚC khi xóa/ban
            try {
              const attachmentWarning = hasAttachments ? `\n\n⚠️ **Bạn đã gửi ${message.attachments.size} file đính kèm** bị đánh dấu là spam.` : '';
              
              const warningEmbed = new EmbedBuilder()
                .setColor(0xef4444)
                .setTitle('⚠️ Cảnh Báo: Tin Nhắn Vi Phạm')
                .setDescription(
                  `Tin nhắn của bạn trong **${message.guild.name}** đã bị phát hiện vi phạm quy tắc chống spam/scam.\n\n` +
                  `**Lý do:** Nội dung nghi ngờ spam giả mạo MrBeast/Giveaway/Scam (${detectionType})\n` +
                  `**Loại vi phạm:** ${isImageSuspicious ? '📷 Ảnh/Embed spam' : '📝 Text spam'}${attachmentWarning}\n` +
                  `**Hành động:** Tin nhắn đã bị xóa${antiMrBeastConfig.autoTimeout ? ` và bạn bị timeout ${antiMrBeastConfig.timeoutDuration} phút` : ''}.\n\n` +
                  `Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ Moderator.`
                )
                .addFields(
                  { name: '📝 Nội dung bị xóa', value: message.content ? `\`\`\`${message.content.substring(0, 400)}\`\`\`` : '*Không có text*', inline: false }
                )
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() || undefined })
                .setTimestamp();

              await message.author.send({ embeds: [warningEmbed] });
              console.log(`✅ [Anti-MrBeast] Đã gửi DM cảnh báo cho ${message.author.tag}`);
            } catch (dmError) {
              console.log(`❌ [Anti-MrBeast] Không thể gửi DM cảnh báo cho ${message.author.tag} - Người dùng có thể đã tắt DM`);
            }

            // Xóa tin nhắn nếu bật autoDelete
            if (antiMrBeastConfig.autoDelete) {
              await message.delete();
              console.log(`🗑️ [Anti-MrBeast] Đã xóa tin nhắn (${detectionType}) từ ${message.author.tag}`);
            }

            // Timeout người dùng nếu bật autoTimeout
            if (antiMrBeastConfig.autoTimeout && member) {
              const timeoutDuration = antiMrBeastConfig.timeoutDuration * 60 * 1000; // Convert phút sang ms
              await member.timeout(timeoutDuration, `Anti-MrBeast: Gửi tin nhắn spam/scam (${detectionType})`);
              console.log(`⏱️ [Anti-MrBeast] Đã timeout ${message.author.tag} trong ${antiMrBeastConfig.timeoutDuration} phút`);
            }

          } catch (error) {
            console.error('❌ [Anti-MrBeast] Lỗi khi xử lý tin nhắn nghi ngờ:', error);
          }
        
          // Dừng xử lý message sau khi xử lý Anti-MrBeast
          return;
        }
      }
    }
  }
  // ===== END ANTI-MRBEAST CHECK =====
  
  // Kiểm tra DM commands setting
  if (!message.guild && !allowDMCommands()) {
    // Nếu là DM và DM commands bị tắt, bỏ qua
    return;
  }
  
  // Xử lý auto reply khi được mention
  if (message.mentions.has(message.client.user!) && shouldAutoReply() && message.guild) {
    try {
      if (shouldShowTyping() && message.channel.isSendable()) {
        await message.channel.sendTyping();
      }
      
      const replies = [
        'Xin chào! Tôi là bot hỗ trợ. Dùng `/help` để xem danh sách lệnh!',
        'Chào bạn! Cần giúp gì không? Dùng `/help` nhé!',
        'Hi! Tôi đây! Dùng `/help` để xem tôi có thể làm gì cho bạn!',
      ];
      
      const reply = replies[Math.floor(Math.random() * replies.length)];
      
      if (useEmbedReplies()) {
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setDescription(reply)
          .setTimestamp();
        await message.reply({ embeds: [embed] });
      } else {
        await message.reply(reply);
      }
    } catch (error) {
      console.error('Error in auto reply:', error);
    }
  }
  
  // Bỏ qua DM cho level system
  if (!message.guild) return;

  // Kiểm tra cooldown
  const now = Date.now();
  const cooldownEnd = cooldowns.get(message.author.id) || 0;
  
  if (now < cooldownEnd) return;

  // Set cooldown mới
  cooldowns.set(message.author.id, now + COOLDOWN_TIME);

  // Random XP từ 15-25
  const xpGain = Math.floor(Math.random() * 11) + 15;

  // Thêm XP
  const result = addXP(message.author.id, xpGain);

  // Nếu level up, gửi thông báo
  if (result.leveledUp) {
    try {
      const xpNeeded = getXPForLevel(result.newLevel);
      
      // Tạo ảnh level up
      const attachment = await createLevelUpImage(
        message.author.username,
        message.author.displayAvatarURL({ extension: 'png', size: 256 }),
        result.newLevel,
        result.user.xp,
        xpNeeded
      );

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('LEVEL UP!')
        .setDescription(
          `Chúc mừng ${message.author}!\n` +
          `Bạn đã lên **Level ${result.newLevel}**!`
        )
        .addFields(
          {
            name: 'XP hiện tại',
            value: `${result.user.xp} / ${xpNeeded}`,
            inline: true
          },
          {
            name: 'Tổng XP',
            value: `${result.user.totalXp.toLocaleString()}`,
            inline: true
          },
          {
            name: 'Tin nhắn',
            value: `${result.user.messageCount.toLocaleString()}`,
            inline: true
          }
        )
        .setImage('attachment://levelup.png')
        .setFooter({
          text: `Tiếp tục chat để lên level cao hơn!`,
          iconURL: message.guild.iconURL() || undefined
        })
        .setTimestamp();

      if (message.channel.isSendable()) {
        await message.channel.send({
          content: `${message.author}`,
          embeds: [embed],
          files: [attachment]
        });
      }

    } catch (error) {
      console.error('Lỗi gửi level up notification:', error);
    }
  }
}
