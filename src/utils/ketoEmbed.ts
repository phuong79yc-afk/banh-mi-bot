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
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Create Keto-style embed (exact match to Bot Keto)
export function createKetoStyleEmbed(data: TikTokData, videoUrl?: string) {
  const tiktokIcon = 'https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/tiktok/webapp/main/webapp-desktop/8152caf0c8e8bc67ae0d.png';
  
  const embed = new EmbedBuilder()
    .setColor(0x000000) // Black like Bot Keto
    .setAuthor({ 
      name: `🎵 ${data.caption.substring(0, 150)}`,
      iconURL: tiktokIcon,
      url: data.videoUrl
    })
    .setDescription(
      `**[@${data.username}](${data.videoUrl})**\n\n` +
      `❤️ **${formatNumber(data.likes)}**  💬 **${formatNumber(data.comments)}**  ↗️ **${formatNumber(data.shares)}**`
    )
    .setImage(data.thumbnailUrl || videoUrl || '') // Use thumbnail (Discord only supports images in embed)
    .setFooter({ 
      text: 'TikTok', 
      iconURL: tiktokIcon 
    })
    .setTimestamp();
  
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
  
  // Add "Watch Video" button if we have Catbox URL
  const row2Components = [
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
  ];
  
  // If we have video URL, add "Watch Video" button at the beginning of row2
  if (videoUrl) {
    row2Components.unshift(
      new ButtonBuilder()
        .setLabel('▶️ Video HD')
        .setStyle(ButtonStyle.Link)
        .setURL(videoUrl)
    );
  }
  
  const row2 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(...row2Components.slice(0, 5)); // Max 5 buttons per row
  
  return { embed, components: [row1, row2] };
}
