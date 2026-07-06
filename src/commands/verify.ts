import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits,
  Role,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction
} from 'discord.js';
import { createEmbed, CustomEmbedBuilder, BotIcons } from '../utils/embedBuilder';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Xác minh người dùng trong server')
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('Xác minh một người dùng')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng cần xác minh')
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Role sẽ được gán sau khi xác minh')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Thiết lập hệ thống xác minh tự động')
        .addRoleOption(option =>
          option
            .setName('verified-role')
            .setDescription('Role được gán khi xác minh')
            .setRequired(true)
        )
        .addChannelOption(option =>
          option
            .setName('verify-channel')
            .setDescription('Kênh để xác minh')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('lockdown')
        .setDescription('Khóa tất cả kênh, chỉ người có role xác minh mới xem được')
        .addRoleOption(option =>
          option
            .setName('verified-role')
            .setDescription('Role xác minh (người có role này sẽ thấy kênh)')
            .setRequired(true)
        )
        .addChannelOption(option =>
          option
            .setName('verify-channel')
            .setDescription('Kênh xác minh (kênh này sẽ public cho mọi người)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Gỡ xác minh của người dùng')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng cần gỡ xác minh')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'user') {
      await handleVerifyUser(interaction);
    } else if (subcommand === 'setup') {
      await handleSetup(interaction);
    } else if (subcommand === 'lockdown') {
      await handleLockdown(interaction);
    } else if (subcommand === 'remove') {
      await handleRemoveVerification(interaction);
    }
  },

  // Handler cho button verify
  async handleVerifyButton(interaction: ButtonInteraction, roleId: string) {
    await interaction.deferReply({ ephemeral: true });

    const member = interaction.member as GuildMember;
    if (!member) {
      await interaction.editReply('❌ Không thể xác minh!');
      return;
    }

    // Kiểm tra đã có role chưa
    if (member.roles.cache.has(roleId)) {
      await interaction.editReply('✅ Bạn đã được xác minh rồi!');
      return;
    }

    try {
      const role = await interaction.guild?.roles.fetch(roleId);
      if (!role) {
        await interaction.editReply('❌ Không tìm thấy role xác minh!');
        return;
      }

      await member.roles.add(role);

      const embed = createEmbed.success(
        'Xác Minh Thành Công!',
        `Bạn đã nhận role ${role}\n\n` +
        `Giờ bạn có thể truy cập tất cả các kênh trong server!`
      );

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in verify button:', error);
      await interaction.editReply('❌ Không thể xác minh. Vui lòng liên hệ Admin!');
    }
  },
};

async function handleVerifyUser(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser('user');
  const verifiedRole = interaction.options.getRole('role') as Role | null;

  if (!targetUser) {
    await interaction.editReply('❌ Không tìm thấy người dùng!');
    return;
  }

  const member = interaction.guild?.members.cache.get(targetUser.id);
  if (!member) {
    await interaction.editReply('❌ Người dùng không trong server!');
    return;
  }

  try {
    // Nếu có role được chỉ định, gán role đó
    if (verifiedRole) {
      await member.roles.add(verifiedRole);
    } else {
      // Tìm role "Verified" mặc định
      const defaultVerifiedRole = interaction.guild?.roles.cache.find(
        role => role.name.toLowerCase() === 'verified' || role.name.toLowerCase() === 'xác minh'
      );
      
      if (defaultVerifiedRole) {
        await member.roles.add(defaultVerifiedRole);
      }
    }

    const embed = new CustomEmbedBuilder()
      .setSuccess('Xác Minh Thành Công', `${targetUser} đã được xác minh!`)
      .addIconField(BotIcons.user, 'Người dùng', `${targetUser.tag}`, true)
      .addIconField(BotIcons.shield, 'Role', verifiedRole ? verifiedRole.name : 'Verified (mặc định)', true)
      .addIconField(BotIcons.settings, 'Xác minh bởi', `${interaction.user.tag}`, true)
      .setBotFooter(`User ID: ${targetUser.id}`);

    await interaction.editReply({ embeds: [embed] });

    // Gửi DM cho người được xác minh
    try {
      await targetUser.send({
        embeds: [
          createEmbed.success(
            'Bạn Đã Được Xác Minh',
            `Bạn đã được xác minh trong server **${interaction.guild?.name}**!\n\n` +
            `Giờ bạn có thể truy cập tất cả các kênh.`
          )
        ]
      });
    } catch (error) {
      // Người dùng tắt DM
    }

  } catch (error) {
    console.error('Error verifying user:', error);
    await interaction.editReply('❌ Không thể xác minh người dùng. Kiểm tra quyền của bot!');
  }
}

