import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel
} from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Xóa nhiều tin nhắn cùng lúc')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Số lượng tin nhắn cần xóa (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('amount', true);
    const channel = interaction.channel as TextChannel;

    try {
      const messages = await channel.bulkDelete(amount, true);

      return interaction.reply({
        content: `✅ Đã xóa ${messages.size} tin nhắn!`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Purge error:', error);
      return interaction.reply({
        content: '❌ Có lỗi xảy ra khi xóa tin nhắn! (Chỉ xóa được tin nhắn dưới 14 ngày)',
        ephemeral: true
      });
    }
  },
};
