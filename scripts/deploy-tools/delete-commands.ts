import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;
const guildId = process.env.GUILD_ID!;

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('🗑️ Đang xóa tất cả commands...');

    // Delete all guild commands
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: [] }
    );

    console.log('✅ Đã xóa tất cả guild commands!');

    // Delete all global commands
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: [] }
    );

    console.log('✅ Đã xóa tất cả global commands!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
