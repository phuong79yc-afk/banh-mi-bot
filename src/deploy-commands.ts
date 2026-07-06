import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const commands: any[] = [];

// Load commands từ thư mục commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command) {
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded: ${command.data.name}`);
    }
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log(`\n🗑️  Xóa tất cả commands cũ...\n`);

    if (process.env.GUILD_ID) {
      // Xóa guild commands cũ
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
        { body: [] }
      );
      console.log('✅ Đã xóa commands cũ trong guild\n');
    } else {
      // Xóa global commands cũ
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        { body: [] }
      );
      console.log('✅ Đã xóa commands cũ global\n');
    }

    console.log(`🚀 Bắt đầu deploy ${commands.length} commands mới...\n`);

    if (process.env.GUILD_ID) {
      // Deploy cho guild (dev mode)
      console.log('📍 Deploy cho guild:', process.env.GUILD_ID);
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
        { body: commands }
      );
    } else {
      // Deploy global
      console.log('🌍 Deploy global commands');
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        { body: commands }
      );
    }

    console.log(`\n✅ Đã deploy thành công ${commands.length} commands!\n`);
  } catch (error) {
    console.error('❌ Lỗi khi deploy commands:', error);
  }
})();
