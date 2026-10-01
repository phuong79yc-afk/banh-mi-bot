const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildEmojisAndStickers
  ]
});

client.once('ready', async () => {
  console.log(`✅ Bot: ${client.user.tag}`);
  console.log(`📊 Cached emojis: ${client.emojis.cache.size}`);
  console.log(`\n🔍 First 10 cached emojis:`);
  
  let count = 0;
  for (const [id, emoji] of client.emojis.cache) {
    if (count >= 10) break;
    console.log(`  ${emoji.name} (${emoji.id}) - ${emoji.animated ? 'ANIMATED' : 'STATIC'}`);
    console.log(`    Format: <${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`);
    count++;
  }
  
  console.log(`\n🧪 Testing specific emoji:`);
  const testEmojis = [
    { name: 'success', id: '1547154783465508894' },
    { name: 'error', id: '1547155697358217216' },
    { name: 'export', id: '1547155335788367943' }
  ];
  
  for (const test of testEmojis) {
    const emoji = client.emojis.cache.get(test.id);
    if (emoji) {
      console.log(`  ✅ ${test.name}: ${emoji.toString()}`);
    } else {
      console.log(`  ❌ ${test.name}: NOT IN CACHE`);
    }
  }
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
