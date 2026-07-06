import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout một thành viên (tạm thời không thể chat)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Thành viên cần timeout')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('duration')
        .setDescription('Thời gian timeout (phút)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10080)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Lý do timeout')
        .setRequired(false)
    ),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('user', true);
    const duration = interaction.options.getInteger('duration', true);
    const reason = interaction.options.getString('reason') || 'Không có lý do';

    try {
      const member = await interaction.guild?.members.fetch(target.id);
      
      if (!member) {
        return interaction.reply({
          content: '❌ Không tìm thấy thành viên này!',
          ephemeral: true
        });
      }

      if (!member.moderatable) {
        return interaction.reply({
          content: '❌ Không thể timeout thành viên này (quyền hạn cao hơn bot)!',
          ephemeral: true
        });
      }

      await member.timeout(duration * 60 * 1000, reason);

      const embed = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle('⏱️ Thành Viên Đã Bị Timeout')
        .addFields(
          { name: '👤 Thành viên', value: `${target.tag}`, inline: true },
          { name: '⏱️ Thời gian', value: `${duration} phút`, inline: true },
          { name: '👮 Bởi', value: `${interaction.user.tag}`, inline: true },
          { name: '📝 Lý do', value: reason, inline: false }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Timeout error:', error);
      return interaction.reply({
        content: '❌ Có lỗi xảy ra khi timeout thành viên!',
        ephemeral: true
      });
    }
  },
};
