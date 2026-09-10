/**
 * Replace ALL Unicode emoji with custom animated emoji
 * Run: node scripts/replace-all-unicode-emoji.js
 */

const fs = require('fs');
const path = require('path');

// Extended emoji mapping - Unicode → ${emojis.xxx}
const EMOJI_REPLACEMENTS = {
  // Core status
  '✅': '${emojis.success}',
  '❌': '${emojis.error}',
  '⚠️': '${emojis.warning}',
  
  // Actions
  '🗑️': '${emojis.delete}',
  '⚙️': '${emojis.settings}',
  '🔄': '${emojis.refresh}',
  '📤': '${emojis.export}',
  
  // Art/Design
  '🎨': '${emojis.art}',
};

// Files to process
const SRC_DIR = path.join(__dirname, '../src');

function shouldProcessFile(filePath) {
  if (filePath.includes('node_modules') || filePath.includes('dist')) return false;
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return false;
  return true;
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (shouldProcessFile(filePath)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  let changeCount = 0;
  
  // Check if file already imports emojis
  const hasImport = content.includes("import { emojis } from");
  
  // Track which emoji were used
  const usedEmojis = new Set();
  
  // Replace emoji EVERYWHERE except console logs and comments
  const lines = content.split('\n');
  const newLines = lines.map((line, index) => {
    // Skip console.log/error lines
    if (line.trim().startsWith('console.log') || 
        line.trim().startsWith('console.error') ||
        line.trim().startsWith('console.warn')) {
      return line;
    }
    
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return line;
    }
    
    let newLine = line;
    let lineChanged = false;
    
    // Replace each emoji EVERYWHERE in the line (more aggressive)
    Object.entries(EMOJI_REPLACEMENTS).forEach(([unicode, replacement]) => {
      if (newLine.includes(unicode)) {
        const count = (newLine.match(new RegExp(unicode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        newLine = newLine.replace(new RegExp(unicode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        changeCount += count;
        lineChanged = true;
        usedEmojis.add(replacement);
      }
    });
    
    if (lineChanged) changed = true;
    return newLine;
  });
  
  if (changed) {
    content = newLines.join('\n');
    
    // Add import if not exists and emoji were used
    if (!hasImport && usedEmojis.size > 0) {
      // Find first import line
      const importLines = content.split('\n');
      let insertIndex = 0;
      
      for (let i = 0; i < importLines.length; i++) {
        if (importLines[i].startsWith('import ')) {
          insertIndex = i + 1;
        }
        // Stop at first non-import line
        if (insertIndex > 0 && !importLines[i].startsWith('import ') && importLines[i].trim() !== '') {
          break;
        }
      }
      
      // Calculate relative path
      const depth = filePath.split(path.sep).filter(p => p === 'src' || p.includes('modules') || p.includes('utils')).length - 1;
      const relativePath = '../'.repeat(depth) + 'config/emojis';
      
      importLines.splice(insertIndex, 0, `import { emojis } from '${relativePath}';`);
      content = importLines.join('\n');
    }
    
    fs.writeFileSync(filePath, content);
    return { changes: changeCount, emojis: usedEmojis.size };
  }
  
  return { changes: 0, emojis: 0 };
}

console.log('🔍 Scanning for Unicode emoji...\n');

const allFiles = getAllFiles(SRC_DIR);

console.log(`📁 Found ${allFiles.length} files\n`);

let totalChanges = 0;
let filesChanged = 0;
let totalEmojisUsed = 0;

allFiles.forEach(file => {
  const result = replaceInFile(file);
  if (result.changes > 0) {
    filesChanged++;
    totalChanges += result.changes;
    totalEmojisUsed += result.emojis;
    const relativePath = path.relative(process.cwd(), file);
    console.log(`✅ ${relativePath} (${result.changes} replacements, ${result.emojis} emoji types)`);
  }
});

console.log('\n' + '='.repeat(80));
console.log(`✅ Done! Updated ${filesChanged} files with ${totalChanges} emoji replacements`);
console.log(`🎨 Total animated emoji types used: ${totalEmojisUsed}`);
console.log('='.repeat(80));
console.log('\n💡 Tip: Run "npm run build" to compile changes');
