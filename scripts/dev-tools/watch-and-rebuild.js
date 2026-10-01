// Auto Build, Deploy & Restart Bot on File Change
// Run: node scripts/watch-and-rebuild.js

const { exec } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

let isRebuilding = false;
let rebuildQueue = false;

console.log('🔍 Watching src/ for changes...\n');

// Watch all TypeScript files in src/
const watcher = chokidar.watch('src/**/*.ts', {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true,
  usePolling: true, // Important for Windows
  interval: 1000, // Check every second
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100
  }
});

function rebuild(filePath) {
  if (isRebuilding) {
    rebuildQueue = true;
    console.log('⏳ Rebuild queued...');
    return;
  }

  isRebuilding = true;
  const fileName = path.basename(filePath);
  const timestamp = new Date().toLocaleTimeString();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`🔄 [${timestamp}] File changed: ${fileName}`);
  console.log(`${'='.repeat(50)}\n`);

  console.log('1️⃣ Building TypeScript...');
  
  exec('npm run build', (error, stdout, stderr) => {
    if (error) {
      console.error('\n❌ BUILD FAILED!\n');
      console.error('━'.repeat(50));
      console.error('Error Code:', error.code);
      console.error('━'.repeat(50));
      
      // Show TypeScript errors
      if (stderr) {
        console.error('\n📋 TypeScript Errors:\n');
        console.error(stderr);
      }
      
      if (stdout) {
        console.error('\n📋 Build Output:\n');
        console.error(stdout);
      }
      
      console.error('\n━'.repeat(50));
      console.error('💡 Fix the errors above and save again.\n');
      
      isRebuilding = false;
      if (rebuildQueue) {
        rebuildQueue = false;
        setTimeout(() => rebuild(filePath), 1000);
      }
      return;
    }

    console.log('✅ Build complete!\n');
    console.log('2️⃣ Deploying commands...');

    exec('node dist/deploy-commands.js', (error, stdout, stderr) => {
      if (error) {
        console.error('\n❌ DEPLOY FAILED!\n');
        console.error('━'.repeat(50));
        console.error('Error Code:', error.code);
        console.error('━'.repeat(50));
        
        if (stderr) {
          console.error('\n📋 Deploy Errors:\n');
          console.error(stderr);
        }
        
        if (stdout) {
          console.error('\n📋 Deploy Output:\n');
          console.error(stdout);
        }
        
        console.error('\n━'.repeat(50));
        console.error('💡 Check Discord bot token and permissions.\n');
        
        isRebuilding = false;
        if (rebuildQueue) {
          rebuildQueue = false;
          setTimeout(() => rebuild(filePath), 1000);
        }
        return;
      }

      // Show deploy success output
      if (stdout) {
        console.log(stdout);
      }
      
      console.log('✅ Commands deployed!\n');
      console.log('3️⃣ Restarting bot...');

      exec('.\\scripts\\restart-bot.bat', (error, stdout, stderr) => {
        if (error) {
          console.error('\n❌ RESTART FAILED!\n');
          console.error('━'.repeat(50));
          console.error('Error Code:', error.code);
          console.error('━'.repeat(50));
          
          if (stderr) {
            console.error('\n📋 Restart Errors:\n');
            console.error(stderr);
          }
          
          if (stdout) {
            console.error('\n📋 Restart Output:\n');
            console.error(stdout);
          }
          
          console.error('\n━'.repeat(50));
          console.error('💡 Try manually: .\\scripts\\restart-bot.bat\n');
        } else {
          // Show restart output (SUCCESS/RUNNING status)
          if (stdout) {
            console.log(stdout);
          }
          
          console.log('✅ Bot restarted!\n');
          console.log(`${'='.repeat(50)}`);
          console.log('✨ All done! Watching for changes...');
          console.log(`${'='.repeat(50)}\n`);
        }

        isRebuilding = false;
        
        if (rebuildQueue) {
          rebuildQueue = false;
          setTimeout(() => rebuild(filePath), 1000);
        }
      });
    });
  });
}

watcher
  .on('change', filePath => rebuild(filePath))
  .on('add', filePath => rebuild(filePath))
  .on('error', error => {
    console.error('\n❌ WATCHER ERROR!\n');
    console.error('━'.repeat(50));
    console.error(error);
    console.error('━'.repeat(50));
    console.error('💡 Watcher might have crashed. Restart it manually.\n');
  });

console.log('✅ Watcher started!');
console.log('📁 Watching: src/**/*.ts');
console.log('🔄 Auto: Build → Deploy → Restart\n');
console.log('Press Ctrl+C to stop.\n');
