const fs = require('fs');
const path = require('path');

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

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const newLines = [];
  let foundEmojisImport = false;
  let removed = false;
  
  for (const line of lines) {
    // Skip duplicate emojis import with @/ alias
    if (line.includes("import { emojis }") && line.includes("from '@/config/emojis'")) {
      removed = true;
      continue;
    }
    
    // Keep the relative import
    if (line.includes("import { emojis }") || line.includes("import { emojis,")) {
      foundEmojisImport = true;
    }
    
    newLines.push(line);
  }
  
  if (removed) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔧 Fixing duplicate imports...\n');
  const modules = findAllModules();
  let fixedCount = 0;
  
  for (const modulePath of modules) {
    if (fixFile(modulePath)) {
      fixedCount++;
      const moduleName = path.basename(path.dirname(modulePath));
      console.log(`✅ Fixed: ${moduleName}`);
    }
  }
  
  console.log(`\n📊 Summary: Fixed ${fixedCount}/${modules.length} modules`);
}

main();
