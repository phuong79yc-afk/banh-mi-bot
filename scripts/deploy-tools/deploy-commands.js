const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(projectRoot, '.env') });

const commands = [];

// Load all module commands
const modulesPath = path.join(projectRoot, 'dist', 'src', 'modules');
console.log('📁 Loading commands from:', modulesPath);

const modules = fs.readdirSync(modulesPath).filter(dir => {
  return fs.statSync(path.join(modulesPath, dir)).isDirectory();
});

console.log(`📦 Found ${modules.length} modules`);

// For each module, try to load commands
for (const moduleName of modules) {
  try {
    const entryPath = path.join(modulesPath, moduleName, 'entry_point.js');
    if (!fs.existsSync(entryPath)) continue;

    const moduleExport = require(entryPath);
    const ModuleClass = moduleExport.default || moduleExport;
    
    // Instantiate module
    const moduleInstance = new ModuleClass({
      commands: new Map(),
      guilds: { cache: new Map() },
      users: { cache: new Map() },
      ws: { ping: 0 }
    });

    if (moduleInstance.commands && moduleInstance.commands.size > 0) {
      for (const [cmdName, command] of moduleInstance.commands) {
        if (command.data) {
          commands.push(command.data.toJSON());
          console.log(`  ✅ ${moduleName}: /${cmdName}`);
        }
      }
    }
  } catch (error) {
    console.log(`  ⚠️ ${moduleName}: ${error.message}`);
  }
}

console.log(`\n📤 Deploying ${commands.length} commands to Discord...`);

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`✅ Successfully deployed ${commands.length} application commands!`);
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
})();
