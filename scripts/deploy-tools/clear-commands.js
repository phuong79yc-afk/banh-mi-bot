/**
 * Clear all slash commands from Discord
 * Run this when you hit the 100 command limit
 */
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(projectRoot, '.env') });
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const guildId = process.env.GUILD_ID || '1482354951689605150';
const clientId = '1552573873034108978';

async function clearCommands() {
  try {
    console.log('🗑️  Clearing all guild commands...');
    
    // Get all current commands
    const commands = await rest.get(
      Routes.applicationGuildCommands(clientId, guildId)
    );
    
    console.log(`Found ${commands.length} commands to delete`);
    
    // Delete all
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: [] }
    );
    
    console.log('✅ All commands cleared!');
    console.log('Now restart bot to deploy fresh commands');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearCommands();
