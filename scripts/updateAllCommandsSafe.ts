import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const commandsDir = join(__dirname, '..', 'src', 'commands');

console.log('🔄 Updating ALL commands with custom emoji (SAFE MODE)...\n');

// Emoji mappings - only in strings (content, name, title, description)
const emojiMap: Record<string, string> = {
  // Music
  '🎵': 'MUSIC',
  '▶️': 'MUSIC_PLAY',
  '⏸️': 'MUSIC_PAUSE',
  '⏹️': 'MUSIC_STOP',
  '⏭️': 'MUSIC_SKIP',
  '⏮️': 'MUSIC_PREV',
  '🔁': 'MUSIC_LOOP',
  '🔀': 'MUSIC_SHUFFLE',
  '🔊': 'MUSIC_VOLUME',
  '📋': 'MUSIC_QUEUE',
  '📜': 'MUSIC_LYRICS',
  
  // Moderation
  '🔨': 'MOD_BAN',
  '👢': 'MOD_KICK',
  '🔇': 'MOD_MUTE',
  '⚠️': 'MOD_WARN',
  '⏰': 'MOD_TIMEOUT',
  '🔒': 'MOD_LOCK',
  '🔓': 'MOD_UNLOCK',
  '🐌': 'MOD_SLOWMODE',
  '🗑️': 'MOD_PURGE',
  '💣': 'MOD_NUKE',
  
  // Utility
  '⚙️': 'UTIL_SETTINGS',
  '❓': 'UTIL_HELP',
  'ℹ️': 'STATUS_INFO',
  '🏓': 'UTIL_PING',
  '📊': 'UTIL_STATS',
  '👤': 'UTIL_AVATAR',
  '🔍': 'UTIL_SEARCH',
  
  // Economy
  '💰': 'ECO_WALLET',
  '🪙': 'ECO_COIN',
  '💵': 'ECO_COIN',
  '🎁': 'ECO_GIFT',
  
  // Status
  '✅': 'STATUS_SUCCESS',
  '❌': 'STATUS_ERROR',
  '🎫': 'TICKET',
};

const files = readdirSync(commandsDir).filter(f => f.endsWith('.ts'));
let updatedCount = 0;
const updatedFiles: string[] = [];

for (const file of files) {
  const filePath = join(commandsDir, file);
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let replacements = 0;

  // Check if already has import
  const hasImport = content.includes("from '../utils/customEmoji'");

  // Replace emoji in strings only (content, reply, title, description, name, text)
  for (const [emoji, emojiKey] of Object.entries(emojiMap)) {
    // Pattern 1: content: '❌ Message'
    const pattern1 = new RegExp(`(content:\\s*['"\`])${emoji}\\s+`, 'g');
    if (pattern1.test(content)) {
      content = content.replace(pattern1, `$1\${CUSTOM_EMOJI.${emojiKey}} `);
      modified = true;
      replacements++;
    }

    // Pattern 2: title: '🎵 Title'
    const pattern2 = new RegExp(`((?:title|name|text):\\s*['"\`])${emoji}\\s+`, 'g');
    if (pattern2.test(content)) {
      content = content.replace(pattern2, `$1\${CUSTOM_EMOJI.${emojiKey}} `);
      modified = true;
      replacements++;
    }

    // Pattern 3: description with emoji
    const pattern3 = new RegExp(`(description:\\s*['"\`][^'"\`]*?)${emoji}`, 'g');
    if (pattern3.test(content)) {
      content = content.replace(pattern3, `$1\${CUSTOM_EMOJI.${emojiKey}}`);
      modified = true;
      replacements++;
    }

    // Pattern 4: .setTitle('🎵 ...')
    const pattern4 = new RegExp(`(\\.setTitle\\(['"\`])${emoji}\\s+`, 'g');
    if (pattern4.test(content)) {
      content = content.replace(pattern4, `$1\${CUSTOM_EMOJI.${emojiKey}} `);
      modified = true;
      replacements++;
    }

    // Pattern 5: .setDescription with emoji
    const pattern5 = new RegExp(`(\\.setDescription\\(['"\`][^'"\`]*?)${emoji}`, 'g');
    if (pattern5.test(content)) {
      content = content.replace(pattern5, `$1\${CUSTOM_EMOJI.${emojiKey}}`);
      modified = true;
      replacements++;
    }
  }

  // Add import if modified and doesn't have it
  if (modified && !hasImport) {
    // Find last import
    const importMatches = content.match(/^import .+ from .+;$/gm);
    if (importMatches && importMatches.length > 0) {
      const lastImport = importMatches[importMatches.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      content = 
        content.slice(0, lastImportIndex + lastImport.length) +
        "\nimport { CUSTOM_EMOJI } from '../utils/customEmoji';" +
        content.slice(lastImportIndex + lastImport.length);
    }
  }

  // Convert quotes to backticks for template literals
  if (modified) {
    // Find all strings with ${CUSTOM_EMOJI
    content = content.replace(/(['"])([^'"]*?\$\{CUSTOM_EMOJI\.[A-Z_]+\}[^'"]*?)\1/g, '`$2`');
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${file.padEnd(25)} - ${replacements} emoji replaced`);
    updatedCount++;
    updatedFiles.push(file);
  } else {
    console.log(`⏭️  ${file.padEnd(25)} - No changes`);
  }
}

console.log('\n' + '='.repeat(70));
console.log(`✅ Updated ${updatedCount}/${files.length} files`);
console.log('='.repeat(70));

if (updatedFiles.length > 0) {
  console.log('\n📝 Updated files:');
  updatedFiles.forEach(f => console.log(`  - ${f}`));
  console.log('\n💡 Remember to:');
  console.log('  1. npm run build');
  console.log('  2. Restart bot');
  console.log('  3. Test commands in Discord');
}
