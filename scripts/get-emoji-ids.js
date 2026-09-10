/**
 * Get all emoji IDs from Discord server
 * Run: node scripts/get-emoji-ids.js
 */

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const GUILD_ID = process.env.GUILD_ID;

async function getEmojiIds() {
  console.log('🔍 Fetching emoji IDs from Discord...\n');
  
  await client.login(process.env.BOT_TOKEN);
  
  client.once('ready', async () => {
    try {
      const guild = await client.guilds.fetch(GUILD_ID);
      console.log(`📁 Server: ${guild.name}\n`);
      
      const emojis = await guild.emojis.fetch();
      console.log(`📊 Found ${emojis.size} emojis:\n`);
      
      // Map Discord emoji names to our standard names
      const nameMapping = {
        'checkmark': 'success',
        'x_mark': 'error',
        'hourglass': 'loading',
        'warning': 'warning',
        'info': 'info',
        'gear': 'settings',
        'export': 'export',
        'trash': 'delete',
        'refresh': 'refresh',
        'pencil': 'edit',
        'save': 'save',
        'search': 'search',
        'plus': 'add',
        'minus': 'remove',
        'copy': 'copy',
        'palette': 'art',
        'document': 'document',
        'folder': 'folder',
        'sparkles': 'sparkles',
        'chart': 'chart',
        'menu': 'menu',
        'image': 'image',
        'music': 'music',
        'video': 'video',
        'book': 'book',
        'user': 'user',
        'users': 'users',
        'message': 'message',
        'bell': 'bell',
        'heart': 'heart',
        'star': 'star',
        'trophy': 'trophy',
        'gift': 'gift',
        'crown': 'crown',
        'shield': 'shield',
        'code': 'code',
        'terminal': 'terminal',
        'database': 'database',
        'server': 'server',
        'cloud': 'cloud',
        'wifi': 'wifi',
        'lock': 'lock',
        'unlock': 'unlock',
        'key': 'key',
        'link': 'link',
        'calendar': 'calendar',
        'clock': 'clock',
        'pin': 'pin',
        'tag': 'tag',
        'flag': 'flag'
      };
      
      const emojiMap = {};
      const discordEmojiList = [];
      
      emojis.forEach(emoji => {
        const standardName = nameMapping[emoji.name] || emoji.name;
        emojiMap[standardName] = emoji.id;
        discordEmojiList.push({ 
          name: emoji.name, 
          id: emoji.id, 
          standard: standardName,
          animated: emoji.animated || false 
        });
      });
      
      // Print list
      console.log('Emoji List:');
      console.log('='.repeat(60));
      discordEmojiList.forEach(e => {
        const animated = e.animated ? '[ANIMATED]' : '[STATIC]';
        console.log(`${e.name.padEnd(20)} ${animated.padEnd(12)} → ${e.standard.padEnd(15)} (${e.id})`);
      });
      console.log('');
      
      // Generate config file
      const fs = require('fs');
      const path = require('path');
      
      const configDir = path.join(__dirname, '../src/config');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      const allEmojiNames = Object.values(nameMapping);
      const configContent = `/**
 * Custom Emoji IDs for Discord Bot
 * Auto-generated: ${new Date().toISOString()}
 * 
 * Uploaded: ${Object.keys(emojiMap).length}/${allEmojiNames.length} emojis
 */

export const EMOJI_IDS = ${JSON.stringify(emojiMap, null, 2)} as const;

// Helper function to get emoji string
export function getEmoji(name: keyof typeof EMOJI_IDS): string {
  const id = EMOJI_IDS[name];
  return id ? \`<:\${name}:\${id}>\` : '❓';
}

// Export ready-to-use emoji strings
export const emojis = {
  // Core Status (${['success','error','loading','warning','info'].filter(n => emojiMap[n]).length}/5)
  success: getEmoji('success'),
  error: getEmoji('error'),
  loading: getEmoji('loading'),
  warning: getEmoji('warning'),
  info: getEmoji('info'),
  
  // Actions (${['settings','export','delete','refresh','edit','save','search','add','remove','copy'].filter(n => emojiMap[n]).length}/10)
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
  
  // Categories/Content (${['art','document','folder','sparkles','chart','menu','image','music','video','book'].filter(n => emojiMap[n]).length}/10)
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
  
  // Social/Community (${['user','users','message','bell','heart','star','trophy','gift','crown','shield'].filter(n => emojiMap[n]).length}/10)
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
  
  // Tools/Tech (${['code','terminal','database','server','cloud','wifi','lock','unlock','key','link'].filter(n => emojiMap[n]).length}/10)
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
  
  // Misc (${['calendar','clock','pin','tag','flag'].filter(n => emojiMap[n]).length}/5)
  calendar: getEmoji('calendar'),
  clock: getEmoji('clock'),
  pin: getEmoji('pin'),
  tag: getEmoji('tag'),
  flag: getEmoji('flag')
} as const;
`;
      
      const configPath = path.join(configDir, 'emojis.ts');
      fs.writeFileSync(configPath, configContent);
      
      console.log('='.repeat(60));
      console.log(`✅ Config generated: src/config/emojis.ts`);
      console.log(`📊 Progress: ${Object.keys(emojiMap).length}/${allEmojiNames.length} emojis uploaded`);
      
      // Show missing emojis
      const missing = allEmojiNames.filter(name => !emojiMap[name]);
      if (missing.length > 0) {
        console.log(`\n⚠️  Missing ${missing.length} emojis:`);
        console.log(missing.join(', '));
        console.log('\n📝 Continue uploading to Discord:');
        missing.forEach(name => {
          console.log(`   - ${name}.png`);
        });
      } else {
        console.log(`\n🎉 All 50 emojis uploaded!`);
      }
      
      console.log('');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
  });
}

getEmojiIds().catch(console.error);
