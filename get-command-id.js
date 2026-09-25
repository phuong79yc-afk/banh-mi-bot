// Quick script to get command ID
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  
  try {
    // Check both global and guild commands
    console.log('\n🌍 Fetching GLOBAL commands...');
    const globalCommands = await client.application.commands.fetch();
    console.log(`Found ${globalCommands.size} global commands\n`);
    
    if (process.env.GUILD_ID) {
      console.log(`📍 Fetching GUILD commands for ${process.env.GUILD_ID}...`);
      const guildCommands = await client.application.commands.fetch({ guildId: process.env.GUILD_ID });
      console.log(`Found ${guildCommands.size} guild commands\n`);
      
      guildCommands.forEach(cmd => {
        console.log(`${cmd.name} => ID: ${cmd.id}`);
        if (cmd.name === 'minecraft-custom-server-banner') {
          console.log(`\n🎯 FOUND IT! Command ID: ${cmd.id}`);
          console.log(`Mention format: </minecraft custom-server-banner:${cmd.id}>\n`);
        }
      });
    }
    
    globalCommands.forEach(cmd => {
      console.log(`${cmd.name} => ID: ${cmd.id}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
