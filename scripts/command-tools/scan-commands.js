// Script để scan tất cả commands và lấy name + description
const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');

const modulesPath = path.join(projectRoot, 'src', 'modules');
const results = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern 1: .setName('xxx').setDescription('yyy')
  const pattern1 = /\.setName\(['"]([^'"]+)['"]\)\.setDescription\(['"]([^'"]+)['"]\)/g;
  let match;
  
  while ((match = pattern1.exec(content)) !== null) {
    results.push({
      file: path.relative(projectRoot, filePath),
      name: match[1],
      description: match[2]
    });
  }
}

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.name.endsWith('.ts')) {
      scanFile(fullPath);
    }
  }
}

console.log('🔍 Scanning modules...\n');
scanDir(modulesPath);

// Sort by command name
results.sort((a, b) => a.name.localeCompare(b.name));

console.log(`📋 Found ${results.length} commands:\n`);
console.log('='.repeat(120));

for (const cmd of results) {
  console.log(`/${cmd.name.padEnd(30)} - ${cmd.description}`);
}

console.log('='.repeat(120));
console.log(`\nTotal: ${results.length} commands`);

// Write to file
fs.writeFileSync(
  path.join(projectRoot, 'command-descriptions.txt'),
  results.map(c => `/${c.name} - ${c.description}`).join('\n')
);

console.log('\n✅ Results saved to command-descriptions.txt');
