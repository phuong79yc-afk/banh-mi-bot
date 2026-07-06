import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import { hasModeratorAccess } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('slowmode')
  .setDescription('Set slowmode for the channel')
  .addIntegerOption(option =>
    option
      .setName('seconds')
      .setDescription('Slowmode duration in seconds (0-21600, 0 to disable)')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(21600)
  )
  .setDefaultMemberPermissions(null)
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check if user has moderator access
  const executor = interaction.guild?.members.cache.get(interaction.user.id);
  if (!executor || !hasModeratorAccess(executor)) {
    await interaction.reply({ 
      content: '❌ Bạn không có quyền sử dụng lệnh này!', 
      ephemeral: true 
    });
    return;
  }

  const seconds = interaction.options.get('seconds')?.value as number;
  const channel = interaction.channel;

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({ content: 'This command can only be used in text channels!', ephemeral: true });
    return;
  }

  try {
    await channel.setRateLimitPerUser(seconds);

    const embed = new EmbedBuilder()
      .setColor(seconds > 0 ? 0xFFA500 : 0x00FF00)
      .setTitle(seconds > 0 ? 'Slowmode Enabled' : 'Slowmode Disabled')
      .addFields(
        { name: 'Channel', value: `${channel}`, inline: true },
        { name: 'Duration', value: seconds > 0 ? `${seconds} seconds` : 'Disabled', inline: true },
        { name: 'Set By', value: interaction.user.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Set by ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await interaction.reply({ content: 'Failed to set slowmode!', ephemeral: true });
  }
}
