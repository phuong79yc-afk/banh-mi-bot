/**
 * Check if test-emoji command is properly registered
 */

const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

client.commands = new Collection();

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}\n`);
  
  // Check commands registered in Discord
  const GUILD_ID = process.env.GUILD_ID;
  const guild = await client.guilds.fetch(GUILD_ID);
  const commands = await guild.commands.fetch();
  
  console.log(`📊 Discord has ${commands.size} registered commands\n`);
  
  const testEmoji = commands.find(cmd => cmd.name === 'test-emoji');
  
  if (testEmoji) {
    console.log('✅ test-emoji IS registered in Discord:');
    console.log(`   Name: ${testEmoji.name}`);
    console.log(`   Description: ${testEmoji.description}`);
    console.log(`   ID: ${testEmoji.id}`);
  } else {
    console.log('❌ test-emoji NOT found in Discord commands!');
    console.log('\n📋 Available commands:');
    commands.forEach(cmd => {
      console.log(`   - ${cmd.name}`);
    });
  }
  
  process.exit(0);
});

client.login(process.env.BOT_TOKEN || process.env.DISCORD_TOKEN);
