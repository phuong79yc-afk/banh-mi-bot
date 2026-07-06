import { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
import { generateHTMLTranscript } from './transcriptGenerator';
import { saveTranscript } from './transcriptStorage';

// Hàm xử lý chọn loại ticket từ dropdown
export async function handleTicketSelect(interaction: any, client: Client): Promise<void> {
  const { guild, user, customId, values } = interaction;
  
  if (!guild) {
    await interaction.reply({
      content: 'Không thể tạo ticket!',
      ephemeral: true
    });
    return;
  }

  const ticketType = values[0];
  const categoryId = customId.split('_')[2];
  const category = categoryId !== 'none' ? guild.channels.cache.get(categoryId) : null;

  const typeEmojis: { [key: string]: string } = {
    general: '💬',
    bug: '🐛',
    report: '⚠️',
    suggestion: '💡',
    other: '❓'
  };

  const typeNames: { [key: string]: string } = {
    general: 'Hỗ trợ chung',
    bug: 'Báo cáo lỗi',
    report: 'Khiếu nại',
    suggestion: 'Đề xuất',
    other: 'Khác'
  };

  // Check if user already has a ticket
  const existingTicket = guild.channels.cache.find(
    (ch: any) => ch.name === `ticket-${user.username.toLowerCase()}` && ch.type === 0
  );

  if (existingTicket) {
    await interaction.reply({
      content: `Bạn đã có ticket mở: ${existingTicket}`,
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: 0,
      parent: category?.id || null,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['ViewChannel']
        },
        {
          id: user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles']
        },
        {
          id: client.user!.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageChannels']
        }
      ]
    });

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`${typeEmojis[ticketType]} ⸻ ${typeNames[ticketType].toUpperCase()} ⸻ ${typeEmojis[ticketType]}`)
      .setDescription(
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  **Xin chào ${user}!**\n` +
        `┃  Cảm ơn bạn đã tạo ticket\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        
        `> 📋 **Loại ticket:** ${typeNames[ticketType]}\n` +
        `> ⏰ **Thời gian tạo:** <t:${Math.floor(Date.now() / 1000)}:R>\n` +
        `> 🎯 **Trạng thái:** Đang chờ staff\n\n` +
        
        `**┌─── 📝 HƯỚNG DẪN ───┐**\n` +
        `**│** \`1.\` Mô tả rõ vấn đề\n` +
        `**│** \`2.\` Cung cấp thông tin chi tiết\n` +
        `**│** \`3.\` Đợi staff phản hồi\n` +
        `**│** \`4.\` Đóng ticket khi xong\n` +
        `**└──────────────────┘**\n\n` +
        
        `⚡ **Staff sẽ hỗ trợ bạn sớm nhất!**\n` +
        `🔒 **Đóng ticket:** Nhấn nút bên dưới`
      )
      .setThumbnail(user.displayAvatarURL())
      .setFooter({
        text: `Ticket ID: ${ticketChannel.id} • ${typeNames[ticketType]}`,
        iconURL: guild.iconURL() || undefined
      })
      .setTimestamp();

    const closeButton = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Đóng Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

    await ticketChannel.send({
      content: `${user} | Staff sẽ hỗ trợ bạn sớm`,
      embeds: [welcomeEmbed],
      components: [closeButton]
    });

    await interaction.editReply({
      content: `Ticket của bạn đã được tạo: ${ticketChannel}`
    });

  } catch (error) {
    console.error('Lỗi khi tạo ticket:', error);
    await interaction.editReply({
      content: 'Không thể tạo ticket. Vui lòng thử lại sau!'
    });
  }
}

// Hàm xử lý đóng ticket từ button
export async function handleTicketClose(interaction: any): Promise<void> {
  const channel = interaction.channel;

  if (!channel.name.startsWith('ticket-')) {
    await interaction.reply({
      content: 'Lệnh này chỉ có thể dùng trong kênh ticket!',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();

  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const messageArray = Array.from(messages.values()) as any[];

    const ticketOwnerName = channel.name.replace('ticket-', '');
    const ticketOwner = interaction.guild?.members.cache.find(
      (m: any) => m.user.username.toLowerCase() === ticketOwnerName.toLowerCase()
    );

    const htmlTranscript = generateHTMLTranscript(
      messageArray,
      channel.name,
      channel.id,
      interaction.user,
      'Đóng bởi button',
      interaction.guild,
      ticketOwner?.user || null
    );

    const buffer = Buffer.from(htmlTranscript, 'utf-8');
    const transcriptUrl = saveTranscript(htmlTranscript, channel.name);
    const fullUrl = `http://localhost:3001${transcriptUrl}`;

    const transcriptEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('Lịch sử Ticket')
      .setDescription(
        `**Ticket của bạn đã được đóng**\n\n` +
        `**Ticket:** ${channel.name}\n` +
        `**Đóng bởi:** ${interaction.user.tag}\n` +
        `**Tổng tin nhắn:** ${messageArray.length}\n\n` +
        `📄 **Xem trực tiếp:** [Click để xem](${fullUrl})\n` +
        `💾 File HTML đính kèm bên dưới`
      )
      .setThumbnail(interaction.guild?.iconURL() || null)
      .setFooter({
        text: `Ticket ID: ${channel.id}`,
        iconURL: interaction.guild?.iconURL() || undefined
      })
      .setTimestamp();

    // Send to ticket owner
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

    // Send to log channel
    const logChannel = interaction.guild?.channels.cache.find(
      (ch: any) => ch.name === 'ticket-logs' && ch.type === ChannelType.GuildText
    );

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
      .setTitle('Đóng Ticket')
      .setDescription(
        `**Ticket đang được đóng...**\n\n` +
        `**Đóng bởi:** ${interaction.user.tag}\n` +
        `**Tin nhắn đã lưu:** ${messageArray.length}\n\n` +
        `**Lịch sử đã được gửi đến:**\n` +
        `${ticketOwner ? `✅ ${ticketOwner.user.tag} (DM)` : '❌ Không tìm thấy ticket owner'}\n` +
        `${logChannel ? `✅ ${logChannel} (Log channel)` : '❌ Không có log channel'}\n\n` +
        `Kênh sẽ bị xóa sau **10 giây**...`
      )
      .setFooter({
        text: `Ticket ID: ${channel.id}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [closeEmbed] });

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
