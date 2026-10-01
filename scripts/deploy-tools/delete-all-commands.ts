import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log('\n🗑️  Đang xóa tất cả commands...\n');

    // Xóa guild commands (nếu có GUILD_ID)
    if (process.env.GUILD_ID) {
      console.log('📍 Xóa guild commands:', process.env.GUILD_ID);
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
        { body: [] }
      );
      console.log('✅ Đã xóa guild commands');
    }

    // Xóa global commands
    console.log('🌍 Xóa global commands');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID!),
      { body: [] }
    );
    console.log('✅ Đã xóa global commands');

    console.log('\n✅ Đã xóa tất cả commands thành công!\n');
  } catch (error) {
    console.error('❌ Lỗi khi xóa commands:', error);
    process.exit(1);
  }
})();
