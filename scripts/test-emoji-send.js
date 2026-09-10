/**
 * Send test message with emoji to verify format
 */

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const GUILD_ID = process.env.GUILD_ID || '1482354951689605150';
const CHANNEL_NAME = 'test'; // Tên channel để gửi test

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}\n`);
  
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log(`📁 Server: ${guild.name}\n`);
    
    // Find channel
    const channels = await guild.channels.fetch();
    const testChannel = channels.find(ch => ch.name === CHANNEL_NAME && ch.isTextBased());
    
    if (!testChannel) {
      console.log(`❌ Channel "${CHANNEL_NAME}" not found!`);
      process.exit(1);
    }
    
    console.log(`📝 Found channel: #${testChannel.name}\n`);
    
    // Test emoji formats
    const tests = [
      '**Test 1: Direct emoji IDs**',
      '<:success:1546857884330098768>',
      '<:error:1546858101381140533>',
      '<:warning:1546858070758396006>',
      '<:art:1546858007944630352>',
      '',
      '**Test 2: From emojis.ts**',
    ];
    
    // Load compiled emojis
    const { emojis } = require('../dist/src/config/emojis');
    tests.push(`success: ${emojis.success}`);
    tests.push(`error: ${emojis.error}`);
    tests.push(`warning: ${emojis.warning}`);
    tests.push(`art: ${emojis.art}`);
    
    tests.push('');
    tests.push('**Test 3: Debug info**');
    tests.push(`\`success format: ${emojis.success}\``);
    tests.push(`\`error format: ${emojis.error}\``);
    
    // Send message
    await testChannel.send(tests.join('\n'));
    
    console.log('✅ Test message sent!\n');
    console.log('Check Discord channel #test for results.');
    console.log('');
    console.log('If Test 1 shows emoji but Test 2 shows text:');
    console.log('  → Bot is sending wrong format');
    console.log('');
    console.log('If Test 1 shows text:');
    console.log('  → Emoji IDs are wrong or emojis deleted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
});

client.login(process.env.BOT_TOKEN || process.env.DISCORD_TOKEN);
