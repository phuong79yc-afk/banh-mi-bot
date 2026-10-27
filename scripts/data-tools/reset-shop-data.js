const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');

console.log('🔄 Resetting shop data...\n');

// Reset coins
const coinsPath = path.join(projectRoot, 'data', 'coins.json');
if (fs.existsSync(coinsPath)) {
  fs.writeFileSync(coinsPath, JSON.stringify({}, null, 2));
  console.log('✅ Reset coins.json');
} else {
  console.log('⚠️ coins.json not found');
}

// Reset inventory
const inventoryPath = path.join(projectRoot, 'data', 'inventory.json');
if (fs.existsSync(inventoryPath)) {
  fs.writeFileSync(inventoryPath, JSON.stringify({}, null, 2));
  console.log('✅ Reset inventory.json');
} else {
  console.log('⚠️ inventory.json not found');
}

console.log('\n✅ Shop data reset complete!');
console.log('📝 Note: Roles in Discord server need to be deleted manually or use Discord commands');
console.log('\nTo delete shop roles from Discord:');
console.log('  1. Go to Server Settings > Roles');
console.log('  2. Delete roles: Bánh Cuốn Lover, VIP Member, Supporter, Gamer, etc.');
console.log('\nOr restart bot and it will create fresh roles on next purchase.');
