import { Message, EmbedBuilder } from 'discord.js';

/**
 * Advanced Scam Detection System
 * Detects MrBeast scams, suspicious links, and phishing attempts
 */

interface ScamPattern {
  type: 'mrbeast' | 'nitro' | 'steam' | 'phishing' | 'suspicious_link' | 'qr_code';
  keywords?: string[];
  urlPatterns?: RegExp[];
  severity: 'high' | 'medium' | 'low';
}

const SCAM_PATTERNS: ScamPattern[] = [
  // MrBeast Scams
  {
    type: 'mrbeast',
    keywords: [
      'mrbeast', 'mr beast', 'mr.beast',
      'giveaway', 'free money', 'prize',
      '$1000', '$10000', 'claim now',
      'limited time', 'click here',
      'congratulations', 'winner'
    ],
    urlPatterns: [
      /mrbeast.*\.com/i,
      /mrbe[a4]st/i,
      /giveaway.*\.xyz/i,
      /free.*money/i
    ],
    severity: 'high'
  },
  
  // Discord Nitro Scams
  {
    type: 'nitro',
    keywords: [
      'free nitro', 'nitro gift', 'discord gift',
      'claim nitro', 'get nitro'
    ],
    urlPatterns: [
      /d[i1]scord.*nitro/i,
      /n[i1]tro.*gift/i,
      /discord\.g[i1]ft/i,
      /d[i1][s5]c[o0]rd\.(com|gift)/i
    ],
    severity: 'high'
  },
  
  // Steam Scams
  {
    type: 'steam',
    keywords: [
      'steam gift', 'free steam', 'csgo skins',
      'vote for my team', 'steam trade'
    ],
    urlPatterns: [
      /st[e3][a4]m.*gift/i,
      /st[e3][a4]mcommunity/i,
      /cs.*go.*skins/i
    ],
    severity: 'high'
  },
  
  // Generic Phishing
  {
    type: 'phishing',
    keywords: [
      'verify account', 'suspended account',
      'click here to verify', 'confirm your identity',
      'urgent action required', 'limited offer'
    ],
    urlPatterns: [
      /bit\.ly/i,
      /tinyurl/i,
      /t\.co/i,
      /short.*link/i
    ],
    severity: 'medium'
  },
  
  // Suspicious Links
  {
    type: 'suspicious_link',
    urlPatterns: [
      /\.tk$/i,
      /\.ml$/i,
      /\.ga$/i,
      /\.cf$/i,
      /\.gq$/i,
      /\.xyz$/i,
      /\.top$/i,
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i, // IP addresses
      /discord.*nitro/i,
      /free.*gift/i
    ],
    severity: 'medium'
  },
  
  // QR Code Scams
  {
    type: 'qr_code',
    keywords: [
      'scan qr', 'qr code', 'scan this'
    ],
    severity: 'low'
  }
];

/**
 * Detect scam in message
 */
