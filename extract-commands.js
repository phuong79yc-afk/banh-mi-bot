// Extract all command names and descriptions from built modules
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist', 'src', 'modules');
const commands = [];

function scanJsFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern: setName('xxx').setDescription('yyy')
  // hoặc: setName("xxx").setDescription("yyy")
  const regex = /\.setName\(['"]([^'"]+)['"]\)\.setDescription\(['"]([^'"]+)['"]\)/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1];
    const desc = match[2];
    
    // Bỏ qua options (những cái không phải command chính)
    // Command chính thường bắt đầu bằng emoji hoặc có từ khóa đặc biệt
    if (desc.includes('👤') || desc.includes('Người') || desc.includes('User') || 
        desc.includes('Số') || desc.includes('Lý do') || desc.includes('Role') ||
        desc.includes('Kênh') || desc.includes('Channel') || desc.match(/^[^🎯💰📊🎁🔧⚙️🛡️📖]/)) {
      continue; // Skip options
    }
    
    commands.push({ name, description: desc });
  }
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.name.endsWith('.js')) {
      scanJsFile(fullPath);
    }
  }
}

console.log('🔍 Scanning all built modules...\n');
scanDirectory(distPath);

// Remove duplicates
const uniqueCommands = [];
const seen = new Set();

for (const cmd of commands) {
  if (!seen.has(cmd.name)) {
    seen.add(cmd.name);
    uniqueCommands.push(cmd);
  }
}

// Sort by name
uniqueCommands.sort((a, b) => a.name.localeCompare(b.name));

console.log(`📋 Found ${uniqueCommands.length} unique commands:\n`);
console.log('='.repeat(120));

for (const cmd of uniqueCommands) {
  console.log(`/${cmd.name.padEnd(35)} ${cmd.description}`);
}

console.log('='.repeat(120));
console.log(`\nTotal: ${uniqueCommands.length} commands`);

// Write to file for review
const output = uniqueCommands.map(c => `/${c.name}\n  ${c.description}\n`).join('\n');
fs.writeFileSync(
  path.join(__dirname, 'all-commands-review.txt'),
  `Tất cả ${uniqueCommands.length} commands:\n\n` + output
);

console.log('\n✅ Full list saved to all-commands-review.txt');
