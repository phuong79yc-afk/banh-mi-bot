// Simple script to deploy all module commands to Discord
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

// ⚠️ IMPORTANT: All commands are now PUBLIC (no permission restrictions)
// Anyone can use /ai, /ping, /help, etc.
// If you want to restrict, add .setDefaultMemberPermissions(...) to specific commands

// Define all commands manually (from ai-module and utility module)
const commands = [
  // AI Module commands
  new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Chat with AI (with memory) / Trò chuyện với AI (có nhớ context)')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Your message / Tin nhắn của bạn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('model')
        .setDescription('AI Model / Mô hình AI')
        .setRequired(false)
        .addChoices(
          { name: '⚡ GPT-OSS 20B (Fastest)', value: 'groq:openai/gpt-oss-20b' },
          { name: '🧠 GPT-OSS 120B (Smart)', value: 'groq:openai/gpt-oss-120b' },
          { name: '🚀 Llama 3.1 8B (Quick)', value: 'groq:llama-3.1-8b-instant' },
          { name: '💎 Llama 3.3 70B', value: 'groq:llama-3.3-70b-versatile' },
          { name: '✨ Gemini 2.0 Flash (New)', value: 'gemini:gemini-2.0-flash-exp' },
          { name: '💎 Gemini 1.5 Pro', value: 'gemini:gemini-1.5-pro' },
          { name: '⚡ Gemini 1.5 Flash', value: 'gemini:gemini-1.5-flash' }
        )
    )
    .addStringOption(option =>
      option
        .setName('style')
        .setDescription('Response style / Phong cách trả lời')
        .setRequired(false)
        .addChoices(
          { name: '📝 Default (Helpful)', value: 'default' },
          { name: '🎨 Creative', value: 'creative' },
          { name: '💼 Professional', value: 'professional' },
          { name: '😄 Casual', value: 'casual' },
          { name: '💻 Technical', value: 'technical' }
        )
    )
    .addBooleanOption(option =>
      option
        .setName('clear_memory')
        .setDescription('Clear conversation history / Xóa lịch sử hội thoại')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('ai-memory')
    .setDescription('View or clear AI conversation memory / Xem/xóa bộ nhớ hội thoại AI')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View conversation history / Xem lịch sử')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('Clear conversation history / Xóa lịch sử')
    ),

  new SlashCommandBuilder()
    .setName('ai-models')
    .setDescription('List available AI models / Danh sách mô hình AI'),

  // Utility module commands
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency / Kiểm tra độ trễ bot'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help information / Hiển thị thông tin trợ giúp'),

  new SlashCommandBuilder()
    .setName('info')
    .setDescription('Show bot information / Thông tin bot'),

  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show server information / Thông tin server')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🚀 Starting deployment...\n');
    console.log(`📊 Total commands: ${commands.length}\n`);
    
    commands.forEach((cmd, i) => {
      console.log(`  ${i + 1}. /${cmd.name} - ${cmd.description}`);
    });

    console.log('\n');

    if (process.env.GUILD_ID) {
      console.log('📍 Deploying to guild:', process.env.GUILD_ID);
      console.log('⚡ Commands will be available INSTANTLY\n');
      
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
    } else {
      console.log('🌍 Deploying GLOBALLY');
      console.log('⏰ Commands will take ~1 hour to propagate worldwide');
      console.log('💡 Add GUILD_ID to .env for instant deployment\n');
      
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
    }

    console.log(`✅ Successfully deployed ${commands.length} commands!\n`);
    
    if (!process.env.GUILD_ID) {
      console.log('⏰ Please wait ~1 hour for global commands to appear');
      console.log('💡 Or add GUILD_ID to .env and run again for instant deployment\n');
    }
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
})();