async function handleSetup(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const verifiedRole = interaction.options.getRole('verified-role') as Role | null;
  const verifyChannel = interaction.options.getChannel('verify-channel');

  if (!verifiedRole) {
    await interaction.editReply('❌ Vui lòng chọn role xác minh!');
    return;
  }

  const setupEmbed = new CustomEmbedBuilder()
    .setInfo('Thiết Lập Hệ Thống Xác Minh', 'Hệ thống xác minh đã được cấu hình!')
    .addIconField(BotIcons.shield, 'Role Xác Minh', `${verifiedRole}`, true)
    .addIconField(BotIcons.pin, 'Kênh Xác Minh', verifyChannel ? `${verifyChannel}` : 'Không thiết lập', true);

  await interaction.editReply({ embeds: [setupEmbed] });

  // Tạo message xác minh trong channel nếu có
  if (verifyChannel) {
    const guildIcon = interaction.guild?.iconURL();
    
    const verifyEmbed = new CustomEmbedBuilder()
      .setSuccess('Xác Minh Tài Khoản', 
        `**Chào mừng đến với ${interaction.guild?.name}!** ${BotIcons.tada}\n\n` +
        `Nhấn nút bên dưới để xác minh và truy cập các kênh khác.\n\n` +
        `${BotIcons.arrow} Role sau khi xác minh: ${verifiedRole}`
      )
      .setThumbnailSafe(guildIcon);

    // Tạo button xác minh
    const verifyButton = new ButtonBuilder()
      .setCustomId(`verify_button_${verifiedRole.id}`)
      .setLabel('✅ Xác Minh')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(verifyButton);

    try {
      const channel = await interaction.guild?.channels.fetch(verifyChannel.id);
      if (channel && channel.isTextBased()) {
        await channel.send({ 
          embeds: [verifyEmbed],
          components: [row]
        });
      }
    } catch (error) {
      console.error('Cannot send message to verify channel:', error);
    }
  }
}

async function handleLockdown(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const verifiedRole = interaction.options.getRole('verified-role') as Role | null;
  const verifyChannel = interaction.options.getChannel('verify-channel');

  if (!verifiedRole || !verifyChannel) {
    await interaction.editReply('❌ Vui lòng chọn đầy đủ role và kênh xác minh!');
    return;
  }

  try {
    let processed = 0;
    let skipped = 0;
    const channels = await interaction.guild?.channels.fetch();

    if (!channels) {
      await interaction.editReply('❌ Không thể lấy danh sách kênh!');
      return;
    }

    await interaction.editReply('🔄 Đang cấu hình quyền cho tất cả kênh... Vui lòng đợi!');

    for (const [channelId, channel] of channels) {
      if (!channel || channel.isThread()) {
        skipped++;
        continue;
      }

      try {
        // Nếu là kênh xác minh, cho @everyone xem
        if (channelId === verifyChannel.id) {
          await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
            ViewChannel: true,
            SendMessages: false,
            AddReactions: false
          });
          processed++;
        } else {
          // Các kênh khác: ẩn với @everyone, hiện với verified role
          await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
            ViewChannel: false
          });
          await channel.permissionOverwrites.edit(verifiedRole, {
            ViewChannel: true
          });
          processed++;
        }
      } catch (error) {
        console.error(`Cannot edit permissions for channel ${channel.name}:`, error);
        skipped++;
      }
    }

    const embed = new CustomEmbedBuilder()
      .setSuccess('Lockdown Hoàn Thành',
        `**Hệ thống xác minh đã được cấu hình!**\n\n` +
        `${BotIcons.check} Tất cả kênh đã bị khóa\n` +
        `${BotIcons.check} Chỉ người có role xác minh mới xem được\n` +
        `${BotIcons.check} Kênh ${verifyChannel} vẫn public để xác minh`
      )
      .addIconField(BotIcons.shield, 'Role Xác Minh', `${verifiedRole}`, true)
      .addIconField(BotIcons.pin, 'Kênh Xác Minh', `${verifyChannel}`, true)
      .addIconField(BotIcons.stats, 'Thống Kê', `Đã xử lý: ${processed}\nBỏ qua: ${skipped}`, false);

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error in lockdown:', error);
    await interaction.editReply('❌ Có lỗi xảy ra khi cấu hình quyền!');
  }
}

async function handleRemoveVerification(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser('user');

  if (!targetUser) {
    await interaction.editReply('❌ Không tìm thấy người dùng!');
    return;
  }

  const member = interaction.guild?.members.cache.get(targetUser.id);
  if (!member) {
    await interaction.editReply('❌ Người dùng không trong server!');
    return;
  }

  try {
    // Tìm và gỡ role verified
    const verifiedRole = interaction.guild?.roles.cache.find(
      role => role.name.toLowerCase() === 'verified' || role.name.toLowerCase() === 'xác minh'
    );

    if (verifiedRole && member.roles.cache.has(verifiedRole.id)) {
      await member.roles.remove(verifiedRole);
    }

    const embed = new CustomEmbedBuilder()
      .setError('Gỡ Xác Minh', `Đã gỡ xác minh của ${targetUser}!`)
      .addIconField(BotIcons.user, 'Người dùng', `${targetUser.tag}`, true)
      .addIconField(BotIcons.settings, 'Gỡ bởi', `${interaction.user.tag}`, true);

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error removing verification:', error);
    await interaction.editReply('❌ Không thể gỡ xác minh. Kiểm tra quyền của bot!');
  }
}
