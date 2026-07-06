/// <reference path="./types.d.ts" />
import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join } from 'path';
import { setClient, startWebServer } from './web/server';
import { checkAndNotifyUpdate } from './utils/updateNotifier';
import { handleTicketSelect, handleTicketClose } from './utils/interactionHandlers';
import { loadSettings, getSettings, shouldSendStartupNotif, getOwnerId } from './utils/botSettings';
import { preloadIcons } from './utils/svgIcons';
import { initializeMusicPlayer } from './utils/musicPlayer';

config();

// Load bot settings
loadSettings();
console.log('📋 Bot settings loaded:', getSettings());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages, // Cho anti-spam
    GatewayIntentBits.MessageContent, // Cho đọc nội dung tin nhắn
    GatewayIntentBits.GuildPresences, // Cho /activity
    GatewayIntentBits.GuildVoiceStates, // Cho voice notifications
  ],
  // Tối ưu WebSocket
  ws: {
    large_threshold: 50, // Giảm threshold cho server nhỏ
  },
  // Tối ưu REST
  rest: {
    timeout: 15000, // 15s timeout
    retries: 3,
  },
});

// Tạo collection để lưu commands
client.commands = new Collection();

// Cache for frequently accessed metrics
let cachedUserCount = 0;
let cachedGuildCount = 0;
let cachedPing = 0;

function cacheBotMetrics(c: Client): void {
  cachedGuildCount = c.guilds.cache.size;
  cachedUserCount = c.guilds.cache.reduce((acc: number, guild: any) => acc + (guild.memberCount ?? 0), 0);
  cachedPing = c.ws.ping;
}

// Cache maintenance/disable command references
let maintenanceCmd: any = null;
let disableCmd: any = null;

function cacheCommandRefs(): void {
  maintenanceCmd = client.commands.get('maintenance');
  disableCmd = client.commands.get('disable');
}

const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => 
  file.endsWith('.js') && !file.endsWith('.d.ts')
);

let commandCount = 0;
for (const file of commandFiles) {
  try {
    const command = require(join(commandsPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      commandCount++;
    }
  } catch (error) {
    console.error(`❌ Lỗi load command ${file}:`, error);
  }
}

console.log(`✅ Đã load ${commandCount} commands`);
cacheCommandRefs();

// Load events
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => 
  file.endsWith('.js') && !file.endsWith('.d.ts')
);

let eventCount = 0;
for (const file of eventFiles) {
  try {
    const event = require(join(eventsPath, file));
    if (event.name) {
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      eventCount++;
    }
  } catch (error) {
    console.error(`❌ Lỗi load event ${file}:`, error);
  }
}
console.log(`✅ Đã load ${eventCount} events`);

