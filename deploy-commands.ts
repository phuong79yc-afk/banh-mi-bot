import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join } from 'path';

config();

const commands = [];
// Path when running from dist folder
const commandsPath = join(__dirname, 'src', 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('📦 Đang load commands từ:', commandsPath);

for (const file of commandFiles) {
  const command = require(join(commandsPath, file));
  if (command.data) {
    commands.push(command.data.toJSON());
    console.log(`✅ Đã load: ${command.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log(`\n🚀 Bắt đầu deploy ${commands.length} commands...`);

    // Deploy cho guild cụ thể (nhanh hơn, xuất hiện ngay)
    if (process.env.GUILD_ID) {
      console.log(`📍 Deploy cho guild: ${process.env.GUILD_ID}`);
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
        { body: commands },
      ) as any;
      console.log(`✅ Đã deploy thành công ${data.length} commands cho guild!`);
    }

    // Deploy global commands (mất thời gian hơn)
    const globalData = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID!),
      { body: commands },
    ) as any;

    console.log(`✅ Đã deploy thành công ${globalData.length} global commands!`);
    console.log(`\n⏰ Global commands có thể mất 5-10 phút để xuất hiện.`);
    console.log(`💡 Guild commands xuất hiện ngay lập tức!`);
  } catch (error) {
    console.error('❌ Lỗi khi deploy commands:', error);
  }
})();
