import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban một thành viên khỏi server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Thành viên cần ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Lý do ban')
        .setRequired(false)
    ),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'Không có lý do';

    try {
      const member = await interaction.guild?.members.fetch(target.id);
      
      if (!member) {
        return interaction.reply({
          content: '❌ Không tìm thấy thành viên này!',
          ephemeral: true
        });
      }

      if (!member.bannable) {
        return interaction.reply({
          content: '❌ Không thể ban thành viên này (quyền hạn cao hơn bot)!',
          ephemeral: true
        });
      }

      await member.ban({ reason });

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🔨 Thành Viên Đã Bị Ban')
        .addFields(
          { name: '👤 Thành viên', value: `${target.tag}`, inline: true },
          { name: '👮 Bởi', value: `${interaction.user.tag}`, inline: true },
          { name: '📝 Lý do', value: reason, inline: false }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Ban error:', error);
      return interaction.reply({
        content: '❌ Có lỗi xảy ra khi ban thành viên!',
        ephemeral: true
      });
    }
  },
};
