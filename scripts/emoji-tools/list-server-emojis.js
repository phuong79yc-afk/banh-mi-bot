const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(projectRoot, '.env') });

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers] 
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}\n`);
  
  const guild = client.guilds.cache.first();
  if (!guild) {
    console.log('❌ No guild found!');
    process.exit(0);
  }
  
  console.log(`🏰 Server: ${guild.name}\n`);
  console.log('😀 Emojis:\n');
  
  guild.emojis.cache.forEach(emoji => {
    const type = emoji.animated ? 'a' : '';
    console.log(`  ${emoji.name}`);
    console.log(`    Usage: <${type}:${emoji.name}:${emoji.id}>`);
    console.log(`    ID: ${emoji.id}\n`);
  });
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
