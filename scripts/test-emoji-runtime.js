/**
 * Test emoji at runtime in dev mode
 */

// Simulate require in ts-node context
const Module = require('module');
const originalRequire = Module.prototype.require;

// Clear require cache
delete require.cache[require.resolve('../src/config/emojis')];

// Now require
console.log('🔍 Testing emoji runtime values:\n');

try {
  const { emojis, EMOJI_IDS, getEmoji } = require('../src/config/emojis');
  
  console.log('EMOJI_IDS:', JSON.stringify(EMOJI_IDS, null, 2));
  console.log('\n' + '='.repeat(60) + '\n');
  
  console.log('emojis.success =', emojis.success);
  console.log('emojis.error =', emojis.error);
  console.log('emojis.warning =', emojis.warning);
  console.log('emojis.art =', emojis.art);
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  console.log('Direct getEmoji test:');
  console.log('getEmoji("success") =', getEmoji('success'));
  console.log('getEmoji("error") =', getEmoji('error'));
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  console.log('Expected format: <:success:1546857884330098768>');
  console.log('Actual success:', emojis.success);
  console.log('Match:', emojis.success === '<:success:1546857884330098768>');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
