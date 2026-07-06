const { spawn } = require('child_process');
const path = require('path');

let botProcess = null;
let isRestarting = false;

function startBot() {
  console.log('🚀 Starting bot...');
  
  botProcess = spawn('node', ['dist/src/index.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });

  botProcess.on('exit', (code) => {
    console.log(`\n⚠️ Bot process exited with code: ${code}`);
    
    if (code === 0 && !isRestarting) {
      // Code 0 = restart được yêu cầu
      console.log('🔄 Restarting bot in 2 seconds...');
      isRestarting = true;
      
      setTimeout(() => {
        isRestarting = false;
        startBot();
      }, 2000);
    } else if (code !== 0) {
      // Lỗi - không restart tự động
      console.log('❌ Bot crashed. Please check the logs and restart manually.');
      process.exit(code);
    }
  });

  botProcess.on('error', (err) => {
    console.error('❌ Failed to start bot:', err);
    process.exit(1);
  });
}

// Handle CTRL+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  if (botProcess) {
    botProcess.kill();
  }
  process.exit(0);
});

// Start the bot
startBot();
