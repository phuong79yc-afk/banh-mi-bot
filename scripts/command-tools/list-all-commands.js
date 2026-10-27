// Đọc tất cả commands từ bot đang build
const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');

// Đọc từng module và extract commands
const modulesPath = path.join(projectRoot, 'dist', 'src', 'modules');

function getAllModules() {
  const modules = [];
  const entries = fs.readdirSync(modulesPath);
  
  for (const entry of entries) {
    const modulePath = path.join(modulesPath, entry);
    if (fs.statSync(modulePath).isDirectory()) {
      const entryPoint = path.join(modulePath, 'entry_point.js');
      if (fs.existsSync(entryPoint)) {
        modules.push({ name: entry, path: entryPoint });
      }
    }
  }
  
  return modules;
}

async function loadCommands() {
  const modules = getAllModules();
  const allCommands = [];
  
  for (const mod of modules) {
    try {
      const Module = require(mod.path).default;
      if (Module) {
        const instance = new Module({ on: () => {}, emit: () => {} }); // Mock client
        if (instance.commands) {
          instance.commands.forEach((cmd, name) => {
            if (cmd.data && cmd.data.name && cmd.data.description) {
              allCommands.push({
                module: mod.name,
                name: cmd.data.name,
                description: cmd.data.description
              });
            }
          });
        }
      }
    } catch (error) {
      console.error(`❌ Error loading ${mod.name}:`, error.message);
    }
  }
  
  return allCommands;
}

(async () => {
  console.log('🔍 Loading all commands from modules...\n');
  
  const commands = await loadCommands();
  commands.sort((a, b) => a.name.localeCompare(b.name));
  
  console.log(`📋 Found ${commands.length} commands:\n`);
  console.log('='.repeat(120));
  
  // Group by module
  const byModule = {};
  for (const cmd of commands) {
    if (!byModule[cmd.module]) byModule[cmd.module] = [];
    byModule[cmd.module].push(cmd);
  }
  
  for (const [module, cmds] of Object.entries(byModule)) {
    console.log(`\n## ${module} (${cmds.length} commands)`);
    for (const cmd of cmds) {
      console.log(`  /${cmd.name.padEnd(35)} - ${cmd.description}`);
    }
  }
  
  console.log('\n' + '='.repeat(120));
  console.log(`\nTotal: ${commands.length} commands`);
  
  // Save detailed list
  const output = [];
  for (const [module, cmds] of Object.entries(byModule)) {
    output.push(`\n## ${module}`);
    for (const cmd of cmds) {
      output.push(`/${cmd.name} - ${cmd.description}`);
    }
  }
  
  fs.writeFileSync(
    path.join(projectRoot, 'all-commands-detailed.txt'),
    output.join('\n')
  );
  
  console.log('\n✅ Detailed list saved to all-commands-detailed.txt');
})();
