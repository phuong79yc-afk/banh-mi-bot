import { REST, Routes, Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { ModuleLoader } from './core/ModuleLoader';
import path from 'path';

dotenv.config();

(async () => {
  try {
    console.log('🤖 Creating temporary client...');
    
    // Create minimal client
    const client = new Client({
      intents: [GatewayIntentBits.Guilds]
    });
    
    (client as any).commands = new Map();

    console.log('📦 Loading modules...\n');
    
    // Load modules
    const modulesPath = path.join(__dirname, '../dist/modules');
    const moduleLoader = new ModuleLoader(client, modulesPath);
    await moduleLoader.loadAllModules();

    // Collect all commands
    const commands: any[] = [];
    
    for (const [name, command] of (client as any).commands) {
      if (command.data) {
        commands.push(command.data.toJSON ? command.data.toJSON() : command.data);
        console.log(`  ✅ ${name}`);
      }
    }

    console.log(`\n🚀 Deploying ${commands.length} commands...\n`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

    if (process.env.GUILD_ID) {
      console.log('📍 Deploy to guild:', process.env.GUILD_ID);
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
        { body: commands }
      );
    } else {
      console.log('🌍 Deploy globally (takes ~1 hour to propagate)');
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        { body: commands }
      );
    }

    console.log(`\n✅ Successfully deployed ${commands.length} commands!\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Deploy error:', error);
    process.exit(1);
  }
})();
