/**
 * Upload all custom emojis to Discord server
 * Run: node scripts/upload-emojis.js
 */

const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const EMOJI_DIR = path.join(__dirname, '../assets/emojis');
const GUILD_ID = process.env.GUILD_ID || ''; // Add your server ID to .env

// Emoji names list (50 total)
const emojiNames = [
  // Core Status (5)
  'success', 'error', 'loading', 'warning', 'info',
  
  // Actions (10)
  'settings', 'export', 'delete', 'refresh', 'edit',
  'save', 'search', 'add', 'remove', 'copy',
  
  // Categories/Content (10)
  'art', 'document', 'folder', 'sparkles', 'chart',
  'menu', 'image', 'music', 'video', 'book',
  
  // Social/Community (10)
  'user', 'users', 'message', 'bell', 'heart',
  'star', 'trophy', 'gift', 'crown', 'shield',
  
  // Tools/Tech (10)
  'code', 'terminal', 'database', 'server', 'cloud',
  'wifi', 'lock', 'unlock', 'key', 'link',
  
  // Misc (5)
  'calendar', 'clock', 'pin', 'tag', 'flag'
];

async function uploadEmojis() {
  console.log('🚀 Starting emoji upload...\n');
  
  if (!GUILD_ID) {
    console.error('❌ Error: GUILD_ID not found in .env');
    console.log('\n📝 Add this to your .env file:');
    console.log('GUILD_ID=your_server_id_here\n');
    process.exit(1);
  }

  await client.login(process.env.BOT_TOKEN);
  
  client.once('ready', async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}\n`);
    
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log(`📁 Server: ${guild.name}\n`);
    
    // Get existing emojis
    const existingEmojis = await guild.emojis.fetch();
    console.log(`📊 Current emojis: ${existingEmojis.size}/50\n`);
    
    const results = {
      created: [],
      skipped: [],
      failed: []
    };
    
    for (const emojiName of emojiNames) {
      const filePath = path.join(EMOJI_DIR, `${emojiName}.png`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${emojiName}.png - File not found`);
        results.failed.push(emojiName);
        continue;
      }
      
      // Check if emoji already exists
      const existing = existingEmojis.find(e => e.name === emojiName);
      if (existing) {
        console.log(`⏭️  ${emojiName} - Already exists (ID: ${existing.id})`);
        results.skipped.push({ name: emojiName, id: existing.id });
        continue;
      }
      
      // Retry logic for rate limits
      let retries = 0;
      const maxRetries = 3;
      let uploaded = false;
      
      while (!uploaded && retries <= maxRetries) {
        try {
          if (retries > 0) {
            console.log(`⏳ Retry ${retries}/${maxRetries} for ${emojiName}...`);
          } else {
            console.log(`⏳ Uploading ${emojiName}...`);
          }
          
          // Upload emoji
          const emoji = await guild.emojis.create({
            attachment: filePath,
            name: emojiName,
            reason: 'Custom emoji for bot UI'
          });
          
          console.log(`✅ ${emojiName} - Uploaded (ID: ${emoji.id})`);
          results.created.push({ name: emojiName, id: emoji.id });
          uploaded = true;
          
          // Rate limit: Discord allows ~1 emoji per second for safety
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (error) {
          // Check if rate limited (429)
          if (error.code === 429 || error.message.includes('rate limit')) {
            retries++;
            if (retries <= maxRetries) {
              // Exponential backoff: 5s, 10s, 20s
              const waitTime = 5000 * Math.pow(2, retries - 1);
              console.log(`⏸️  Rate limited! Waiting ${waitTime/1000}s before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              console.log(`❌ ${emojiName} - Failed after ${maxRetries} retries: ${error.message}`);
              results.failed.push(emojiName);
            }
          } else {
            // Other errors - don't retry
            console.log(`❌ ${emojiName} - Failed: ${error.message}`);
            results.failed.push(emojiName);
            break;
          }
        }
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Created: ${results.created.length}`);
    console.log(`⏭️  Skipped: ${results.skipped.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log('='.repeat(60) + '\n');
    
    // Generate config file
    console.log('📝 Generating emoji config file...\n');
    
    const allEmojis = [...results.created, ...results.skipped];
    const configContent = generateConfigFile(allEmojis);
    
    const configPath = path.join(__dirname, '../src/config/emojis.ts');
    fs.writeFileSync(configPath, configContent);
    
    console.log(`✅ Config saved to: ${configPath}`);
    console.log(`📦 Total emojis: ${allEmojis.length}/50\n`);
    
    if (results.failed.length > 0) {
      console.log('⚠️  Failed emojis:');
      results.failed.forEach(name => console.log(`   - ${name}`));
      console.log('');
    }
    
    console.log('🎉 Upload complete!\n');
    
    // Show usage example
    console.log('📖 Usage in code:');
    console.log('   import { emojis } from "./config/emojis";');
    console.log('   console.log(emojis.success); // <:success:123456789>\n');
    
    process.exit(0);
  });
}

function generateConfigFile(emojis) {
  const emojiMap = emojis.reduce((acc, { name, id }) => {
    acc[name] = id;
    return acc;
  }, {});
  
  return `/**
 * Custom Emoji IDs for Discord Bot
 * Auto-generated by upload-emojis.js
 * Generated: ${new Date().toISOString()}
 */

export const EMOJI_IDS = ${JSON.stringify(emojiMap, null, 2)} as const;

// Helper function to get emoji string
export function getEmoji(name: keyof typeof EMOJI_IDS): string {
  const id = EMOJI_IDS[name];
  return id ? \`<:$\{name\}:$\{id\}>\` : '❓';
}

// Export emoji strings for easy use
export const emojis = {
  // Core Status
  success: getEmoji('success'),
  error: getEmoji('error'),
  loading: getEmoji('loading'),
  warning: getEmoji('warning'),
  info: getEmoji('info'),
  
  // Actions
  settings: getEmoji('settings'),
  export: getEmoji('export'),
  delete: getEmoji('delete'),
  refresh: getEmoji('refresh'),
  edit: getEmoji('edit'),
  save: getEmoji('save'),
  search: getEmoji('search'),
  add: getEmoji('add'),
  remove: getEmoji('remove'),
  copy: getEmoji('copy'),
  
  // Categories/Content
  art: getEmoji('art'),
  document: getEmoji('document'),
  folder: getEmoji('folder'),
  sparkles: getEmoji('sparkles'),
  chart: getEmoji('chart'),
  menu: getEmoji('menu'),
  image: getEmoji('image'),
  music: getEmoji('music'),
  video: getEmoji('video'),
  book: getEmoji('book'),
  
  // Social/Community
  user: getEmoji('user'),
  users: getEmoji('users'),
  message: getEmoji('message'),
  bell: getEmoji('bell'),
  heart: getEmoji('heart'),
  star: getEmoji('star'),
  trophy: getEmoji('trophy'),
  gift: getEmoji('gift'),
  crown: getEmoji('crown'),
  shield: getEmoji('shield'),
  
  // Tools/Tech
  code: getEmoji('code'),
  terminal: getEmoji('terminal'),
  database: getEmoji('database'),
  server: getEmoji('server'),
  cloud: getEmoji('cloud'),
  wifi: getEmoji('wifi'),
  lock: getEmoji('lock'),
  unlock: getEmoji('unlock'),
  key: getEmoji('key'),
  link: getEmoji('link'),
  
  // Misc
  calendar: getEmoji('calendar'),
  clock: getEmoji('clock'),
  pin: getEmoji('pin'),
  tag: getEmoji('tag'),
  flag: getEmoji('flag'),
} as const;
`;
}

uploadEmojis().catch(console.error);
