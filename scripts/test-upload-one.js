const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const GUILD_ID = process.env.GUILD_ID;
const EMOJI_PATH = path.join(__dirname, '../assets/emojis/success.png');

async function testUpload() {
  console.log('🧪 Testing single emoji upload...\n');
  
  await client.login(process.env.BOT_TOKEN);
  
  client.once('ready', async () => {
    console.log(`✅ Bot: ${client.user.tag}`);
    
    try {
      const guild = await client.guilds.fetch(GUILD_ID);
      console.log(`📁 Server: ${guild.name}`);
      
      console.log(`⏳ Uploading success.png...`);
      
      const emoji = await guild.emojis.create({
        attachment: EMOJI_PATH,
        name: 'success',
        reason: 'Test upload'
      });
      
      console.log(`\n✅ Success!`);
      console.log(`   Name: ${emoji.name}`);
      console.log(`   ID: ${emoji.id}`);
      console.log(`   Usage: <:${emoji.name}:${emoji.id}>`);
      
    } catch (error) {
      console.error(`\n❌ Error:`, error.message);
      console.error(`   Code:`, error.code);
      console.error(`   HTTP:`, error.httpStatus);
    }
    
    process.exit(0);
  });
}

testUpload().catch(console.error);
