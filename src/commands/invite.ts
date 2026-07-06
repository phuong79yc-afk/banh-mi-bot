import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

const CLIENT_ID = process.env.CLIENT_ID || '1498700400327528498';

export const data = new SlashCommandBuilder()
  .setName('invite')
  .setDescription('Nhận link mời bot và links hữu ích')
  .setDMPermission(true);

export async function execute(interaction: ChatInputCommandInteraction) {
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;
  const supportServer = 'https://discord.gg/phocaviet'; // Đổi thành link support server thật
  const website = 'https://banh-mi-bot.onrender.com';
  
  const embed = new EmbedBuilder()
    .setColor(0xFF1744)
    .setTitle('🎉 Mời Bot Bánh Mì vào server!')
    .setDescription(
      'Cảm ơn bạn đã quan tâm đến bot! Dưới đây là các links hữu ích:'
    )
    .addFields(
      {
        name: '🤖 Mời Bot',
        value: `[Nhấn vào đây để mời bot](${inviteUrl})`,
        inline: false
      },
      {
        name: '🌐 Website',
        value: `[${website}](${website})`,
        inline: true
      },
      {
        name: '💬 Support Server',
        value: `[Tham gia server](${supportServer})`,
        inline: true
      },
      {
        name: '⭐ Vote Bot',
        value: 'Coming soon trên top.gg',
        inline: true
      }
    )
    .setFooter({
      text: `${interaction.client.user?.username || 'Bot'} • Made with ❤️ in Vietnam`,
      iconURL: interaction.client.user?.displayAvatarURL()
    })
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed] });
}
