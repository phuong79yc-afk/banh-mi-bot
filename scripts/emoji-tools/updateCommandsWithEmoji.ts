import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const commandsDir = join(__dirname, '..', 'src', 'commands');

const replacements: { old: string; new: string }[] = [
  // Error messages
  { old: "'❌ ", new: "`${CUSTOM_EMOJI.STATUS_ERROR} " },
  { old: '"❌ ', new: '`${CUSTOM_EMOJI.STATUS_ERROR} ' },
  { old: "'⚠️ ", new: "`${CUSTOM_EMOJI.MOD_WARN} " },
  { old: '"⚠️ ', new: '`${CUSTOM_EMOJI.MOD_WARN} ' },
  { old: "'✅ ", new: "`${CUSTOM_EMOJI.STATUS_SUCCESS} " },
  { old: '"✅ ', new: '`${CUSTOM_EMOJI.STATUS_SUCCESS} ' },
  
  // Music icons
  { old: "'🎵 ", new: "'${CUSTOM_EMOJI.MUSIC} " },
  { old: '"🎵 ', new: '"${CUSTOM_EMOJI.MUSIC} ' },
  { old: "'▶️ ", new: "'${CUSTOM_EMOJI.MUSIC_PLAY} " },
  { old: '"▶️ ', new: '"${CUSTOM_EMOJI.MUSIC_PLAY} ' },
  { old: "'⏸️ ", new: "'${CUSTOM_EMOJI.MUSIC_PAUSE} " },
  { old: '"⏸️ ', new: '"${CUSTOM_EMOJI.MUSIC_PAUSE} ' },
  { old: "'⏹️ ", new: "'${CUSTOM_EMOJI.MUSIC_STOP} " },
  { old: '"⏹️ ', new: '"${CUSTOM_EMOJI.MUSIC_STOP} ' },
  { old: "'⏭️ ", new: "'${CUSTOM_EMOJI.MUSIC_SKIP} " },
  { old: '"⏭️ ', new: '"${CUSTOM_EMOJI.MUSIC_SKIP} ' },
  { old: "'🔀 ", new: "'${CUSTOM_EMOJI.MUSIC_SHUFFLE} " },
  { old: '"🔀 ', new: '"${CUSTOM_EMOJI.MUSIC_SHUFFLE} ' },
  { old: "'🔁 ", new: "'${CUSTOM_EMOJI.MUSIC_LOOP} " },
  { old: '"🔁 ', new: '"${CUSTOM_EMOJI.MUSIC_LOOP} ' },
  { old: "'🔊 ", new: "'${CUSTOM_EMOJI.MUSIC_VOLUME} " },
  { old: '"🔊 ', new: '"${CUSTOM_EMOJI.MUSIC_VOLUME} ' },
  { old: "'📋 ", new: "'${CUSTOM_EMOJI.MUSIC_QUEUE} " },
  { old: '"📋 ', new: '"${CUSTOM_EMOJI.MUSIC_QUEUE} ' },
  { old: "'📜 ", new: "'${CUSTOM_EMOJI.MUSIC_LYRICS} " },
  { old: '"📜 ', new: '"${CUSTOM_EMOJI.MUSIC_LYRICS} ' },
  
  // Moderation icons
  { old: "'🔨 ", new: "'${CUSTOM_EMOJI.MOD_BAN} " },
  { old: '"🔨 ', new: '"${CUSTOM_EMOJI.MOD_BAN} ' },
  { old: "'👢 ", new: "'${CUSTOM_EMOJI.MOD_KICK} " },
  { old: '"👢 ', new: '"${CUSTOM_EMOJI.MOD_KICK} ' },
  { old: "'🔇 ", new: "'${CUSTOM_EMOJI.MOD_MUTE} " },
  { old: '"🔇 ', new: '"${CUSTOM_EMOJI.MOD_MUTE} ' },
  { old: "'⏰ ", new: "'${CUSTOM_EMOJI.MOD_TIMEOUT} " },
  { old: '"⏰ ', new: '"${CUSTOM_EMOJI.MOD_TIMEOUT} ' },
  { old: "'🔒 ", new: "'${CUSTOM_EMOJI.MOD_LOCK} " },
  { old: '"🔒 ', new: '"${CUSTOM_EMOJI.MOD_LOCK} ' },
  { old: "'🔓 ", new: "'${CUSTOM_EMOJI.MOD_UNLOCK} " },
  { old: '"🔓 ', new: '"${CUSTOM_EMOJI.MOD_UNLOCK} ' },
  { old: "'🐌 ", new: "'${CUSTOM_EMOJI.MOD_SLOWMODE} " },
  { old: '"🐌 ', new: '"${CUSTOM_EMOJI.MOD_SLOWMODE} ' },
  { old: "'🗑️ ", new: "'${CUSTOM_EMOJI.MOD_PURGE} " },
  { old: '"🗑️ ', new: '"${CUSTOM_EMOJI.MOD_PURGE} ' },
  { old: "'💣 ", new: "'${CUSTOM_EMOJI.MOD_NUKE} " },
  { old: '"💣 ', new: '"${CUSTOM_EMOJI.MOD_NUKE} ' },
  
  // Utility icons
  { old: "'⚙️ ", new: "'${CUSTOM_EMOJI.UTIL_SETTINGS} " },
  { old: '"⚙️ ', new: '"${CUSTOM_EMOJI.UTIL_SETTINGS} ' },
  { old: "'❓ ", new: "'${CUSTOM_EMOJI.UTIL_HELP} " },
  { old: '"❓ ', new: '"${CUSTOM_EMOJI.UTIL_HELP} ' },
  { old: "'🏓 ", new: "'${CUSTOM_EMOJI.UTIL_PING} " },
  { old: '"🏓 ', new: '"${CUSTOM_EMOJI.UTIL_PING} ' },
  { old: "'📊 ", new: "'${CUSTOM_EMOJI.UTIL_STATS} " },
  { old: '"📊 ', new: '"${CUSTOM_EMOJI.UTIL_STATS} ' },
  { old: "'👤 ", new: "'${CUSTOM_EMOJI.UTIL_AVATAR} " },
  { old: '"👤 ', new: '"${CUSTOM_EMOJI.UTIL_AVATAR} ' },
  { old: "'🔍 ", new: "'${CUSTOM_EMOJI.UTIL_SEARCH} " },
  { old: '"🔍 ', new: '"${CUSTOM_EMOJI.UTIL_SEARCH} ' },
  
  // Economy icons
  { old: "'💰 ", new: "'${CUSTOM_EMOJI.ECO_WALLET} " },
  { old: '"💰 ', new: '"${CUSTOM_EMOJI.ECO_WALLET} ' },
  { old: "'🪙 ", new: "'${CUSTOM_EMOJI.ECO_COIN} " },
  { old: '"🪙 ', new: '"${CUSTOM_EMOJI.ECO_COIN} ' },
  { old: "'🎁 ", new: "'${CUSTOM_EMOJI.ECO_GIFT} " },
  { old: '"🎁 ', new: '"${CUSTOM_EMOJI.ECO_GIFT} ' },
  
  // Status icons
  { old: "'ℹ️ ", new: "'${CUSTOM_EMOJI.STATUS_INFO} " },
  { old: '"ℹ️ ', new: '"${CUSTOM_EMOJI.STATUS_INFO} ' },
  { old: "'🎫 ", new: "'${CUSTOM_EMOJI.TICKET} " },
  { old: '"🎫 ', new: '"${CUSTOM_EMOJI.TICKET} ' },
];

