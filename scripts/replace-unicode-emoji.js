/**
 * Replace all Unicode emoji with custom emoji imports
 * Run: node scripts/replace-unicode-emoji.js
 */

const fs = require('fs');
const path = require('path');

// Emoji mapping
const REPLACEMENTS = {
  '✅': '${emojis.success}',
  '❌': '${emojis.error}',
  '⚠️': '${emojis.warning}',
  '🗑️': '${emojis.delete}',
  '🎨': '${emojis.art}',
  '⚙️': '${emojis.settings}',
  '🔄': '${emojis.refresh}',
  '📤': '${emojis.export}',
};

// Files to process (modules only, skip console.log)
const MODULES_DIR = path.join(__dirname, '../src/modules');

function shouldProcessFile(filePath) {
  // Skip node_modules, dist, etc
  if (filePath.includes('node_modules') || filePath.includes('dist')) return false;
  // Only .ts files
  if (!filePath.endsWith('.ts')) return false;
  return true;
}

function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllTsFiles(filePath, fileList);
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
  
  // Replace emoji in user-facing messages only (not console.log)
  Object.entries(REPLACEMENTS).forEach(([unicode, custom]) => {
    // Match emoji in strings but NOT in console.log
    const lines = content.split('\n');
    const newLines = lines.map(line => {
      // Skip console.log lines
      if (line.trim().startsWith('console.log') || line.trim().startsWith('console.error')) {
        return line;
      }
      
      // Replace in content/reply/description/title strings
      if (line.includes(unicode) && 
          (line.includes('content:') || 
           line.includes('reply(') || 
           line.includes('description:') ||
           line.includes('title:') ||
           line.includes('.setTitle(') ||
           line.includes('.setDescription('))) {
        changed = true;
        changeCount++;
        return line.replace(new RegExp(unicode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), custom);
      }
      
      return line;
    });
    
    content = newLines.join('\n');
  });
  
  if (changed) {
    // Add import if not exists
    if (!hasImport) {
      // Find first import line
      const lines = content.split('\n');
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          insertIndex = i + 1;
        }
      }
      
      lines.splice(insertIndex, 0, "import { emojis } from '../../config/emojis';");
      content = lines.join('\n');
    }
    
    fs.writeFileSync(filePath, content);
    return changeCount;
  }
  
  return 0;
}

console.log('🔍 Scanning modules directory...\n');

const files = getAllTsFiles(MODULES_DIR);
console.log(`📁 Found ${files.length} TypeScript files\n`);

let totalChanges = 0;
let filesChanged = 0;

files.forEach(file => {
  const changes = replaceInFile(file);
  if (changes > 0) {
    filesChanged++;
    totalChanges += changes;
    const relativePath = path.relative(process.cwd(), file);
    console.log(`✅ ${relativePath} (${changes} changes)`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`✅ Done! Updated ${filesChanged} files with ${totalChanges} emoji replacements`);
console.log('='.repeat(60));
