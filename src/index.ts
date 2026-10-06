import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { Player } from 'discord-player';
// import { YoutubeiExtractor } from 'discord-player-youtubei';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { validateEnv } from './utils/envValidator';

dotenv.config();
validateEnv(); // Validate environment variables before proceeding

// Extend Client type để thêm commands collection
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, any>;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// Increase max listeners to prevent warning
client.setMaxListeners(20);

client.commands = new Collection();

// Initialize music player
const player = new Player(client);

// Load YouTube extractor (optional - requires discord-player-youtubei)
// player.extractors.register(YoutubeiExtractor, {});

console.log('✅ Music player initialized');

// Player events
player.events.on('playerStart', (queue: any, track: any) => {
  const channel = queue.metadata.channel as any;
  channel?.send(`🎵 Đang phát: **${track.title}** • ${track.author}`);
});

player.events.on('audioTrackAdd', (queue: any, track: any) => {
  const channel = queue.metadata.channel as any;
  channel?.send(`✅ Đã thêm vào hàng đợi: **${track.title}**`);
});

player.events.on('emptyQueue', (queue: any) => {
  const channel = queue.metadata.channel as any;
  channel?.send('✅ Đã phát hết nhạc trong hàng đợi!');
});

player.events.on('error', (queue: any, error: any) => {
  console.error(`Music player error:`, error);
  const channel = queue.metadata.channel as any;
  channel?.send('❌ Có lỗi xảy ra khi phát nhạc!');
});

// Export player for dashboard API
export { player };

// ============================================
// LOAD MODULES (New Module System)
// ============================================
import { ModuleLoader } from './core/ModuleLoader';

// Load modules on ready
let moduleLoader: ModuleLoader;

// Export moduleLoader for external access
export function getModuleLoader(): ModuleLoader | null {
  return moduleLoader || null;
}

async function initializeModules() {
  try {
    // Pass absolute path to modules directory
    const modulesPath = path.resolve(__dirname, 'modules');
    console.log('📁 Modules path:', modulesPath);
    
    moduleLoader = new ModuleLoader(client, modulesPath);
    await moduleLoader.loadAllModules();
    
    // Set module loader reference for module-manager module
    const moduleManagerModule = moduleLoader.getModuleInfo('module-manager-module');
    if (moduleManagerModule && moduleManagerModule.instance) {
      moduleManagerModule.instance.setModuleLoader(moduleLoader);
    }
    
    // Register all module commands
    for (const [moduleName, loadedModule] of moduleLoader.getLoadedModules()) {
      if (loadedModule.instance && loadedModule.instance.commands) {
        for (const [cmdName, command] of loadedModule.instance.commands) {
          client.commands.set(cmdName, command);
        }
      }
    }
  } catch (error) {
    console.error('Error loading modules:', error);
  }
}

