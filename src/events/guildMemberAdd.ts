import { Events, GuildMember, EmbedBuilder, ChannelType, Client } from 'discord.js';
import { antiRaidSystem } from '../utils/antiRaid';

export const name = Events.GuildMemberAdd;
export const once = false;

export async function execute(member: GuildMember, client: Client) {
  try {
    // Anti-Raid check
    await antiRaidSystem.handleMemberJoin(member, client);
    
    // Nếu đang trong raid mode, không gửi welcome message
    if (antiRaidSystem.isInRaidMode()) {
      return;
    }
    // Tìm channel welcome hoặc general
    let welcomeChannel = member.guild.channels.cache.find(
      ch => ch.type === ChannelType.GuildText && ch.name.includes('welcome')
    );
    
    if (!welcomeChannel) {
      welcomeChannel = member.guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildText && ch.name.includes('general')
      );
    }

    if (!welcomeChannel || !welcomeChannel.isTextBased()) return;

    const welcomeEmbed = new EmbedBuilder()
      .setColor('#5865f2')
      .setAuthor({ 
        name: `Chào mừng ${member.user.username}!`, 
        iconURL: member.user.avatarURL() || undefined 
      })
      .setDescription(
        `👋 Chào mừng bạn đến với **${member.guild.name}**!\n\n` +
        `Bạn là thành viên thứ **#${member.guild.memberCount}** của server.\n\n` +
        `Hãy đọc các quy tắc và thưởng thức cộng đồng của chúng tôi! 🎉`
      )
      .setThumbnail(member.user.avatarURL() || null)
      .addFields(
        { name: '👤 Tên', value: `\`${member.user.username}\``, inline: true },
        { name: '🆔 ID', value: `\`${member.user.id}\``, inline: true },
        { name: '📅 Tài Khoản Tạo', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`, inline: true }
      )
      .setFooter({ text: `${member.guild.name}`, iconURL: member.guild.iconURL() || undefined })
      .setTimestamp();

    await welcomeChannel.send({ embeds: [welcomeEmbed] });
  } catch (error) {
    console.error('Lỗi khi gửi welcome message:', error);
  }
}
