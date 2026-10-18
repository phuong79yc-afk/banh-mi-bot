// Admin command to reset daily for testing
import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import Database from 'better-sqlite3';
import path from 'path';

const dataDir = process.env.DATABASE_PATH || path.join(process.cwd(), 'data');
const db = new Database(path.join(dataDir, 'economy.db'));

export const data = new SlashCommandBuilder()
  .setName('admin-reset-daily')
  .setDescription('[Admin] Reset daily của user để test')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('User cần reset daily')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser('user', true);
  
  try {
    const stmt = db.prepare('UPDATE daily_users SET last_daily = NULL WHERE user_id = ?');
    const result = stmt.run(targetUser.id);
    
    if (result.changes > 0) {
      await interaction.reply({
        content: `✅ Đã reset daily cho ${targetUser.toString()}. User có thể dùng /daily lại!`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `⚠️ User ${targetUser.toString()} chưa có dữ liệu daily.`,
        ephemeral: true
      });
    }
  } catch (error: any) {
    await interaction.reply({
      content: `❌ Lỗi: ${error.message}`,
      ephemeral: true
    });
  }
}
