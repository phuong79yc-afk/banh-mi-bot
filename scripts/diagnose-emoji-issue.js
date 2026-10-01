require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const EMOJI_SERVER_ID = '1482354951689605150';

client.once('ready', async () => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  🔍 EMOJI ISSUE DIAGNOSIS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`✅ Bot: ${client.user.tag}\n`);
  
  console.log(`📊 Bot is in ${client.guilds.cache.size} server(s):\n`);
  
  let emojiServerFound = false;
  
  client.guilds.cache.forEach(guild => {
    const isEmojiServer = guild.id === EMOJI_SERVER_ID;
    const emojiCount = guild.emojis.cache.size;
    
    if (isEmojiServer) emojiServerFound = true;
    
    console.log(`${isEmojiServer ? '⭐' : '  '} ${guild.name}`);
    console.log(`     ID: ${guild.id}`);
    console.log(`     Members: ${guild.memberCount}`);
    console.log(`     Emojis: ${emojiCount}`);
    
    if (isEmojiServer) {
      console.log(`     ⭐ THIS IS THE EMOJI SERVER (50 animated emojis here)`);
    } else if (emojiCount === 0) {
      console.log(`     ⚠️  NO EMOJIS in this server - emojis will show as text!`);
    }
    console.log('');
  });
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  💡 DIAGNOSIS RESULT:');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (!emojiServerFound) {
    console.log('❌ PROBLEM: Bot is NOT in the emoji server!\n');
    console.log(`   Solution: Invite bot to server ID ${EMOJI_SERVER_ID}\n`);
    process.exit(1);
  }
  
  const otherServers = Array.from(client.guilds.cache.values()).filter(g => g.id !== EMOJI_SERVER_ID);
  
  if (otherServers.length > 0) {
    console.log('⚠️  FOUND THE PROBLEM!\n');
    console.log(`   Bot is in ${client.guilds.cache.size} servers, but emojis only exist in 1 server.\n`);
    console.log('   🔴 Discord Rule: Bots can only use emojis from the CURRENT server.\n');
    console.log('   When you use bot commands in other servers, emojis show as text\n');
    console.log('   because those servers don\'t have the emoji!\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✅ SOLUTION: Copy emojis to ALL servers');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('   I will create a script to upload emojis to all servers...\n');
    
  } else {
    console.log('✅ Bot is ONLY in the emoji server.\n');
    console.log('   Emojis should work perfectly in this server!\n');
    console.log('   If they still show as text, rebuild and restart bot.\n');
  }
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
