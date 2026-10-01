require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const EMOJI_SERVER_ID = '1482354951689605150';
const TEST_EMOJI_IDS = {
  success: '1555134746340884480',
  error: '1555133957870460979',
  loading: '1555134662525980763'
};

client.once('ready', async () => {
  console.log(`✅ Bot: ${client.user.tag}\n`);
  
  const emojiServer = client.guilds.cache.get(EMOJI_SERVER_ID);
  if (!emojiServer) {
    console.log('❌ Bot not in emoji server');
    process.exit(1);
  }
  
  console.log('📊 Testing emoji IDs:\n');
  
  for (const [name, id] of Object.entries(TEST_EMOJI_IDS)) {
    const emoji = emojiServer.emojis.cache.get(id);
    
    if (emoji) {
      console.log(`✅ ${name} (${id}):`);
      console.log(`   Name: ${emoji.name}`);
      console.log(`   Format: ${emoji.toString()}`);
      console.log(`   Animated: ${emoji.animated}`);
      console.log(`   Available: ${emoji.available}`);
    } else {
      console.log(`❌ ${name} (${id}): NOT FOUND`);
      
      // Try to find by name
      const byName = emojiServer.emojis.cache.find(e => e.name === name);
      if (byName) {
        console.log(`   ⚠️  Found emoji with name "${name}" but different ID: ${byName.id}`);
        console.log(`   Old ID: ${id}`);
        console.log(`   New ID: ${byName.id}`);
      }
    }
    console.log('');
  }
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
