const util = require('minecraft-server-util');

async function testPing() {
  try {
    console.log('Testing megacity.asia...');
    const result = await util.status('megacity.asia', 25565, {
      timeout: 10000,
      enableSRV: true
    });
    
    console.log('✅ SUCCESS!');
    console.log('Version:', result.version.name);
    console.log('Players:', result.players.online, '/', result.players.max);
    console.log('MOTD:', result.motd);
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

testPing();
