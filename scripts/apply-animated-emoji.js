/**
 * Script to apply animated emoji across all modules
 * Replaces Unicode emoji with custom animated emoji imports
 */

const fs = require('fs');
const path = require('path');

// Emoji mapping: Unicode → custom emoji name
const EMOJI_MAP = {
  '✅': 'success',
  '❌': 'error',
  '⚠️': 'warning',
  '🗑️': 'delete',
  '🎨': 'art',
  '⚙️': 'settings',
  '🔄': 'refresh',
  '📤': 'export',
  '💾': 'save',
  '🔍': 'search',
  '✏️': 'edit',
  '📅': 'calendar',
  '🕒': 'clock',
  '📌': 'pin',
  '🏷️': 'tag',
  '🚩': 'flag',
  '👤': 'user',
  '👥': 'users',
  '💬': 'message',
  '🔔': 'bell',
  '❤️': 'heart',
  '⭐': 'star',
  '🏆': 'trophy',
  '🎁': 'gift',
  '👑': 'crown',
  '🛡️': 'shield',
  '💻': 'terminal',
  '🗄️': 'database',
  '🖥️': 'server',
  '☁️': 'cloud',
  '📶': 'wifi',
  '🔓': 'unlock',
  '🔑': 'key',
  '🔗': 'link',
  '🖼️': 'image',
  '🎵': 'music',
  '📹': 'video',
  '📂': 'folder',
  '📄': 'document',
  '✨': 'sparkles',
  '📊': 'chart',
  '☰': 'menu',
  '➕': 'add',
  '➖': 'remove',
  '📋': 'copy',
  'ℹ️': 'info',
  '⏳': 'loading'
};

// Files to process (trong thư mục src/)
const TARGET_PATTERNS = [
  'src/modules/**/*.ts',
  'src/utils/**/*.ts',
  'src/web/**/*.ts',
  'src/commands/**/*.ts'
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (filePath.endsWith('.ts') && !filePath.includes('node_modules')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let needsImport = false;

  // Check if file already has emoji import
  const hasImport = content.includes("from '@/config/emojis'") || 
                    content.includes('from "../config/emojis"') ||
                    content.includes('from "../../config/emojis"') ||
                    content.includes('from "../../../config/emojis"');

  // Replace each Unicode emoji
  for (const [unicode, emojiName] of Object.entries(EMOJI_MAP)) {
    // Escape special regex characters
    const escapedUnicode = unicode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Pattern 1: In strings like '✅ Text'
    const pattern1 = new RegExp('([\'"' + '`' + '])' + escapedUnicode, 'g');
    if (pattern1.test(content)) {
      content = content.replace(pattern1, '$1${emojis.' + emojiName + '}');
      modified = true;
      needsImport = true;
    }

    // Pattern 2: In template literals like `✅ Text`
    const pattern2 = new RegExp('(`)([^`]*?)' + escapedUnicode, 'g');
    if (pattern2.test(content)) {
      content = content.replace(pattern2, (match, quote, before) => {
        return quote + before + '${emojis.' + emojiName + '}';
      });
      modified = true;
      needsImport = true;
    }

    // Pattern 3: Standalone emoji in console.log
    const pattern3 = new RegExp('console\\.log\\(([\'"])' + escapedUnicode, 'g');
    if (pattern3.test(content)) {
      content = content.replace(pattern3, 'console.log($1${emojis.' + emojiName + '}');
      modified = true;
      needsImport = true;
    }
  }

  // Add import if needed and not already present
  if (needsImport && !hasImport) {
    // Calculate relative path to config/emojis
    const fileDir = path.dirname(filePath);
    const projectRoot = path.resolve(__dirname, '..');
    const relativePath = path.relative(fileDir, path.join(projectRoot, 'src', 'config', 'emojis')).replace(/\\/g, '/');
    
    // Add import at the top after other imports
    const importStatement = `import { emojis } from '${relativePath.startsWith('.') ? relativePath : './' + relativePath}';\n`;
    
    // Find the last import statement
    const importRegex = /^import\s+.*?;$/gm;
    const imports = content.match(importRegex);
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      content = content.replace(lastImport, lastImport + '\n' + importStatement);
    } else {
      // No imports found, add at the beginning
      content = importStatement + '\n' + content;
    }
    
    modified = true;
  }

  // Save if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
    return 1;
  }

  return 0;
}

// Main execution
console.log('🚀 Starting emoji replacement...\n');

let totalFiles = 0;
let modifiedFiles = 0;

// Process src/modules
const modulesPath = path.resolve(__dirname, '../src/modules');
const utilsPath = path.resolve(__dirname, '../src/utils');
const webPath = path.resolve(__dirname, '../src/web');

const allFiles = [
  ...getAllFiles(modulesPath),
  ...getAllFiles(utilsPath),
  ...getAllFiles(webPath)
];

console.log(`📁 Found ${allFiles.length} TypeScript files\n`);

allFiles.forEach(file => {
  totalFiles++;
  modifiedFiles += processFile(file);
});

console.log(`\n✅ Complete!`);
console.log(`📊 Total files: ${totalFiles}`);
console.log(`📝 Modified files: ${modifiedFiles}`);
console.log(`⏭️  Skipped files: ${totalFiles - modifiedFiles}`);
