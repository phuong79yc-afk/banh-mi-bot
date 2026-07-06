import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, EmbedBuilder } from 'discord.js';

// Cấu hình Anti-MrBeast cho mỗi guild
const antiMrBeastConfig = new Map<string, {
  enabled: boolean;
  autoDelete: boolean;
  autoTimeout: boolean;
  timeoutDuration: number; // phút
  logChannelId: string | null;
  whitelistedRoles: string[];
  whitelistedUsers: string[];
  blockImageOnly: boolean; // Chặn ảnh không có text
}>();

// Các từ khóa nghi ngờ
const SUSPICIOUS_KEYWORDS = [
  'mrbeast',
  'mr beast',
  'mr.beast',
  'giveaway',
  'free nitro',
  'nitro gift',
  '@everyone',
  'click here',
  'claim now',
  'limited time',
  'discord.com',
  'discord.gift',
  'steam',
  'steamcommunity',
  'promo code',
  'activate code',
  'withdrawal',
  'rakeback',
  'betting',
  'casino',
  'crypto',
  'bitcoin'
];

// Patterns nguy hiểm
const DANGEROUS_PATTERNS = [
  /discord\s*\.\s*gift/i,
  /discord\s*\.\s*com\/gifts?/i,
  /nitro\s*giveaway/i,
  /free\s*nitro/i,
  /mrbeast/i,
  /mr\s*beast/i,
  /@everyone/i,
  /steamcommunity/i
];

export function isSuspiciousMessage(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  // Kiểm tra keywords
  const keywordCount = SUSPICIOUS_KEYWORDS.filter(keyword => 
    lowerContent.includes(keyword.toLowerCase())
  ).length;
  
  // Nếu có 2+ keywords nghi ngờ = rất nguy hiểm
  if (keywordCount >= 2) return true;
  
  // Kiểm tra patterns
  const hasPattern = DANGEROUS_PATTERNS.some(pattern => pattern.test(content));
  if (hasPattern) return true;
  
  return false;
}

// Kiểm tra ảnh có chứa URL spam không
export function isSuspiciousImageMessage(hasImage: boolean, content: string, embedUrls: string[], blockImageOnly: boolean = false): boolean {
  // Nếu không có ảnh, return false
  if (!hasImage) return false;
  
  const lowerContent = content.toLowerCase();
  const allUrls = embedUrls.join(' ').toLowerCase();
  
  // Pattern 0: Chỉ ảnh không có text (nếu blockImageOnly = true)
  const textLength = content.trim().length;
  if (blockImageOnly && textLength < 10) {
    return true; // Chặn ảnh không có description
  }
  
  // Pattern 1: Ảnh + @everyone/here = nghi ngờ cao
  if (/@(everyone|here)/i.test(content)) {
    return true;
  }
  
  // Pattern 2: Ảnh + suspicious keywords
  const suspiciousWithImage = [
    'free', 'giveaway', 'nitro', 'mrbeast', 'claim', 'gift', 'limited',
    'promo', 'code', 'withdrawal', 'betting', 'casino', 'crypto', 'win'
  ];
  
  const keywordCount = suspiciousWithImage.filter(keyword => 
    lowerContent.includes(keyword)
  ).length;
  
  // Ảnh + 2+ keywords = spam
  if (keywordCount >= 2) return true;
  
  // Pattern 3: Ảnh + URL nghi ngờ trong embeds
  const suspiciousUrlPatterns = [
    /discord\.gift/i,
    /discordgift/i,
    /steamcommunity\.com\/gift/i,
    /free.*nitro/i,
    /nitro.*free/i
  ];
  
  if (suspiciousUrlPatterns.some(pattern => pattern.test(allUrls))) {
    return true;
  }
  
  // Pattern 4: Chỉ có ảnh + @everyone (no text) = spam
  if (textLength < 50 && /@(everyone|here)/i.test(content)) {
    return true;
  }
  
  return false;
}

export function getAntiMrBeastConfig(guildId: string) {
  if (!antiMrBeastConfig.has(guildId)) {
    antiMrBeastConfig.set(guildId, {
      enabled: false,
      autoDelete: true,
      autoTimeout: true,
      timeoutDuration: 10, // 10 phút mặc định
      logChannelId: null,
      whitelistedRoles: [],
      whitelistedUsers: [],
      blockImageOnly: false // Mặc định không chặn ảnh không text
    });
  }
  return antiMrBeastConfig.get(guildId)!;
}

