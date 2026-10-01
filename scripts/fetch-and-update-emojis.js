require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const EMOJI_SERVER_ID = '1482354951689605150';

client.once('ready', async () => {
  console.log(`✅ Bot: ${client.user.tag}\n`);
  
  const emojiServer = client.guilds.cache.get(EMOJI_SERVER_ID);
  if (!emojiServer) {
    console.log('❌ Bot not in emoji server');
    process.exit(1);
  }
  
  console.log(`📊 Fetching emojis from: ${emojiServer.name}\n`);
  
  const emojis = await emojiServer.emojis.fetch();
  console.log(`Found ${emojis.size} emojis\n`);
  
  if (emojis.size === 0) {
    console.log('❌ No emojis found in server!');
    process.exit(1);
  }
  
  // Expected emoji names (50 total)
  const expectedNames = [
    // Core Status (5)
    'success', 'error', 'loading', 'warning', 'info',
    // Actions (12)
    'export', 'delete', 'refresh', 'edit', 'save', 'search', 
    'add', 'remove', 'copy', 'unlock', 'lock', 'cloud',
    // UI/Content (11)
    'art', 'document', 'folder', 'sparkles', 'chart', 'menu',
    'image', 'music', 'video', 'star', 'trophy',
    // Social/User (7)
    'user', 'users', 'message', 'bell', 'heart', 'crown', 'shield',
    // System/Tech (10)
    'terminal', 'database', 'server', 'wifi', 'calendar', 'clock',
    'pin', 'key', 'tag', 'flag',
    // Special (5)
    'gift', 'link', 'cache', 'rocket', 'coin'
  ];
  
  // Build emoji map
  const emojiMap = {};
  const foundNames = [];
  const missingNames = [];
  
  emojis.forEach(emoji => {
    const name = emoji.name.toLowerCase();
    if (expectedNames.includes(name)) {
      emojiMap[name] = emoji.id;
      foundNames.push(name);
    }
  });
  
  // Check for missing
  expectedNames.forEach(name => {
    if (!emojiMap[name]) {
      missingNames.push(name);
    }
  });
  
  console.log(`✅ Found: ${foundNames.length}/50 expected emojis`);
  if (missingNames.length > 0) {
    console.log(`❌ Missing: ${missingNames.join(', ')}\n`);
  } else {
    console.log('');
  }
  
  // List all emojis found
  console.log('📋 Emojis on server:');
  emojis.forEach(emoji => {
    const status = expectedNames.includes(emoji.name.toLowerCase()) ? '✅' : '❓';
    console.log(`  ${status} ${emoji.name}: ${emoji.id} ${emoji.animated ? '(animated)' : ''}`);
  });
  console.log('');
  
  // Generate TypeScript code
  const emojiEntries = Object.entries(emojiMap)
    .sort((a, b) => expectedNames.indexOf(a[0]) - expectedNames.indexOf(b[0]))
    .map(([name, id]) => `  "${name}": "${id}",`)
    .join('\n');
  
  const tsContent = `/**
 * Custom Emoji IDs for Discord Bot
 * Auto-generated: ${new Date().toISOString()}
 * 
 * ✅ COMPLETE: ${foundNames.length}/50 emojis
 * Server ID: ${EMOJI_SERVER_ID}
 */

export const EMOJI_IDS = {
${emojiEntries}
} as const;

// Helper function to get emoji string (animated format)
export function getEmoji(name: keyof typeof EMOJI_IDS): string {
  const id = EMOJI_IDS[name];
  if (!id) return '❓';
  return \`<a:\${name}:\${id}>\`;
}

// Export ready-to-use emoji strings
export const emojis = {
${Object.keys(emojiMap).sort((a, b) => expectedNames.indexOf(a) - expectedNames.indexOf(b)).map(name => `  ${name}: getEmoji('${name}'),`).join('\n')}
} as const;
`;
  
  // Write to file
  const emojiFilePath = path.join(__dirname, '..', 'src', 'config', 'emojis.ts');
  fs.writeFileSync(emojiFilePath, tsContent);
  
  console.log(`✅ Updated: ${emojiFilePath}`);
  console.log(`\n✨ Next steps:`);
  console.log(`   1. npm run build`);
  console.log(`   2. Restart bot`);
  console.log(`   3. Test with /test-emoji or !testemoji\n`);
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
