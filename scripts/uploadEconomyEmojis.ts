import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// List of economy emojis to download and upload
const ECONOMY_EMOJIS = [
  {
    name: 'anim_coin',
    url: 'https://cdn.discordapp.com/emojis/1067646492287836250.gif', // Spinning coin
    description: 'Spinning gold coin'
  },
  {
    name: 'anim_money',
    url: 'https://cdn.discordapp.com/emojis/1067646494850637964.gif', // Money flying
    description: 'Flying money bills'
  },
  {
    name: 'anim_wallet',
    url: 'https://cdn.discordapp.com/emojis/1067646497484415036.gif', // Wallet animation
    description: 'Animated wallet'
  },
  {
    name: 'anim_bank',
    url: 'https://cdn.discordapp.com/emojis/1067646499392466985.gif', // Bank building
    description: 'Bank building animation'
  },
  {
    name: 'anim_stonks',
    url: 'https://cdn.discordapp.com/emojis/1067646501409693776.gif', // Stonks meme
    description: 'Stonks up arrow'
  },
  {
    name: 'anim_rich',
    url: 'https://cdn.discordapp.com/emojis/1067646503779622962.gif', // Rich emoji
    description: 'Money falling'
  },
  {
    name: 'anim_work',
    url: 'https://cdn.discordapp.com/emojis/1067646506174627910.gif', // Working animation
    description: 'Working hard'
  },
  {
    name: 'anim_daily',
    url: 'https://cdn.discordapp.com/emojis/1067646508653060107.gif', // Calendar
    description: 'Calendar flip'
  }
];

// Temp directory for downloaded emojis
const TEMP_DIR = path.join(process.cwd(), 'temp_emojis');

// Download emoji
async function downloadEmoji(url: string, name: string): Promise<string> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const ext = url.endsWith('.gif') ? 'gif' : 'png';
    const filePath = path.join(TEMP_DIR, `${name}.${ext}`);
    
    fs.writeFileSync(filePath, response.data);
    console.log(`✅ Downloaded: ${name}.${ext}`);
    return filePath;
  } catch (error: any) {
    console.error(`❌ Failed to download ${name}:`, error.message);
    throw error;
  }
}

// Upload emoji to guild
async function uploadEmoji(guildId: string, name: string, filePath: string) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const emoji = await guild.emojis.create({
      attachment: filePath,
      name: name
    });
    
    console.log(`✅ Uploaded: ${emoji.name} (${emoji.id})`);
    return emoji;
  } catch (error: any) {
    console.error(`❌ Failed to upload ${name}:`, error.message);
    throw error;
  }
}

// Main function
async function main() {
  const guildId = process.env.GUILD_ID;
  
  if (!guildId) {
    console.error('❌ GUILD_ID not found in .env');
    process.exit(1);
  }

  console.log(`📊 Target Guild ID: ${guildId}`);

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    console.log(`📁 Created temp directory: ${TEMP_DIR}`);
  }

  console.log(`📥 Downloading ${ECONOMY_EMOJIS.length} emojis...\n`);
  
  const results: any[] = [];

  for (const emoji of ECONOMY_EMOJIS) {
    try {
      console.log(`\n📦 Processing: ${emoji.name}`);
      console.log(`   Description: ${emoji.description}`);
      
      // Download
      const filePath = await downloadEmoji(emoji.url, emoji.name);
      
      // Upload
      const uploadedEmoji = await uploadEmoji(guildId, emoji.name, filePath);
      
      results.push({
        name: emoji.name,
        id: uploadedEmoji.id,
        animated: uploadedEmoji.animated,
        code: `<${uploadedEmoji.animated ? 'a' : ''}:${uploadedEmoji.name}:${uploadedEmoji.id}>`
      });
      
      // Delay to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error(`❌ Error with ${emoji.name}:`, error.message);
    }
  }

  console.log('\n\n🎉 Upload complete!\n');
  console.log('📋 Copy these to customEmoji.ts:\n');
  console.log('// 💰 Economy Emojis (Animated)');
  results.forEach(r => {
    console.log(`  ${r.name.toUpperCase()}: '${r.code}', // ${r.animated ? 'ANIMATED!' : 'Static'}`);
  });

  // Cleanup temp directory
  console.log('\n🧹 Cleaning up temp files...');
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  
  console.log('✅ Done!');
  process.exit(0);
}

client.once('ready', () => {
  console.log(`✅ Bot ready as ${client.user?.tag}`);
  main().catch(error => {
    console.error('❌ Main error:', error);
    process.exit(1);
  });
});

client.on('error', error => {
  console.error('❌ Client error:', error);
});

console.log('🔐 Logging in to Discord...');
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Login failed:', error);
  process.exit(1);
});
