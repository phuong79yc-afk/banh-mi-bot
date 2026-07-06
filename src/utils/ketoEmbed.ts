import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export interface TikTokData {
  username: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  videoUrl: string;
  thumbnailUrl: string;
  author: string;
  musicTitle?: string;
  downloadUrl?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 10000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  // For numbers < 10K, show exact number (like Bot Keto)
  return num.toString();
}

// Create Keto-style embed (exact match to Bot Keto)
export function createKetoStyleEmbed(data: TikTokData, videoUrl?: string) {
  const tiktokIcon = 'https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/tiktok/webapp/main/webapp-desktop/8152caf0c8e8bc67ae0d.png';
  
  // Format caption - remove excessive emojis/newlines
  const cleanCaption = data.caption.trim().substring(0, 200);
  
  const embed = new EmbedBuilder()
    .setColor(0x000000) // Black like Bot Keto
    .setAuthor({ 
      name: `🎵 ${data.author || data.username} (@${data.username})`,
      iconURL: tiktokIcon,
      url: data.videoUrl
    })
    .setDescription(
      `${cleanCaption}\n\n` +
      `[Open in TikTok](${data.videoUrl}) • [Get Keto+](https://www.keto.boats/)\n\n` +
      `❤️ ${formatNumber(data.likes)}  💬 ${formatNumber(data.comments)}  ↗️ ${formatNumber(data.shares)}`
    )
    .setFooter({ 
      text: 'TikTok', 
      iconURL: tiktokIcon 
    })
    .setTimestamp();
  
  // Don't set image in embed - let Discord render video attachment separately
  // This is the closest we can get to Bot Keto without Discord partnership
  
  // 2 rows of buttons (exact match to Bot Keto in image)
  const row1 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Open in TikTok')
        .setStyle(ButtonStyle.Link)
        .setURL(data.videoUrl),
      new ButtonBuilder()
        .setLabel('Get Keto+')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.keto.boats/')
    );
  
  const row2 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel(`@${data.username}`)
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`tiktok_user_${Date.now()}`)
        .setDisabled(true),
      new ButtonBuilder()
        .setLabel('i')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`tiktok_info_${Date.now()}`),
      new ButtonBuilder()
        .setLabel('Transcript')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`tiktok_transcript_${Date.now()}`)
    );
  
  return { embed, components: [row1, row2] };
}
