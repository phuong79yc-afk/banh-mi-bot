require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`\n✅ Bot: ${client.user.tag}\n`);
  console.log('📊 Servers bot is in:\n');
  
  client.guilds.cache.forEach(guild => {
    console.log(`  ${guild.name}`);
    console.log(`    ID: ${guild.id}`);
    console.log(`    Members: ${guild.memberCount}`);
    console.log('');
  });
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
