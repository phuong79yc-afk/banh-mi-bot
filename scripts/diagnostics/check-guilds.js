const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(projectRoot, '.env') });

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
