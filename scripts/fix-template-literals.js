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
  let modified = false;
  const lines = content.split('\n');
  const newLines = [];
  
  for (let line of lines) {
    // Fix console.log with single quotes containing ${emojis
    // Pattern: console.log('...${emojis.xxx}...')
    // Replace with: console.log(`...${emojis.xxx}...`)
    
    if (line.includes('console.log(\'') && line.includes('${emojis.')) {
      // Replace single quotes with backticks for this line
      const match = line.match(/console\.log\('([^']*)'\)/);
      if (match) {
        const oldLine = line;
        line = line.replace(/console\.log\('([^']*)'\)/, 'console.log(`$1`)');
        if (oldLine !== line) {
          modified = true;
        }
      }
    }
    
    newLines.push(line);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔧 Fixing template literals...\n');
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
