const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const GUILD_ID = process.env.GUILD_ID;

async function checkPermissions() {
  console.log('🔍 Checking bot permissions...\n');
  
  await client.login(process.env.BOT_TOKEN);
  
  client.once('ready', async () => {
    console.log(`✅ Bot: ${client.user.tag}\n`);
    
    try {
      const guild = await client.guilds.fetch(GUILD_ID);
      console.log(`📁 Server: ${guild.name}`);
      
      const me = await guild.members.fetchMe();
      const permissions = me.permissions;
      
      console.log(`\n🔐 Bot Permissions:`);
      console.log(`   Administrator: ${permissions.has('Administrator')}`);
      console.log(`   Manage Emojis: ${permissions.has('ManageEmojisAndStickers')}`);
      console.log(`   Manage Guild: ${permissions.has('ManageGuild')}`);
      
      const emojis = await guild.emojis.fetch();
      console.log(`\n📊 Current Emojis: ${emojis.size}/50`);
      
      if (emojis.size > 0) {
        console.log(`\nExisting emojis:`);
        emojis.forEach(e => console.log(`   - ${e.name} (${e.id})`));
      }
      
    } catch (error) {
      console.error(`\n❌ Error:`, error.message);
    }
    
    process.exit(0);
  });
}

checkPermissions().catch(console.error);
