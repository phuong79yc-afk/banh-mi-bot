/**
 * Social Media Embed Fixer
 * Automatically fixes embeds for Twitter, TikTok, Instagram, Reddit, YouTube
 */

import { CUSTOM_EMOJI } from './customEmoji';

export interface EmbedFixResult {
  platform: string;
  originalUrl: string;
  fixedUrl: string;
  shouldReply: boolean;
  emoji: string;
}

const EMBED_PATTERNS = {
  // Twitter/X - Use fxtwitter or vxtwitter for better embeds
  twitter: {
    regex: /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/gi,
    fix: (url: string) => url.replace(/(twitter\.com|x\.com)/, 'fxtwitter.com'),
    name: 'Twitter/X',
    emoji: CUSTOM_EMOJI.INFO // Blue search icon
  },
  
  // TikTok - Use fxTikTok (alternative to vxtiktok)
  tiktok: {
    regex: /https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/[@\w\-\.\/]+/gi,
    fix: (url: string) => url.replace(/tiktok\.com/g, 'tnktok.com').replace(/vm\.tiktok\.com/g, 'vm.tnktok.com'), 
    name: 'TikTok',
    emoji: CUSTOM_EMOJI.MUSIC // Music note for TikTok
  },
  
  // Instagram - Use ddinstagram for better embeds
  instagram: {
    regex: /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w\-]+/gi,
    fix: (url: string) => url.replace('instagram.com', 'ddinstagram.com'),
    name: 'Instagram',
    emoji: CUSTOM_EMOJI.HEART // Heart for Instagram
  },
  
  // Reddit - Use rxddit for better video embeds
  reddit: {
    regex: /https?:\/\/(www\.)?reddit\.com\/r\/[\w\-]+\/comments\/[\w\-\/]+/gi,
    fix: (url: string) => url.replace('reddit.com', 'rxddit.com'),
    name: 'Reddit',
    emoji: CUSTOM_EMOJI.UTIL_AVATAR // Avatar icon for Reddit
  },
  
  // YouTube Shorts - Convert to regular YouTube for better playback
  youtubeShorts: {
    regex: /https?:\/\/(www\.)?youtube\.com\/shorts\/([\w\-]+)/gi,
    fix: (url: string) => {
      const match = url.match(/\/shorts\/([\w\-]+)/);
      if (match) {
        return `https://www.youtube.com/watch?v=${match[1]}`;
      }
      return url;
    },
    name: 'YouTube Shorts',
    emoji: CUSTOM_EMOJI.MUSIC_PLAY // Play icon for YouTube
  }
};

/**
 * Detect and fix social media URLs in a message
 */
export function detectAndFixEmbeds(content: string): EmbedFixResult[] {
  const results: EmbedFixResult[] = [];
  
  for (const [platform, config] of Object.entries(EMBED_PATTERNS)) {
    const matches = content.match(config.regex);
    
    if (matches) {
      for (const originalUrl of matches) {
        const fixedUrl = config.fix(originalUrl);
        
        // Only suggest fix if URL actually changed
        if (fixedUrl !== originalUrl) {
          results.push({
            platform: config.name,
            originalUrl,
            fixedUrl,
            shouldReply: true,
            emoji: config.emoji
          });
        }
      }
    }
  }
  
  return results;
}

/**
 * Format embed fix message for Discord
 */
export function formatEmbedFixMessage(fixes: EmbedFixResult[]): string {
  if (fixes.length === 0) return '';
  
  const lines = [`${CUSTOM_EMOJI.SPARKLES} **Link Embed Tốt Hơn:**\n`];
  
  for (const fix of fixes) {
    lines.push(`${fix.emoji} **${fix.platform}:** ${fix.fixedUrl}`);
  }
  
  lines.push(`\n${CUSTOM_EMOJI.INFO} *Mẹo: Dùng link này để xem video/hình ảnh đẹp hơn!*`);
  
  return lines.join('\n');
}

/**
 * Check if embed fixing is enabled for a guild
 */
export function isEmbedFixingEnabled(guildId: string): boolean {
  // TODO: Add guild settings to enable/disable
  // For now, always enabled
  return true;
}
