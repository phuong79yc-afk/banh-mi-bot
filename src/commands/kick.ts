import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Kick a member from the server')
  .addUserOption(option =>
    option.setName('target')
      .setDescription('Member to kick')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('reason')
      .setDescription('Reason for kick')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target', true);
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const member = interaction.guild?.members.cache.get(target.id);

  if (!member) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff4444')
      .setDescription('```diff\n- ERROR: User not found in this server!\n```');
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    return;
  }

  if (!member.kickable) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff4444')
      .setDescription('```diff\n- ERROR: Cannot kick this user. They may have higher permissions.\n```');
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    return;
  }

  try {
    await member.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xFF8800)
      .setAuthor({ 
        name: 'Member Kicked', 
        iconURL: interaction.guild?.iconURL() || undefined 
      })
      .setTitle('Moderation Action')
      .setDescription(`**${target.tag}** has been kicked from the server`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'User', value: `${target.tag}\n\`${target.id}\``, inline: true },
        { name: 'Moderator', value: interaction.user.tag, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setFooter({ 
        text: `Kicked by ${interaction.user.username}`, 
        iconURL: interaction.user.avatarURL() || undefined 
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff4444')
      .setDescription('```diff\n- ERROR: Failed to kick member!\n```');
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}