console.log('🔄 Updating commands with custom emoji...\n');

const files = readdirSync(commandsDir).filter(f => f.endsWith('.ts'));
let updatedCount = 0;

for (const file of files) {
  const filePath = join(commandsDir, file);
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Check if import already exists
  const hasCustomEmojiImport = content.includes("from '../utils/customEmoji'");

  // Count replacements
  let replacementCount = 0;
  for (const { old, new: newStr } of replacements) {
    if (content.includes(old)) {
      content = content.replaceAll(old, newStr);
      replacementCount++;
      modified = true;
    }
  }

  // Add import if needed
  if (modified && !hasCustomEmojiImport) {
    // Find last import line
    const importMatch = content.match(/import .+ from .+;/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const importIndex = content.lastIndexOf(lastImport);
      content = 
        content.slice(0, importIndex + lastImport.length) +
        "\nimport { CUSTOM_EMOJI } from '../utils/customEmoji';" +
        content.slice(importIndex + lastImport.length);
    }
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${file.padEnd(30)} - ${replacementCount} replacements`);
    updatedCount++;
  } else {
    console.log(`⏭️  ${file.padEnd(30)} - No changes needed`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`✅ Updated ${updatedCount}/${files.length} command files`);
console.log('='.repeat(60));
console.log('\n💡 Remember to rebuild: npm run build');
