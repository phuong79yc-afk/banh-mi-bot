import { Events, Guild, EmbedBuilder, ChannelType, Client } from 'discord.js';

export const name = Events.GuildCreate;
export const once = false;

export async function execute(guild: Guild, client: Client) {
  try {
    console.log(`✅ Bot đã được thêm vào server: ${guild.name} (${guild.id})`);
    console.log(`📊 Thành viên: ${guild.memberCount} | Owner: ${guild.ownerId}`);

    // Tìm channel để gửi welcome message
    let welcomeChannel = guild.channels.cache.find(
      ch => ch.type === ChannelType.GuildText && 
            (ch.name.includes('general') || ch.name.includes('chat') || ch.name.includes('welcome'))
    );

    // Nếu không tìm thấy, lấy channel text đầu tiên mà bot có quyền gửi tin
    if (!welcomeChannel) {
      welcomeChannel = guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildText && 
              ch.permissionsFor(client.user!)?.has(['SendMessages', 'ViewChannel'])
      );
    }

    if (!welcomeChannel || !welcomeChannel.isTextBased()) {
      console.log('⚠️ Không tìm thấy channel để gửi welcome message');
      return;
    }

    const botName = client.user?.username || 'Bot';
    const botAvatar = client.user?.avatarURL() || undefined;

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0xff1744)
      .setTitle('🎉 Cảm ơn đã thêm tôi vào server!')
      .setDescription(
        `Xin chào **${guild.name}**! Tôi là **${botName}** - Bot Discord đa năng với đầy đủ tính năng.\n\n` +
        `**✨ Tính năng chính:**\n` +
        `🛡️ **Quản lý & Bảo mật** - Auto-mod, anti-raid, anti-spam\n` +
        `🎵 **Phát nhạc** - YouTube, Spotify, SoundCloud\n` +
        `📊 **Level System** - XP tự động, rank cards\n` +
        `💰 **Economy** - Tiền ảo, shop, casino, games\n` +
        `🎫 **Ticket System** - Support chuyên nghiệp\n` +
        `👋 **Welcome & Roles** - Tự động chào mừng, auto-roles\n\n` +
        `**Bắt đầu ngay:** \`/help\` để xem tất cả lệnh!`
      )
      .addFields(
        { 
          name: '⚡ Quick Start', 
          value: '`/help` - Xem lệnh\n`/setup` - Thiết lập\n`/config` - Cấu hình', 
          inline: true 
        },
        { 
          name: '🔗 Links', 
          value: '[Website](http://localhost:3001) • [Docs](http://localhost:3001/docs) • [Support](https://discord.gg/support)', 
          inline: true 
        }
      )
      .setThumbnail(botAvatar || null)
      .setFooter({ 
        text: `${botName} • Made with ❤️ in Vietnam`, 
        iconURL: botAvatar 
      })
      .setTimestamp();

    await welcomeChannel.send({ 
      content: `👋 Xin chào! Cảm ơn <@${guild.ownerId}> đã mời tôi!`,
      embeds: [welcomeEmbed] 
    });

    // Gửi DM cho owner
    try {
      const owner = await guild.fetchOwner();
      const dmEmbed = new EmbedBuilder()
        .setColor(0xff1744)
        .setTitle(`🎉 ${botName} đã join ${guild.name}!`)
        .setDescription(
          `Cảm ơn bạn đã thêm bot vào server!\n\n` +
          `**⚡ Các lệnh cơ bản:**\n` +
          `• \`/help\` - Xem tất cả lệnh\n` +
          `• \`/setup\` - Thiết lập tự động\n` +
          `• \`/config\` - Cấu hình bot\n\n` +
          `Cần hỗ trợ? Join [Discord Support](https://discord.gg/support)!`
        )
        .setThumbnail(botAvatar || null)
        .setFooter({ text: botName, iconURL: botAvatar })
        .setTimestamp();

      await owner.send({ embeds: [dmEmbed] });
      console.log(`📧 Đã gửi DM cho owner: ${owner.user.tag}`);
    } catch (dmError) {
      console.log('⚠️ Không thể gửi DM cho owner (có thể đã tắt DM)');
    }

  } catch (error) {
    console.error('❌ Lỗi khi xử lý guildCreate event:', error);
  }
}
