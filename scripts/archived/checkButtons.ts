// Script to check all button IDs match with handlers

import fs from 'fs';
import path from 'path';

// Read index.ts to get all handlers
const indexPath = path.join(process.cwd(), 'src', 'index.ts');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

// Read modalHelper.ts to get all button IDs
const modalHelperPath = path.join(process.cwd(), 'src', 'utils', 'modalHelper.ts');
const modalHelperContent = fs.readFileSync(modalHelperPath, 'utf-8');

// Extract button IDs from modalHelper
const buttonIdRegex = /\.setCustomId\(['"]([^'"]+)['"]\)/g;
const buttonIds = new Set<string>();
let match;

while ((match = buttonIdRegex.exec(modalHelperContent)) !== null) {
  buttonIds.add(match[1]);
}

console.log('🔍 Found Button IDs in modalHelper.ts:');
console.log('━'.repeat(80));

const buttonsByPrefix: Record<string, string[]> = {
  modal: [],
  button: [],
  other: []
};

buttonIds.forEach(id => {
  if (id.startsWith('modal_')) {
    buttonsByPrefix.modal.push(id);
  } else if (id.startsWith('button_')) {
    buttonsByPrefix.button.push(id);
  } else {
    buttonsByPrefix.other.push(id);
  }
});

console.log(`\n📋 Modal Buttons (${buttonsByPrefix.modal.length}):`);
buttonsByPrefix.modal.forEach(id => console.log(`  - ${id}`));

console.log(`\n🎮 Action Buttons (${buttonsByPrefix.button.length}):`);
buttonsByPrefix.button.forEach(id => console.log(`  - ${id}`));

console.log(`\n🔧 Other Buttons (${buttonsByPrefix.other.length}):`);
buttonsByPrefix.other.forEach(id => console.log(`  - ${id}`));

// Check handlers in index.ts
console.log('\n\n' + '━'.repeat(80));
console.log('✅ Checking Handlers in index.ts:');
console.log('━'.repeat(80));

const missingHandlers: string[] = [];
const hasHandlers: string[] = [];

// Check modal_ buttons (should be handled by modal system)
buttonsByPrefix.modal.forEach(id => {
  if (indexContent.includes(`customId.startsWith('modal_')`)) {
    hasHandlers.push(id + ' ✅ (handled by modal_ prefix)');
  } else {
    missingHandlers.push(id);
  }
});

// Check button_ buttons (need explicit handlers)
buttonsByPrefix.button.forEach(id => {
  const checks = [
    `customId === '${id}'`,
    `customId.includes('${id}')`,
    `customId.startsWith('${id.split('_')[0]}_')`
  ];
  
  const found = checks.some(check => indexContent.includes(check));
  
  if (found) {
    hasHandlers.push(id + ' ✅');
  } else {
    missingHandlers.push(id + ' ❌');
  }
});

// Check other buttons
buttonsByPrefix.other.forEach(id => {
  if (indexContent.includes(`'${id}'`)) {
    hasHandlers.push(id + ' ✅');
  } else {
    missingHandlers.push(id + ' ❌');
  }
});

if (missingHandlers.length > 0) {
  console.log('\n❌ Missing Handlers:');
  missingHandlers.forEach(id => console.log(`  ${id}`));
} else {
  console.log('\n✅ All buttons have handlers!');
}

console.log('\n\n' + '━'.repeat(80));
console.log('📊 Summary:');
console.log('━'.repeat(80));
console.log(`Total Buttons: ${buttonIds.size}`);
console.log(`With Handlers: ${hasHandlers.length}`);
console.log(`Missing Handlers: ${missingHandlers.length}`);

if (missingHandlers.length > 0) {
  console.log('\n⚠️  Some buttons may not work! Fix needed.');
  process.exit(1);
} else {
  console.log('\n✅ All buttons OK!');
  process.exit(0);
}
