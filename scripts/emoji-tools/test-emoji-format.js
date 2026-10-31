/**
 * Test emoji format
 */

const { emojis, EMOJI_IDS } = require('../dist/src/config/emojis');

console.log('🔍 Testing emoji format:\n');

console.log('EMOJI_IDS object:');
console.log(JSON.stringify(EMOJI_IDS, null, 2));

console.log('\n' + '='.repeat(60) + '\n');

console.log('Generated emoji strings:');
Object.entries(emojis).slice(0, 8).forEach(([name, value]) => {
  console.log(`${name.padEnd(15)} → ${value}`);
});

console.log('\n' + '='.repeat(60) + '\n');

console.log('Expected format: <:name:id>');
console.log(`Example: <:success:${EMOJI_IDS.success}>`);

console.log('\n✅ If format matches, emoji should work!');
console.log('❌ If format is different, check getEmoji() function');
