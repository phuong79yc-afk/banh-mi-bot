// Quick script to check if VIP commands loaded
const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');

console.log('\n🔍 Checking VIP Module...\n');

const vipModulePath = path.join(projectRoot, 'src', 'modules', 'vip-module', 'entry_point.ts');

if (fs.existsSync(vipModulePath)) {
  console.log('✅ VIP Module file exists:', vipModulePath);
  
  const content = fs.readFileSync(vipModulePath, 'utf8');
  
  // Check for required elements
  const checks = [
    { name: 'export default class', regex: /export default class VIPModule/ },
    { name: 'name property', regex: /name = ['"]vip-module['"]/ },
    { name: 'commands Collection', regex: /commands.*Collection/ },
    { name: '/vipinfo command', regex: /\.setName\(['"]vipinfo['"]\)/ },
    { name: '/vip-tiers command', regex: /\.setName\(['"]vip-tiers['"]\)/ },
    { name: 'commands.set', regex: /this\.commands\.set\(['"]vipinfo['"]/ },
  ];
  
  console.log('\n📋 Module Structure Checks:\n');
  checks.forEach(check => {
    const found = check.regex.test(content);
    console.log(`${found ? '✅' : '❌'} ${check.name}: ${found ? 'OK' : 'MISSING'}`);
  });
  
  console.log('\n📦 Commands to Register:\n');
  const commandMatches = content.match(/this\.commands\.set\(['"]([^'"]+)['"]/g) || [];
  commandMatches.forEach(match => {
    const cmdName = match.match(/['"]([^'"]+)['"]/)[1];
    console.log(`   - ${cmdName}`);
  });
  
  console.log('\n💡 Next Steps:\n');
  console.log('1. Run: scripts/dev-tools/quick-restart.bat');
  console.log('2. Wait 10 seconds for bot to load');
  console.log('3. Test: /vipinfo in Discord');
  console.log('4. Or click "👑 VIP Info" button in /shop');
  console.log('');
  
} else {
  console.log('❌ VIP Module not found!');
  console.log('Expected:', vipModulePath);
}
