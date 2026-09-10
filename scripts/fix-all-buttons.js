// Auto-fix all buttons to use Primary style
const fs = require('fs');
const path = require('path');

// Button styles to replace
const styleReplacements = [
  { from: /\.setStyle\(ButtonStyle\.Secondary\)/g, to: '.setStyle(ButtonStyle.Primary)' },
  { from: /\.setStyle\(ButtonStyle\.Success\)/g, to: '.setStyle(ButtonStyle.Primary)' },
  { from: /\.setStyle\(ButtonStyle\.Danger\)/g, to: '.setStyle(ButtonStyle.Primary)' },
  { from: /\.setStyle\(ButtonStyle\.Link\)/g, to: '.setStyle(ButtonStyle.Primary)' },
  // Keep Primary as is
];

function fixButtonsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let count = 0;

    // Skip if no ButtonStyle found
    if (!content.includes('ButtonStyle')) {
      return { modified: false, count: 0 };
    }

    // Apply replacements
    for (const replacement of styleReplacements) {
      const matches = content.match(replacement.from);
      if (matches) {
        content = content.replace(replacement.from, replacement.to);
        modified = true;
        count += matches.length;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }

    return { modified, count };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { modified: false, count: 0 };
  }
}

function findTypeScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, etc.
      if (!['node_modules', 'dist', '.git', 'backups'].includes(file)) {
        findTypeScriptFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

console.log('🔧 Fixing all buttons to Primary style...\n');

const projectRoot = path.join(__dirname, '..');
const tsFiles = findTypeScriptFiles(path.join(projectRoot, 'src'));

let totalFiles = 0;
let totalButtons = 0;

tsFiles.forEach(file => {
  const result = fixButtonsInFile(file);
  if (result.modified) {
    totalFiles++;
    totalButtons += result.count;
    console.log(`✅ ${path.relative(projectRoot, file)} - ${result.count} buttons`);
  }
});

console.log(`\n✨ Done!`);
console.log(`📊 Modified ${totalFiles} files`);
console.log(`🔘 Fixed ${totalButtons} buttons`);
