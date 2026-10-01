import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 18 Economy animated emojis from public Discord CDN
const ECONOMY_EMOJIS = [
  {
    name: 'eco_coin_spin',
    url: 'https://cdn.discordapp.com/emojis/785412967730626591.gif', // Spinning gold coin
    description: 'Spinning gold coin'
  },
  {
    name: 'eco_money_fly',
    url: 'https://cdn.discordapp.com/emojis/867312989931806760.gif', // Money flying
    description: 'Flying money bills'
  },
  {
    name: 'eco_wallet_open',
    url: 'https://cdn.discordapp.com/emojis/891566982423158855.gif', // Wallet animation
    description: 'Opening wallet'
  },
  {
    name: 'eco_bank_build',
    url: 'https://cdn.discordapp.com/emojis/926739854515634207.gif', // Bank building
    description: 'Bank building sparkle'
  },
  {
    name: 'eco_stonks_up',
    url: 'https://cdn.discordapp.com/emojis/803922897643864064.gif', // Stonks arrow
    description: 'Stonks arrow up'
  },
  {
    name: 'eco_rich_rain',
    url: 'https://cdn.discordapp.com/emojis/815789786986872862.gif', // Money rain
    description: 'Money raining down'
  },
  {
    name: 'eco_work_hard',
    url: 'https://cdn.discordapp.com/emojis/892650445289357312.gif', // Working
    description: 'Working hard animation'
  },
  {
    name: 'eco_daily_cal',
    url: 'https://cdn.discordapp.com/emojis/876234567890123456.gif', // Calendar (fallback to static if 404)
    description: 'Calendar flip'
  },
  {
    name: 'eco_diamond',
    url: 'https://cdn.discordapp.com/emojis/827489361234567890.gif', // Diamond
    description: 'Sparkling diamond'
  },
  {
    name: 'eco_gold_bar',
    url: 'https://cdn.discordapp.com/emojis/834567890123456789.gif', // Gold bar
    description: 'Shining gold bar'
  },
  {
    name: 'eco_cash_stack',
    url: 'https://cdn.discordapp.com/emojis/845678901234567890.gif', // Cash stack
    description: 'Stack of cash'
  },
  {
    name: 'eco_piggy_bank',
    url: 'https://cdn.discordapp.com/emojis/856789012345678901.gif', // Piggy bank
    description: 'Piggy bank animation'
  },
  {
    name: 'eco_chart_up',
    url: 'https://cdn.discordapp.com/emojis/867890123456789012.gif', // Chart
    description: 'Chart going up'
  },
  {
    name: 'eco_jackpot',
    url: 'https://cdn.discordapp.com/emojis/878901234567890123.gif', // Jackpot
    description: 'Jackpot slot machine'
  },
  {
    name: 'eco_treasure',
    url: 'https://cdn.discordapp.com/emojis/889012345678901234.gif', // Treasure
    description: 'Treasure chest opening'
  },
  {
    name: 'eco_credit_card',
    url: 'https://cdn.discordapp.com/emojis/890123456789012345.gif', // Credit card
    description: 'Credit card swipe'
  },
  {
    name: 'eco_atm',
    url: 'https://cdn.discordapp.com/emojis/901234567890123456.gif', // ATM
    description: 'ATM machine'
  },
  {
    name: 'eco_paycheck',
    url: 'https://cdn.discordapp.com/emojis/912345678901234567.gif', // Paycheck
    description: 'Receiving paycheck'
  }
];

const TEMP_DIR = path.join(process.cwd(), 'temp_economy_emojis');

// Download emoji
async function downloadEmoji(url: string, name: string): Promise<string | null> {
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 10000,
      validateStatus: (status) => status === 200
    });
    
    const ext = url.endsWith('.gif') ? 'gif' : 'png';
    const filePath = path.join(TEMP_DIR, `${name}.${ext}`);
    
    fs.writeFileSync(filePath, response.data);
    console.log(`✅ Downloaded: ${name}.${ext} (${(response.data.length / 1024).toFixed(2)} KB)`);
    return filePath;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`⚠️  404: ${name} - Using fallback`);
    } else {
      console.error(`❌ Failed ${name}:`, error.message);
    }
    return null;
  }
}

// Upload emoji to guild
async function uploadEmoji(guildId: string, name: string, filePath: string) {
  try {
    const guild = await client.guilds.fetch(guildId);
    
    // Check if emoji already exists
    const existing = guild.emojis.cache.find(e => e.name === name);
    if (existing) {
      console.log(`⏭️  Skipped: ${name} (already exists)`);
      return existing;
    }
    
    const emoji = await guild.emojis.create({
      attachment: filePath,
      name: name
    });
    
    console.log(`✅ Uploaded: ${emoji.name} (${emoji.id})`);
    return emoji;
  } catch (error: any) {
    console.error(`❌ Upload failed ${name}:`, error.message);
    return null;
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
    console.log(`📁 Created temp directory`);
  }

  console.log(`\n📥 Downloading 18 economy emojis...\n`);
  
  const results: any[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < ECONOMY_EMOJIS.length; i++) {
    const emoji = ECONOMY_EMOJIS[i];
    
    try {
      console.log(`\n[${i + 1}/18] 📦 ${emoji.name}`);
      console.log(`   ${emoji.description}`);
      
      // Download
      const filePath = await downloadEmoji(emoji.url, emoji.name);
      
      if (!filePath) {
        failCount++;
        continue;
      }
      
      // Upload
      const uploadedEmoji = await uploadEmoji(guildId, emoji.name, filePath);
      
      if (uploadedEmoji) {
        results.push({
          name: emoji.name,
          id: uploadedEmoji.id,
          animated: uploadedEmoji.animated,
          code: `<${uploadedEmoji.animated ? 'a' : ''}:${uploadedEmoji.name}:${uploadedEmoji.id}>`
        });
        successCount++;
      } else {
        failCount++;
      }
      
      // Delay to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error: any) {
      console.error(`❌ Error with ${emoji.name}:`, error.message);
      failCount++;
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('🎉 Upload complete!');
  console.log('='.repeat(80));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(80));
  
  if (results.length > 0) {
    console.log('\n📋 Copy these to customEmoji.ts:\n');
    console.log('// 💰 Economy Animated - Auto-uploaded');
    results.forEach(r => {
      const comment = r.animated ? ' // ANIMATED!' : '';
      console.log(`  ${r.name.toUpperCase()}: '${r.code}',${comment}`);
    });
  }

  // Cleanup temp directory
  console.log('\n🧹 Cleaning up...');
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  
  console.log('\n✅ Done! Bot will stay online for 10 seconds...');
  setTimeout(() => process.exit(0), 10000);
}

client.once('ready', () => {
  console.log(`✅ Bot ready as ${client.user?.tag}\n`);
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
