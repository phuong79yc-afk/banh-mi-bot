import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { Player } from 'discord-player';
// import { YoutubeiExtractor } from 'discord-player-youtubei';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { validateEnv } from './utils/envValidator';
import { setupPrefixCommands } from './handlers/prefixCommandHandler';
import { ModuleLoader } from './core/ModuleLoader';
import { memoryOptimizer } from './utils/memoryOptimizer';
import { initializeDatabase } from './database/init';
import {
  auditSlashCommands,
  replyCommandError,
  runCommandWithTimeout,
  sanitizeCommandJson,
} from './utils/commandUx';

const execAsync = promisify(exec);

dotenv.config();
validateEnv(); // Validate environment variables before proceeding

// ============================================
// DUPLICATE INSTANCE DETECTION & AUTO-KILL
// ============================================
async function killDuplicateInstances() {
  try {
    const currentPid = process.pid;
    console.log(`🔍 Checking for duplicate bot instances... (PID: ${currentPid})`);

    // Get all node processes running index.js
    const { stdout } = await execAsync(
      `powershell -Command "Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Select-Object Id, Path | ConvertTo-Json"`
    );
    
    if (!stdout.trim()) {
      console.log('✅ No other node processes found');
      return;
    }

    const processes = JSON.parse(stdout);
    const processList = Array.isArray(processes) ? processes : [processes];
    
    // Filter: only processes running THIS bot (index.js in dist/src)
    const botInstances = processList.filter(p => {
      if (p.Id === currentPid) return false; // Skip current process
      const path = p.Path || '';
      // Check if running index.js from dist/src (this bot)
      return path.includes('dist\\src\\index.js') || path.includes('dist/src/index.js');
    });

    if (botInstances.length === 0) {
      console.log('✅ No duplicate bot instances detected');
      return;
    }

    console.log(`⚠️  Found ${botInstances.length} duplicate bot instance(s), terminating...`);
    
    for (const proc of botInstances) {
      try {
        await execAsync(`powershell -Command "Stop-Process -Id ${proc.Id} -Force -ErrorAction SilentlyContinue"`);
        console.log(`   ✅ Terminated PID ${proc.Id}`);
      } catch (error) {
        // Silent fail
      }
    }

    // Wait for processes to fully terminate
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Duplicate detection complete, continuing startup...\n');

  } catch (error) {
    console.log('⚠️  Duplicate detection skipped (non-critical)\n');
  }
}

// Run duplicate check BEFORE anything else (wrapped to avoid top-level await issues)
(async () => {
  await killDuplicateInstances();
  startBot();
})();

// Extend Client type để thêm commands collection
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, any>;
  }
}

let client: Client;
let player: Player;
let moduleLoader: ModuleLoader;

// Export for other modules
export { player };
export function getModuleLoader(): ModuleLoader | null {
  return moduleLoader || null;
}

