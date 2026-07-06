import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('nuke')
  .setDescription('Xóa toàn bộ kênh và tạo lại (Admin only)')
  .addStringOption(option =>
    option
      .setName('confirm')
      .setDescription('Gõ "CONFIRM" để xác nhận')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const confirm = interaction.options.getString('confirm', true);

  if (confirm !== 'CONFIRM') {
    await interaction.reply({
      content: '❌ Bạn phải gõ "CONFIRM" để xác nhận nuke kênh!',
      ephemeral: true
    });
    return;
  }

  const channel = interaction.channel;

  if (!channel) {
    await interaction.reply({
      content: '❌ Không thể xác định channel!',
      ephemeral: true
    });
    return;
  }

  // Check if channel type is supported
  if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildVoice) {
    await interaction.reply({
      content: '❌ Lệnh này chỉ dùng được cho text channel hoặc voice channel!',
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: '💣 Đang nuke kênh...',
    ephemeral: true
  });

  try {
    const position = channel.position;
    const parent = channel.parent;
    const permissions = channel.permissionOverwrites.cache;

    // Check if this is a community required channel
    const guild = channel.guild;
    const isCommunityChannel = 
      guild.rulesChannelId === channel.id || 
      guild.publicUpdatesChannelId === channel.id ||
      guild.safetyAlertsChannelId === channel.id;

    if (isCommunityChannel) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('❌ Không Thể Nuke Channel')
        .setDescription(
          `Channel này là **channel bắt buộc** cho Community Server:\n\n` +
          (guild.rulesChannelId === channel.id ? '• **Rules Channel** - Channel quy tắc\n' : '') +
          (guild.publicUpdatesChannelId === channel.id ? '• **Updates Channel** - Channel thông báo\n' : '') +
          (guild.safetyAlertsChannelId === channel.id ? '• **Safety Alerts** - Cảnh báo an toàn\n' : '') +
          `\n**Giải pháp:**\n` +
          `1. Tắt Community mode trong Server Settings\n` +
          `2. Hoặc thay đổi channel bắt buộc sang channel khác\n` +
          `3. Sau đó mới có thể nuke channel này`
        )
        .setFooter({ text: `Error Code: 50074` })
        .setTimestamp();

      return interaction.followUp({ embeds: [embed], ephemeral: true });
    }

    // Clone and delete the channel
    const newChannel = await channel.clone();
    await newChannel.setPosition(position);
    if (parent) await newChannel.setParent(parent);
    
    await channel.delete();

    // Send confirmation message
    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('💣 Kênh đã được Nuke')
      .setDescription(
        `**${channel.type === ChannelType.GuildVoice ? 'Voice channel' : 'Text channel'} này đã được nuke bởi ${interaction.user}**\n\n` +
        `${channel.type === ChannelType.GuildVoice ? 'Tất cả tin nhắn chat trong voice đã bị xóa.' : 'Tất cả tin nhắn cũ đã bị xóa.'}`
      )
      .setImage('https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif')
      .setFooter({
        text: `Nuke bởi ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    // For voice channels, try to send message to a system channel or the new channel if it's text
    if (channel.type === ChannelType.GuildVoice) {
      // Find system channel or any text channel to send notification
      const systemChannel = guild.systemChannel || guild.channels.cache.find(c => c.type === ChannelType.GuildText);
      if (systemChannel && systemChannel.type === ChannelType.GuildText) {
        await systemChannel.send({ embeds: [embed] });
      }
    } else {
      await newChannel.send({ embeds: [embed] });
    }
  } catch (error: any) {
    console.error('Lỗi khi nuke kênh:', error);
    
    // Handle specific Discord API errors
    if (error.code === 50074) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('❌ Lỗi: Channel Bắt Buộc')
        .setDescription(
          `Không thể xóa channel này vì nó là **channel bắt buộc** cho Community Server.\n\n` +
          `**Các channel bắt buộc:**\n` +
          `• Rules Channel (Quy tắc)\n` +
          `• Updates Channel (Thông báo)\n` +
          `• Safety Alerts (Cảnh báo)\n\n` +
          `**Cách fix:**\n` +
          `Vào **Server Settings** → **Enable Community** → Đổi channel bắt buộc sang channel khác.`
        )
        .setFooter({ text: `Discord API Error: ${error.code}` })
        .setTimestamp();

      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.followUp({ 
        content: `❌ Đã xảy ra lỗi: ${error.message || 'Unknown error'}`, 
        ephemeral: true 
      });
    }
  }

  return;
}
