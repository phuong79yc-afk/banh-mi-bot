const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds] 
});

client.once('ready', () => {
  console.log('\n🏰 Guilds in cache:\n');
  client.guilds.cache.forEach(g => {
    console.log(`  - ${g.name}`);
    console.log(`    ID: ${g.id}\n`);
  });
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
