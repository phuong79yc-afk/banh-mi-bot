const fs = require('fs');
const path = require('path');

// Mapping Unicode emoji -> custom emoji name
const EMOJI_MAP = {
  '✅': 'emojis.success',
  '❌': 'emojis.error',
  '⏳': 'emojis.loading',
  '⚠️': 'emojis.warning',
  'ℹ️': 'emojis.info',
  '📤': 'emojis.export',
  '🗑️': 'emojis.delete',
  '🔄': 'emojis.refresh',
  '✏️': 'emojis.edit',
  '💾': 'emojis.save',
  '🔍': 'emojis.search',
  '➕': 'emojis.add',
  '➖': 'emojis.remove',
  '📋': 'emojis.copy',
  '🔓': 'emojis.unlock',
  '🔒': 'emojis.lock',
  '☁️': 'emojis.cloud',
  '🎨': 'emojis.art',
  '📄': 'emojis.document',
  '📁': 'emojis.folder',
  '✨': 'emojis.sparkles',
  '📊': 'emojis.chart',
  '🖼️': 'emojis.image',
  '🎵': 'emojis.music',
  '📹': 'emojis.video',
  '⭐': 'emojis.star',
  '🏆': 'emojis.trophy',
  '👤': 'emojis.user',
  '👥': 'emojis.users',
  '💬': 'emojis.message',
  '🔔': 'emojis.bell',
  '❤️': 'emojis.heart',
  '👑': 'emojis.crown',
  '🛡️': 'emojis.shield',
  '💻': 'emojis.terminal',
  '🗄️': 'emojis.database',
  '🖥️': 'emojis.server',
  '📡': 'emojis.wifi',
  '📅': 'emojis.calendar',
  '⏰': 'emojis.clock',
  '📌': 'emojis.pin',
  '🔑': 'emojis.key',
  '🏷️': 'emojis.tag',
  '🚩': 'emojis.flag',
  '🎁': 'emojis.gift',
  '🔗': 'emojis.link',
  '🚀': 'emojis.rocket',
  '💰': 'emojis.coin',
};

function findAllModules() {
  const modulesDir = path.join(__dirname, '..', 'src', 'modules');
  const modules = [];
  
  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item === 'entry_point.ts') {
        modules.push(fullPath);
      }
    }
  }
  
  scanDir(modulesDir);
  return modules;
}

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changes = [];
  
  // Check if emojis import already exists
  const hasEmojisImport = content.includes("from '@/config/emojis'") || 
                           content.includes('from "../config/emojis"');
  
  // Replace Unicode emojis
  for (const [unicode, customEmoji] of Object.entries(EMOJI_MAP)) {
    if (content.includes(unicode)) {
      const count = (content.match(new RegExp(unicode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      content = content.replaceAll(unicode, `\${${customEmoji}}`);
      modified = true;
      changes.push(`  ${unicode} -> ${customEmoji} (${count}x)`);
    }
  }
  
  // Add import if needed and file was modified
  if (modified && !hasEmojisImport) {
    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex !== -1) {
      lines.splice(lastImportIndex + 1, 0, "import { emojis } from '@/config/emojis';");
      content = lines.join('\n');
      changes.push('  ✅ Added emojis import');
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return changes;
  }
  
  return null;
}

function main() {
  console.log('🔍 Scanning for modules...\n');
  const modules = findAllModules();
  console.log(`Found ${modules.length} modules\n`);
  
  let updatedCount = 0;
  
  for (const modulePath of modules) {
    const changes = updateFile(modulePath);
    if (changes) {
      updatedCount++;
      const moduleName = path.basename(path.dirname(modulePath));
      console.log(`✅ Updated: ${moduleName}`);
      changes.forEach(change => console.log(change));
      console.log('');
    }
  }
  
  console.log(`\n📊 Summary: Updated ${updatedCount}/${modules.length} modules`);
  
  if (updatedCount === 0) {
    console.log('✨ All modules already using custom animated emojis!');
  }
}

main();
