/**
 * Design Validator - Validates and auto-fixes server designs from AI or user imports
 */

import { ChannelType } from 'discord.js';

export interface DesignChannel {
  name: string;
  type?: number;
  emoji?: string;
}

export interface DesignCategory {
  name: string;
  emoji?: string;
  channels?: DesignChannel[];
}

export interface DesignRole {
  name: string;
  emoji?: string;
  color?: string;
  permissions?: any[];
}

export interface WelcomeDesign {
  title: string;
  description: string;
  color: string;
  thumbnail?: string;
  footer?: string;
}

export interface ServerDesign {
  serverName: string;
  categories: DesignCategory[];
  roles?: DesignRole[];
  welcome?: WelcomeDesign;
  goodbye?: WelcomeDesign;
}

export interface ValidationReport {
  themes: string[];
  fixes: string[];
  warnings: string[];
}

const VALID_TYPES = [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildStageVoice];

const THEMES = {
  // Gaming subcategories
  gaming: ['gaming', 'game', 'esport', 'gamer', 'tournament', 'lfg', 'scrim', 'clan', 'guild', 'pvp', 'pve', 'fps', 'moba', 'mmo'],
  minecraft: ['minecraft', 'survival', 'creative', 'build', 'block', 'craft', 'redstone'],
  roleplay: ['roleplay', 'rp', 'character', 'story', 'lore', 'fantasy'],
  fps: ['fps', 'shooter', 'csgo', 'valorant', 'cod', 'battlefield', 'warzone'],
  moba: ['moba', 'league', 'dota', 'lol', 'legends', 'arena'],
  esports: ['esport', 'tournament', 'competitive', 'pro', 'championship'],
  
  // Social & Community
  community: ['community', 'social', 'chat', 'general', 'off-topic', 'chill', 'hangout', 'lounge', 'friend', 'talk'],
  dating: ['dating', 'romance', 'relationship', 'love', 'meetup', 'singles'],
  meme: ['meme', 'funny', 'joke', 'humor', 'dank', 'shitpost'],
  vietnamese: ['viet', 'vietnam', 'tieng viet', 'vietnamese', 'vn'],
  
  // Education & Learning
  school: ['school', 'study', 'homework', 'education', 'learn', 'tutor', 'class', 'student', 'teacher', 'học', 'trường', 'lớp', 'bài tập'],
  study: ['study', 'homework', 'learning', 'tutorial', 'course'],
  english: ['english', 'learning', 'esl', 'language', 'grammar'],
  
  // Creative & Arts
  anime: ['anime', 'manga', 'otaku', 'weeb', 'episode', 'cosplay', 'waifu', 'husbando', 'shounen', 'seinen'],
  music: ['music', 'song', 'artist', 'producer', 'beat', 'karaoke', 'dj', 'remix', 'soundcloud', 'spotify', 'nhạc'],
  art: ['art', 'draw', 'design', 'paint', 'illustration', 'sketch', 'artist'],
  photography: ['photo', 'camera', 'photography', 'picture', 'shot'],
  streaming: ['streaming', 'stream', 'twitch', 'youtube', 'content', 'creator'],
  movie: ['movie', 'film', 'cinema', 'series', 'tv show', 'netflix'],
  
  // Tech & Business
  tech: ['code', 'programming', 'dev', 'tech', 'project', 'github', 'developer', 'coding', 'software', 'web', 'app', 'api'],
  crypto: ['crypto', 'bitcoin', 'nft', 'blockchain', 'defi', 'trading', 'token', 'coin', 'wallet', 'eth', 'btc'],
  business: ['business', 'startup', 'entrepreneur', 'company', 'work', 'office', 'team', 'project', 'meeting', 'doanh nghiệp'],
  
  // Lifestyle & Hobbies
  fitness: ['fitness', 'gym', 'workout', 'exercise', 'health', 'bodybuilding'],
  food: ['food', 'cooking', 'recipe', 'chef', 'culinary', 'baking'],
  travel: ['travel', 'trip', 'vacation', 'tour', 'adventure', 'explore'],
  sports: ['sport', 'football', 'basketball', 'soccer', 'athlete'],
  chess: ['chess', 'board', 'strategy', 'checkmate'],
  
  // Genre themes
  horror: ['horror', 'scary', 'spooky', 'creepy', 'terror'],
  fantasy: ['fantasy', 'magic', 'wizard', 'dragon', 'medieval'],
  scifi: ['scifi', 'sci-fi', 'space', 'robot', 'futuristic', 'alien'],
};

/** Detect themes from prompt */
export function detectThemes(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const detected: string[] = [];
  for (const [theme, keywords] of Object.entries(THEMES)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detected.push(theme);
    }
  }
  return detected.length ? detected : ['community'];
}

/** Build theme hint for AI prompt */
export function buildThemeHint(themes: string[]): string {
  if (!themes.length) return '';
  const hints = themes.map((t) => `${t.charAt(0).toUpperCase() + t.slice(1)} theme hints apply`).join(', ');
  return `DETECTED THEMES: ${hints}`;
}

/** Parse AI response and extract JSON */
export function parseAiJson(raw: string): any {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI không trả về JSON hợp lệ');
  return JSON.parse(match[0]);
}

/** Validate and auto-fix design */
export function validateDesign(
  raw: any,
  options: { mode: 'ai' | 'import'; themes?: string[] } = { mode: 'import' },
): { design: ServerDesign; report: ValidationReport } {
  const fixes: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object') {
    throw new Error('Design phải là object JSON');
  }

  if (!raw.serverName || typeof raw.serverName !== 'string') {
    throw new Error('Thiếu serverName');
  }

  if (!Array.isArray(raw.categories)) {
    throw new Error('Thiếu categories (phải là array)');
  }

  // Auto-fix invalid channel types
  for (const cat of raw.categories) {
    if (!cat.channels) continue;
    for (const ch of cat.channels) {
      if (ch.type && !VALID_TYPES.includes(ch.type)) {
        fixes.push(`Channel "${ch.name}" type ${ch.type} → Text (0)`);
        ch.type = ChannelType.GuildText;
      }
    }
  }

  // Auto-fix missing voice category
  const hasVoice = raw.categories.some((c: any) =>
    c.channels?.some((ch: any) => ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice),
  );
  if (!hasVoice) {
    fixes.push('Thêm Voice Channels category (thiếu voice)');
    raw.categories.push({
      name: 'VOICE CHANNELS',
      emoji: '🔊',
      channels: [
        { name: 'Voice Lobby', type: ChannelType.GuildVoice, emoji: '🎙️' },
        { name: 'General Voice', type: ChannelType.GuildVoice, emoji: '💬' },
        { name: 'AFK', type: ChannelType.GuildVoice, emoji: '💤' },
      ],
    });
  }

  // Auto-fix missing welcome
  const hasWelcome = raw.categories.some((c: any) => c.name.toUpperCase().includes('WELCOME'));
  if (!hasWelcome) {
    fixes.push('Thêm Welcome category');
    raw.categories.unshift({
      name: 'WELCOME',
      emoji: '👋',
      channels: [
        { name: 'welcome', type: ChannelType.GuildText, emoji: '👋' },
        { name: 'rules', type: ChannelType.GuildText, emoji: '📜' },
      ],
    });
  }

  return {
    design: raw as ServerDesign,
    report: {
      themes: options.themes || [],
      fixes,
      warnings,
    },
  };
}
