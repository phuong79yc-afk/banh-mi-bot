const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN || process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🚀 Force refreshing application (/) commands globally...');
    
    const guildId = process.env.GUILD_ID || '1482354951689605150';
    const clientId = process.env.CLIENT_ID || '1523664549637525616';
    
    // Get guild commands
    const commands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
    
    console.log(`✅ Found ${commands.length} commands to sync\n`);
    
    console.log('Commands:');
    commands.slice(0, 10).forEach(cmd => console.log(`  - ${cmd.name}`));
    if (commands.length > 10) console.log(`  ... and ${commands.length - 10} more`);
    
    console.log('\n✅ Commands are registered!');
    console.log('If commands still not showing:');
    console.log('1. Restart Discord app');
    console.log('2. Wait 1-2 minutes');
    console.log('3. Check server permissions');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
