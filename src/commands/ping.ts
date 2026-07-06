import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Kiểm tra độ trễ của bot'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({ 
      content: '🏓 Pinging...', 
      fetchReply: true 
    });
    
    const ping = sent.createdTimestamp - interaction.createdTimestamp;
    const apiPing = Math.round(interaction.client.ws.ping);
    
    await interaction.editReply(
      `🏓 Pong!\n` +
      `📊 Bot Latency: **${ping}ms**\n` +
      `📡 API Latency: **${apiPing}ms**`
    );
  },
};
