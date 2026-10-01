const fs = require('fs');
const path = require('path');

// Unicode to Custom Emoji mapping
const emojiMap = {
  '👑': 'CROWN',
  '🏆': 'TROPHY',
  '💚': 'HEART',
  '✨': 'SPARKLES',
  '📈': 'CHART',
  '🛡️': 'SHIELD',
  '📅': 'CALENDAR',
  '🎲': 'DICE',
  '🌐': 'GLOBE',
  '🕐': 'CLOCK',
  '💎': 'GEM',
  '🎊': 'CONFETTI',
  '🏰': 'CASTLE',
  '🎯': 'DART'
};

const commandsDir = path.join(__dirname, '../src/commands');
const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.ts'));

let totalReplacements = 0;
const modifiedFiles = [];

console.log('🔄 Replacing Unicode emoji with custom emoji...\n');

files.forEach(file => {
  const filePath = path.join(commandsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  let fileReplacements = 0;

  // Check if file imports CUSTOM_EMOJI
  const hasImport = content.includes("import { CUSTOM_EMOJI } from '../utils/customEmoji'");

  Object.entries(emojiMap).forEach(([unicode, emojiName]) => {
    const regex = new RegExp(unicode, 'g');
    const matches = content.match(regex);
    
    if (matches) {
      content = content.replace(regex, `\${CUSTOM_EMOJI.${emojiName}}`);
      fileReplacements += matches.length;
      modified = true;
    }
  });

  if (modified) {
    // Add import if not exists
    if (!hasImport) {
      const importRegex = /(import.*from ['"]discord\.js['"];)/;
      content = content.replace(importRegex, `$1\nimport { CUSTOM_EMOJI } from '../utils/customEmoji';`);
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${file.padEnd(25)} - ${fileReplacements} replacements`);
    modifiedFiles.push(file);
    totalReplacements += fileReplacements;
  }
});

console.log(`\n🎉 Complete!`);
console.log(`📝 Modified ${modifiedFiles.length} files`);
console.log(`🔄 Total replacements: ${totalReplacements}`);
console.log(`\n✅ All Unicode emoji replaced with custom emoji!`);