// Load legacy commands (if any)
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded command: ${command.data.name}`);
    }
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`✅ Loaded event: ${event.name}`);
  }
}

// Ready event (using clientReady to avoid deprecation warning)
client.once('clientReady' as any, async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 BOT STATUS');
  console.log('='.repeat(60));
  console.log(`✅ Online: ${client.user?.tag}`);
  console.log(`📊 Servers: ${client.guilds.cache.size}`);
  console.log(`👥 Users: ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`);
  console.log('='.repeat(60) + '\n');

  // Set bot status (idle with custom status text matching GlitchBucket)
  client.user?.setPresence({
    activities: [{ 
      name: 'Custom Status',
      type: 4, // Type 4 = Custom Status
      state: '/help | Bot Discord đa năng'
    }],
    status: 'idle', // idle = yellow/orange moon icon
  });

  // Initialize modules
  await initializeModules();

  // Auto-deploy commands to Discord
  try {
    console.log('🚀 Deploying commands to Discord...');
    
    const commands = [];
    for (const [name, command] of client.commands) {
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    }
    
    console.log(`📋 Found ${commands.length} commands to deploy`);
    
    const { REST } = require('@discordjs/rest');
    const { Routes } = require('discord-api-types/v10');
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
    
    // Try guild deploy first (faster), fallback to global if no guild
    const guildId = process.env.GUILD_ID || '1482354951689605150';
    
    try {
      await rest.put(
        Routes.applicationGuildCommands(client.user!.id, guildId),
        { body: commands }
      );
      console.log(`✅ Deployed ${commands.length} commands to guild ${guildId}`);
    } catch (guildError: any) {
      // If guild deploy fails, try global
      if (guildError.code === 50001) {
        console.log('⚠️ No guild access, deploying globally...');
        await rest.put(
          Routes.applicationCommands(client.user!.id),
          { body: commands }
        );
        console.log(`✅ Deployed ${commands.length} commands globally`);
      } else {
        throw guildError;
      }
    }
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
    console.log('⚠️ Commands not deployed - use manual deploy script');
  }

  // Start web server
  const { startWebServer } = require('./web/server');
  const port = process.env.PORT || 3000;
  startWebServer(client, port);
});

// Interaction handler - Optimized for fast response
client.on('interactionCreate', async (interaction) => {
  // ⚡ Wrap entire handler in try-catch to prevent crashes
  try {
    // Handle autocomplete
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      
      if (command && command.autocomplete) {
        try {
          await command.autocomplete(interaction);
        } catch (error) {
          console.error(`Error in autocomplete for ${interaction.commandName}:`, error);
        }
      }
      return;
    }
    
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      
      if (!command) {
        console.warn(`⚠️ Unknown command: ${interaction.commandName}`);
        return;
      }

      // ⚡ EXECUTE IMMEDIATELY - Let command handle its own defer
      try {
        await command.execute(interaction);
      } catch (error: any) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        
        // ⚡ Handle expired interaction
        if (error.code === 10062 || error.rawError?.code === 10062) {
          console.warn(`⚠️ Interaction expired for command: ${interaction.commandName}`);
          return;
        }
        
        // Send error message if possible
        const { emojis } = require('./config/emojis');
        const errorMessage = error.message === 'Command timeout' 
          ? `${emojis.error} Lệnh này mất quá nhiều thời gian để thực thi!`
          : `${emojis.error} Có lỗi xảy ra khi thực hiện lệnh này!`;
        
        const reply = { content: errorMessage, flags: 64 };
        
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
          } else {
            await interaction.reply(reply);
          }
        } catch (replyError: any) {
          if (replyError.code !== 10062) {
            console.error('Failed to send error reply:', replyError);
          }
        }
      }
    }
    
    // ⚡ Handle buttons, select menus, modals - let modules handle them
    // Just catch errors to prevent crashes
    
  } catch (error: any) {
    // ⚡ Top-level catch for ANY interaction error
    if (error.code === 10062 || error.rawError?.code === 10062) {
      console.warn(`⚠️ Expired interaction (${interaction.type}), ignoring`);
      return;
    }
    
    console.error('Uncaught interaction error:', error);
  }
});

// Helper event to collect all commands for /help
client.on('getAllCommands', (commandsArray: any[]) => {
  client.commands.forEach((cmd) => {
    commandsArray.push(cmd);
  });
});

// Login
client.login(process.env.DISCORD_TOKEN);

// ============================================
// PREFIX COMMANDS HANDLER
// ============================================
import { setupPrefixCommands } from './handlers/prefixCommandHandler';

// Initialize prefix commands
setupPrefixCommands(client);

// ============================================
// AI CHAT - Message Listener for Auto-Reply
// ============================================
import { aiChatService } from './utils/aiChatService';
import { conversationManager } from './utils/conversationManager';
import { aiChatRateLimiter } from './utils/rateLimiter';

client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Only in guilds
  if (!message.guild) return;

  const config = conversationManager.getConfig();

  // Check if auto-reply is enabled
  if (!config.autoReplyOnMention) return;

  // Check if bot is mentioned
  const botMentioned = message.mentions.has(client.user!);
  if (!botMentioned) return;

  // ⚡ Rate limiting - Prevent spam
  if (!aiChatRateLimiter.check(message.author.id)) {
    const info = aiChatRateLimiter.getInfo(message.author.id);
    return message.reply(`⏱️ Bạn đang gửi tin nhắn quá nhanh! Vui lòng đợi ${info.resetIn}s nữa.`);
  }

  // Check if user is blacklisted
  if (conversationManager.isUserBlacklisted(message.author.id)) return;

  // Check if channel is allowed
  if (!conversationManager.isChannelAllowed(message.channel.id)) return;

  // Check if AI service is available
  if (!aiChatService.isAvailable()) {
    return message.reply('❌ AI service chưa được cấu hình');
  }

  try {
    // Show typing indicator
    await message.channel.sendTyping();

    // Remove mention from message
    let userMessage = message.content
      .replace(/<@!?\d+>/g, '')
      .trim();

    if (!userMessage) {
      return message.reply('💭 Bạn muốn hỏi gì?');
    }

    // Get AI response
    const response = await aiChatService.chat(
      message.author.id,
      message.guild.id,
      userMessage,
      { model: 'openai/gpt-oss-20b' } // Fastest (1000 T/s)
    );

    if (!response.success) {
      return message.reply(`❌ Lỗi: ${response.error}`);
    }

    // Split long messages
    const maxLength = 2000;
    const responseText = response.message || 'No response';

    if (responseText.length <= maxLength) {
      await message.reply(responseText);
    } else {
      // Send first chunk as reply
      await message.reply(responseText.substring(0, maxLength));

      // Send remaining chunks
      for (let i = maxLength; i < responseText.length; i += maxLength) {
        await message.channel.send(responseText.substring(i, i + maxLength));
      }
    }

  } catch (error) {
    console.error('AI chat error:', error);
    message.reply('❌ Có lỗi xảy ra khi xử lý tin nhắn');
  }
});

console.log('✅ AI Chat auto-reply listener initialized');

// ============================================
// MEMORY OPTIMIZER - Auto cleanup every 30 minutes
// ============================================
import { memoryOptimizer } from './utils/memoryOptimizer';

// Bắt đầu auto cleanup sau 5 phút bot chạy (đợi load xong)
setTimeout(() => {
  memoryOptimizer.startAutoCleanup(30); // Cleanup mỗi 30 phút
}, 5 * 60 * 1000);

console.log('✅ Memory optimizer scheduled');

// ============================================
// GLOBAL ERROR HANDLERS - Prevent crashes
// ============================================

// Throttle expired interaction warnings (max 1 per 5 seconds)
let lastExpiredWarning = 0;
const EXPIRED_WARNING_THROTTLE = 5000; // 5 seconds

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise) => {
  // ⚠️ Silent ignore for expired interactions (with throttled logging)
  if (reason?.code === 10062 || reason?.rawError?.code === 10062) {
    const now = Date.now();
    if (now - lastExpiredWarning > EXPIRED_WARNING_THROTTLE) {
      console.warn('⚠️ Expired interactions detected (some logs omitted to reduce spam)');
      lastExpiredWarning = now;
    }
    return;
  }
  
  console.error('🚨 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  console.error('Stack:', reason?.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  // ⚠️ Silent ignore for expired interactions (with throttled logging)
  if ((error as any).code === 10062 || (error as any).rawError?.code === 10062) {
    const now = Date.now();
    if (now - lastExpiredWarning > EXPIRED_WARNING_THROTTLE) {
      console.warn('⚠️ Expired interactions detected (some logs omitted to reduce spam)');
      lastExpiredWarning = now;
    }
    return;
  }
  
  console.error('🚨 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  
  // For other critical errors, log but don't exit (let nodemon restart)
  console.error('💥 Critical error detected');
});

// Handle warnings (optional - helps debug)
process.on('warning', (warning) => {
  console.warn('⚠️ Process Warning:', warning.name);
  console.warn('Message:', warning.message);
  if (warning.stack) {
    console.warn('Stack:', warning.stack);
  }
});

console.log('✅ Global error handlers registered');
