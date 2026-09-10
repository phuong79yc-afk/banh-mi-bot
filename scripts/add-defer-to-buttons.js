// Add deferReply to all button handlers
const fs = require('fs');
const path = require('path');

function addDeferToButtonHandler(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern: if (!interaction.isButton()) return;
    // Add defer after the return statement
    const pattern1 = /(if\s*\(!interaction\.isButton\(\)\)\s*return;)\s*\n(\s*)\n(\s*)(if|const)/g;
    
    if (content.match(pattern1)) {
      content = content.replace(pattern1, (match, ifStatement, newline, spaces, nextCode) => {
        // Check if defer already exists nearby
        const afterMatch = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + match.length + 200);
        if (afterMatch.includes('deferReply') || afterMatch.includes('showModal')) {
          return match; // Already has defer or modal
        }
        
        modified = true;
        return `${ifStatement}\n\n${spaces}// Defer reply to prevent timeout\n${spaces}await interaction.deferReply({ flags: 64 }).catch(() => {});\n\n${spaces}${nextCode}`;
      });
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }

    return modified;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Adding deferReply to button handlers...\n');

const files = [
  'src/modules/server-generator-module/entry_point.ts',
  'src/modules/settings-module/entry_point.ts',
  'src/modules/ticket-module/entry_point.ts',
  'src/modules/giveaway-module/entry_point.ts'
];

let count = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    if (addDeferToButtonHandler(filePath)) {
      count++;
      console.log(`✅ ${file}`);
    } else {
      console.log(`⏭️  ${file} - skipped (already has defer or modal)`);
    }
  } else {
    console.log(`❌ ${file} - not found`);
  }
});

console.log(`\n✨ Modified ${count} files`);
