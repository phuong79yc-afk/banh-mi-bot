import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Thông tin về bot'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    const totalMembers = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('ℹ️ Thông Tin Bot')
      .setThumbnail(client.user?.displayAvatarURL() || '')
      .addFields(
        { 
          name: '🤖 Tên Bot', 
          value: client.user?.tag || 'Unknown', 
          inline: true 
        },
        { 
          name: '📊 Servers', 
          value: `${client.guilds.cache.size}`, 
          inline: true 
        },
        { 
          name: '👥 Users', 
          value: `${totalMembers}`, 
          inline: true 
        },
        { 
          name: '📡 Ping', 
          value: `${Math.round(client.ws.ping)}ms`, 
          inline: true 
        },
        { 
          name: '⏰ Uptime', 
          value: `${Math.floor((client.uptime || 0) / 1000 / 60)} phút`, 
          inline: true 
        },
        { 
          name: '💻 Node.js', 
          value: process.version, 
          inline: true 
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Bánh Mì Bot' });

    await interaction.reply({ embeds: [embed] });
  },
};
