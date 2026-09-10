/**
 * Test if bot can render custom emoji in messages
 * Run: node scripts/test-emoji-render.js
 */

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const TEST_CHANNEL_ID = process.env.TEST_CHANNEL_ID || '1482354952373641279'; // Update this
const EMOJI_IDS = {
  checkmark: '1546857884330098768',
  error: '1546858101381140533',
  warning: '1546858070758396006',
  trash: '1546858039556972545',
  palette: '1546858007944630352',
  gear: '1546857981482635397'
};

async function testEmojiRender() {
  console.log('🔍 Testing emoji rendering...\n');
  
  await client.login(process.env.BOT_TOKEN);
  
  client.once('ready', async () => {
    console.log(`✅ Bot: ${client.user.tag}\n`);
    
    try {
      const channel = await client.channels.fetch(TEST_CHANNEL_ID);
      if (!channel || !channel.isTextBased()) {
        console.log('❌ Invalid channel!');
        process.exit(1);
      }
      
      console.log(`📢 Sending test message to: ${channel.name}\n`);
      
      // Test different formats
      const formats = [
        `<:checkmark:${EMOJI_IDS.checkmark}>`,
        `<:error:${EMOJI_IDS.error}>`,
        `<:warning:${EMOJI_IDS.warning}>`,
        `<:trash:${EMOJI_IDS.trash}>`,
        `<:palette:${EMOJI_IDS.palette}>`,
        `<:gear:${EMOJI_IDS.gear}>`
      ];
      
      // Plain message test
      await channel.send({
        content: `**Plain message test:**\n${formats.join(' ')}`
      });
      
      // Embed test
      const embed = new EmbedBuilder()
        .setTitle(`${formats[0]} Embed Title Test`)
        .setDescription(`**Emoji in description:**\n${formats.join('\n')}`)
        .setColor(0x00FF00);
      
      await channel.send({ embeds: [embed] });
      
      console.log('✅ Test messages sent!');
      console.log('\n📋 Formats tested:');
      formats.forEach(f => console.log(`   ${f}`));
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
  });
}

testEmojiRender().catch(console.error);
