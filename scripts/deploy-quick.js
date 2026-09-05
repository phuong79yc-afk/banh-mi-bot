// Quick Deploy Script - No deletion, just deploy
const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const commands = [];

// Load commands from dist/src/modules
const modulesPath = path.join(__dirname, '..', 'dist', 'src', 'modules');

console.log('📁 Loading from:', modulesPath);

if (fs.existsSync(modulesPath)) {
  const moduleFolders = fs.readdirSync(modulesPath).filter(folder => {
    const folderPath = path.join(modulesPath, folder);
    return fs.statSync(folderPath).isDirectory();
  });

  console.log(`📦 Found ${moduleFolders.length} module folders\n`);

  for (const folder of moduleFolders) {
    const entryPointPath = path.join(modulesPath, folder, 'entry_point.js');
    
    if (fs.existsSync(entryPointPath)) {
      try {
        const ModuleClass = require(entryPointPath).default;
        if (!ModuleClass) continue;
        
        // Create dummy client
        const dummyClient = {
          on: () => {},
          once: () => {},
          channels: { fetch: () => Promise.resolve(null) },
          guilds: { fetch: () => Promise.resolve(null) }
        };
        
        const tempModule = new ModuleClass(dummyClient);
        
        // Initialize
        if (typeof tempModule.initialize === 'function') {
          tempModule.initialize();
        }
        
        // Get commands
        if (tempModule.commands && tempModule.commands.size > 0) {
          tempModule.commands.forEach((command) => {
            if (command.data) {
              commands.push(command.data.toJSON());
              console.log(`  ✅ ${command.data.name} (${folder})`);
            }
          });
        }
      } catch (error) {
        console.error(`  ❌ Error loading ${folder}:`, error.message);
      }
    }
  }
}

console.log(`\n🚀 Deploying ${commands.length} commands...\n`);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    if (process.env.GUILD_ID) {
      console.log('📍 Guild ID:', process.env.GUILD_ID);
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`\n✅ Successfully deployed ${commands.length} commands to guild!`);
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`\n✅ Successfully deployed ${commands.length} commands globally!`);
    }
  } catch (error) {
    console.error('\n❌ Deploy error:', error);
  }
})();
