/**
 * Safely fix emoji template literals - ONLY fix obvious cases
 * Pattern: content: '..${emojis.xxx}..' or title: '..${emojis.xxx}..'
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
  
  // Pattern 1: content: '...${emojis.xxx}...'
  // Pattern 2: title: '...${emojis.xxx}...'
  // Pattern 3: message: '...${emojis.xxx}...'
  // Pattern 4: name: '...${emojis.xxx}...'
  // Only fix these specific cases
  
  const safePatterns = [
    /(content|title|message|name):\s*'([^']*\$\{emojis\.[^}]+\}[^']*)'/g,
  ];
  
  for (const pattern of safePatterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, (match, prefix, inner) => {
        return `${prefix}: \`${inner}\``;
      });
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return 1;
  }
  
  return 0;
}

// Main
console.log('🔧 Safely fixing emoji quotes...\n');

const srcPath = path.resolve(__dirname, '../src');
const files = getAllTsFiles(srcPath);

let fixedCount = 0;
files.forEach(file => {
  fixedCount += fixFile(file);
});

console.log(`\n✅ Fixed ${fixedCount} file(s)`);
