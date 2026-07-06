import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  GuildMember,
  VoiceChannel
} from 'discord.js';
import fs from 'fs';
import path from 'path';

interface TempVoiceConfig {
  guildId: string;
  ownerId: string;
  channelId: string;
  channelName: string;
  createdAt: string;
  settings: {
    userLimit: number;
    isLocked: boolean;
    trustedUsers: string[];
    blockedUsers: string[];
  };
}

export const data = new SlashCommandBuilder()
  .setName('voice')
  .setDescription('Quản lý temporary voice channels')
  .addSubcommand(subcommand =>
    subcommand
      .setName('setup')
      .setDescription('Setup Join-to-Create channel (Admin only)')
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('Voice channel để làm Join-to-Create')
          .addChannelTypes(ChannelType.GuildVoice)
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Tạo voice channel tạm thời của riêng bạn')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('Tên voice channel (để trống = tên của bạn)')
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('limit')
          .setDescription('Giới hạn số người (0 = không giới hạn)')
          .setMinValue(0)
          .setMaxValue(99)
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('delete')
      .setDescription('Xóa voice channel tạm thời của bạn')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('lock')
      .setDescription('Khóa voice channel (chỉ trusted users vào được)')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('unlock')
      .setDescription('Mở khóa voice channel')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('limit')
      .setDescription('Thay đổi giới hạn số người')
      .addIntegerOption(option =>
        option
          .setName('amount')
          .setDescription('Số người tối đa (0 = không giới hạn)')
          .setMinValue(0)
          .setMaxValue(99)
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('rename')
      .setDescription('Đổi tên voice channel')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('Tên mới')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('trust')
      .setDescription('Cho phép user vào voice channel khi bị lock')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User cần trust')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('untrust')
      .setDescription('Bỏ trust user')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User cần untrust')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('kick')
      .setDescription('Kick user ra khỏi voice channel')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User cần kick')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('block')
      .setDescription('Chặn user không cho vào voice channel')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User cần block')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('unblock')
      .setDescription('Bỏ chặn user')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User cần unblock')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('transfer')
      .setDescription('Chuyển quyền sở hữu voice channel')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User nhận quyền sở hữu')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('claim')
      .setDescription('Claim quyền sở hữu voice channel (khi owner đã rời)')
  );

/**
 * Get temp voice config file path
 */
function getConfigPath(): string {
  return path.join(process.cwd(), 'temp-voice-channels.json');
}

/**
 * Load all temp voice configs
 */
function loadConfigs(): Record<string, TempVoiceConfig> {
  try {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
      return {};
    }
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load temp voice configs:', error);
    return {};
  }
}

/**
 * Save all temp voice configs
 */
function saveConfigs(configs: Record<string, TempVoiceConfig>): void {
  try {
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
  } catch (error) {
    console.error('Failed to save temp voice configs:', error);
  }
}

/**
 * Get temp voice config for a channel
 */
function getChannelConfig(channelId: string): TempVoiceConfig | null {
  const configs = loadConfigs();
  return configs[channelId] || null;
}

/**
 * Save temp voice config for a channel
 */
function saveChannelConfig(channelId: string, config: TempVoiceConfig): void {
  const configs = loadConfigs();
  configs[channelId] = config;
  saveConfigs(configs);
}

/**
 * Delete temp voice config
 */
