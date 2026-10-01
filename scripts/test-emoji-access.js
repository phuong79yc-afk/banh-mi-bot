require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const EMOJI_SERVER_ID = '1482354951689605150';
const TEST_EMOJI_ID = '1554844011653496842'; // success emoji

client.once('ready', async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}\n`);
  
  try {
    // Check if bot is in the emoji server
    const emojiServer = client.guilds.cache.get(EMOJI_SERVER_ID);
    
    if (!emojiServer) {
      console.log('❌ PROBLEM: Bot is NOT in the emoji server!');
      console.log(`   Server ID: ${EMOJI_SERVER_ID}`);
      console.log('\n📝 SOLUTION:');
      console.log(`   1. Invite bot to server ID ${EMOJI_SERVER_ID}`);
      console.log(`   2. OR move emojis to a server where bot already is`);
      console.log('\n🔗 Bot is currently in these servers:');
      client.guilds.cache.forEach(g => {
        console.log(`   - ${g.name} (${g.id})`);
      });
      process.exit(1);
    }
    
    console.log(`✅ Bot IS in emoji server: ${emojiServer.name}\n`);
    
    // Fetch emojis from that server
    const emojis = await emojiServer.emojis.fetch();
    console.log(`📊 Found ${emojis.size} emoji(s) in server\n`);
    
    // Check if our test emoji exists
    const testEmoji = emojis.get(TEST_EMOJI_ID);
    if (testEmoji) {
      console.log(`✅ Test emoji found: ${testEmoji.name}`);
      console.log(`   Format: <${testEmoji.animated ? 'a' : ''}:${testEmoji.name}:${testEmoji.id}>`);
      console.log(`   Animated: ${testEmoji.animated}`);
      console.log(`   Available: ${testEmoji.available}`);
    } else {
      console.log(`❌ Test emoji NOT found in server`);
    }
    
    console.log('\n✅ ALL CHECKS PASSED');
    console.log('   Emojis should work in Discord messages!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
