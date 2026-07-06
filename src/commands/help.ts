import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Xem danh sách lệnh của bot'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📚 Danh Sách Lệnh Bot')
      .setDescription('Bot Discord đơn giản với các lệnh cơ bản')
      .addFields(
        { 
          name: '🏓 /ping', 
          value: 'Kiểm tra độ trễ của bot', 
          inline: false 
        },
        { 
          name: '📚 /help', 
          value: 'Hiển thị menu trợ giúp này', 
          inline: false 
        },
        { 
          name: 'ℹ️ /info', 
          value: 'Thông tin về bot', 
          inline: false 
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Bánh Mì Bot' });

    await interaction.reply({ embeds: [embed] });
  },
};
