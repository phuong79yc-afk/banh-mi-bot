import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

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
  ],
});

client.commands = new Collection();

// Initialize music player
const player = new Player(client);

// Load YouTube extractor (suppress warnings)
player.extractors.register(YoutubeiExtractor, {});

// Suppress YouTube console warnings
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  const message = args.join(' ');
  // Suppress YouTube extractor warnings
  if (message.includes('[YOUTUBEJS][Player]') || 
      message.includes('Failed to extract signature') ||
      message.includes('Failed to extract n decipher')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

console.log('✅ YouTube extractor loaded');

// Player events
player.events.on('playerStart', (queue, track) => {
  const channel = queue.metadata.channel as any;
  channel?.send(`🎵 Đang phát: **${track.title}** • ${track.author}`);
});

player.events.on('audioTrackAdd', (queue, track) => {
  const channel = queue.metadata.channel as any;
  channel?.send(`✅ Đã thêm vào hàng đợi: **${track.title}**`);
});

player.events.on('emptyQueue', (queue) => {
  const channel = queue.metadata.channel as any;
  channel?.send('✅ Đã phát hết nhạc trong hàng đợi!');
});

player.events.on('error', (queue, error) => {
  console.error(`Music player error:`, error);
  const channel = queue.metadata.channel as any;
  channel?.send('❌ Có lỗi xảy ra khi phát nhạc!');
});

// ============================================
// LOAD MODULES (New Module System)
// ============================================
import { ModuleLoader } from './core/ModuleLoader';

// Load modules on ready
let moduleLoader: ModuleLoader;

async function initializeModules() {
  try {
    // Pass absolute path to modules directory
    const modulesPath = path.resolve(__dirname, 'modules');
    console.log('📁 Modules path:', modulesPath);
    
    moduleLoader = new ModuleLoader(client, modulesPath);
    await moduleLoader.loadAllModules();
    
    // Register all module commands
    for (const [moduleName, loadedModule] of moduleLoader.getLoadedModules()) {
      if (loadedModule.instance && loadedModule.instance.commands) {
        for (const [cmdName, command] of loadedModule.instance.commands) {
          client.commands.set(cmdName, command);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error loading modules:', error);
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
      state: '/help | http://localhost:5173/dashboard'
    }],
    status: 'idle', // idle = yellow/orange moon icon
  });

  // Initialize modules
  await initializeModules();

  // Start web server
  const { startWebServer } = require('./web/server');
  const port = process.env.PORT || 3000;
  startWebServer(client, port);
});

// Interaction handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Error executing ${interaction.commandName}:`, error);
    const reply = {
      content: '❌ Có lỗi xảy ra khi thực hiện lệnh này!',
      ephemeral: true,
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
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
// AI CHAT - Message Listener for Auto-Reply
// ============================================
import { aiChatService } from './utils/aiChatService';
import { conversationManager } from './utils/conversationManager';

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
