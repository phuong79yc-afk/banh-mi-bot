/**
 * Upload emojis in small batches to avoid rate limits
 * Run: node scripts/upload-emojis-batch.js
 */

const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const EMOJI_DIR = path.join(__dirname, '../assets/emojis');
const GUILD_ID = process.env.GUILD_ID;
const BATCH_SIZE = 5; // Upload 5 emoji per batch
const BATCH_DELAY = 10000; // Wait 10s between batches
const EMOJI_DELAY = 2000; // Wait 2s between each emoji

// All 50 emoji names
const emojiNames = [
  'success', 'error', 'loading', 'warning', 'info',
  'settings', 'export', 'delete', 'refresh', 'edit',
  'save', 'search', 'add', 'remove', 'copy',
  'art', 'document', 'folder', 'sparkles', 'chart',
  'menu', 'image', 'music', 'video', 'book',
  'user', 'users', 'message', 'bell', 'heart',
  'star', 'trophy', 'gift', 'crown', 'shield',
  'code', 'terminal', 'database', 'server', 'cloud',
  'wifi', 'lock', 'unlock', 'key', 'link',
  'calendar', 'clock', 'pin', 'tag', 'flag'
];

async function uploadBatch(guild, batch, batchNum, totalBatches) {
  console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} emojis)`);
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const emojiName of batch) {
    const filePath = path.join(EMOJI_DIR, `${emojiName}.png`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${emojiName} - File not found`);
      results.push({ name: emojiName, status: 'missing' });
      continue;
    }
    
    try {
      console.log(`⏳ ${emojiName}...`);
      
      const emoji = await guild.emojis.create({
        attachment: filePath,
        name: emojiName,
        reason: `Batch upload ${batchNum}/${totalBatches}`
      });
      
      console.log(`✅ ${emojiName} (ID: ${emoji.id})`);
      results.push({ name: emojiName, id: emoji.id, status: 'success' });
      
      // Wait between emojis
      await new Promise(resolve => setTimeout(resolve, EMOJI_DELAY));
      
    } catch (error) {
      if (error.code === 429) {
        console.log(`⏸️  ${emojiName} - Rate limited! Waiting 30s...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Retry once
        try {
          const emoji = await guild.emojis.create({
            attachment: filePath,
            name: emojiName,
            reason: `Retry batch ${batchNum}`
          });
          console.log(`✅ ${emojiName} (ID: ${emoji.id}) [retry]`);
          results.push({ name: emojiName, id: emoji.id, status: 'success' });
        } catch (retryError) {
          console.log(`❌ ${emojiName} - Failed: ${retryError.message}`);
          results.push({ name: emojiName, status: 'failed', error: retryError.message });
        }
      } else {
        console.log(`❌ ${emojiName} - Failed: ${error.message}`);
        results.push({ name: emojiName, status: 'failed', error: error.message });
      }
    }
  }
  
  return results;
}

async function uploadAll() {
  console.log('🚀 Starting batch emoji upload...\n');
  console.log(`⚙️  Config:`);
  console.log(`   - Batch size: ${BATCH_SIZE} emojis`);
  console.log(`   - Batch delay: ${BATCH_DELAY/1000}s`);
  console.log(`   - Emoji delay: ${EMOJI_DELAY/1000}s`);
  console.log(`   - Total emojis: ${emojiNames.length}\n`);
  
  await client.login(process.env.BOT_TOKEN);
  
  client.once('ready', async () => {
    console.log(`✅ Bot: ${client.user.tag}`);
    
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log(`📁 Server: ${guild.name}`);
    
    const existingEmojis = await guild.emojis.fetch();
    console.log(`📊 Current: ${existingEmojis.size}/50 emojis`);
    
    // Split into batches
    const batches = [];
    for (let i = 0; i < emojiNames.length; i += BATCH_SIZE) {
      batches.push(emojiNames.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`\n📦 Total batches: ${batches.length}`);
    
    const allResults = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batchResults = await uploadBatch(guild, batches[i], i + 1, batches.length);
      allResults.push(...batchResults);
      
      // Wait between batches (except last one)
      if (i < batches.length - 1) {
        console.log(`\n⏸️  Waiting ${BATCH_DELAY/1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }
    
    // Summary
    const success = allResults.filter(r => r.status === 'success');
    const failed = allResults.filter(r => r.status === 'failed');
    const missing = allResults.filter(r => r.status === 'missing');
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${success.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`⚠️  Missing: ${missing.length}`);
    console.log('='.repeat(60));
    
    if (failed.length > 0) {
      console.log(`\n⚠️  Failed emojis:`);
      failed.forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    }
    
    // Generate config
    if (success.length > 0) {
      console.log(`\n📝 Generating config file...`);
      
      const configDir = path.join(__dirname, '../src/config');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      const emojiMap = {};
      success.forEach(r => {
        emojiMap[r.name] = r.id;
      });
      
      const configContent = `/**
 * Custom Emoji IDs
 * Auto-generated: ${new Date().toISOString()}
 */

export const EMOJI_IDS = ${JSON.stringify(emojiMap, null, 2)} as const;

export function getEmoji(name: keyof typeof EMOJI_IDS): string {
  const id = EMOJI_IDS[name];
  return id ? \`<:\${name}:\${id}>\` : '❓';
}

export const emojis = {
  ${Object.keys(emojiMap).map(name => `${name}: getEmoji('${name}')`).join(',\n  ')}
} as const;
`;
      
      const configPath = path.join(configDir, 'emojis.ts');
      fs.writeFileSync(configPath, configContent);
      
      console.log(`✅ Config saved: src/config/emojis.ts`);
      console.log(`📦 Total emojis in config: ${success.length}`);
    }
    
    console.log(`\n🎉 Done!\n`);
    process.exit(0);
  });
}

uploadAll().catch(console.error);
