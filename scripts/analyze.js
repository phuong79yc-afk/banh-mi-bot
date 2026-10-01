const fs = require('fs');
const path = require('path');

const emojisConfig = fs.readFileSync('src/config/emojis.ts', 'utf8');
const emojiIdsMatch = emojisConfig.match(/export const EMOJI_IDS = \{([^}]+)\}/s);
const definedEmojis = [];
if (emojiIdsMatch) {
  const matches = emojiIdsMatch[1].matchAll(/"(\w+)":/g);
  for (const match of matches) {
    definedEmojis.push(match[1]);
  }
}

const usedEmojis = new Set();
const emojiUsageByFile = {};

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.matchAll(/emojis\.(\w+)/g);
      for (const match of matches) {
        const emojiName = match[1];
        usedEmojis.add(emojiName);
        if (!emojiUsageByFile[emojiName]) {
          emojiUsageByFile[emojiName] = [];
        }
        const relativePath = filePath.replace(/\\/g, '/').replace('src/', '');
        if (!emojiUsageByFile[emojiName].includes(relativePath)) {
          emojiUsageByFile[emojiName].push(relativePath);
        }
      }
    }
  }
}

scanDirectory('src');

const usedEmojisArray = Array.from(usedEmojis).sort();
const definedEmojisArray = definedEmojis.sort();

console.log('EMOJI DANG DUNG:', usedEmojisArray.length);
console.log(usedEmojisArray.join(', '));
console.log('');
console.log('EMOJI DA DINH NGHIA:', definedEmojisArray.length);
console.log(definedEmojisArray.join(', '));
console.log('');

const missing = usedEmojisArray.filter(e => !definedEmojisArray.includes(e));
const unused = definedEmojisArray.filter(e => !usedEmojisArray.includes(e));

if (missing.length > 0) {
  console.log('THIEU:', missing.join(', '));
}
if (unused.length > 0) {
  console.log('THUA:', unused.join(', '));
}
