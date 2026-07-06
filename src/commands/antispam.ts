import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { antiSpamSystem } from '../utils/antiSpam';

export const data = new SlashCommandBuilder()
  .setName('antispam')
  .setDescription('🛡️ Chống spam tin nhắn, mention, emoji flood')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand(sub =>
    sub
      .setName('enable')
      .setDescription('Bật Anti-Spam')
  )
  .addSubcommand(sub =>
    sub
      .setName('disable')
      .setDescription('Tắt Anti-Spam')
  )
  .addSubcommand(sub =>
    sub
      .setName('config')
      .setDescription('Cấu hình Anti-Spam')
      .addIntegerOption(opt =>
        opt
          .setName('max_messages')
          .setDescription('Số tin nhắn tối đa trong time window (mặc định: 5)')
          .setMinValue(2)
          .setMaxValue(20)
          .setRequired(false)
      )
      .addIntegerOption(opt =>
        opt
          .setName('time_window')
          .setDescription('Time window (giây) - mặc định: 5s')
          .setMinValue(1)
          .setMaxValue(60)
          .setRequired(false)
      )
      .addIntegerOption(opt =>
        opt
          .setName('max_mentions')
          .setDescription('Số mention tối đa trong 1 tin nhắn (mặc định: 5)')
          .setMinValue(1)
          .setMaxValue(20)
          .setRequired(false)
      )
      .addIntegerOption(opt =>
        opt
          .setName('max_emojis')
          .setDescription('Số emoji tối đa trong 1 tin nhắn (mặc định: 10)')
          .setMinValue(5)
          .setMaxValue(50)
          .setRequired(false)
      )
      .addIntegerOption(opt =>
        opt
          .setName('mute_duration')
          .setDescription('Thời gian mute (phút) - mặc định: 5 phút')
          .setMinValue(1)
          .setMaxValue(1440)
          .setRequired(false)
      )
      .addBooleanOption(opt =>
        opt
          .setName('auto_delete')
          .setDescription('Tự động xóa tin nhắn spam')
          .setRequired(false)
      )
      .addBooleanOption(opt =>
        opt
          .setName('auto_mute')
          .setDescription('Tự động mute spammers')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('whitelist')
      .setDescription('Quản lý whitelist')
      .addStringOption(opt =>
        opt
          .setName('action')
          .setDescription('Hành động')
          .setRequired(true)
          .addChoices(
            { name: 'Add Role', value: 'add_role' },
            { name: 'Remove Role', value: 'remove_role' },
            { name: 'Add Channel', value: 'add_channel' },
            { name: 'Remove Channel', value: 'remove_channel' },
            { name: 'List', value: 'list' }
          )
      )
      .addRoleOption(opt =>
        opt
          .setName('role')
          .setDescription('Role để whitelist')
          .setRequired(false)
      )
      .addChannelOption(opt =>
        opt
          .setName('channel')
          .setDescription('Channel để whitelist')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('status')
      .setDescription('Xem trạng thái và thống kê Anti-Spam')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ Lệnh này chỉ dùng trong server!', ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;

  switch (subcommand) {
    case 'enable': {
      await interaction.deferReply(); // Defer để tránh timeout
      
      antiSpamSystem.setEnabled(guildId, true);
      
      const embed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('🛡️ Anti-Spam Enabled')
        .setDescription(
          '```diff\n+ Hệ thống Anti-Spam đã được kích hoạt\n```\n' +
          '**Bot sẽ tự động phát hiện:**\n' +
          '• 📨 Message spam (nhiều tin nhắn liên tục)\n' +
          '• 👥 Mention spam (@everyone/@here flood)\n' +
          '• 😀 Emoji flood (spam emoji)\n\n' +
          '**Hành động:**\n' +
          '• 🗑️ Xóa tin nhắn spam\n' +
          '• 🔇 Mute spammers tự động'
        )
        .addFields(
          { name: '🗑️ Auto Delete', value: '`Bật`', inline: true },
          { name: '🔇 Auto Mute', value: '`Bật`', inline: true },
          { name: '⏲️ Mute Duration', value: '`5 phút`', inline: true }
        )
        .setThumbnail('https://media.giphy.com/media/xUPGcJ9uOAezHHfFlu/giphy.gif')
        .setFooter({ text: 'Dùng /antispam config để tùy chỉnh', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'disable': {
      await interaction.deferReply(); // Defer để tránh timeout
      
      antiSpamSystem.setEnabled(guildId, false);
      
      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('⚠️ Anti-Spam Disabled')
        .setDescription(
          '```diff\n- Hệ thống Anti-Spam đã được tắt\n```\n' +
          '⚠️ **Bot sẽ không còn xử lý spam messages!**'
        )
        .setThumbnail('https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif')
        .setFooter({ text: '❌ Protection Disabled', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'config': {
      await interaction.deferReply(); // Defer để tránh timeout
      
      const maxMessages = interaction.options.getInteger('max_messages');
      const timeWindow = interaction.options.getInteger('time_window');
      const maxMentions = interaction.options.getInteger('max_mentions');
      const maxEmojis = interaction.options.getInteger('max_emojis');
      const muteDuration = interaction.options.getInteger('mute_duration');
      const autoDelete = interaction.options.getBoolean('auto_delete');
      const autoMute = interaction.options.getBoolean('auto_mute');

      const updates: any = {};
      if (maxMessages) updates.maxMessages = maxMessages;
      if (timeWindow) updates.timeWindow = timeWindow;
      if (maxMentions) updates.maxMentions = maxMentions;
      if (maxEmojis) updates.maxEmojis = maxEmojis;
      if (muteDuration) updates.muteDuration = muteDuration;
      if (autoDelete !== null) updates.autoDelete = autoDelete;
      if (autoMute !== null) updates.autoMute = autoMute;

      antiSpamSystem.updateConfig(guildId, updates);
      const config = antiSpamSystem.getConfig(guildId);

      const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle('⚙️ Cấu Hình Đã Cập Nhật')
        .addFields(
          { name: '📨 Max Messages', value: `${config.maxMessages} tin nhắn / ${config.timeWindow}s`, inline: true },
          { name: '👥 Max Mentions', value: `${config.maxMentions} mentions`, inline: true },
          { name: '😀 Max Emojis', value: `${config.maxEmojis} emojis`, inline: true },
          { name: '🗑️ Auto Delete', value: config.autoDelete ? '✅ Bật' : '❌ Tắt', inline: true },
          { name: '🔇 Auto Mute', value: config.autoMute ? '✅ Bật' : '❌ Tắt', inline: true },
          { name: '⏲️ Mute Duration', value: `${config.muteDuration} phút`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'whitelist': {
      const action = interaction.options.getString('action', true);
      const role = interaction.options.getRole('role');
      const channel = interaction.options.getChannel('channel');

      switch (action) {
        case 'add_role':
          if (!role) {
            await interaction.reply({ content: '❌ Vui lòng chọn role!', ephemeral: true });
            return;
          }
          antiSpamSystem.addWhitelistedRole(guildId, role.id);
          await interaction.reply({ content: `✅ Đã thêm role ${role} vào whitelist!`, ephemeral: true });
          break;

        case 'remove_role':
          if (!role) {
            await interaction.reply({ content: '❌ Vui lòng chọn role!', ephemeral: true });
            return;
          }
          antiSpamSystem.removeWhitelistedRole(guildId, role.id);
          await interaction.reply({ content: `✅ Đã xóa role ${role} khỏi whitelist!`, ephemeral: true });
          break;

        case 'add_channel':
          if (!channel) {
            await interaction.reply({ content: '❌ Vui lòng chọn channel!', ephemeral: true });
            return;
          }
          antiSpamSystem.addWhitelistedChannel(guildId, channel.id);
          await interaction.reply({ content: `✅ Đã thêm channel ${channel} vào whitelist!`, ephemeral: true });
          break;

        case 'remove_channel':
          if (!channel) {
            await interaction.reply({ content: '❌ Vui lòng chọn channel!', ephemeral: true });
            return;
          }
          antiSpamSystem.removeWhitelistedChannel(guildId, channel.id);
          await interaction.reply({ content: `✅ Đã xóa channel ${channel} khỏi whitelist!`, ephemeral: true });
          break;

        case 'list': {
          const config = antiSpamSystem.getConfig(guildId);
          const rolesText = config.whitelistedRoles.length > 0
            ? config.whitelistedRoles.map(id => `<@&${id}>`).join(', ')
            : 'Không có';
          const channelsText = config.whitelistedChannels.length > 0
            ? config.whitelistedChannels.map(id => `<#${id}>`).join(', ')
            : 'Không có';

          const embed = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle('📋 Anti-Spam Whitelist')
            .addFields(
              { name: '👥 Roles', value: rolesText, inline: false },
              { name: '📢 Channels', value: channelsText, inline: false }
            )
            .setFooter({ text: 'Roles và channels trong whitelist không bị kiểm tra spam' })
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
      }
      break;
    }

    case 'status': {
      await interaction.deferReply(); // Defer để tránh timeout
      
      const config = antiSpamSystem.getConfig(guildId);
      const stats = antiSpamSystem.getStats(guildId);

      const embed = new EmbedBuilder()
        .setColor(config.enabled ? 0x22c55e : 0xef4444)
        .setTitle('📊 Anti-Spam Status')
        .setDescription(
          config.enabled 
            ? '```diff\n+ ✅ Anti-Spam đang hoạt động\n```\n**Bảo vệ server khỏi spam!**' 
            : '```diff\n- ❌ Anti-Spam đang tắt\n```\n**Server không được bảo vệ!**'
        )
        .addFields(
          { name: '📨 Max Messages', value: `\`${config.maxMessages}\` tin nhắn / \`${config.timeWindow}s\``, inline: true },
          { name: '👥 Max Mentions', value: `\`${config.maxMentions}\` mentions`, inline: true },
          { name: '😀 Max Emojis', value: `\`${config.maxEmojis}\` emojis`, inline: true },
          { name: '🗑️ Auto Delete', value: config.autoDelete ? '`✅ Bật`' : '`❌ Tắt`', inline: true },
          { name: '🔇 Auto Mute', value: config.autoMute ? '`✅ Bật`' : '`❌ Tắt`', inline: true },
          { name: '⏲️ Mute Duration', value: `\`${config.muteDuration} phút\``, inline: true },
          { name: '📋 Whitelist', value: `\`${config.whitelistedRoles.length}\` roles\n\`${config.whitelistedChannels.length}\` channels`, inline: true },
          { name: '📊 Thống kê', value: `\`${stats.totalDetections}\` spam phát hiện\n\`${stats.totalDeletes}\` tin nhắn xóa\n\`${stats.totalMutes}\` users muted`, inline: true }
        )
        .setThumbnail(config.enabled ? 'https://media.giphy.com/media/l1J9FiGxR61OcF2mI/giphy.gif' : 'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif')
        .setImage(config.enabled ? 'https://media.giphy.com/media/3oKIPic2BnoVZkRla8/giphy.gif' : null)
        .setFooter({ text: 'Dùng /antispam config để thay đổi', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      break;
    }
  }
}
