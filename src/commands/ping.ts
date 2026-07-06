import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Kiểm tra độ trễ của bot');

export async function execute(interaction: ChatInputCommandInteraction) {
  // Đo latency nhanh hơn
  const start = Date.now();
  await interaction.deferReply();
  const latency = Date.now() - start;
  const apiLatency = Math.round(interaction.client.ws.ping);

  // Color và status dựa trên latency
  let color = 0x57F287; // Green
  let status = '🟢 Tuyệt vời';
  let emoji = '⚡';
  
  if (latency > 200 || apiLatency > 200) {
    color = 0xFEE75C; // Yellow
    status = '🟡 Tốt';
    emoji = '⚠️';
  }
  if (latency > 500 || apiLatency > 500) {
    color = 0xED4245; // Red
    status = '🔴 Chậm';
    emoji = '🐌';
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} Ping Check`)
    .setDescription(
      `**Bot Latency:** \`${latency}ms\`\n` +
      `**API Latency:** \`${apiLatency}ms\`\n` +
      `**Status:** ${status}`
    )
    .setFooter({ 
      text: `Requested by ${interaction.user.tag}`, 
      iconURL: interaction.user.displayAvatarURL() 
    })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
