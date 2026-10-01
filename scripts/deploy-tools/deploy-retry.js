// Deploy with retry logic
const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const commands = [];
const modulesPath = path.join(__dirname, '..', 'dist', 'src', 'modules');

console.log('📁 Loading commands from modules...\n');

if (fs.existsSync(modulesPath)) {
  const moduleFolders = fs.readdirSync(modulesPath).filter(folder => {
    const folderPath = path.join(modulesPath, folder);
    return fs.statSync(folderPath).isDirectory();
  });

  for (const folder of moduleFolders) {
    const entryPointPath = path.join(modulesPath, folder, 'entry_point.js');
    
    if (fs.existsSync(entryPointPath)) {
      try {
        const ModuleClass = require(entryPointPath).default;
        if (!ModuleClass) continue;
        
        const dummyClient = {
          on: () => {},
          once: () => {},
          channels: { fetch: () => Promise.resolve(null) },
          guilds: { fetch: () => Promise.resolve(null) }
        };
        
        const tempModule = new ModuleClass(dummyClient);
        
        if (typeof tempModule.initialize === 'function') {
          tempModule.initialize();
        }
        
        if (tempModule.commands && tempModule.commands.size > 0) {
          tempModule.commands.forEach((command) => {
            if (command.data) {
              commands.push(command.data.toJSON());
            }
          });
        }
      } catch (error) {
        // Silent fail
      }
    }
  }
}

console.log(`✅ Loaded ${commands.length} commands\n`);

const rest = new REST({ version: '10', timeout: 120000 }).setToken(process.env.DISCORD_TOKEN);

async function deployWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 Attempt ${attempt}/${maxRetries}: Deploying commands...`);
      
      if (process.env.GUILD_ID) {
        console.log(`📍 Guild: ${process.env.GUILD_ID}\n`);
        
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
          { body: commands }
        );
        
        console.log(`\n✅ Successfully deployed ${commands.length} commands to guild!`);
        return true;
      } else {
        console.log('🌍 Global deployment\n');
        
        await rest.put(
          Routes.applicationCommands(process.env.CLIENT_ID),
          { body: commands }
        );
        
        console.log(`\n✅ Successfully deployed ${commands.length} commands globally!`);
        return true;
      }
    } catch (error) {
      console.error(`\n❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = attempt * 10;
        console.log(`⏳ Waiting ${waitTime}s before retry...\n`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      }
    }
  }
  
  console.error('\n❌ All deployment attempts failed!');
  return false;
}

deployWithRetry();