function startBot() {
  client = new Client({
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
  player = new Player(client);

  // Load YouTube extractor (optional - requires discord-player-youtubei)
  // player.extractors.register(YoutubeiExtractor, {});

  console.log('✅ Music player initialized (events handled by music-module)');

  // ============================================
  // LOAD MODULES (New Module System)
  // ============================================

  // Load modules on ready

async function initializeModules() {
  try {
    // ⚠️ CRITICAL: Initialize database schema BEFORE loading modules
    // Some modules query daily_users table immediately on load
    await initializeDatabase();
    
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

  // Setup prefix commands
  setupPrefixCommands(client);

  // Auto-deploy commands to Discord
  try {
    console.log('🚀 Deploying commands to Discord...');
    
    const commands = [];
    auditSlashCommands(client.commands);
    for (const [name, command] of client.commands) {
      if (command.data) {
        commands.push(sanitizeCommandJson(command.data.toJSON()));
      }
    }
    
    console.log(`📋 Found ${commands.length} commands to deploy`);
    
    const { REST } = require('@discordjs/rest');
    const { Routes } = require('discord-api-types/v10');
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
    
    // Deploy globally (no 100-command limit, but takes ~1 hour to sync)
    const deployGlobal = process.env.DEPLOY_GLOBAL === 'true';
    
    if (deployGlobal) {
      await rest.put(
        Routes.applicationCommands(client.user!.id),
        { body: commands }
      );
      console.log(`✅ Deployed ${commands.length} commands globally (sync in ~1 hour)`);
    } else {
      // Guild deploy (faster but 100-command limit)
      const guildId = process.env.GUILD_ID || '1482354951689605150';
      
      try {
        await rest.put(
          Routes.applicationGuildCommands(client.user!.id, guildId),
          { body: commands }
        );
        console.log(`✅ Deployed ${commands.length} commands to guild ${guildId}`);
      } catch (guildError: any) {
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
  const startTime = Date.now(); // Track performance
  
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
      const preExecuteTime = Date.now() - startTime;
      if (preExecuteTime > 500) {
        console.warn(`⚠️ Slow pre-execute: ${interaction.commandName} took ${preExecuteTime}ms before execute`);
      }
      
      const command = client.commands.get(interaction.commandName);
      
      if (!command) {
        console.warn(`⚠️ Unknown command: ${interaction.commandName}`);
        return;
      }

      // ⚡ EXECUTE IMMEDIATELY - Let command handle its own defer
      try {
        await runCommandWithTimeout(interaction.commandName, interaction, command.execute(interaction));
        
        const totalTime = Date.now() - startTime;
        if (totalTime > 2000) {
          console.warn(`⚠️ Slow command: ${interaction.commandName} took ${totalTime}ms total`);
        }
      } catch (error: any) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        
        // ⚡ Handle expired interaction
        if (error.code === 10062 || error.rawError?.code === 10062) {
          console.warn(`⚠️ Interaction expired for command: ${interaction.commandName}`);
          return;
        }

        const isTimeout = error.code === 'COMMAND_TIMEOUT' || error.message === 'Command timeout';
        await replyCommandError(
          interaction,
          isTimeout
            ? 'Lệnh mất quá nhiều thời gian để xử lý. Vui lòng thử lại sau.'
            : 'Có lỗi xảy ra khi thực hiện lệnh. Hệ thống đã ghi log để kiểm tra.',
        );
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
// PREFIX COMMANDS - Handled by individual modules
// ============================================
// Each module handles its own prefix commands (e.g., music-module handles !bc)
// No global prefix handler needed

  // ============================================
  // AI CHAT HANDLER - DISABLED
  // ============================================
  // Removed to prevent duplicate responses. AI handled by ai-module only.

  // ⚠️ DISABLED - Duplicate with ai-module mention handler
  // client.on('messageCreate', async (message) => {
//   // Ignore bot messages
//   if (message.author.bot) return;
//   
//   // Only in guilds
//   if (!message.guild) return;

//   const config = conversationManager.getConfig();

//   // Check if auto-reply is enabled
//   if (!config.autoReplyOnMention) return;

//   // Check if bot is mentioned
//   const botMentioned = message.mentions.has(client.user!);
//   if (!botMentioned) return;

//   // ⚡ Rate limiting - Prevent spam
//   if (!aiChatRateLimiter.check(message.author.id)) {
//     const info = aiChatRateLimiter.getInfo(message.author.id);
//     return message.reply(`⏱️ Bạn đang gửi tin nhắn quá nhanh! Vui lòng đợi ${info.resetIn}s nữa.`);
//   }

//   // Check if user is blacklisted
//   if (conversationManager.isUserBlacklisted(message.author.id)) return;

//   // Check if channel is allowed
//   if (!conversationManager.isChannelAllowed(message.channel.id)) return;

//   // Check if AI service is available
//   if (!aiChatService.isAvailable()) {
//     return message.reply('❌ AI service chưa được cấu hình');
//   }

//   try {
//     // Show typing indicator
//     await message.channel.sendTyping();

//     // Remove mention from message
//     let userMessage = message.content
//       .replace(/<@!?\d+>/g, '')
//       .trim();

//     if (!userMessage) {
//       return message.reply('💭 Bạn muốn hỏi gì?');
//     }

//     // Get AI response with retry on rate limit
//     let response: any = null;
//     let retries = 0;
//     const maxRetries = 2;
//     let currentModel = 'openai/gpt-oss-20b'; // Fastest (1000 T/s)
//     
//     while (retries <= maxRetries) {
//       response = await aiChatService.chat(
//         message.author.id,
//         message.guild.id,
//         userMessage,
//         { model: currentModel }
//       );

//       // Success
//       if (response.success) break;

//       // Rate limit - try fallback model or retry
//       if (response.error?.includes('rate_limit') || response.error?.includes('429')) {
//         retries++;
//         
//         // First retry: switch to Llama 3.1 8B (less rate limit)
//         if (retries === 1 && currentModel === 'openai/gpt-oss-20b') {
//           currentModel = 'llama-3.1-8b-instant';
//           console.log('⏳ Rate limit on GPT-OSS, switching to Llama 3.1 8B...');
//           continue;
//         }
//         
//         // Second retry: wait and try again
//         if (retries <= maxRetries) {
//           const delay = 5000;
//           console.log(`⏳ Rate limit hit, retrying in ${delay/1000}s (attempt ${retries}/${maxRetries})`);
//           await new Promise(resolve => setTimeout(resolve, delay));
//           continue;
//         }
//       }
//       
//       // Other errors or max retries reached
//       break;
//     }

//     if (!response || !response.success) {
//       return message.reply(`❌ Lỗi: ${response?.error || 'Unknown error'}`);
//     }

//     // Split long messages
//     const maxLength = 2000;
//     const responseText = response.message || 'No response';

//     if (responseText.length <= maxLength) {
//       await message.reply(responseText);
//     } else {
//       // Send first chunk as reply
//       await message.reply(responseText.substring(0, maxLength));

//       // Send remaining chunks
//       for (let i = maxLength; i < responseText.length; i += maxLength) {
//         await message.channel.send(responseText.substring(i, i + maxLength));
//       }
//     }

//   } catch (error) {
//     console.error('AI chat error:', error);
//     message.reply('❌ Có lỗi xảy ra khi xử lý tin nhắn');
//   }
// });

// console.log('✅ AI Chat auto-reply listener initialized');

// ============================================
// MEMORY OPTIMIZER - Auto cleanup every 30 minutes
// ============================================

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
  
  // ⚠️ Silent ignore for AbortError from discord-voip (voice connection timeout)
  if (reason?.name === 'AbortError' || reason?.code === 'ABORT_ERR') {
    return;
  }
  
  // ⚠️ Silent ignore for "Cannot perform IP discovery - socket closed" from discord-voip
  if (reason?.message?.includes('Cannot perform IP discovery') || reason?.message?.includes('socket closed')) {
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
  
  // ⚠️ Silent ignore for AbortError from discord-voip
  if ((error as any).name === 'AbortError' || (error as any).code === 'ABORT_ERR') {
    return;
  }
  
  // ⚠️ Silent ignore for "Cannot perform IP discovery - socket closed" from discord-voip
  if (error.message?.includes('Cannot perform IP discovery') || error.message?.includes('socket closed')) {
    return;
  }
  
  console.error('🚨 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  
  // For other critical errors, log but don't exit (let nodemon restart)
  console.error('💥 Critical error detected');
});

// Handle warnings (optional - helps debug)
process.on('warning', (warning) => {
  // ⚠️ Silent ignore for AbortError from discord-voip
  if (warning.name === 'AbortError' || warning.message?.includes('discord-voip')) {
    return;
  }
  
  console.warn('⚠️ Process Warning:', warning.name);
  console.warn('Message:', warning.message);
  if (warning.stack) {
    console.warn('Stack:', warning.stack);
  }
});

console.log('✅ Global error handlers registered');

} // End of startBot()
