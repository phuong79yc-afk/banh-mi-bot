// Admin command to reset daily for testing
import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { getTursoDatabase } from '../../database/turso';

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
    const db = getTursoDatabase();
    const result = await db.execute({
      sql: 'UPDATE daily_users SET last_daily = NULL WHERE user_id = ?',
      args: [targetUser.id]
    });
    
    if (result.rowsAffected > 0) {
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
