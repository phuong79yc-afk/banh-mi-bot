import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const commandsDir = join(__dirname, '..', 'src', 'commands');

console.log('🔧 Fixing emoji template strings...\n');

const files = readdirSync(commandsDir).filter(f => f.endsWith('.ts'));
let fixedCount = 0;

for (const file of files) {
  const filePath = join(commandsDir, file);
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Fix single quotes with ${CUSTOM_EMOJI
  const singleQuotePattern = /'(\$\{CUSTOM_EMOJI\.[A-Z_]+\}[^']*?)'/g;
  if (singleQuotePattern.test(content)) {
    content = content.replace(singleQuotePattern, '`$1`');
    modified = true;
  }

  // Fix double quotes with ${CUSTOM_EMOJI
  const doubleQuotePattern = /"(\$\{CUSTOM_EMOJI\.[A-Z_]+\}[^"]*?)"/g;
  if (doubleQuotePattern.test(content)) {
    content = content.replace(doubleQuotePattern, '`$1`');
    modified = true;
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${file}`);
    fixedCount++;
  } else {
    console.log(`⏭️  ${file} - No changes needed`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`✅ Fixed ${fixedCount}/${files.length} files`);
console.log('='.repeat(60));
console.log('\n💡 Remember to rebuild: npm run build');
