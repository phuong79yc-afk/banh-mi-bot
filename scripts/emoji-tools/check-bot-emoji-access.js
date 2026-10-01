/**
 * Check if bot can access emoji IDs from config
 * Run: node scripts/check-bot-emoji-access.js
 */

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers]
});

const EMOJI_IDS_TO_CHECK = {
  "success": "1546857884330098768",
  "settings": "1546857981482635397",
  "art": "1546858007944630352",
  "delete": "1546858039556972545",
  "warning": "1546858070758396006",
  "error": "1546858101381140533",
  "refresh": "1546864957075882015",
  "export": "1546865815700246639"
};

async function checkEmojiAccess() {
  console.log('🔍 Checking emoji access...\n');
  
  await client.login(process.env.BOT_TOKEN);
  
  client.once('ready', async () => {
    console.log(`✅ Bot: ${client.user.tag}`);
    console.log(`📊 Servers: ${client.guilds.cache.size}\n`);
    
    // List all servers
    console.log('═'.repeat(60));
    console.log('ALL SERVERS:');
    console.log('═'.repeat(60));
    client.guilds.cache.forEach(guild => {
      console.log(`${guild.id.padEnd(20)} ${guild.name}`);
    });
    console.log('');
    
    // Check each emoji
    console.log('═'.repeat(60));
    console.log('EMOJI ACCESS CHECK:');
    console.log('═'.repeat(60));
    
    for (const [name, id] of Object.entries(EMOJI_IDS_TO_CHECK)) {
      let found = false;
      let foundInGuild = null;
      
      // Search in all guilds
      for (const guild of client.guilds.cache.values()) {
        const emoji = guild.emojis.cache.get(id);
        if (emoji) {
          found = true;
          foundInGuild = guild;
          break;
        }
      }
      
      if (found) {
        console.log(`✅ ${name.padEnd(10)} ${id} (${foundInGuild.name})`);
      } else {
        console.log(`❌ ${name.padEnd(10)} ${id} NOT ACCESSIBLE`);
      }
    }
    
    console.log('');
    console.log('═'.repeat(60));
    console.log('AVAILABLE EMOJIS IN TARGET GUILD (1482354951689605150):');
    console.log('═'.repeat(60));
    
    const targetGuild = client.guilds.cache.get('1482354951689605150');
    if (targetGuild) {
      const emojis = await targetGuild.emojis.fetch();
      if (emojis.size > 0) {
        console.log(`Found ${emojis.size} emoji(s):\n`);
        emojis.forEach(emoji => {
          console.log(`${emoji.name.padEnd(20)} ${emoji.id}`);
        });
      } else {
        console.log('⚠️  NO EMOJIS in this guild!');
        console.log('\n📝 Solution: Upload emoji to this server manually via Discord UI');
      }
    } else {
      console.log('❌ Bot not in target guild!');
    }
    
    console.log('');
    process.exit(0);
  });
}

checkEmojiAccess().catch(console.error);
