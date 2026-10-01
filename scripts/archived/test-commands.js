// Test Commands & Show Errors
// Run: node scripts/test-commands.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing all commands for errors...\n');
console.log('='.repeat(60));

const commandsDir = path.join(__dirname, '../dist/commands');
const errors = [];
const warnings = [];
const success = [];

// Check if dist exists
if (!fs.existsSync(commandsDir)) {
  console.error('❌ dist/commands/ not found! Run: npm run build');
  process.exit(1);
}

// Read all command files
const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

console.log(`📦 Found ${commandFiles.length} command files\n`);

// Test each command
for (const file of commandFiles) {
  const commandName = file.replace('.js', '');
  const filePath = path.join(commandsDir, file);
  
  try {
    // Try to require the command
    const command = require(filePath);
    
    // Check if it has data and execute
    if (!command.data) {
      warnings.push({
        name: commandName,
        type: 'Missing data export',
        message: 'Command does not export "data"'
      });
      continue;
    }
    
    if (!command.execute) {
      warnings.push({
        name: commandName,
        type: 'Missing execute function',
        message: 'Command does not export "execute" function'
      });
      continue;
    }
    
    // Check command data structure
    if (!command.data.name) {
      errors.push({
        name: commandName,
        type: 'Invalid data',
        message: 'Command data missing "name" property'
      });
      continue;
    }
    
    if (!command.data.description) {
      errors.push({
        name: commandName,
        type: 'Invalid data',
        message: 'Command data missing "description" property'
      });
      continue;
    }
    
    // Success!
    success.push({
      name: commandName,
      commandName: command.data.name,
      description: command.data.description
    });
    
  } catch (error) {
    errors.push({
      name: commandName,
      type: 'Load error',
      message: error.message,
      stack: error.stack
    });
  }
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS');
console.log('='.repeat(60));

// Success
if (success.length > 0) {
  console.log(`\n✅ ${success.length} commands loaded successfully:\n`);
  success.forEach(cmd => {
    console.log(`  /${cmd.commandName.padEnd(20)} - ${cmd.description.substring(0, 40)}${cmd.description.length > 40 ? '...' : ''}`);
  });
}

// Warnings
if (warnings.length > 0) {
  console.log(`\n⚠️  ${warnings.length} warnings:\n`);
  warnings.forEach(warn => {
    console.log(`  ⚠️  ${warn.name}`);
    console.log(`     ${warn.type}: ${warn.message}\n`);
  });
}

// Errors
if (errors.length > 0) {
  console.log(`\n❌ ${errors.length} errors found:\n`);
  errors.forEach(err => {
    console.log(`  ❌ ${err.name}`);
    console.log(`     ${err.type}: ${err.message}`);
    if (err.stack) {
      console.log(`\n     Stack trace:`);
      console.log(err.stack.split('\n').slice(0, 5).join('\n'));
    }
    console.log('');
  });
}

// Summary
console.log('='.repeat(60));
console.log('📈 SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Success: ${success.length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Errors: ${errors.length}`);
console.log(`📦 Total: ${commandFiles.length}`);
console.log('='.repeat(60));

// Exit code
if (errors.length > 0) {
  console.log('\n❌ Tests failed! Fix errors above.\n');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Tests passed with warnings.\n');
  process.exit(0);
} else {
  console.log('\n✅ All tests passed!\n');
  process.exit(0);
}