export function setAntiMrBeastConfig(guildId: string, config: Partial<typeof antiMrBeastConfig extends Map<string, infer T> ? T : never>) {
  const current = getAntiMrBeastConfig(guildId);
  antiMrBeastConfig.set(guildId, { ...current, ...config });
}

export const data = new SlashCommandBuilder()
  .setName('antimrbeast')
  .setDescription('🛡️ Chống tin nhắn spam/scam giả mạo MrBeast và các giveaway giả')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand(sub =>
    sub
      .setName('enable')
      .setDescription('Bật chế độ Anti-MrBeast')
  )
  .addSubcommand(sub =>
    sub
      .setName('disable')
      .setDescription('Tắt chế độ Anti-MrBeast')
  )
  .addSubcommand(sub =>
    sub
      .setName('config')
      .setDescription('Cấu hình Anti-MrBeast')
      .addBooleanOption(opt =>
        opt
          .setName('autodelete')
          .setDescription('Tự động xóa tin nhắn nghi ngờ')
          .setRequired(false)
      )
      .addBooleanOption(opt =>
        opt
          .setName('autotimeout')
          .setDescription('Tự động timeout người gửi')
          .setRequired(false)
      )
      .addIntegerOption(opt =>
        opt
          .setName('timeout_duration')
          .setDescription('Thời gian timeout (phút)')
          .setMinValue(1)
          .setMaxValue(1440)
          .setRequired(false)
      )
      .addChannelOption(opt =>
        opt
          .setName('log_channel')
          .setDescription('Kênh để ghi log')
          .setRequired(false)
      )
      .addBooleanOption(opt =>
        opt
          .setName('block_image_only')
          .setDescription('Chặn ảnh không có text/mô tả (strict mode)')
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
            { name: 'Add User', value: 'add_user' },
            { name: 'Remove User', value: 'remove_user' },
            { name: 'List', value: 'list' }
          )
      )
      .addRoleOption(opt =>
        opt
          .setName('role')
          .setDescription('Role để whitelist')
          .setRequired(false)
      )
      .addUserOption(opt =>
        opt
          .setName('user')
          .setDescription('User để whitelist')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('status')
      .setDescription('Xem trạng thái cấu hình Anti-MrBeast')
  )
  .addSubcommand(sub =>
    sub
      .setName('test')
      .setDescription('Test một tin nhắn có bị coi là nghi ngờ không')
      .addStringOption(opt =>
        opt
          .setName('message')
          .setDescription('Nội dung tin nhắn để test')
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ Lệnh này chỉ dùng trong server!', ephemeral: true });
    return;
  }

  const subcommand = interaction.options.data[0]?.name;
  const guildId = interaction.guild.id;
  const config = getAntiMrBeastConfig(guildId);

  switch (subcommand) {
    case 'enable': {
      config.enabled = true;
      setAntiMrBeastConfig(guildId, config);
      
      const embed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('🛡️ Anti-MrBeast Enabled')
        .setDescription(
          '```diff\n+ Hệ thống Anti-MrBeast đã được kích hoạt\n```\n' +
          '**Bot sẽ tự động phát hiện:**\n' +
          '• 🎁 Giveaway giả mạo MrBeast\n' +
          '• 🎮 Discord Nitro scam\n' +
          '• 🖼️ Image spam với @everyone\n' +
          '• 🔗 URL nguy hiểm\n\n' +
          '**Hành động:**\n' +
          `• ${config.autoDelete ? '🗑️ Xóa tin nhắn' : '⚠️ Cảnh báo'}\n` +
          `• ${config.autoTimeout ? '⏱️ Timeout người gửi' : '📝 Ghi log'}`
        )
        .addFields(
          { name: '🗑️ Auto Delete', value: config.autoDelete ? '`Bật`' : '`Tắt`', inline: true },
          { name: '⏱️ Auto Timeout', value: config.autoTimeout ? '`Bật`' : '`Tắt`', inline: true },
          { name: '⏲️ Timeout Duration', value: `\`${config.timeoutDuration} phút\``, inline: true }
        )
        .setThumbnail('https://media.giphy.com/media/QC7UQbxq89MnL9r6AN/giphy.gif')
        .setFooter({ text: 'Dùng /antimrbeast config để tùy chỉnh', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      break;
    }

    case 'disable': {
      config.enabled = false;
      setAntiMrBeastConfig(guildId, config);
      
      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('⚠️ Anti-MrBeast Disabled')
        .setDescription(
          '```diff\n- Hệ thống Anti-MrBeast đã được tắt\n```\n' +
          '⚠️ **Server không còn được bảo vệ khỏi spam/scam!**'
        )
        .setThumbnail('https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif')
        .setFooter({ text: '❌ Protection Disabled', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      break;
    }

    case 'config': {
      const autoDelete = interaction.options.get('autodelete')?.value as boolean | undefined;
      const autoTimeout = interaction.options.get('autotimeout')?.value as boolean | undefined;
      const timeoutDuration = interaction.options.get('timeout_duration')?.value as number | undefined;
      const logChannel = interaction.options.get('log_channel')?.channel as TextChannel | undefined;
      const blockImageOnly = interaction.options.get('block_image_only')?.value as boolean | undefined;

      if (autoDelete !== undefined) config.autoDelete = autoDelete;
      if (autoTimeout !== undefined) config.autoTimeout = autoTimeout;
      if (timeoutDuration !== undefined) config.timeoutDuration = timeoutDuration;
      if (logChannel) config.logChannelId = logChannel.id;
      if (blockImageOnly !== undefined) config.blockImageOnly = blockImageOnly;

      setAntiMrBeastConfig(guildId, config);

      const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle('⚙️ Cấu Hình Đã Cập Nhật')
        .addFields(
          { name: '🗑️ Auto Delete', value: config.autoDelete ? '✅ Bật' : '❌ Tắt', inline: true },
          { name: '⏱️ Auto Timeout', value: config.autoTimeout ? '✅ Bật' : '❌ Tắt', inline: true },
          { name: '⏲️ Timeout Duration', value: `${config.timeoutDuration} phút`, inline: true },
          { name: '📝 Log Channel', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Chưa đặt', inline: true },
          { name: '📷 Block Image Only', value: config.blockImageOnly ? '✅ Bật (Strict)' : '❌ Tắt', inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      break;
    }

    case 'whitelist': {
      const action = interaction.options.get('action')?.value as string;
      const role = interaction.options.get('role')?.role;
      const user = interaction.options.get('user')?.user;

      switch (action) {
        case 'add_role':
          if (!role) {
            await interaction.reply({ content: '❌ Vui lòng chọn role!', ephemeral: true });
            return;
          }
          if (!config.whitelistedRoles.includes(role.id)) {
            config.whitelistedRoles.push(role.id);
            setAntiMrBeastConfig(guildId, config);
            await interaction.reply({ content: `✅ Đã thêm role ${role} vào whitelist!`, ephemeral: true });
          } else {
            await interaction.reply({ content: `⚠️ Role ${role} đã có trong whitelist!`, ephemeral: true });
          }
          break;

        case 'remove_role':
          if (!role) {
            await interaction.reply({ content: '❌ Vui lòng chọn role!', ephemeral: true });
            return;
          }
          config.whitelistedRoles = config.whitelistedRoles.filter(id => id !== role.id);
          setAntiMrBeastConfig(guildId, config);
          await interaction.reply({ content: `✅ Đã xóa role ${role} khỏi whitelist!`, ephemeral: true });
          break;

        case 'add_user':
          if (!user) {
            await interaction.reply({ content: '❌ Vui lòng chọn user!', ephemeral: true });
            return;
          }
          if (!config.whitelistedUsers.includes(user.id)) {
            config.whitelistedUsers.push(user.id);
            setAntiMrBeastConfig(guildId, config);
            await interaction.reply({ content: `✅ Đã thêm user ${user} vào whitelist!`, ephemeral: true });
          } else {
            await interaction.reply({ content: `⚠️ User ${user} đã có trong whitelist!`, ephemeral: true });
          }
          break;

        case 'remove_user':
          if (!user) {
            await interaction.reply({ content: '❌ Vui lòng chọn user!', ephemeral: true });
            return;
          }
          config.whitelistedUsers = config.whitelistedUsers.filter(id => id !== user.id);
          setAntiMrBeastConfig(guildId, config);
          await interaction.reply({ content: `✅ Đã xóa user ${user} khỏi whitelist!`, ephemeral: true });
          break;

        case 'list':
          const rolesText = config.whitelistedRoles.length > 0
            ? config.whitelistedRoles.map(id => `<@&${id}>`).join(', ')
            : 'Không có';
          const usersText = config.whitelistedUsers.length > 0
            ? config.whitelistedUsers.map(id => `<@${id}>`).join(', ')
            : 'Không có';

          const embed = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle('📋 Whitelist')
            .addFields(
              { name: '👥 Roles', value: rolesText, inline: false },
              { name: '👤 Users', value: usersText, inline: false }
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
      }
      break;
    }

    case 'status': {
      const embed = new EmbedBuilder()
        .setColor(config.enabled ? 0x22c55e : 0xef4444)
        .setTitle('📊 Anti-MrBeast Status')
        .setDescription(
          config.enabled 
            ? '```diff\n+ ✅ Anti-MrBeast đang hoạt động\n```\n**Bảo vệ server khỏi scam!**' 
            : '```diff\n- ❌ Anti-MrBeast đang tắt\n```\n**Server không được bảo vệ!**'
        )
        .addFields(
          { name: '🛡️ Trạng thái', value: config.enabled ? '`✅ Đang bật`' : '`❌ Đang tắt`', inline: true },
          { name: '🗑️ Auto Delete', value: config.autoDelete ? '`✅ Bật`' : '`❌ Tắt`', inline: true },
          { name: '⏱️ Auto Timeout', value: config.autoTimeout ? '`✅ Bật`' : '`❌ Tắt`', inline: true },
          { name: '⏲️ Timeout Duration', value: `\`${config.timeoutDuration} phút\``, inline: true },
          { name: '📝 Log Channel', value: config.logChannelId ? `<#${config.logChannelId}>` : '`Chưa đặt`', inline: true },
          { name: '📷 Block Image Only', value: config.blockImageOnly ? '`✅ Bật (Strict)`' : '`❌ Tắt`', inline: true },
          { name: '📋 Whitelist', value: `\`${config.whitelistedRoles.length}\` roles\n\`${config.whitelistedUsers.length}\` users`, inline: true }
        )
        .setThumbnail(config.enabled ? 'https://media.giphy.com/media/QC7UQbxq89MnL9r6AN/giphy.gif' : 'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif')
        .setImage(config.enabled ? 'https://media.giphy.com/media/3oKIPic2BnoVZkRla8/giphy.gif' : null)
        .setFooter({ text: 'Dùng /antimrbeast config để thay đổi cấu hình', iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      break;
    }

    case 'test': {
      const message = interaction.options.get('message')?.value as string;
      const hasImage = message.toLowerCase().includes('[image]') || message.toLowerCase().includes('[attachment]');
      
      // Extract URLs from message for testing
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = message.match(urlRegex) || [];
      
      const isTextSuspicious = isSuspiciousMessage(message);
      const isImageSuspicious = hasImage ? isSuspiciousImageMessage(true, message, urls) : false;
      const isSuspicious = isTextSuspicious || isImageSuspicious;
      
      const detectionReason = [];
      if (isTextSuspicious) detectionReason.push('📝 Text spam');
      if (isImageSuspicious) detectionReason.push('📷 Image/Embed spam');

      const embed = new EmbedBuilder()
        .setColor(isSuspicious ? 0xef4444 : 0x22c55e)
        .setTitle(isSuspicious ? '⚠️ Tin Nhắn Nghi Ngờ' : '✅ Tin Nhắn An Toàn')
        .setDescription(`\`\`\`\n${message}\n\`\`\``)
        .addFields({
          name: 'Kết quả',
          value: isSuspicious 
            ? `❌ Tin nhắn này sẽ bị xử lý nếu Anti-MrBeast được bật\n\n**Lý do phát hiện:**\n${detectionReason.join('\n')}`
            : '✅ Tin nhắn này không bị đánh dấu là nghi ngờ'
        })
        .setFooter({ 
          text: hasImage 
            ? 'Note: Thêm [image] hoặc [attachment] trong tin nhắn để test image detection' 
            : 'Tip: Thêm [image] để test image spam detection'
        })
        .setTimestamp();

      if (urls.length > 0) {
        embed.addFields({
          name: '🔗 URLs phát hiện',
          value: urls.map(url => `- ${url}`).join('\n').substring(0, 1024)
        });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
      break;
    }

    default:
      await interaction.reply({ content: '❌ Subcommand không hợp lệ!', ephemeral: true });
  }
}
