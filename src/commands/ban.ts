import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Ban a member from the server')
  .addUserOption(option =>
    option.setName('target')
      .setDescription('Member to ban')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('reason')
      .setDescription('Reason for ban')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option.setName('days')
      .setDescription('Delete message history (days)')
      .setMinValue(0)
      .setMaxValue(7)
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target', true);
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const days = interaction.options.getInteger('days') || 0;
  const member = interaction.guild?.members.cache.get(target.id);

  if (member && !member.bannable) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff4444')
      .setDescription('```diff\n- ERROR: Cannot ban this user. They may have higher permissions.\n```');
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    return;
  }

  try {
    await interaction.guild?.members.ban(target, { reason, deleteMessageSeconds: days * 86400 });

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setAuthor({ 
        name: 'Member Banned', 
        iconURL: interaction.guild?.iconURL() || undefined 
      })
      .setTitle('Moderation Action')
      .setDescription(`**${target.tag}** has been banned from the server`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'User', value: `${target.tag}\n\`${target.id}\``, inline: true },
        { name: 'Moderator', value: interaction.user.tag, inline: true },
        { name: 'Message History', value: `${days} days`, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setFooter({ 
        text: `Banned by ${interaction.user.username}`, 
        iconURL: interaction.user.avatarURL() || undefined 
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff4444')
      .setDescription('```diff\n- ERROR: Failed to ban member!\n```');
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}
