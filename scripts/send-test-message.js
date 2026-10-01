require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot ready: ${client.user.tag}`);
  console.log('📝 Gõ "!sendtest" trong Discord để test\n');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content !== '!sendtest') return;
  
  const guild = message.guild;
  
  // Get emoji objects from guild
  const successEmoji = guild.emojis.cache.find(e => e.name === 'success');
  const errorEmoji = guild.emojis.cache.find(e => e.name === 'error');
  const loadingEmoji = guild.emojis.cache.find(e => e.name === 'loading');
  
  console.log('\n🧪 Sending test message...');
  console.log(`   Server: ${guild.name} (${guild.id})`);
  console.log(`   Success emoji found: ${!!successEmoji}`);
  console.log(`   Error emoji found: ${!!errorEmoji}`);
  console.log(`   Loading emoji found: ${!!loadingEmoji}\n`);
  
  if (!successEmoji || !errorEmoji || !loadingEmoji) {
    await message.reply('❌ Không tìm thấy emoji trên server này!');
    return;
  }
  
  // Test 1: Using emoji objects
  await message.reply(
    `**Test 1: Emoji Objects**\n` +
    `${successEmoji} Success\n` +
    `${errorEmoji} Error\n` +
    `${loadingEmoji} Loading`
  );
  
  // Test 2: Using string format
  await message.channel.send(
    `**Test 2: String Format**\n` +
    `<a:success:${successEmoji.id}> Success\n` +
    `<a:error:${errorEmoji.id}> Error\n` +
    `<a:loading:${loadingEmoji.id}> Loading`
  );
  
  // Test 3: Using emoji URL (should always work)
  await message.channel.send(
    `**Test 3: If above don't work, emoji URLs:**\n` +
    `Success: ${successEmoji.url}\n` +
    `Error: ${errorEmoji.url}\n` +
    `Loading: ${loadingEmoji.url}`
  );
  
  console.log('✅ Test messages sent!\n');
});

client.login(process.env.DISCORD_TOKEN);

console.log('🚀 Starting test bot...');
console.log('📝 Gõ "!sendtest" trong Test Bot🤖 server\n');
