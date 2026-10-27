/**
 * Auto Build, Deploy & Restart Script
 * Triggered by Kiro hook when command files are saved
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');

console.log('\n🔄 Auto Deploy Triggered...\n');

try {
  // Step 1: Build TypeScript
  console.log('[1/4] 📦 Building TypeScript...');
  execSync('npm run build', { 
    stdio: 'inherit',
    cwd: projectRoot
  });
  console.log('✅ Build successful!\n');

  // Step 2: Deploy commands to Discord
  console.log('[2/4] 🚀 Deploying commands to Discord...');
  execSync('node dist/src/deploy-commands.js', {
    stdio: 'inherit',
    cwd: projectRoot
  });
  console.log('✅ Commands deployed!\n');

  // Step 3: Kill existing bot process
  console.log('[3/4] 🛑 Stopping bot...');
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*" 2>nul', { stdio: 'ignore' });
    } else {
      execSync('pkill -f "npm start"', { stdio: 'ignore' });
    }
  } catch (err) {
    // Ignore errors if no process found
  }
  console.log('✅ Bot stopped!\n');

  // Step 4: Start bot in background
  console.log('[4/4] 🚀 Starting bot...');
  if (process.platform === 'win32') {
    execSync('start /B npm start', { stdio: 'ignore', cwd: projectRoot });
  } else {
    execSync('npm start > /dev/null 2>&1 &', { stdio: 'ignore', cwd: projectRoot });
  }
  console.log('✅ Bot started!\n');

  console.log('✅ AUTO DEPLOY COMPLETE!\n');
  process.exit(0);

} catch (error) {
  console.error('❌ Auto deploy failed:', error.message);
  process.exit(1);
}
