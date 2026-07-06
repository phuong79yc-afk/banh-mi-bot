import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('user')
  .setDescription('Xem thông tin người dùng')
  .addUserOption(option =>
    option.setName('target')
      .setDescription('Người dùng cần xem')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target') || interaction.user;
  const member = interaction.guild?.members.cache.get(target.id);
  
  const accountAge = Math.floor((Date.now() - target.createdTimestamp) / (1000 * 60 * 60 * 24));
  const joinedAge = member ? Math.floor((Date.now() - member.joinedTimestamp!) / (1000 * 60 * 60 * 24)) : 0;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ 
      name: 'Thông tin User', 
      iconURL: target.displayAvatarURL() 
    })
    .setTitle(`${target.tag}`)
    .setDescription(
      `**${target.displayName}**\n` +
      `**ID:** \`${target.id}\`\n` +
      `**Loại:** ${target.bot ? 'Bot' : 'User'}`
    )
    .setThumbnail(target.displayAvatarURL({ size: 256 }))
    .addFields(
      { 
        name: 'Tạo tài khoản', 
        value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>\n*${accountAge} ngày trước*`, 
        inline: true 
      },
      { 
        name: 'Tham gia Server', 
        value: member ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:D>\n*${joinedAge} ngày trước*` : '`N/A`', 
        inline: true 
      }
    )
    .setFooter({ 
      text: `${interaction.user.tag}`, 
      iconURL: interaction.user.displayAvatarURL() 
    })
    .setTimestamp();

  if (member && member.roles.cache.size > 1) {
    const roles = member.roles.cache
      .filter(role => role.id !== interaction.guild?.id)
      .sort((a, b) => b.position - a.position)
      .map(role => role.toString())
      .slice(0, 10);
    
    embed.addFields({
      name: `Roles [${member.roles.cache.size - 1}]`,
      value: roles.join(', ') || 'Không có role',
      inline: false
    });
  }

  await interaction.reply({ embeds: [embed] });
}
