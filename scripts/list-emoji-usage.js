/**
 * List all commands using custom emoji
 * Run: node scripts/list-emoji-usage.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const results = {
  embedHelper: [],
  embedBuilder: [],
  embedTemplates: [],
  directEmoji: []
};

function scanDirectory(dir, basePath = '') {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relativePath = path.join(basePath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        scanDirectory(fullPath, relativePath);
      }
    } else if (file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check imports
      if (content.includes('from') && content.includes('embedHelper')) {
        results.embedHelper.push(relativePath);
      }
      if (content.includes('from') && content.includes('embedBuilder')) {
        results.embedBuilder.push(relativePath);
      }
      if (content.includes('from') && content.includes('embedTemplates')) {
        results.embedTemplates.push(relativePath);
      }
      
      // Check direct emoji usage
      if (content.match(/✅|❌|⚠️|🎨|⚙️|🗑️|🔄|📤/)) {
        results.directEmoji.push(relativePath);
      }
    }
  }
}

console.log('🔍 Scanning for emoji usage...\n');
scanDirectory(srcDir);

console.log('📊 RESULTS\n');
console.log('='.repeat(80));

console.log('\n📦 Files using embedHelper (auto custom emoji):');
console.log('-'.repeat(80));
if (results.embedHelper.length > 0) {
  results.embedHelper.forEach(f => console.log(`  ✅ ${f}`));
} else {
  console.log('  (none)');
}

console.log('\n📦 Files using embedBuilder (auto custom emoji):');
console.log('-'.repeat(80));
if (results.embedBuilder.length > 0) {
  results.embedBuilder.forEach(f => console.log(`  ✅ ${f}`));
} else {
  console.log('  (none)');
}

console.log('\n📦 Files using embedTemplates (auto custom emoji):');
console.log('-'.repeat(80));
if (results.embedTemplates.length > 0) {
  results.embedTemplates.forEach(f => console.log(`  ✅ ${f}`));
} else {
  console.log('  (none)');
}

console.log('\n⚠️  Files with hardcoded Unicode emoji (need manual update):');
console.log('-'.repeat(80));
if (results.directEmoji.length > 0) {
  results.directEmoji.slice(0, 20).forEach(f => console.log(`  ⚠️  ${f}`));
  if (results.directEmoji.length > 20) {
    console.log(`  ... and ${results.directEmoji.length - 20} more files`);
  }
} else {
  console.log('  (none)');
}

console.log('\n📈 Summary:');
console.log('='.repeat(80));
console.log(`  ✅ embedHelper users: ${results.embedHelper.length} files`);
console.log(`  ✅ embedBuilder users: ${results.embedBuilder.length} files`);
console.log(`  ✅ embedTemplates users: ${results.embedTemplates.length} files`);
console.log(`  ⚠️  Hardcoded emoji: ${results.directEmoji.length} files`);
console.log('');
