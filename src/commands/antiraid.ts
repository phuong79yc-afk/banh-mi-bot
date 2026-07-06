import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { antiRaidSystem } from '../utils/antiRaid';

export const data = new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('🛡️ Hệ thống chống raid tự động')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Bật Anti-Raid')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Tắt Anti-Raid')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('config')
        .setDescription('Xem cấu hình Anti-Raid')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('setchannel')
        .setDescription('Set channel để log raid')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel để gửi log')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('setthreshold')
        .setDescription('Set số lượng user join để kích hoạt raid mode')
        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('Số lượng user (mặc định: 5)')
            .setRequired(true)
            .setMinValue(2)
            .setMaxValue(20)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('settime')
        .setDescription('Set thời gian tính raid (giây)')
        .addIntegerOption(option =>
          option
            .setName('seconds')
            .setDescription('Số giây (mặc định: 10)')
            .setRequired(true)
            .setMinValue(5)
            .setMaxValue(60)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('setaction')
        .setDescription('Set hành động với raiders')
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Kick hoặc Ban')
            .setRequired(true)
            .addChoices(
              { name: 'Kick', value: 'kick' },
              { name: 'Ban', value: 'ban' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Xem trạng thái raid hiện tại')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('whitelist')
        .setDescription('Quản lý whitelist')
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Thêm hoặc xóa')
            .setRequired(true)
            .addChoices(
              { name: 'Add Role', value: 'add_role' },
              { name: 'Remove Role', value: 'remove_role' },
              { name: 'Add User', value: 'add_user' },
              { name: 'Remove User', value: 'remove_user' },
              { name: 'List', value: 'list' }
            )
        )
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Role để whitelist')
            .setRequired(false)
        )
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User để whitelist')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('accountage')
        .setDescription('Yêu cầu tuổi tài khoản tối thiểu')
        .addIntegerOption(option =>
          option
            .setName('days')
            .setDescription('Số ngày tối thiểu (0 = tắt)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(365)
        )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'enable':
        antiRaidSystem.setEnabled(true);
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('🛡️ Anti-Raid Enabled')
              .setDescription(
                '```diff\n+ Hệ thống Anti-Raid đã được kích hoạt\n```\n' +
                '**Bot sẽ tự động:**\n' +
                '• 🔍 Phát hiện raid attacks\n' +
                '• 🔨 Kick/Ban raiders tự động\n' +
                '• 📝 Ghi log vào channel\n' +
                '• 🚨 Kích hoạt raid mode khi cần'
              )
              .setColor(0x00FF00)
              .setThumbnail('https://media.giphy.com/media/3o7TKSx0g7RqRniGFG/giphy.gif')
              .setFooter({ text: '✅ Protection Active', iconURL: interaction.guild?.iconURL() || undefined })
              .setTimestamp()
          ],
          ephemeral: true
        });
        break;

      case 'disable':
        antiRaidSystem.setEnabled(false);
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('⚠️ Anti-Raid Disabled')
              .setDescription(
                '```diff\n- Hệ thống Anti-Raid đã được tắt\n```\n' +
                '⚠️ **Server không còn được bảo vệ khỏi raid attacks!**'
              )
              .setColor(0xFF0000)
              .setThumbnail('https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif')
              .setFooter({ text: '❌ Protection Disabled', iconURL: interaction.guild?.iconURL() || undefined })
              .setTimestamp()
          ],
          ephemeral: true
        });
        break;

      case 'config':
        const config = antiRaidSystem.getConfig();
        const isActive = antiRaidSystem.isInRaidMode();
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('⚙️ Anti-Raid Configuration')
              .setDescription(
                '**Cấu hình hiện tại:**\n' +
                `> 🔘 Status: ${config.enabled ? '**✅ Enabled**' : '**❌ Disabled**'}\n` +
                `> 🚨 Raid Mode: ${isActive ? '**⚠️ ACTIVE**' : '**✅ Normal**'}`
              )
              .addFields(
                { name: '👥 Threshold', value: `\`${config.threshold} users\``, inline: true },
                { name: '⏱️ Time Window', value: `\`${config.timeWindow / 1000}s\``, inline: true },
                { name: '🔨 Action', value: `\`${config.action.toUpperCase()}\``, inline: true },
                { name: '📢 Log Channel', value: config.channel_id ? `<#${config.channel_id}>` : '`Chưa set`', inline: true },
                { name: '📅 Min Account Age', value: config.minAccountAge ? `\`${config.minAccountAge} ngày\`` : '`Không giới hạn`', inline: true },
                { name: '📋 Whitelist', value: `\`${config.whitelistedRoles?.length || 0}\` roles\n\`${config.whitelistedUsers?.length || 0}\` users`, inline: true }
              )
              .setColor(isActive ? 0xFF0000 : 0x5865F2)
              .setThumbnail(isActive ? 'https://media.giphy.com/media/l4FGHqHTFlLXdZy5q/giphy.gif' : 'https://media.giphy.com/media/3oKIPic2BnoVZkRla8/giphy.gif')
              .setFooter({ text: 'Dùng /antiraid để thay đổi cấu hình', iconURL: interaction.guild?.iconURL() || undefined })
              .setTimestamp()
          ],
          ephemeral: true
        });
        break;

      case 'setchannel':
        const channel = interaction.options.getChannel('channel', true);
        antiRaidSystem.setLogChannel(channel.id);
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('✅ Log Channel Updated')
              .setDescription(`Log channel đã được set thành <#${channel.id}>`)
              .setColor(0x00FF00)
              .setTimestamp()
          ],
          ephemeral: true
        });
        break;

      case 'setthreshold':
        const threshold = interaction.options.getInteger('amount', true);
        antiRaidSystem.setThreshold(threshold);
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('✅ Threshold Updated')
              .setDescription(`Threshold đã được set thành **${threshold} users**`)
              .setColor(0x00FF00)
              .setTimestamp()
          ],
          ephemeral: true
        });
        break;

      case 'settime':
        const seconds = interaction.options.getInteger('seconds', true);
        antiRaidSystem.setTimeWindow(seconds);
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('✅ Time Window Updated')
              .setDescription(`Time window đã được set thành **${seconds} seconds**`)
              .setColor(0x00FF00)
              .setTimestamp()
          ],
          ephemeral: true
        });
        break;

      case 'setaction':
        const action = interaction.options.getString('action', true) as 'kick' | 'ban';
        antiRaidSystem.setAction(action);
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('✅ Action Updated')
              .setDescription(`Action đã được set thành **${action.toUpperCase()}**`)
              .setColor(0x00FF00)
              .setTimestamp()
          ],
          ephemeral: true
        });
        break;

      case 'status':
        const currentConfig = antiRaidSystem.getConfig();
        const isRaidMode = antiRaidSystem.isInRaidMode();
        const joinCount = antiRaidSystem.getJoinCount();

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(isRaidMode ? '🚨 RAID MODE - ACTIVE' : '✅ Status - Normal')
              .setDescription(
                isRaidMode 
                  ? '```diff\n- ⚠️ RAID DETECTED! Server đang trong protection mode\n```\n' +
                    '**Hệ thống đang:**\n' +
                    '• 🛡️ Chặn raiders tự động\n' +
                    '• 📝 Ghi log tất cả hoạt động\n' +
                    '• ⏰ Tự động tắt sau 5 phút'
                  : '```diff\n+ ✅ Server đang an toàn và hoạt động bình thường\n```'
              )
              .addFields(
                { name: '👥 Recent Joins', value: `\`${joinCount}/${currentConfig.threshold}\``, inline: true },
                { name: '⏱️ Time Window', value: `\`${currentConfig.timeWindow / 1000}s\``, inline: true },
                { name: '🔨 Action', value: `\`${currentConfig.action.toUpperCase()}\``, inline: true },
                { name: '📅 Min Account Age', value: currentConfig.minAccountAge ? `\`${currentConfig.minAccountAge} ngày\`` : '`Không giới hạn`', inline: true },
                { name: '📋 Whitelist', value: `\`${currentConfig.whitelistedRoles?.length || 0}\` roles\n\`${currentConfig.whitelistedUsers?.length || 0}\` users`, inline: true }
              )
              .setColor(isRaidMode ? 0xFF0000 : 0x00FF00)
              .setImage(isRaidMode ? 'https://media.giphy.com/media/SvFocn0wNMx0iv2rYz/giphy.gif' : 'https://media.giphy.com/media/3oKIPic2BnoVZkRla8/giphy.gif')
              .setFooter({ text: isRaidMode ? '⚠️ Protection Active' : '✅ All Clear', iconURL: interaction.guild?.iconURL() || undefined })
              .setTimestamp()
          ],
          ephemeral: true
        });
        break;

      case 'whitelist': {
        const action = interaction.options.getString('action', true);
        const role = interaction.options.getRole('role');
        const user = interaction.options.getUser('user');

        switch (action) {
          case 'add_role':
            if (!role) {
              await interaction.reply({ content: '❌ Vui lòng chọn role!', ephemeral: true });
              return;
            }
            antiRaidSystem.addWhitelistedRole(role.id);
            await interaction.reply({ content: `✅ Đã thêm role ${role} vào whitelist!`, ephemeral: true });
            break;

          case 'remove_role':
            if (!role) {
              await interaction.reply({ content: '❌ Vui lòng chọn role!', ephemeral: true });
              return;
            }
            antiRaidSystem.removeWhitelistedRole(role.id);
            await interaction.reply({ content: `✅ Đã xóa role ${role} khỏi whitelist!`, ephemeral: true });
            break;

          case 'add_user':
            if (!user) {
              await interaction.reply({ content: '❌ Vui lòng chọn user!', ephemeral: true });
              return;
            }
            antiRaidSystem.addWhitelistedUser(user.id);
            await interaction.reply({ content: `✅ Đã thêm user ${user} vào whitelist!`, ephemeral: true });
            break;

          case 'remove_user':
            if (!user) {
              await interaction.reply({ content: '❌ Vui lòng chọn user!', ephemeral: true });
              return;
            }
            antiRaidSystem.removeWhitelistedUser(user.id);
            await interaction.reply({ content: `✅ Đã xóa user ${user} khỏi whitelist!`, ephemeral: true });
            break;

          case 'list': {
            const config = antiRaidSystem.getConfig();
            const rolesText = config.whitelistedRoles && config.whitelistedRoles.length > 0
              ? config.whitelistedRoles.map(id => `<@&${id}>`).join(', ')
              : 'Không có';
            const usersText = config.whitelistedUsers && config.whitelistedUsers.length > 0
              ? config.whitelistedUsers.map(id => `<@${id}>`).join(', ')
              : 'Không có';

            const embed = new EmbedBuilder()
              .setColor(0x8b5cf6)
              .setTitle('📋 Anti-Raid Whitelist')
              .addFields(
                { name: '👥 Roles', value: rolesText, inline: false },
                { name: '👤 Users', value: usersText, inline: false }
              )
              .setFooter({ text: 'Users và roles trong whitelist sẽ không bị kick/ban khi raid' })
              .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            break;
          }
        }
        break;
      }

      case 'accountage': {
        const days = interaction.options.getInteger('days', true);
        antiRaidSystem.setMinAccountAge(days);
        
        const embed = new EmbedBuilder()
          .setTitle('✅ Account Age Updated')
          .setDescription(
            days > 0 
              ? `Tài khoản mới join phải tồn tại ít nhất **${days} ngày**\n\n` +
                '⚠️ Tài khoản mới hơn sẽ bị tự động kick khi raid mode active.'
              : 'Đã tắt kiểm tra tuổi tài khoản'
          )
          .setColor(0x00FF00)
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        break;
      }
    }
}
