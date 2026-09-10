/**
 * Fix emoji template literals in single quotes
 * Change 'text ${emojis.xxx}' to `text ${emojis.xxx}`
 */

const fs = require('fs');
const path = require('path');

function getAllTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !fullPath.includes('node_modules')) {
      getAllTsFiles(fullPath, files);
    } else if (item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern: '...${emojis.xxx}...' → `...${emojis.xxx}...`
  // Only fix if string contains ${emojis.
  const pattern = /'([^']*\$\{emojis\.[^}]+\}[^']*)'/g;
  
  if (pattern.test(content)) {
    content = content.replace(pattern, (match, inner) => {
      // Convert single quotes to backticks
      return '`' + inner + '`';
    });
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return 1;
  }
  
  return 0;
}

// Main
console.log('🔧 Fixing emoji quotes...\n');

const srcPath = path.resolve(__dirname, '../src');
const files = getAllTsFiles(srcPath);

let fixedCount = 0;
files.forEach(file => {
  fixedCount += fixFile(file);
});

console.log(`\n✅ Fixed ${fixedCount} file(s)`);
