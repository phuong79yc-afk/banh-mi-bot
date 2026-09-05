import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const commands: any[] = [];

// Load commands từ modules (use dist path for compiled code)
const isDist = __dirname.includes('dist');
const modulesPath = isDist 
  ? path.join(__dirname, 'modules')
  : path.join(__dirname, '..', 'dist', 'src', 'modules');
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
        
        // Create dummy client to initialize module
        const dummyClient: any = {
          on: () => {},
          once: () => {},
          channels: { fetch: () => Promise.resolve(null) },
          guilds: { fetch: () => Promise.resolve(null) }
        };
        
        const tempModule = new ModuleClass(dummyClient);
        
        // Initialize to register commands
        if (typeof tempModule.initialize === 'function') {
          tempModule.initialize();
        }
        
        // Check if module has commands
        if (tempModule.commands && tempModule.commands.size > 0) {
          tempModule.commands.forEach((command: any) => {
            if (command.data) {
              commands.push(command.data.toJSON());
              console.log(`✅ Loaded: ${command.data.name} (from ${folder})`);
            }
          });
        }
      } catch (error) {
        console.error(`❌ Error loading module ${folder}:`, error);
      }
    }
  }
}

// Skip legacy commands - they're replaced by modules
// Also load legacy commands from commands folder (if any)
/*
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command) {
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded: ${command.data.name} (legacy)`);
    }
  }
}
*/

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log(`\n🚀 Bắt đầu deploy ${commands.length} commands...\n`);

    if (process.env.GUILD_ID) {
      try {
        // Try guild deploy first
        console.log('📍 Thử deploy cho guild:', process.env.GUILD_ID);
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
          { body: commands }
        );
        console.log(`✅ Đã deploy thành công ${commands.length} commands!\n`);
      } catch (guildError: any) {
        if (guildError.code === 50001) {
          console.log('⚠️ Bot thiếu quyền deploy guild commands, chuyển sang global...\n');
          // Fallback to global
          console.log('🌍 Deploy global commands (có thể mất 1 giờ để sync)');
          await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID!),
            { body: commands }
          );
          console.log(`✅ Đã deploy global ${commands.length} commands!\n`);
        } else {
          throw guildError;
        }
      }
    } else {
      // Deploy global
      console.log('🌍 Deploy global commands');
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        { body: commands }
      );
      console.log(`✅ Đã deploy thành công ${commands.length} commands!\n`);
    }
  } catch (error) {
    console.error('❌ Lỗi khi deploy commands:', error);
    console.log('⚠️ Hãy re-invite bot với scope "applications.commands"\n');
    process.exit(1);
  }
})();