function deleteChannelConfig(channelId: string): void {
  const configs = loadConfigs();
  delete configs[channelId];
  saveConfigs(configs);
}

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({ 
      content: '❌ Lệnh này chỉ dùng được trong server!', 
      flags: 64
    });
  }

  const subcommand = interaction.options.getSubcommand();
  const member = interaction.member as GuildMember;

  try {
    if (subcommand === 'setup') {
      // Setup Join-to-Create channel (Admin only)
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '❌ Bạn cần quyền Administrator để dùng lệnh này!', 
          flags: 64
        });
      }

      const channel = interaction.options.getChannel('channel', true);
      
      // Save config
      const configPath = path.join(process.cwd(), 'join-to-create-config.json');
      let configs: any = {};
      
      if (fs.existsSync(configPath)) {
        configs = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }

      configs[interaction.guild.id] = {
        guildId: interaction.guild.id,
        createChannelId: channel.id,
        categoryId: 'parentId' in channel ? channel.parentId : undefined
      };

      fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));

      const embed = new EmbedBuilder()
        .setColor(0x43B581)
        .setTitle('✅ Join-to-Create Setup Thành Công')
        .setDescription(
          `🎙️ **Voice Channel:** <#${channel.id}>\n\n` +
          `**Cách hoạt động:**\n` +
          `1. User vào voice channel này\n` +
          `2. Bot tự động tạo voice mới cho user\n` +
          `3. User được chuyển vào voice mới\n` +
          `4. Voice tự động xóa khi không còn ai\n\n` +
          `💡 Dùng \`/setup-voice\` trong voice của bạn để chỉnh settings!`
        )
        .setFooter({ text: 'Join-to-Create System' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'create') {
      // Create new temp voice channel
      const customName = interaction.options.getString('name');
      const userLimit = interaction.options.getInteger('limit') || 0;
      const channelName = customName || `${member.displayName}'s Voice`;

      await interaction.deferReply({ flags: 64 });

      // Create voice channel
      const voiceChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        userLimit: userLimit,
        reason: `Temp voice created by ${member.user.tag}`,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
          },
          {
            id: member.id,
            allow: [PermissionFlagsBits.ManageChannels]
          }
        ]
      });

      // Save config
      const config: TempVoiceConfig = {
        guildId: interaction.guild.id,
        ownerId: member.id,
        channelId: voiceChannel.id,
        channelName: voiceChannel.name,
        createdAt: new Date().toISOString(),
        settings: {
          userLimit: userLimit,
          isLocked: false,
          trustedUsers: [],
          blockedUsers: []
        }
      };
      saveChannelConfig(voiceChannel.id, config);

      const embed = new EmbedBuilder()
        .setColor(0x43B581)
        .setTitle('✅ Voice Channel Đã Tạo')
        .setDescription(
          `🎙️ **${voiceChannel.name}**\n\n` +
          `👑 Owner: ${member}\n` +
          `👥 Limit: ${userLimit === 0 ? 'Không giới hạn' : `${userLimit} người`}\n\n` +
          `💡 Dùng \`/setup-voice\` trong voice channel để chỉnh settings!`
        )
        .setFooter({ text: 'Channel sẽ tự động xóa khi không còn ai' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // For other subcommands, check if user is in a temp voice channel
    if (!member.voice.channelId) {
      return interaction.reply({ 
        content: '❌ Bạn cần vào voice channel trước!', 
        flags: 64
      });
    }

    const voiceChannel = member.voice.channel as VoiceChannel;
    const config = getChannelConfig(voiceChannel.id);

    if (!config) {
      return interaction.reply({ 
        content: '❌ Voice channel này không phải temp voice channel!', 
        flags: 64
      });
    }

    if (config.ownerId !== member.id) {
      return interaction.reply({ 
        content: '❌ Chỉ owner mới có thể dùng lệnh này!', 
        flags: 64
      });
    }

    // Handle other subcommands
    switch (subcommand) {
      case 'delete':
        await voiceChannel.delete(`Deleted by owner ${member.user.tag}`);
        deleteChannelConfig(voiceChannel.id);
        return interaction.reply({ 
          content: '✅ Voice channel đã xóa!', 
          flags: 64
        });

      case 'lock':
        await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
          Connect: false
        });
        config.settings.isLocked = true;
        saveChannelConfig(voiceChannel.id, config);
        return interaction.reply({ 
          content: '🔒 Voice channel đã khóa! Chỉ trusted users mới vào được.', 
          flags: 64
        });

      case 'unlock':
        await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
          Connect: true
        });
        config.settings.isLocked = false;
        saveChannelConfig(voiceChannel.id, config);
        return interaction.reply({ 
          content: '🔓 Voice channel đã mở khóa!', 
          flags: 64
        });

      case 'limit': {
        const amount = interaction.options.getInteger('amount', true);
        await voiceChannel.setUserLimit(amount);
        config.settings.userLimit = amount;
        saveChannelConfig(voiceChannel.id, config);
        return interaction.reply({ 
          content: `👥 Giới hạn đã đổi thành: ${amount === 0 ? 'Không giới hạn' : `${amount} người`}`, 
          flags: 64
        });
      }

      case 'rename': {
        const newName = interaction.options.getString('name', true);
        await voiceChannel.setName(newName);
        config.channelName = newName;
        saveChannelConfig(voiceChannel.id, config);
        return interaction.reply({ 
          content: `✏️ Voice channel đã đổi tên thành: **${newName}**`, 
          flags: 64
        });
      }

      case 'trust': {
        const user = interaction.options.getUser('user', true);
        if (!config.settings.trustedUsers.includes(user.id)) {
          config.settings.trustedUsers.push(user.id);
          await voiceChannel.permissionOverwrites.edit(user.id, {
            Connect: true
          });
          saveChannelConfig(voiceChannel.id, config);
        }
        return interaction.reply({ 
          content: `✅ Đã trust ${user}! User này có thể vào khi channel bị lock.`, 
          flags: 64
        });
      }

      case 'untrust': {
        const user = interaction.options.getUser('user', true);
        config.settings.trustedUsers = config.settings.trustedUsers.filter(id => id !== user.id);
        await voiceChannel.permissionOverwrites.delete(user.id);
        saveChannelConfig(voiceChannel.id, config);
        return interaction.reply({ 
          content: `❌ Đã untrust ${user}!`, 
          flags: 64
        });
      }

      case 'kick': {
        const user = interaction.options.getUser('user', true);
        const targetMember = interaction.guild.members.cache.get(user.id);
        if (targetMember?.voice.channelId === voiceChannel.id) {
          await targetMember.voice.disconnect('Kicked by voice owner');
          return interaction.reply({ 
            content: `👢 Đã kick ${user} ra khỏi voice channel!`, 
            flags: 64
          });
        }
        return interaction.reply({ 
          content: '❌ User không ở trong voice channel!', 
          flags: 64
        });
      }

      case 'block': {
        const user = interaction.options.getUser('user', true);
        if (!config.settings.blockedUsers.includes(user.id)) {
          config.settings.blockedUsers.push(user.id);
          await voiceChannel.permissionOverwrites.edit(user.id, {
            Connect: false
          });
          saveChannelConfig(voiceChannel.id, config);
          
          // Kick if currently in channel
          const targetMember = interaction.guild.members.cache.get(user.id);
          if (targetMember?.voice.channelId === voiceChannel.id) {
            await targetMember.voice.disconnect('Blocked by voice owner');
          }
        }
        return interaction.reply({ 
          content: `🚫 Đã block ${user}! User này không thể vào voice channel.`, 
          flags: 64
        });
      }

      case 'unblock': {
        const user = interaction.options.getUser('user', true);
        config.settings.blockedUsers = config.settings.blockedUsers.filter(id => id !== user.id);
        await voiceChannel.permissionOverwrites.delete(user.id);
        saveChannelConfig(voiceChannel.id, config);
        return interaction.reply({ 
          content: `✔️ Đã unblock ${user}!`, 
          flags: 64
        });
      }

      case 'transfer': {
        const user = interaction.options.getUser('user', true);
        const targetMember = interaction.guild.members.cache.get(user.id);
        
        if (!targetMember) {
          return interaction.reply({ 
            content: '❌ Không tìm thấy user!', 
            flags: 64
          });
        }

        // Transfer ownership
        await voiceChannel.permissionOverwrites.edit(user.id, {
          ManageChannels: true
        });
        await voiceChannel.permissionOverwrites.delete(member.id);
        
        config.ownerId = user.id;
        saveChannelConfig(voiceChannel.id, config);
        
        return interaction.reply({ 
          content: `🔄 Đã chuyển quyền sở hữu cho ${user}!`, 
          flags: 64
        });
      }

      case 'claim': {
        // Check if original owner is still in channel
        const owner = interaction.guild.members.cache.get(config.ownerId);
        if (owner?.voice.channelId === voiceChannel.id) {
          return interaction.reply({ 
            content: '❌ Owner vẫn còn trong voice channel!', 
            flags: 64
          });
        }

        // Claim ownership
        await voiceChannel.permissionOverwrites.edit(member.id, {
          ManageChannels: true
        });
        if (config.ownerId) {
          await voiceChannel.permissionOverwrites.delete(config.ownerId);
        }
        
        config.ownerId = member.id;
        saveChannelConfig(voiceChannel.id, config);
        
        return interaction.reply({ 
          content: `👑 Bạn đã claim quyền sở hữu voice channel!`, 
          flags: 64
        });
      }
    }

  } catch (error) {
    console.error('Voice command error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return interaction.reply({ 
      content: `❌ Đã xảy ra lỗi:\n\`\`\`${errorMessage}\`\`\``, 
      flags: 64
    }).catch(() => {});
  }

  return;
}
