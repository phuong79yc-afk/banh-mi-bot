import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { getLinkPreviewConfig, setLinkPreviewConfig } from '../utils/linkPreview';

export const data = new SlashCommandBuilder()
  .setName('linkpreview')
  .setDescription('🔗 Tự động fix link TikTok/Twitter/Instagram/Reddit để xem video')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand(sub =>
    sub
      .setName('enable')
      .setDescription('Bật Link Preview')
  )
  .addSubcommand(sub =>
    sub
      .setName('disable')
      .setDescription('Tắt Link Preview')
  )
  .addSubcommand(sub =>
    sub
      .setName('config')
      .setDescription('Cấu hình Link Preview')
      .addBooleanOption(opt =>
        opt
          .setName('delete_original')
          .setDescription('Xóa tin nhắn gốc sau khi fix link')
          .setRequired(false)
      )
      .addBooleanOption(opt =>
        opt
          .setName('custom_embed')
          .setDescription('Dùng custom embed của bot (TikTok only)')
          .setRequired(false)
      )
      .addStringOption(opt =>
        opt
          .setName('tiktok_service')
          .setDescription('Chọn TikTok service')
          .setRequired(false)
          .addChoices(
            { name: '🔥 tfxktok.com (có buttons)', value: 'tfxktok' },
            { name: '📺 tiktokez.com (video player sạch)', value: 'tiktokez' },
            { name: '⭐ tnktok.com (fxTikTok official)', value: 'tnktok' }
          )
      )
      .addStringOption(opt =>
        opt
          .setName('method')
          .setDescription('Chọn phương pháp xử lý TikTok')
          .setRequired(false)
          .addChoices(
            { name: '⚡ Fast (Fixed URL - nhanh)', value: 'fast' },
            { name: '📥 Download (Upload video - chậm nhưng ổn định)', value: 'download' }
          )
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('channel')
      .setDescription('Quản lý channels')
      .addStringOption(opt =>
        opt
          .setName('action')
          .setDescription('Hành động')
          .setRequired(true)
          .addChoices(
            { name: 'Allow Channel', value: 'allow' },
            { name: 'Block Channel', value: 'block' },
            { name: 'Remove Allow', value: 'remove_allow' },
            { name: 'Remove Block', value: 'remove_block' },
            { name: 'List', value: 'list' }
          )
      )
      .addChannelOption(opt =>
        opt
          .setName('channel')
          .setDescription('Channel')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('status')
      .setDescription('Xem trạng thái Link Preview')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ Lệnh này chỉ dùng trong server!', ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;
  const config = getLinkPreviewConfig(guildId);

  switch (subcommand) {
    case 'enable': {
      await interaction.deferReply();
      
      setLinkPreviewConfig(guildId, { enabled: true });
      
      const embed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('🔗 Link Fixer Enabled')
        .setDescription(
          '```diff\n+ Link Fixer đã được kích hoạt\n```\n' +
          '**Bot sẽ tự động fix links:**\n' +
          '• 🎥 TikTok → tfxktok.com (mặc định)\n' +
          '• 🐦 Twitter/X → fxtwitter.com\n' +
          '• 📷 Instagram → ddinstagram.com\n' +
          '• 🎮 Reddit → rxddit.com\n' +
          '• 🎬 YouTube Shorts\n' +
          '• 👥 Facebook Videos\n\n' +
          '**Discord sẽ tự động hiển thị:**\n' +
          '• Video player\n' +
          '• Stats (likes, comments, shares)\n' +
          '• Thumbnail/preview\n' +
          '• Native embed giống Bot Keto!\n\n' +
          '💡 Dùng `/linkpreview config tiktok_service:` để đổi service TikTok!'
        )
        .setThumbnail('https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif')
        .setFooter({ text: 'Dùng /linkpreview config để tùy chỉnh', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'disable': {
      await interaction.deferReply();
      
      setLinkPreviewConfig(guildId, { enabled: false });
      
      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('⚠️ Link Fixer Disabled')
        .setDescription(
          '```diff\n- Link Fixer đã được tắt\n```\n' +
          '⚠️ **Bot sẽ không còn fix links!**'
        )
        .setThumbnail('https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif')
        .setFooter({ text: '❌ Link Fixer Disabled', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'config': {
      await interaction.deferReply();
      
      const deleteOriginal = interaction.options.getBoolean('delete_original');
      const customEmbed = interaction.options.getBoolean('custom_embed');
      const tiktokService = interaction.options.getString('tiktok_service') as 'tfxktok' | 'tiktokez' | 'tnktok' | null;
      const method = interaction.options.getString('method') as 'fast' | 'download' | null;
      
      if (deleteOriginal !== null) {
        setLinkPreviewConfig(guildId, { deleteOriginal });
      }
      if (customEmbed !== null) {
        setLinkPreviewConfig(guildId, { useCustomEmbed: customEmbed });
      }
      if (tiktokService !== null) {
        setLinkPreviewConfig(guildId, { tiktokService });
      }
      if (method !== null) {
        setLinkPreviewConfig(guildId, { downloadMethod: method });
      }
      
      const updatedConfig = getLinkPreviewConfig(guildId);
      
      const serviceEmoji = {
        'tfxktok': '🔥',
        'tiktokez': '📺',
        'tnktok': '⭐'
      };
      
      const serviceName = {
        'tfxktok': 'tfxktok.com (có buttons)',
        'tiktokez': 'tiktokez.com (video player sạch)',
        'tnktok': 'tnktok.com (fxTikTok official)'
      };
      
      const methodEmoji = {
        'fast': '⚡',
        'download': '📥'
      };
      
      const methodName = {
        'fast': 'Fast (Fixed URL - nhanh)',
        'download': 'Download (Upload video - chậm)'
      };
      
      const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle('⚙️ Cấu Hình Link Fixer')
        .addFields(
          { name: '🗑️ Delete Original', value: updatedConfig.deleteOriginal ? '`✅ Bật`' : '`❌ Tắt`', inline: true },
          { name: '🎨 Custom Embed', value: updatedConfig.useCustomEmbed ? '`✅ Bật (TikTok)`' : '`❌ Tắt (Native)`', inline: true },
          { name: '🎥 TikTok Service', value: `${serviceEmoji[updatedConfig.tiktokService]} \`${serviceName[updatedConfig.tiktokService]}\``, inline: false },
          { name: '⚙️ Method', value: `${methodEmoji[updatedConfig.downloadMethod]} \`${methodName[updatedConfig.downloadMethod]}\``, inline: false },
          { name: '🌐 Platforms', value: '`TikTok, Twitter, Instagram, Reddit, YouTube, Facebook`', inline: false }
        )
        .setDescription(
          '**TikTok Methods:**\n' +
          '• ⚡ **Fast** - Gửi fixed URL, Discord tự fetch embed (nhanh)\n' +
          '• 📥 **Download** - Download và upload video (chậm hơn nhưng luôn hoạt động)\n\n' +
          '**TikTok Services:**\n' +
          '• 🔥 **tfxktok** - Có buttons (Open/Get Keto+)\n' +
          '• 📺 **tiktokez** - Video player sạch\n' +
          '• ⭐ **tnktok** - fxTikTok official (ổn định nhất)'
        )
        .setFooter({ text: 'Link Fixer Settings', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'channel': {
      const action = interaction.options.getString('action', true);
      const channel = interaction.options.getChannel('channel');

      switch (action) {
        case 'allow':
          if (!channel) {
            await interaction.reply({ content: '❌ Vui lòng chọn channel!', ephemeral: true });
            return;
          }
          if (!config.allowedChannels.includes(channel.id)) {
            config.allowedChannels.push(channel.id);
            setLinkPreviewConfig(guildId, config);
          }
          await interaction.reply({ content: `✅ Đã cho phép Link Preview trong ${channel}!`, ephemeral: true });
          break;

        case 'block':
          if (!channel) {
            await interaction.reply({ content: '❌ Vui lòng chọn channel!', ephemeral: true });
            return;
          }
          if (!config.blockedChannels.includes(channel.id)) {
            config.blockedChannels.push(channel.id);
            setLinkPreviewConfig(guildId, config);
          }
          await interaction.reply({ content: `✅ Đã chặn Link Preview trong ${channel}!`, ephemeral: true });
          break;

        case 'remove_allow':
          if (!channel) {
            await interaction.reply({ content: '❌ Vui lòng chọn channel!', ephemeral: true });
            return;
          }
          config.allowedChannels = config.allowedChannels.filter(id => id !== channel.id);
          setLinkPreviewConfig(guildId, config);
          await interaction.reply({ content: `✅ Đã xóa ${channel} khỏi allowed list!`, ephemeral: true });
          break;

        case 'remove_block':
          if (!channel) {
            await interaction.reply({ content: '❌ Vui lòng chọn channel!', ephemeral: true });
            return;
          }
          config.blockedChannels = config.blockedChannels.filter(id => id !== channel.id);
          setLinkPreviewConfig(guildId, config);
          await interaction.reply({ content: `✅ Đã xóa ${channel} khỏi blocked list!`, ephemeral: true });
          break;

        case 'list': {
          const allowedText = config.allowedChannels.length > 0
            ? config.allowedChannels.map(id => `<#${id}>`).join(', ')
            : 'Tất cả channels (nếu không có blocked)';
          const blockedText = config.blockedChannels.length > 0
            ? config.blockedChannels.map(id => `<#${id}>`).join(', ')
            : 'Không có';

          const embed = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle('📋 Channel Settings')
            .addFields(
              { name: '✅ Allowed Channels', value: allowedText, inline: false },
              { name: '❌ Blocked Channels', value: blockedText, inline: false }
            )
            .setFooter({ text: 'Nếu allowed list trống, sẽ hoạt động ở tất cả channels trừ blocked' })
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
      }
      break;
    }

    case 'status': {
      await interaction.deferReply();
      
      const serviceEmoji = {
        'tfxktok': '🔥',
        'tiktokez': '📺',
        'tnktok': '⭐'
      };
      
      const serviceName = {
        'tfxktok': 'tfxktok.com',
        'tiktokez': 'tiktokez.com',
        'tnktok': 'tnktok.com'
      };
      
      const embed = new EmbedBuilder()
        .setColor(config.enabled ? 0x22c55e : 0xef4444)
        .setTitle('📊 Link Fixer Status')
        .setDescription(
          config.enabled 
            ? '```diff\n+ ✅ Link Fixer đang hoạt động\n```\n**Bot sẽ fix links và Discord tự động tạo embed native!**' 
            : '```diff\n- ❌ Link Fixer đang tắt\n```\n**Bot không fix links!**'
        )
        .addFields(
          { 
            name: '🔗 Supported Platforms', 
            value: 
              `• 🎥 **TikTok** → ${serviceName[config.tiktokService]} ${serviceEmoji[config.tiktokService]}\n` +
              '• 🐦 **Twitter/X** → fxtwitter.com\n' +
              '• 📷 **Instagram** → ddinstagram.com\n' +
              '• 🎮 **Reddit** → rxddit.com\n' +
              '• 🎬 **YouTube Shorts**\n' +
              '• 👥 **Facebook Videos**',
            inline: false 
          },
          { name: '🎨 Custom Embed', value: config.useCustomEmbed ? '`✅ Bật`' : '`❌ Tắt (Native)`', inline: true },
          { name: '🗑️ Delete Original', value: config.deleteOriginal ? '`✅ Bật`' : '`❌ Tắt`', inline: true },
          { name: '✅ Allowed', value: config.allowedChannels.length > 0 ? `\`${config.allowedChannels.length}\` channels` : '`Tất cả`', inline: true },
          { name: '❌ Blocked', value: config.blockedChannels.length > 0 ? `\`${config.blockedChannels.length}\` channels` : '`Không có`', inline: true }
        )
        .setThumbnail(config.enabled ? 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif' : 'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif')
        .setFooter({ 
          text: `${serviceEmoji[config.tiktokService]} TikTok: ${serviceName[config.tiktokService]}`, 
          iconURL: interaction.guild?.iconURL() || undefined 
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      break;
    }
  }
}
