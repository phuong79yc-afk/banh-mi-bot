require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const EMOJI_SERVER_ID = '1482354951689605150';

client.once('ready', async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🔍 EMOJI SYSTEM VERIFICATION REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // 1. Check bot status
  console.log(`✅ Bot: ${client.user.tag}`);
  console.log(`✅ Bot ID: ${client.user.id}\n`);
  
  // 2. Check emoji server
  const emojiServer = client.guilds.cache.get(EMOJI_SERVER_ID);
  if (!emojiServer) {
    console.log('❌ CRITICAL: Bot not in emoji server!');
    process.exit(1);
  }
  
  console.log(`✅ Emoji Server: ${emojiServer.name} (${EMOJI_SERVER_ID})`);
  console.log(`✅ Server Members: ${emojiServer.memberCount}\n`);
  
  // 3. Fetch emojis from server
  const serverEmojis = await emojiServer.emojis.fetch();
  console.log(`📊 Server Emojis: ${serverEmojis.size} total\n`);
  
  // 4. Load emojis.ts file
  const emojiFilePath = path.join(__dirname, '..', 'src', 'config', 'emojis.ts');
  const emojiFileContent = fs.readFileSync(emojiFilePath, 'utf8');
  
  // Extract EMOJI_IDS from file
  const emojiIdsMatch = emojiFileContent.match(/export const EMOJI_IDS = \{([^}]+)\}/s);
  if (!emojiIdsMatch) {
    console.log('❌ Could not parse EMOJI_IDS from emojis.ts');
    process.exit(1);
  }
  
  const emojiEntries = emojiIdsMatch[1]
    .split('\n')
    .filter(line => line.includes(':'))
    .map(line => {
      const match = line.match(/"([^"]+)":\s*"([^"]+)"/);
      return match ? { name: match[1], id: match[2] } : null;
    })
    .filter(Boolean);
  
  console.log(`📝 Code Definitions: ${emojiEntries.length} emojis\n`);
  
  // 5. Cross-check each emoji
  console.log('🔎 DETAILED EMOJI CHECK:\n');
  
  let validCount = 0;
  let invalidCount = 0;
  const issues = [];
  
  for (const { name, id } of emojiEntries) {
    const serverEmoji = serverEmojis.get(id);
    
    if (!serverEmoji) {
      invalidCount++;
      issues.push(`❌ ${name}: ID ${id} NOT FOUND on server`);
    } else if (serverEmoji.name.toLowerCase() !== name.toLowerCase()) {
      invalidCount++;
      issues.push(`⚠️  ${name}: Name mismatch (server: "${serverEmoji.name}")`);
    } else if (!serverEmoji.animated) {
      invalidCount++;
      issues.push(`⚠️  ${name}: NOT ANIMATED`);
    } else if (!serverEmoji.available) {
      invalidCount++;
      issues.push(`⚠️  ${name}: NOT AVAILABLE`);
    } else {
      validCount++;
    }
  }
  
  // 6. Print results
  if (issues.length > 0) {
    console.log('⚠️  ISSUES FOUND:\n');
    issues.forEach(issue => console.log(`  ${issue}`));
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ VALID: ${validCount}/${emojiEntries.length}`);
  console.log(`  ❌ ISSUES: ${invalidCount}/${emojiEntries.length}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (invalidCount === 0) {
    console.log('🎉 ALL EMOJIS ARE VALID AND WORKING!');
    console.log('✨ System Status: PERFECT\n');
  } else {
    console.log('⚠️  Some emojis have issues. Please review above.\n');
  }
  
  // 7. Show emoji categories
  console.log('📋 EMOJI CATEGORIES:\n');
  
  const categories = {
    'Core Status': ['success', 'error', 'loading', 'warning', 'info'],
    'Actions': ['export', 'delete', 'refresh', 'edit', 'save', 'search', 'add', 'remove', 'copy', 'unlock', 'lock', 'cloud'],
    'UI/Content': ['art', 'document', 'folder', 'sparkles', 'chart', 'menu', 'image', 'music', 'video', 'star', 'trophy'],
    'Social/User': ['user', 'users', 'message', 'bell', 'heart', 'crown', 'shield'],
    'System/Tech': ['terminal', 'database', 'server', 'wifi', 'calendar', 'clock', 'pin', 'key', 'tag', 'flag'],
    'Special': ['gift', 'link', 'cache', 'rocket', 'coin']
  };
  
  for (const [category, names] of Object.entries(categories)) {
    const count = names.filter(n => emojiEntries.find(e => e.name === n)).length;
    console.log(`  ${category}: ${count}/${names.length}`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
