import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('user')
  .setDescription('👤 Xem thông tin user')
  .addSubcommand(subcommand =>
    subcommand
      .setName('info')
      .setDescription('📋 Xem thông tin chi tiết user')
      .addUserOption(option =>
        option
          .setName('target')
          .setDescription('User cần xem')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('avatar')
      .setDescription('🖼️ Xem avatar user')
      .addUserOption(option =>
        option
          .setName('target')
          .setDescription('User cần xem avatar')
          .setRequired(false)
      )
  )
  .setDMPermission(true);

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();
  const target = interaction.options.getUser('target') || interaction.user;

  if (subcommand === 'avatar') {
    // Avatar subcommand
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({ 
        name: `Avatar - ${target.username}`, 
        iconURL: target.displayAvatarURL() 
      })
      .setTitle(target.tag)
      .setDescription(
        `**📥 Download Links:**\n` +
        `[PNG](${target.displayAvatarURL({ extension: 'png', size: 2048 })}) • ` +
        `[JPG](${target.displayAvatarURL({ extension: 'jpg', size: 2048 })}) • ` +
        `[WEBP](${target.displayAvatarURL({ extension: 'webp', size: 2048 })})`
      )
      .setImage(target.displayAvatarURL({ size: 2048 }))
      .setFooter({ 
        text: `Requested by ${interaction.user.tag}`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'info') {
    // Info subcommand
    const member = interaction.guild?.members.cache.get(target.id);
    
    const accountAge = Math.floor((Date.now() - target.createdTimestamp) / (1000 * 60 * 60 * 24));
    const joinedAge = member ? Math.floor((Date.now() - member.joinedTimestamp!) / (1000 * 60 * 60 * 24)) : 0;

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || 0x5865F2)
      .setAuthor({ 
        name: 'Thông Tin User', 
        iconURL: target.displayAvatarURL() 
      })
      .setTitle(`${target.tag}`)
      .setDescription(
        `**${target.displayName}**\n` +
        `**ID:** \`${target.id}\`\n` +
        `**Loại:** ${target.bot ? '🤖 Bot' : '👤 User'}`
      )
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { 
          name: '📅 Tạo Tài Khoản', 
          value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>\n*${accountAge} ngày trước*`, 
          inline: true 
        },
        { 
          name: '🚪 Tham Gia Server', 
          value: member ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:D>\n*${joinedAge} ngày trước*` : '`Không trong server`', 
          inline: true 
        }
      )
      .setFooter({ 
        text: `Requested by ${interaction.user.tag}`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();

    if (member && member.roles.cache.size > 1) {
      const roles = member.roles.cache
        .filter(role => role.id !== interaction.guild?.id)
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString())
        .slice(0, 15);
      
      embed.addFields({
        name: `🎭 Roles [${member.roles.cache.size - 1}]`,
        value: roles.join(', ') || 'Không có role',
        inline: false
      });
    }

    if (member?.premiumSince) {
      embed.addFields({
        name: '💎 Server Boost',
        value: `Boost từ <t:${Math.floor(member.premiumSinceTimestamp! / 1000)}:R>`,
        inline: true
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
}
