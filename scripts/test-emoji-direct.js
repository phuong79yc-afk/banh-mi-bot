require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot ready: ${client.user.tag}`);
  console.log('📝 Go to Discord and type: !emojitest\n');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!emojitest')) return;
  
  const guild = message.guild;
  
  // Get emoji from guild
  const successEmoji = guild.emojis.cache.find(e => e.name === 'success');
  const coinEmoji = guild.emojis.cache.find(e => e.name === 'coin');
  const sparklesEmoji = guild.emojis.cache.find(e => e.name === 'sparkles');
  
  console.log('\n🧪 Testing emojis:');
  console.log(`   success: ${successEmoji ? successEmoji.toString() : 'NOT FOUND'}`);
  console.log(`   coin: ${coinEmoji ? coinEmoji.toString() : 'NOT FOUND'}`);
  console.log(`   sparkles: ${sparklesEmoji ? sparklesEmoji.toString() : 'NOT FOUND'}\n`);
  
  // Method 1: Using guild emoji objects
  const embed1 = new EmbedBuilder()
    .setTitle('Method 1: Guild Emoji Objects')
    .setDescription([
      `${successEmoji} Success (using emoji object)`,
      `${coinEmoji} Coin (using emoji object)`,
      `${sparklesEmoji} Sparkles (using emoji object)`,
    ].join('\n'))
    .setColor(0x00ff00);
  
  // Method 2: Using string format
  const embed2 = new EmbedBuilder()
    .setTitle('Method 2: String Format')
    .setDescription([
      `<a:success:1554844011653496842> Success (string)`,
      `<a:coin:1555075964919226449> Coin (string)`,
      `<a:sparkles:1554843063333949521> Sparkles (string)`,
    ].join('\n'))
    .setColor(0x0099ff);
  
  // Method 3: Using emoji ID from cache
  const embed3 = new EmbedBuilder()
    .setTitle('Method 3: Dynamic from Cache')
    .setDescription([
      successEmoji ? `${successEmoji.toString()} Success ID: ${successEmoji.id}` : 'Success emoji not found',
      coinEmoji ? `${coinEmoji.toString()} Coin ID: ${coinEmoji.id}` : 'Coin emoji not found',
      sparklesEmoji ? `${sparklesEmoji.toString()} Sparkles ID: ${sparklesEmoji.id}` : 'Sparkles emoji not found',
    ].join('\n'))
    .setColor(0xff9900);
  
  await message.reply({ 
    content: 'Testing 3 different methods:',
    embeds: [embed1, embed2, embed3] 
  });
  
  console.log(`✅ Sent test to ${guild.name}\n`);
});

client.login(process.env.DISCORD_TOKEN);

console.log('🚀 Starting emoji test bot...');
console.log('📝 Type !emojitest in Discord to test\n');
