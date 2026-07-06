import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('Xem avatar người dùng')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('Người dùng cần xem avatar')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser('user') || interaction.user;
  
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ 
      name: `Avatar - ${targetUser.username}`, 
      iconURL: targetUser.displayAvatarURL() 
    })
    .setTitle(targetUser.tag)
    .setDescription(
      `**User Avatar**\n\n` +
      `**Download:**\n` +
      `[PNG](${targetUser.displayAvatarURL({ extension: 'png', size: 1024 })}) • ` +
      `[JPG](${targetUser.displayAvatarURL({ extension: 'jpg', size: 1024 })}) • ` +
      `[WEBP](${targetUser.displayAvatarURL({ extension: 'webp', size: 1024 })})`
    )
    .setImage(targetUser.displayAvatarURL({ size: 1024 }))
    .setFooter({ 
      text: `Requested by ${interaction.user.tag}`, 
      iconURL: interaction.user.displayAvatarURL() 
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