export function detectScam(message: Message): { detected: boolean; type?: string; severity?: string; reason?: string } {
  const content = message.content.toLowerCase();
  const hasAttachments = message.attachments.size > 0;
  const hasEmbeds = message.embeds.length > 0;
  
  // Check for suspicious attachments (images that might be fake MrBeast screenshots)
  if (hasAttachments) {
    for (const attachment of message.attachments.values()) {
      const filename = attachment.name?.toLowerCase() || '';
      
      // Suspicious filenames
      if (
        filename.includes('mrbeast') ||
        filename.includes('giveaway') ||
        filename.includes('prize') ||
        filename.includes('winner')
      ) {
        return {
          detected: true,
          type: 'mrbeast',
          severity: 'high',
          reason: 'Suspicious attachment filename detected'
        };
      }
    }
  }
  
  // Check content against patterns
  for (const pattern of SCAM_PATTERNS) {
    // Check keywords
    if (pattern.keywords) {
      const matchedKeywords = pattern.keywords.filter(keyword => 
        content.includes(keyword.toLowerCase())
      );
      
      // If multiple keywords match, it's likely a scam
      if (matchedKeywords.length >= 2) {
        return {
          detected: true,
          type: pattern.type,
          severity: pattern.severity,
          reason: `Multiple scam keywords detected: ${matchedKeywords.join(', ')}`
        };
      }
    }
    
    // Check URL patterns
    if (pattern.urlPatterns) {
      for (const urlPattern of pattern.urlPatterns) {
        if (urlPattern.test(content)) {
          return {
            detected: true,
            type: pattern.type,
            severity: pattern.severity,
            reason: 'Suspicious URL pattern detected'
          };
        }
      }
    }
  }
  
  // Check for @everyone/@here with links (common spam)
  if ((content.includes('@everyone') || content.includes('@here')) && 
      (content.includes('http://') || content.includes('https://'))) {
    return {
      detected: true,
      type: 'phishing',
      severity: 'high',
      reason: 'Mass ping with link (potential spam)'
    };
  }
  
  // Check embeds for suspicious content
  if (hasEmbeds) {
    for (const embed of message.embeds) {
      const embedText = (
        (embed.title || '') + ' ' +
        (embed.description || '') + ' ' +
        (embed.url || '')
      ).toLowerCase();
      
      if (embedText.includes('mrbeast') || 
          embedText.includes('free nitro') ||
          embedText.includes('giveaway')) {
        return {
          detected: true,
          type: 'mrbeast',
          severity: 'high',
          reason: 'Suspicious embed content detected'
        };
      }
    }
  }
  
  return { detected: false };
}

/**
 * Create scam alert embed
 */
export function createScamAlert(message: Message, detection: any): EmbedBuilder {
  const severityColors = {
    high: 0xff0000,    // Red
    medium: 0xff9900,  // Orange
    low: 0xffff00      // Yellow
  };
  
  const severityEmojis = {
    high: '🚨',
    medium: '⚠️',
    low: '⚡'
  };
  
  const typeNames = {
    mrbeast: '🎬 MrBeast Scam',
    nitro: '💎 Nitro Scam',
    steam: '🎮 Steam Scam',
    phishing: '🎣 Phishing',
    suspicious_link: '🔗 Suspicious Link',
    qr_code: '📱 QR Code Scam'
  };
  
  const emoji = severityEmojis[detection.severity as keyof typeof severityEmojis] || '⚠️';
  const typeName = typeNames[detection.type as keyof typeof typeNames] || '⚠️ Scam Detected';
  
  const embed = new EmbedBuilder()
    .setColor(severityColors[detection.severity as keyof typeof severityColors] || 0xff9900)
    .setTitle(`${emoji} SCAM DETECTED: ${typeName}`)
    .setDescription(
      `**User:** ${message.author.tag} (${message.author.id})\n` +
      `**Channel:** ${message.channel}\n` +
      `**Severity:** ${detection.severity.toUpperCase()}\n\n` +
      `**Reason:** ${detection.reason}\n\n` +
      `**Message Content:**\n` +
      `\`\`\`${message.content.substring(0, 500)}${message.content.length > 500 ? '...' : ''}\`\`\``
    )
    .setThumbnail(message.author.displayAvatarURL())
    .setFooter({ text: 'Scam Detection System • User has been removed' })
    .setTimestamp();
    
  if (message.attachments.size > 0) {
    embed.addFields({
      name: '📎 Attachments',
      value: Array.from(message.attachments.values())
        .map(a => `[${a.name}](${a.url})`)
        .join('\n')
        .substring(0, 1024)
    });
  }
  
  return embed;
}

/**
 * Get scam type description
 */
export function getScamDescription(type: string): string {
  const descriptions: Record<string, string> = {
    mrbeast: 'Fake MrBeast giveaway - These scams impersonate popular YouTuber MrBeast to steal accounts or money.',
    nitro: 'Fake Discord Nitro - Phishing links that steal your Discord account.',
    steam: 'Fake Steam gift/trade - Attempts to steal Steam accounts or items.',
    phishing: 'Phishing attempt - Tries to steal personal information or accounts.',
    suspicious_link: 'Suspicious link - Link from untrusted domain.',
    qr_code: 'QR code scam - May redirect to phishing sites.'
  };
  
  return descriptions[type] || 'Potential scam detected.';
}
