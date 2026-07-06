import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits,
  AttachmentBuilder
} from 'discord.js';
import fs from 'fs';
import path from 'path';

export const data = new SlashCommandBuilder()
  .setName('setup-control-emojis')
  .setDescription('[ADMIN] Upload control button emojis to server')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const CONTROL_EMOJI_NAMES = [
  'pause_button',
  'play_button',
  'stop_button',
  'skip_button',
  'previous_button',
  'loop_button'
];

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply('❌ Lệnh này chỉ dùng được trong server!');
    return;
  }

  // Check if emojis directory exists
  const emojiDir = path.join(process.cwd(), 'control-emojis-animated');
  if (!fs.existsSync(emojiDir)) {
    await interaction.editReply({
      content: '❌ Thư mục `control-emojis-animated/` không tồn tại!\n\n' +
               '**Hướng dẫn:**\n' +
               '1. Chạy: `node scripts/create-animated-control-emojis.js`\n' +
               '2. Sau đó chạy lại lệnh này'
    });
    return;
  }

  const results: string[] = [];
  const uploadedEmojis: Record<string, string> = {};
  let successCount = 0;
  let failCount = 0;

  await interaction.editReply('🔄 Đang upload control button emojis...');

  for (const emojiName of CONTROL_EMOJI_NAMES) {
    try {
      const emojiPath = path.join(emojiDir, `${emojiName}.gif`);
      
      if (!fs.existsSync(emojiPath)) {
        results.push(`❌ ${emojiName}: File không tồn tại`);
        failCount++;
        continue;
      }

      // Check if emoji already exists
      const existingEmoji = guild.emojis.cache.find(e => e.name === emojiName);
      
      if (existingEmoji) {
        uploadedEmojis[emojiName] = existingEmoji.id;
        results.push(`✅ ${emojiName}: Đã tồn tại (ID: ${existingEmoji.id})`);
        successCount++;
        continue;
      }

      // Upload emoji
      const emoji = await guild.emojis.create({
        attachment: emojiPath,
        name: emojiName
      });

      uploadedEmojis[emojiName] = emoji.id;
      results.push(`✅ ${emojiName}: Uploaded (ID: ${emoji.id})`);
      successCount++;

      // Small delay to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error: any) {
      results.push(`❌ ${emojiName}: ${error.message}`);
      failCount++;
    }
  }

  // Save to config file (merge with existing music emojis)
  try {
    const configPath = path.join(process.cwd(), 'emoji-config.json');
    let existingConfig: any = { emojis: {} };
    
    if (fs.existsSync(configPath)) {
      existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }

    const config = {
      guildId: guild.id,
      emojis: {
        ...existingConfig.emojis,
        ...uploadedEmojis
      },
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    results.push('\n💾 Đã lưu cấu hình vào `emoji-config.json`');
  } catch (error: any) {
    results.push(`\n⚠️ Không thể lưu config: ${error.message}`);
  }

  const summary = `\n\n**Tổng kết:**\n✅ Thành công: ${successCount}\n❌ Thất bại: ${failCount}`;

  await interaction.editReply({
    content: '**Control Button Emoji Upload Results:**\n\n' + 
             results.join('\n') + 
             summary
  });
}
