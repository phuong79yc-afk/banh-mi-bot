/**
 * Clear ALL emojis from Discord server
 * Run: node scripts/clear-emojis.js
 */

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const GUILD_ID = process.env.GUILD_ID || '';

async function clearEmojis() {
  console.log('🗑️  Starting emoji cleanup...\n');
  
  if (!GUILD_ID) {
    console.error('❌ Error: GUILD_ID not found in .env');
    process.exit(1);
  }

  await client.login(process.env.BOT_TOKEN);
  
  client.once('ready', async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}\n`);
    
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log(`📁 Server: ${guild.name}\n`);
    
    const emojis = await guild.emojis.fetch();
    console.log(`📊 Found ${emojis.size} emoji(s)\n`);
    
    if (emojis.size === 0) {
      console.log('✅ No emojis to delete!\n');
      process.exit(0);
    }
    
    console.log('⏳ Deleting all emojis...\n');
    
    let deleted = 0;
    let failed = 0;
    
    for (const [id, emoji] of emojis) {
      try {
        await emoji.delete('Clearing old emojis for new upload');
        console.log(`✅ Deleted: ${emoji.name} (${id})`);
        deleted++;
        
        // Rate limit: wait 500ms between deletes
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`❌ Failed to delete ${emoji.name}: ${error.message}`);
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Cleanup Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Deleted: ${deleted}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60) + '\n');
    
    console.log('🎉 Cleanup complete!\n');
    console.log('📝 Next step: Run "node scripts/upload-emojis.js" to upload new emojis\n');
    
    process.exit(0);
  });
}

clearEmojis().catch(console.error);
