import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { hasModeratorAccess } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('🔇 Mute/Unmute thành viên')
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('🔇 Mute thành viên')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('Thành viên cần mute')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option
          .setName('duration')
          .setDescription('Thời gian mute (phút, 1-1440)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(1440)
      )
      .addStringOption(option =>
        option
          .setName('reason')
          .setDescription('Lý do mute')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('🔊 Unmute thành viên')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('Thành viên cần unmute')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('reason')
          .setDescription('Lý do unmute')
          .setRequired(false)
      )
  )
  .setDefaultMemberPermissions(null)
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const executor = interaction.guild?.members.cache.get(interaction.user.id);
  if (!executor || !hasModeratorAccess(executor)) {
    await interaction.reply({ 
      content: '❌ Bạn không có quyền sử dụng lệnh này!', 
      ephemeral: true 
    });
    return;
  }

  const subcommand = interaction.options.getSubcommand();
  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') || 'Không có lý do';
  const member = interaction.guild?.members.cache.get(user.id);

  if (!member) {
    await interaction.reply({ content: '❌ Không tìm thấy thành viên!', ephemeral: true });
    return;
  }

  if (member.id === interaction.user.id) {
    await interaction.reply({ content: '❌ Bạn không thể mute chính mình!', ephemeral: true });
    return;
  }

  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: '❌ Không thể mute administrator!', ephemeral: true });
    return;
  }

  try {
    if (subcommand === 'add') {
      // Mute member
      const duration = interaction.options.getInteger('duration', true);
      
      if (member.isCommunicationDisabled()) {
        await interaction.reply({ 
          content: `⚠️ ${user.tag} đã bị mute rồi!`, 
          ephemeral: true 
        });
        return;
      }

      await member.timeout(duration * 60 * 1000, reason);

      const muteEmbed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('🔇 Thành Viên Bị Mute')
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
          { name: '⏱️ Thời Gian', value: `${duration} phút`, inline: true },
          { name: '👮 Mute Bởi', value: interaction.user.tag, inline: true },
          { name: '📝 Lý Do', value: reason, inline: false },
          { name: '🕐 Hết Hạn', value: `<t:${Math.floor((Date.now() + duration * 60 * 1000) / 1000)}:R>`, inline: false }
        )
        .setFooter({ text: `Mute bởi ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.reply({ embeds: [muteEmbed] });

    } else if (subcommand === 'remove') {
      // Unmute member
      if (!member.isCommunicationDisabled()) {
        await interaction.reply({ 
          content: `⚠️ ${user.tag} không bị mute!`, 
          ephemeral: true 
        });
        return;
      }

      await member.timeout(null, reason);

      const unmuteEmbed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('🔊 Thành Viên Được Unmute')
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
          { name: '👮 Unmute Bởi', value: interaction.user.tag, inline: true },
          { name: '📝 Lý Do', value: reason, inline: false }
        )
        .setFooter({ text: `Unmute bởi ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.reply({ embeds: [unmuteEmbed] });
    }

  } catch (error) {
    console.error('Lỗi mute/unmute:', error);
    await interaction.reply({ 
      content: '❌ Không thể thực hiện! Kiểm tra quyền của bot.', 
      ephemeral: true 
    });
  }
}