// Event: Bot sẵn sàng
client.once(Events.ClientReady, async (c) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Bot đã online: ${c.user.tag}`);
  console.log(`📊 Servers: ${c.guilds.cache.size}`);
  console.log(`👥 Users: ${c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}`);
  console.log(`⚡ Ping: ${c.ws.ping}ms`);
  console.log(`${'='.repeat(50)}\n`);
  
  // Set bot status to DND (Do Not Disturb)
  c.user.setPresence({
    status: 'dnd',
    activities: [{
      name: 'Không làm phiền',
      type: 4 // Custom status
    }]
  });
  
  // Preload SVG icons for level system
  console.log('📦 Loading SVG icons...');
  await preloadIcons(['star', 'sparkle', 'trophy', 'crown', 'fire', 'lightning', 'gem', 'rocket', 'medal', 'heart']);
  
  // Initialize music player
  console.log('🎵 Initializing music player...');
  await initializeMusicPlayer(c);
  
  // Set client cho web server
  setClient(c);
  cacheBotMetrics(c);
  
  // Start web server
  startWebServer();

  // Thông báo khởi động đã bị tắt
  // const settings = getSettings();
  // const ownerId = settings.ownerId || process.env.OWNER_ID;
  // if (ownerId && shouldSendStartupNotif()) { ... }

  // Kiểm tra và gửi thông báo cập nhật tự động
  await checkAndNotifyUpdate(c);
});

// Event: Xử lý interactions (commands và buttons)
client.on(Events.InteractionCreate, async (interaction): Promise<void> => {
  // Xử lý select menu interactions (ticket system)
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith('ticket_select_')) {
      await handleTicketSelect(interaction, client);
      return;
    }
  }

  // Xử lý button interactions
  if (interaction.isButton()) {
    // TikTok embed buttons
    if (interaction.customId.startsWith('tiktok_')) {
      const action = interaction.customId.split('_')[1];
      if (action === 'info' || action === 'download') {
        await interaction.reply({
          content: action === 'info' 
            ? '📋 **TikTok Info**\nLink đã được gửi ở trên. Click "Open in TikTok" để xem!' 
            : '⬇️ **Download**\nClick "Get Fixed Link" để tải video!',
          ephemeral: true
        });
      }
      return;
    }
    
    if (interaction.customId === 'ticket_close') {
      await handleTicketClose(interaction);
      return;
    }
    
    // Verify button
    if (interaction.customId.startsWith('verify_button_')) {
      const roleId = interaction.customId.split('_')[2];
      const verifyCommand = client.commands.get('verify');
      if (verifyCommand && 'handleVerifyButton' in verifyCommand) {
        await (verifyCommand as any).handleVerifyButton(interaction, roleId);
      }
      return;
    }
    
    // Blackjack buttons
    if (interaction.customId.startsWith('blackjack_')) {
      const parts = interaction.customId.split('_');
      const action = parts[1];
      const userId = parts[2];
      
      const blackjackCommand = client.commands.get('blackjack');
      if (blackjackCommand && typeof blackjackCommand.handleBlackjackButton === 'function') {
        await blackjackCommand.handleBlackjackButton(interaction, action, userId);
      }
      return;
    }
    
    // Tic-Tac-Toe buttons
    if (interaction.customId.startsWith('ttt_')) {
      const parts = interaction.customId.split('_');
      const gameId = `${parts[1]}_${parts[2]}`;
      const position = parseInt(parts[3]);
      
      const tttCommand = client.commands.get('tictactoe');
      if (tttCommand && typeof tttCommand.handleTicTacToeButton === 'function') {
        await tttCommand.handleTicTacToeButton(interaction, gameId, position);
      }
      return;
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // Kiểm tra chế độ bảo trì
  if (maintenanceCmd?.isMaintenanceMode?.()) {
    if (interaction.commandName !== 'maintenance') {
      const member = interaction.member;
      const isAdmin = member && 'permissions' in member && 
        member.permissions instanceof Object && 
        'has' in member.permissions &&
        typeof member.permissions.has === 'function' &&
        member.permissions.has('Administrator');

      if (!isAdmin) {
        const maintenanceInfo = maintenanceCmd.getMaintenanceInfo?.() || { reason: 'Đang bảo trì', startTime: new Date() };
        await interaction.reply({
          content: `**Bot đang trong chế độ bảo trì**\n\n` +
                  `**Lý do:** ${maintenanceInfo.reason}\n` +
                  `**Thời gian bắt đầu:** <t:${Math.floor((maintenanceInfo.startTime?.getTime() || 0) / 1000)}:R>\n\n` +
                  `Vui lòng thử lại sau!`,
          ephemeral: true
        });
        return;
      }
    }
  }

  // Kiểm tra lệnh có bị vô hiệu hóa không
  if (disableCmd?.isCommandDisabled?.(interaction.commandName)) {
    const member = interaction.member;
    const isAdmin = member && 'permissions' in member && 
      member.permissions instanceof Object && 
      'has' in member.permissions &&
      typeof member.permissions.has === 'function' &&
      member.permissions.has('Administrator');

    if (!isAdmin) {
      const disabledInfo = disableCmd.getDisabledInfo?.(interaction.commandName) || { 
        reason: 'Lệnh đã bị vô hiệu hóa', 
        disabledBy: 'Admin', 
        disabledAt: new Date() 
      };
      
      await interaction.reply({
        content: `🚫 **Lệnh này đã bị vô hiệu hóa**\n\n` +
                `**Lý do:** ${disabledInfo.reason}\n` +
                `**Vô hiệu bởi:** ${disabledInfo.disabledBy}\n` +
                `**Thời gian:** <t:${Math.floor((disabledInfo.disabledAt?.getTime?.() || Date.now()) / 1000)}:R>\n\n` +
                `Vui lòng liên hệ Admin để biết thêm chi tiết!`,
        ephemeral: true
      });
      return;
    }
  }

  // Thực thi command với error handling
  try {
    await command.execute(interaction);
  } catch (error: any) {
    console.error(`❌ Error [${interaction.commandName}]:`, error);
    
    const errorMessage = {
      content: '❌ Có lỗi xảy ra khi thực thi lệnh này!',
      ephemeral: true
    };

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    } catch (replyError) {
      console.error('❌ Không thể gửi error message:', replyError);
    }
  }
});

// Event: Xử lý tin nhắn cho Anti-Spam và Anti-MrBeast
import { antiSpamSystem } from './utils/antiSpam';
import { getAntiMrBeastConfig, isSuspiciousMessage, isSuspiciousImageMessage } from './commands/antimrbeast';
import { handleLinkPreview } from './utils/linkPreview';

client.on(Events.MessageCreate, async (message) => {
  // Bỏ qua bot messages
  if (message.author.bot) return;
  if (!message.guild) return;

  try {
    // Link Preview (chạy trước để không conflict với anti-spam)
    await handleLinkPreview(message);
    
    // Anti-Spam check
    await antiSpamSystem.checkMessage(message);

    // Anti-MrBeast check
    const guildId = message.guild.id;
    const config = getAntiMrBeastConfig(guildId);
    
    if (config.enabled) {
      // Check if user is whitelisted
      const isWhitelisted = message.member && (
        config.whitelistedUsers.includes(message.author.id) ||
        message.member.roles.cache.some(role => config.whitelistedRoles.includes(role.id))
      );

      if (!isWhitelisted) {
        const hasImage = message.attachments.size > 0 || message.embeds.length > 0;
        const embedUrls = message.embeds.map(e => e.url || e.image?.url || '').filter(u => u);
        
        const isTextSuspicious = isSuspiciousMessage(message.content);
        const isImageSuspicious = hasImage ? isSuspiciousImageMessage(hasImage, message.content, embedUrls, config.blockImageOnly) : false;
        
        if (isTextSuspicious || isImageSuspicious) {
          console.log(`🚨 Suspicious message detected from ${message.author.tag}`);
          
          // Delete message
          if (config.autoDelete) {
            try {
              await message.delete();
              console.log(`🗑️ Deleted suspicious message from ${message.author.tag}`);
            } catch (err) {
              console.error('❌ Failed to delete message:', err);
            }
          }
          
          // Timeout user
          if (config.autoTimeout && message.member) {
            try {
              await message.member.timeout(
                config.timeoutDuration * 60 * 1000,
                `Anti-MrBeast: Suspicious message detected`
              );
              console.log(`⏱️ Timed out ${message.author.tag} for ${config.timeoutDuration} minutes`);
            } catch (err) {
              console.error('❌ Failed to timeout user:', err);
            }
          }
          
          // Send log
          if (config.logChannelId) {
            try {
              const logChannel = await client.channels.fetch(config.logChannelId);
              if (logChannel && 'send' in logChannel) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                  .setTitle('⚠️ Suspicious Message Detected')
                  .setDescription(`**User:** ${message.author} (${message.author.tag})\n**Channel:** ${message.channel}`)
                  .addFields(
                    { name: 'Content', value: message.content.substring(0, 1024) || '*No text content*', inline: false },
                    { name: 'Detection', value: isTextSuspicious ? '📝 Text spam' : '📷 Image spam', inline: true },
                    { name: 'Action', value: config.autoDelete ? '🗑️ Deleted' : '⚠️ Warned', inline: true }
                  )
                  .setColor(0xFF0000)
                  .setTimestamp();
                  
                if (hasImage && message.attachments.size > 0) {
                  embed.setImage(message.attachments.first()?.url || null);
                }
                
                await (logChannel as any).send({ embeds: [embed] });
              }
            } catch (err) {
              console.error('❌ Failed to send log:', err);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in messageCreate handler:', error);
  }
});

// Đăng nhập
client.login(process.env.DISCORD_TOKEN);
