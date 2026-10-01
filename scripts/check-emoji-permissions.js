require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const EMOJI_SERVER_ID = '1482354951689605150';
const TEST_EMOJIS = {
  success: '1554844011653496842',
  error: '1554843556349345973',
  coin: '1555075964919226449'
};

client.once('ready', async () => {
  console.log(`✅ Bot: ${client.user.tag}\n`);
  
  const emojiServer = client.guilds.cache.get(EMOJI_SERVER_ID);
  if (!emojiServer) {
    console.log('❌ Bot not in emoji server');
    process.exit(1);
  }
  
  console.log(`📊 Server: ${emojiServer.name}\n`);
  
  // Check bot permissions in emoji server
  const botMember = await emojiServer.members.fetch(client.user.id);
  const permissions = botMember.permissions.toArray();
  
  console.log('🔐 Bot permissions:');
  console.log(`   Use External Emojis: ${botMember.permissions.has('UseExternalEmojis')}`);
  console.log(`   Use External Stickers: ${botMember.permissions.has('UseExternalStickers')}`);
  console.log(`   Administrator: ${botMember.permissions.has('Administrator')}`);
  console.log('');
  
  // Fetch and check specific emojis
  const emojis = await emojiServer.emojis.fetch();
  console.log(`📋 Checking ${Object.keys(TEST_EMOJIS).length} test emojis:\n`);
  
  for (const [name, id] of Object.entries(TEST_EMOJIS)) {
    const emoji = emojis.get(id);
    if (emoji) {
      console.log(`✅ ${name}:`);
      console.log(`   Name: ${emoji.name}`);
      console.log(`   ID: ${emoji.id}`);
      console.log(`   Animated: ${emoji.animated}`);
      console.log(`   Available: ${emoji.available}`);
      console.log(`   Managed: ${emoji.managed}`);
      console.log(`   Require Colons: ${emoji.requiresColons}`);
      console.log(`   Format: ${emoji.toString()}`);
      console.log('');
    } else {
      console.log(`❌ ${name}: NOT FOUND (ID: ${id})\n`);
    }
  }
  
  // Check if bot needs Nitro
  console.log('💡 IMPORTANT NOTE:');
  console.log('   Bots can use emojis from servers they are in WITHOUT Nitro.');
  console.log('   If emojis still show as text in Discord, possible causes:');
  console.log('   1. Bot is not in the target server where message is sent');
  console.log('   2. Emoji was deleted/renamed after fetching IDs');
  console.log('   3. Discord permission issue in target channel');
  console.log('');
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
