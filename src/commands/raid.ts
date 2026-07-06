import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { antiRaidSystem } from '../utils/antiRaid';

export const data = new SlashCommandBuilder()
    .setName('raid')
    .setDescription('🚨 Quản lý và test raid protection')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Xem thông tin về raid protection')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('simulate')
        .setDescription('Simulate raid attack để test (chỉ hiển thị thông báo)')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Reset raid mode và join records')
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'info':
        const config = antiRaidSystem.getConfig();
        const isRaidMode = antiRaidSystem.isInRaidMode();
        const joinCount = antiRaidSystem.getJoinCount();

        const infoEmbed = new EmbedBuilder()
          .setTitle('🛡️ Raid Protection System')
          .setDescription(
            '```diff\n+ Hệ thống tự động phát hiện và chặn raid attacks\n```\n' +
            '**Cách hoạt động:**\n' +
            `• 👥 Phát hiện khi **${config.threshold}+ users** join trong **${config.timeWindow / 1000}s**\n` +
            `• 🔨 Tự động **${config.action}** tất cả raiders\n` +
            '• 📝 Gửi log chi tiết vào channel\n' +
            '• ⏰ Raid mode tự động tắt sau 5 phút\n' +
            '• 📅 Kiểm tra tuổi tài khoản (nếu được bật)'
          )
          .addFields(
            { 
              name: '🔘 Status', 
              value: config.enabled ? '`✅ Enabled`' : '`❌ Disabled`', 
              inline: true 
            },
            { 
              name: '🚨 Raid Mode', 
              value: isRaidMode ? '`⚠️ ACTIVE`' : '`✅ Normal`', 
              inline: true 
            },
            { 
              name: '👥 Recent Joins', 
              value: `\`${joinCount}/${config.threshold}\``, 
              inline: true 
            },
            { 
              name: '📢 Log Channel', 
              value: config.channel_id ? `<#${config.channel_id}>` : '`Chưa set`', 
              inline: true 
            },
            { 
              name: '⏱️ Time Window', 
              value: `\`${config.timeWindow / 1000}s\``, 
              inline: true 
            },
            { 
              name: '🔨 Action', 
              value: `\`${config.action.toUpperCase()}\``, 
              inline: true 
            }
          )
          .setColor(isRaidMode ? 0xFF0000 : 0x5865F2)
          .setThumbnail(isRaidMode ? 'https://media.giphy.com/media/SvFocn0wNMx0iv2rYz/giphy.gif' : 'https://media.giphy.com/media/3oKIPic2BnoVZkRla8/giphy.gif')
          .setImage(isRaidMode ? 'https://media.giphy.com/media/l4FGHqHTFlLXdZy5q/giphy.gif' : null)
          .setFooter({ text: 'Sử dụng /antiraid để cấu hình', iconURL: interaction.guild?.iconURL() || undefined })
          .setTimestamp();

        await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
        break;

      case 'simulate':
        const currentConfig = antiRaidSystem.getConfig();
        
        if (!currentConfig.enabled) {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle('❌ Anti-Raid Disabled')
                .setDescription('Vui lòng bật Anti-Raid trước: `/antiraid enable`')
                .setColor(0xFF0000)
            ],
            ephemeral: true
          });
          return;
        }

        const simulateEmbed = new EmbedBuilder()
          .setTitle('🧪 Raid Simulation')
          .setDescription(
            '```diff\n! Đây là mô phỏng raid attack (test mode)\n```\n' +
            `**Giả sử:**\nCó **${currentConfig.threshold} users** join trong **${currentConfig.timeWindow / 1000}s**\n\n` +
            '**Hệ thống sẽ thực hiện:**\n' +
            '```yaml\n' +
            '1. ⚠️ Kích hoạt Raid Mode ngay lập tức\n' +
            `2. 🔨 ${currentConfig.action.toUpperCase()} tất cả raiders tự động\n` +
            '3. 📢 Gửi alert chi tiết vào log channel\n' +
            '4. 🛡️ Bảo vệ server trong 5 phút\n' +
            '5. ✅ Tự động tắt raid mode sau đó\n' +
            '```\n' +
            '💡 **Lưu ý:** Đây chỉ là simulation, không có user nào bị kick/ban thật.\n' +
            '> Để test thật, hãy dùng nhiều bot accounts và cho join cùng lúc.'
          )
          .setColor(0xFFA500)
          .setThumbnail('https://media.giphy.com/media/VbEloWwOz3QqYBsqIZ/giphy.gif')
          .setImage('https://media.giphy.com/media/l0HlNyrvLKBMxjFzG/giphy.gif')
          .setFooter({ text: '🧪 Test Mode - No Real Actions', iconURL: interaction.guild?.iconURL() || undefined })
          .setTimestamp();

        await interaction.reply({ embeds: [simulateEmbed], ephemeral: true });

        // Gửi thông báo vào log channel (nếu có)
        if (currentConfig.channel_id) {
          try {
            const logChannel = await interaction.client.channels.fetch(currentConfig.channel_id);
            if (logChannel && 'send' in logChannel) {
              const alertEmbed = new EmbedBuilder()
                .setTitle('🧪 RAID SIMULATION TEST')
                .setDescription(
                  `**${interaction.user.tag}** đã chạy raid simulation test\n\n` +
                  '⚠️ Đây là test, không phải raid thật!'
                )
                .addFields(
                  { name: '👥 Threshold', value: `${currentConfig.threshold} users`, inline: true },
                  { name: '⏱️ Time Window', value: `${currentConfig.timeWindow / 1000}s`, inline: true },
                  { name: '🔨 Action', value: currentConfig.action.toUpperCase(), inline: true }
                )
                .setColor(0xFFA500)
                .setTimestamp();

              await logChannel.send({ embeds: [alertEmbed] });
            }
          } catch (error) {
            console.error('❌ Không thể gửi simulation alert:', error);
          }
        }
        break;

      case 'reset':
        // Reset raid mode (nếu đang active)
        if (antiRaidSystem.isInRaidMode()) {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle('⚠️ Cannot Reset')
                .setDescription(
                  'Không thể reset khi đang trong Raid Mode!\n\n' +
                  'Raid mode sẽ tự động tắt sau 5 phút, hoặc bạn có thể:\n' +
                  '• Tắt Anti-Raid: `/antiraid disable`\n' +
                  '• Đợi raid mode tự tắt'
                )
                .setColor(0xFF0000)
            ],
            ephemeral: true
          });
          return;
        }

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('✅ Reset Complete')
              .setDescription(
                'Đã reset:\n' +
                '• Join records đã được xóa\n' +
                '• Raid mode: Normal\n' +
                '• System ready'
              )
              .setColor(0x00FF00)
              .setTimestamp()
          ],
          ephemeral: true
        });
        break;
    }
}
