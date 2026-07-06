import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
  CategoryChannel
} from 'discord.js';
import { generateHTMLTranscript } from '../utils/transcriptGenerator';
import { saveTranscript } from '../utils/transcriptStorage';

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Quản lý hệ thống ticket')
  .addSubcommand(subcommand =>
    subcommand
      .setName('setup')
      .setDescription('Thiết lập hệ thống ticket')
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('Kênh để gửi panel ticket')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
      .addChannelOption(option =>
        option
          .setName('category')
          .setDescription('Category để tạo ticket (tùy chọn)')
          .addChannelTypes(ChannelType.GuildCategory)
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('close')
      .setDescription('Đóng ticket hiện tại')
      .addStringOption(option =>
        option
          .setName('reason')
          .setDescription('Lý do đóng ticket')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('Thêm người vào ticket')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('Người dùng cần thêm')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Xóa người khỏi ticket')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('Người dùng cần xóa')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('claim')
      .setDescription('Nhận (claim) ticket để xử lý')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('unclaim')
      .setDescription('Từ chối (unclaim) ticket')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'setup') {
    await handleSetup(interaction);
  } else if (subcommand === 'close') {
    await handleClose(interaction);
  } else if (subcommand === 'add') {
    await handleAdd(interaction);
  } else if (subcommand === 'remove') {
    await handleRemove(interaction);
  } else if (subcommand === 'claim') {
    await handleClaim(interaction);
  } else if (subcommand === 'unclaim') {
    await handleUnclaim(interaction);
  }
}

async function handleSetup(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.options.getChannel('channel', true) as TextChannel;
  const category = interaction.options.getChannel('category') as CategoryChannel | null;

  // Create ticket panel embed with modern design
  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setTitle('🎫  ⸻  HỆ THỐNG HỖ TRỢ  ⸻  🎫')
    .setDescription(
      `┌─────────────────────────────────────┐\n` +
      `│ **Chào mừng đến với ${interaction.guild?.name}!**\n` +
      `│ Chọn loại hỗ trợ bạn cần từ menu bên dưới\n` +
      `└─────────────────────────────────────┘\n\n` +
      
      `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
      `┃  **📋 HƯỚNG DẪN SỬ DỤNG**\n` +
      `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `┃  \`1.\` Chọn loại ticket phù hợp\n` +
      `┃  \`2.\` Mô tả chi tiết vấn đề\n` +
      `┃  \`3.\` Đợi staff hỗ trợ\n` +
      `┃  \`4.\` Đóng ticket khi xong\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
      
      `> � **Hỗ trợ chung** - Câu hỏi và hỗ trợ thông thường\n` +
      `> 🐛 **Báo cáo lỗi** - Phát hiện bug hoặc lỗi hệ thống\n` +
      `> ⚠️ **Khiếu nại** - Báo cáo vi phạm hoặc người chơi\n` +
      `> 💡 **Đề xuất** - Ý tưởng cải thiện server\n` +
      `> ❓ **Khác** - Vấn đề không thuộc các loại trên\n\n` +
      
      `⚡ **Lưu ý:** Cung cấp thông tin đầy đủ để được hỗ trợ nhanh hơn!`
    )
    .setThumbnail(interaction.guild?.iconURL() || null)
    .setImage('https://i.imgur.com/5mDq1Fh.png')
    .setFooter({
      text: `${interaction.guild?.name} • Support Team`,
      iconURL: interaction.guild?.iconURL() || undefined
    })
    .setTimestamp();

  // Create dropdown menu for ticket types
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`ticket_select_${category?.id || 'none'}`)
    .setPlaceholder('Select a ticket type')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Hỗ trợ chung')
        .setDescription('Cần hỗ trợ về vấn đề chung')
        .setValue('general')
        .setEmoji('💬'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Báo cáo lỗi')
        .setDescription('Báo cáo lỗi hoặc bug')
        .setValue('bug')
        .setEmoji('🐛'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Khiếu nại')
        .setDescription('Khiếu nại về người chơi hoặc staff')
        .setValue('report')
        .setEmoji('⚠️'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Đề xuất')
        .setDescription('Đề xuất tính năng hoặc cải tiến')
        .setValue('suggestion')
        .setEmoji('💡'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Khác')
        .setDescription('Vấn đề khác')
        .setValue('other')
        .setEmoji('❓')
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(selectMenu);

  try {
    await channel.send({
      embeds: [embed],
      components: [row]
    });

    const successEmbed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('Thiết lập thành công')
      .setDescription(
        `**Hệ thống ticket đã được thiết lập!**\n\n` +
        `**Kênh:** ${channel}\n` +
        `**Category:** ${category || 'Mặc định'}\n\n` +
        `Người dùng có thể tạo ticket bằng cách chọn loại ticket trong ${channel}`
      )
      .setFooter({
        text: `Thiết lập bởi ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
  } catch (error) {
    await interaction.reply({
      content: 'Không thể thiết lập hệ thống ticket. Kiểm tra quyền của bot!',
      ephemeral: true
    });
  }
}

async function handleClose(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel;
  const reason = interaction.options.getString('reason') || 'Không có lý do';

  // Check if this is a ticket channel
  if (!channel.name.startsWith('ticket-')) {
    await interaction.reply({
      content: 'Lệnh này chỉ có thể dùng trong kênh ticket!',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();

  try {
    // Fetch all messages from the ticket
    const messages = await channel.messages.fetch({ limit: 100 });
    const messageArray = Array.from(messages.values());

    // Get ticket owner
    const ticketOwnerName = channel.name.replace('ticket-', '');
    const ticketOwner = interaction.guild?.members.cache.find(
      m => m.user.username.toLowerCase() === ticketOwnerName.toLowerCase()
    );

    // Generate HTML transcript
    const htmlTranscript = generateHTMLTranscript(
      messageArray,
      channel.name,
      channel.id,
      interaction.user,
      reason,
      interaction.guild,
      ticketOwner?.user || null
    );

    // Create buffer from HTML transcript
    const buffer = Buffer.from(htmlTranscript, 'utf-8');

    // Save transcript and get URL
    const transcriptUrl = saveTranscript(htmlTranscript, channel.name);
    const fullUrl = `http://localhost:3001${transcriptUrl}`;

    const transcriptEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📋 ⸻ LỊCH SỬ TICKET ⸻ 📋')
      .setDescription(
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  **Ticket đã được đóng và lưu trữ**\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `> 🎫 **Ticket:** \`${channel.name}\`\n` +
        `> 📊 **Tổng số tin nhắn:** \`${messageArray.length}\` tin nhắn\n` +
        `> 📝 **Lý do đóng:** ${reason}\n\n` +
        `**┌─────────────────────────────┐**\n` +
        `**│** [🌐 Xem lịch sử trực tuyến tại đây](${fullUrl})\n` +
        `**└─────────────────────────────┘**`
      )
      .addFields(
        {
          name: '👤 Chủ Ticket',
          value: ticketOwner ? `\`\`\`${ticketOwner.user.tag}\`\`\`` : '`Không xác định`',
          inline: true
        },
        {
          name: '🔒 Đóng Bởi',
          value: `\`\`\`${interaction.user.tag}\`\`\``,
          inline: true
        },
        {
          name: '⏰ Thời Gian',
          value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
          inline: true
        }
      )
      .setThumbnail(ticketOwner?.user.displayAvatarURL() || interaction.guild?.iconURL() || null)
      .setFooter({
        text: `Ticket ID: ${channel.id} • ${interaction.guild?.name}`,
        iconURL: interaction.guild?.iconURL() || undefined
      })
      .setTimestamp();

    // Try to send to ticket owner
    if (ticketOwner) {
      try {
        await ticketOwner.send({
          embeds: [transcriptEmbed],
          files: [{
            attachment: buffer,
            name: `ticket-${channel.name}-${Date.now()}.html`
          }]
        });
      } catch (error) {
        console.log('Không thể gửi transcript cho ticket owner (DM disabled)');
      }
    }

    // Send to a log channel if exists
    const logChannel = interaction.guild?.channels.cache.find(
      ch => ch.name === 'ticket-logs' && ch.type === ChannelType.GuildText
    ) as TextChannel;

    if (logChannel) {
      await logChannel.send({
        embeds: [transcriptEmbed],
        files: [{
          attachment: buffer,
          name: `ticket-${channel.name}-${Date.now()}.html`
        }]
      });
    }

    const closeEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🔒 ⸻ ĐÓNG TICKET ⸻ 🔒')
      .setDescription(
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  **Ticket đang được đóng...**\n` +
        `┃  Kênh sẽ bị xóa sau \`10 giây\`\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `> 👤 **Đóng bởi:** ${interaction.user}\n` +
        `> 💾 **Đã lưu:** \`${messageArray.length}\` tin nhắn\n` +
        `> 📝 **Lý do:** ${reason}\n\n` +
        `**┌─── 📤 Lịch Sử Đã Gửi Đến ───┐**\n` +
        `${ticketOwner ? `**│** ✅ ${ticketOwner.user.tag} (DM)\n` : `**│** ❌ Không tìm thấy owner\n`}` +
        `${logChannel ? `**│** ✅ ${logChannel} (Log)\n` : `**│** ❌ Không có log channel\n`}` +
        `**└────────────────────────────┘**`
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({
        text: `Ticket ID: ${channel.id} • Đang xóa kênh...`,
        iconURL: interaction.guild?.iconURL() || undefined
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [closeEmbed] });

    // Delete channel after 10 seconds
    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (error) {
        console.error('Không thể xóa kênh ticket:', error);
      }
    }, 10000);

  } catch (error) {
    console.error('Lỗi khi đóng ticket:', error);
    await interaction.editReply({
      content: 'Có lỗi xảy ra khi đóng ticket!'
    });
  }
}

async function handleAdd(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel;
  const user = interaction.options.getUser('user', true);

  if (!channel.name.startsWith('ticket-')) {
    await interaction.reply({
      content: 'Lệnh này chỉ có thể dùng trong kênh ticket!',
      ephemeral: true
    });
    return;
  }

  try {
    await channel.permissionOverwrites.create(user, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setDescription(`**${user} đã được thêm vào ticket bởi ${interaction.user}**`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await interaction.reply({
      content: 'Không thể thêm người dùng vào ticket!',
      ephemeral: true
    });
  }
}

async function handleRemove(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel;
  const user = interaction.options.getUser('user', true);

  if (!channel.name.startsWith('ticket-')) {
    await interaction.reply({
      content: 'Lệnh này chỉ có thể dùng trong kênh ticket!',
      ephemeral: true
    });
    return;
  }

  try {
    await channel.permissionOverwrites.delete(user);

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setDescription(`**${user} đã bị xóa khỏi ticket bởi ${interaction.user}**`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await interaction.reply({
      content: 'Không thể xóa người dùng khỏi ticket!',
      ephemeral: true
    });
  }
}

async function handleClaim(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel;

  if (!channel.name.startsWith('ticket-')) {
    await interaction.reply({
      content: '❌ Lệnh này chỉ có thể dùng trong kênh ticket!',
      ephemeral: true
    });
    return;
  }

  // Check if ticket is already claimed
  const topic = channel.topic || '';
  if (topic.includes('Claimed by:')) {
    const claimedBy = topic.match(/Claimed by: (.+?) \|/)?.[1];
    const claimedAt = topic.match(/at: (.+)$/)?.[1];
    
    const alreadyClaimedEmbed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('⚠️ ⸻ TICKET ĐÃ ĐƯỢC CLAIM ⸻ ⚠️')
      .setDescription(
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  **Ticket đang được xử lý**\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `> 👨‍💼 **Đang xử lý bởi:** \`${claimedBy}\`\n` +
        `> ⏰ **Claim lúc:** ${claimedAt ? `<t:${claimedAt}:R>` : '`Không rõ`'}\n` +
        `> 🎫 **Ticket:** \`${channel.name}\`\n\n` +
        `**┌────────────────────────────┐**\n` +
        `**│** ❌ Không thể claim ticket\n` +
        `**│** 💡 Liên hệ staff đang xử lý\n` +
        `**└────────────────────────────┘**`
      )
      .setFooter({
        text: `Request by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [alreadyClaimedEmbed], ephemeral: true });
    return;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Update channel topic to show who claimed and when
    await channel.setTopic(`Claimed by: ${interaction.user.tag} | Ticket ID: ${channel.id} | Claimed at: ${timestamp}`);

    // Update channel name to show claimed status
    if (!channel.name.includes('claimed')) {
      await channel.setName(`${channel.name}-claimed`);
    }

    // Pin claim message
    const claimEmbed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('✅ ⸻ TICKET ĐÃ ĐƯỢC CLAIM ⸻ ✅')
      .setDescription(
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  **Staff đã nhận xử lý ticket**\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `> 👨‍💼 **Staff phụ trách:** ${interaction.user} (\`${interaction.user.tag}\`)\n` +
        `> 🎫 **Ticket:** \`${channel.name}\`\n` +
        `> ⏰ **Thời gian claim:** <t:${timestamp}:F>\n` +
        `> 🕐 **Claim lúc:** <t:${timestamp}:R>\n` +
        `> 📊 **Trạng thái:** \`🟢 Đang xử lý\`\n\n` +
        `**╭─── 📋 THÔNG TIN CHO KHÁCH HÀNG ───╮**\n` +
        `**│** 👤 Staff này sẽ hỗ trợ bạn\n` +
        `**│** 📝 Vui lòng mô tả chi tiết vấn đề\n` +
        `**│** ⏱️ Thời gian phản hồi: < 5 phút\n` +
        `**│** 💬 Trả lời tin nhắn để tiếp tục\n` +
        `**╰───────────────────────────────╯**`
      )
      .addFields(
        {
          name: '🎯 Mức độ ưu tiên',
          value: '```Normal Priority```',
          inline: true
        },
        {
          name: '📞 Phương thức hỗ trợ',
          value: '```Text Support```',
          inline: true
        },
        {
          name: '⌛ SLA',
          value: '```< 24 hours```',
          inline: true
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({
        text: `Claimed by ${interaction.user.tag} • Staff Support Team`,
        iconURL: interaction.guild?.iconURL() || undefined
      })
      .setTimestamp();

    const message = await interaction.reply({ embeds: [claimEmbed] });
    
    // Pin the claim message for visibility
    try {
      const repliedMessage = await interaction.fetchReply();
      await repliedMessage.pin();
    } catch (pinError) {
      console.log('Không thể pin message claim');
    }

    // Log to ticket-logs if exists
    const logChannel = interaction.guild?.channels.cache.find(
      ch => ch.name === 'ticket-logs' && ch.type === ChannelType.GuildText
    ) as TextChannel;

    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor(0x57F287)
        .setAuthor({
          name: 'Ticket Claimed',
          iconURL: interaction.user.displayAvatarURL()
        })
        .setDescription(
          `**Staff:** ${interaction.user} (\`${interaction.user.tag}\`)\n` +
          `**Ticket:** ${channel} (\`${channel.name}\`)\n` +
          `**Time:** <t:${timestamp}:F>`
        )
        .setFooter({ text: `Ticket ID: ${channel.id}` })
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }

  } catch (error) {
    console.error('Lỗi khi claim ticket:', error);
    await interaction.reply({
      content: '❌ Không thể claim ticket! Vui lòng kiểm tra quyền của bot.',
      ephemeral: true
    });
  }
}

async function handleUnclaim(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel;

  if (!channel.name.startsWith('ticket-')) {
    await interaction.reply({
      content: '❌ Lệnh này chỉ có thể dùng trong kênh ticket!',
      ephemeral: true
    });
    return;
  }

  // Check if ticket is claimed
  const topic = channel.topic || '';
  if (!topic.includes('Claimed by:')) {
    const notClaimedEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('❌ ⸻ TICKET CHƯA ĐƯỢC CLAIM ⸻ ❌')
      .setDescription(
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  **Không thể unclaim**\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `> 🎫 **Ticket:** \`${channel.name}\`\n` +
        `> 📊 **Trạng thái:** \`⚪ Chưa được claim\`\n\n` +
        `**┌────────────────────────┐**\n` +
        `**│** ⚠️ Ticket này chưa có ai claim\n` +
        `**│** 💡 Sử dụng \`/ticket claim\` để nhận\n` +
        `**└────────────────────────┘**`
      )
      .setFooter({
        text: `Request by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [notClaimedEmbed], ephemeral: true });
    return;
  }

  // Check if user is the one who claimed
  const claimedBy = topic.match(/Claimed by: (.+?) \|/)?.[1];
  const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
  
  if (claimedBy !== interaction.user.tag && !isAdmin) {
    const noPermEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🚫 ⸻ KHÔNG CÓ QUYỀN ⸻ 🚫')
      .setDescription(
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  **Không đủ quyền unclaim**\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `> 👨‍💼 **Claimed bởi:** \`${claimedBy}\`\n` +
        `> 👤 **Bạn:** \`${interaction.user.tag}\`\n` +
        `> 🎫 **Ticket:** \`${channel.name}\`\n\n` +
        `**┌────────────────────────────┐**\n` +
        `**│** ❌ Chỉ staff đã claim hoặc Admin\n` +
        `**│** ❌ mới có thể unclaim ticket\n` +
        `**│** 💡 Liên hệ \`${claimedBy}\` hoặc Admin\n` +
        `**└────────────────────────────┘**`
      )
      .setFooter({
        text: `Request by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
    return;
  }

  // Defer reply at the START to prevent timeout
  await interaction.deferReply();

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const claimedAt = topic.match(/Claimed at: (.+)$/)?.[1];
    const claimDuration = claimedAt ? timestamp - parseInt(claimedAt) : 0;

    // Remove claim from channel topic
    await channel.setTopic(`Ticket ID: ${channel.id} | Unclaimed at: ${timestamp}`);

    // Remove -claimed from channel name if exists
    if (channel.name.includes('-claimed')) {
      const newName = channel.name.replace('-claimed', '');
      await channel.setName(newName);
    }

    const unclaimEmbed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('⚠️ ⸻ TICKET ĐÃ BỊ UNCLAIM ⸻ ⚠️')
      .setDescription(
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  **Staff đã bỏ xử lý ticket**\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `> 👨‍💼 **Unclaim bởi:** ${interaction.user} (\`${interaction.user.tag}\`)\n` +
        `> 📝 **Staff đã claim:** \`${claimedBy}\`\n` +
        `> ⏱️ **Thời gian đã claim:** \`${Math.floor(claimDuration / 60)} phút\`\n` +
        `> 🎫 **Ticket:** \`${channel.name}\`\n` +
        `> ⏰ **Unclaim lúc:** <t:${timestamp}:F>\n` +
        `> 📊 **Trạng thái:** \`⚪ Chờ claim\`\n\n` +
        `**╭─── 🔄 TICKET SẴN SÀNG CLAIM LẠI ───╮**\n` +
        `**│** 🟡 Ticket đã được unclaim\n` +
        `**│** 👥 Staff khác có thể claim\n` +
        `**│** ⏳ Đợi staff mới hỗ trợ\n` +
        `**│** 💬 Vui lòng kiên nhẫn đợi\n` +
        `**╰──────────────────────────────╯**`
      )
      .addFields(
        {
          name: '📊 Thống kê',
          value: `\`\`\`Thời gian claim: ${Math.floor(claimDuration / 60)} phút ${claimDuration % 60} giây\`\`\``,
          inline: true
        },
        {
          name: '🎯 Lý do',
          value: isAdmin && claimedBy !== interaction.user.tag 
            ? '```Admin Override```' 
            : '```Staff Request```',
          inline: true
        },
        {
          name: '🔄 Trạng thái',
          value: '```Available```',
          inline: true
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({
        text: `Unclaimed by ${interaction.user.tag} • Waiting for new staff`,
        iconURL: interaction.guild?.iconURL() || undefined
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [unclaimEmbed] });

    // Unpin previous claim messages (do this after reply to avoid timeout)
    try {
      const pinnedMessages = await channel.messages.fetchPinned();
      for (const [, message] of pinnedMessages) {
        if (message.author.id === interaction.client.user?.id && 
            message.embeds[0]?.title?.includes('CLAIM')) {
          await message.unpin();
        }
      }
    } catch (unpinError) {
      console.log('Không thể unpin messages:', unpinError);
    }

    // Log to ticket-logs if exists
    try {
      const logChannel = interaction.guild?.channels.cache.find(
        ch => ch.name === 'ticket-logs' && ch.type === ChannelType.GuildText
      ) as TextChannel;

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(0xFEE75C)
          .setAuthor({
            name: 'Ticket Unclaimed',
            iconURL: interaction.user.displayAvatarURL()
          })
          .setDescription(
            `**Staff:** ${interaction.user} (\`${interaction.user.tag}\`)\n` +
            `**Originally Claimed by:** \`${claimedBy}\`\n` +
            `**Ticket:** ${channel} (\`${channel.name}\`)\n` +
            `**Claim Duration:** \`${Math.floor(claimDuration / 60)}m ${claimDuration % 60}s\`\n` +
            `**Time:** <t:${timestamp}:F>`
          )
          .setFooter({ text: `Ticket ID: ${channel.id}` })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (logError) {
      console.log('Không thể gửi log:', logError);
    }

  } catch (error) {
    console.error('Lỗi khi unclaim ticket:', error);
    
    // Try to edit reply if deferred
    const errorMessage = '❌ Không thể unclaim ticket! Vui lòng kiểm tra quyền của bot.';
    
    try {
      await interaction.editReply({ content: errorMessage });
    } catch (replyError) {
      console.error('Không thể gửi error message:', replyError);
    }
  }
}
