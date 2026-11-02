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

const THEMES: Record<string, string[]> = {
  gaming: ['gaming', 'game', 'esport', 'gamer', 'tournament', 'lfg', 'scrim', 'clan', 'guild', 'pvp', 'pve', 'fps', 'moba', 'mmo'],
  valorant: ['valorant', 'valo'],
  league: ['league of legends', 'league', 'lol'],
  dota: ['dota', 'dota2'],
  fortnite: ['fortnite'],
  pubg: ['pubg', 'battleground'],
  genshin: ['genshin impact', 'genshin'],
  roblox: ['roblox'],
  minecraft: ['minecraft', 'survival', 'creative', 'build', 'block', 'craft', 'redstone'],
  roleplay: ['roleplay', 'rp', 'character', 'story', 'lore', 'fantasy'],
  fps: ['fps', 'shooter', 'csgo', 'valorant', 'cod', 'battlefield', 'warzone'],
  moba: ['moba', 'league', 'dota', 'lol', 'legends', 'arena'],
  esports: ['esport', 'tournament', 'competitive', 'pro', 'championship'],
  community: ['community', 'social', 'chat', 'general', 'off topic', 'chill', 'hangout', 'lounge', 'friend', 'talk', 'cong dong', 'giao luu', 'tro chuyen', 'ban be'],
  dating: ['dating', 'romance', 'relationship', 'love', 'meetup', 'singles', 'hen ho', 'tinh yeu'],
  meme: ['meme', 'funny', 'joke', 'humor', 'dank', 'shitpost'],
  vietnamese: ['viet nam', 'tieng viet', 'vietnamese', 'vn'],
  cute: ['cute', 'adorable', 'de thuong', 'xinh xan'],
  kawaii: ['kawaii', 'moe'],
  pink: ['pink', 'mau hong', 'hong pastel'],
  pastel: ['pastel'],
  aesthetic: ['aesthetic', 'aesthetics', 'th am my'],
  soft: ['soft', 'softcore', 'soft aesthetic'],
  cottagecore: ['cottagecore', 'cottage core'],
  princess: ['princess', 'cong chua'],
  fairy: ['fairy', 'tien nu'],
  magical: ['magical', 'magic', 'phep thuat'],
  flower: ['flower', 'floral', 'hoa tuoi', 'vuon hoa', 'hoa sen', 'canh hoa'],
  angel: ['angel', 'thien than'],
  sparkle: ['sparkle', 'sparkly', 'lap lanh'],
  rainbow: ['rainbow', 'cau vong'],
  unicorn: ['unicorn', 'ky lan'],
  heart: ['heart', 'love', 'trai tim'],
  bunny: ['bunny', 'rabbit', 'tho'],
  cat: ['cat', 'kitty', 'meo'],
  girl: ['girl', 'girls', 'women', 'phu nu', 'con gai'],
  star: ['star theme', 'starry', 'stars', 'ngoi sao'],
  moon: ['moon theme', 'moonlight', 'mat trang'],
  discord: ['discord', 'discord server'],
  school: ['school', 'study', 'homework', 'education', 'learn', 'tutor', 'class', 'student', 'teacher', 'hoc tap', 'truong hoc', 'lop hoc', 'bai tap'],
  study: ['study', 'homework', 'learning', 'tutorial', 'course', 'hoc tap', 'on thi'],
  english: ['english', 'esl', 'language', 'grammar', 'tieng anh', 'hoc tieng anh'],
  anime: ['anime', 'manga', 'otaku', 'weeb', 'episode', 'cosplay', 'waifu', 'husbando', 'shounen', 'seinen'],
  music: ['music', 'song', 'artist', 'producer', 'beat', 'karaoke', 'dj', 'remix', 'soundcloud', 'spotify', 'nhac', 'ca hat'],
  art: ['art', 'draw', 'design', 'paint', 'illustration', 'sketch', 'artist', 'my thuat', 've tranh'],
  photography: ['photo', 'camera', 'photography', 'picture', 'shot', 'nhiep anh'],
  streaming: ['streaming', 'stream', 'twitch', 'content', 'creator'],
  movie: ['movie', 'film', 'cinema', 'series', 'tv show', 'netflix', 'phim'],
  tech: ['code', 'programming', 'dev', 'tech', 'project', 'github', 'developer', 'coding', 'software', 'web', 'app', 'api', 'lap trinh', 'cong nghe', 'phat trien phan mem'],
  crypto: ['crypto', 'bitcoin', 'nft', 'blockchain', 'defi', 'trading', 'token', 'coin', 'wallet', 'eth', 'btc'],
  business: ['business', 'startup', 'entrepreneur', 'company', 'work', 'office', 'team', 'project', 'meeting', 'doanh nghiep', 'kinh doanh'],
  fitness: ['fitness', 'gym', 'workout', 'exercise', 'health', 'bodybuilding', 'the hinh', 'tap gym'],
  food: ['food', 'cooking', 'recipe', 'chef', 'culinary', 'baking', 'nau an', 'mon an', 'am thuc'],
  travel: ['travel', 'trip', 'vacation', 'tour', 'adventure', 'explore', 'du lich'],
  sports: ['sport', 'football', 'basketball', 'soccer', 'athlete', 'the thao', 'bong da', 'bong ro'],
  chess: ['chess', 'board', 'strategy', 'checkmate', 'co vua'],
  pets: ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'animal', 'animals', 'thu cung', 'con cho', 'nuoi cho', 'con meo'],
  nature: ['nature', 'outdoor', 'hiking', 'camping', 'thien nhien', 'leo nui'],
  horror: ['horror', 'scary', 'spooky', 'creepy', 'terror', 'kinh di'],
  fantasy: ['fantasy', 'magic', 'wizard', 'dragon', 'medieval', 'ky ao'],
  scifi: ['scifi', 'sci fi', 'space', 'robot', 'futuristic', 'alien', 'khoa hoc vien tuong'],
  strategy: ['strategy', 'tactics', 'chien thuat'],
  kpop: ['kpop', 'k pop', 'korean pop'],
  jpop: ['jpop', 'j pop', 'japanese pop'],
  vocaloid: ['vocaloid', 'miku', 'hatsune'],
  rock: ['rock', 'metal', 'guitar'],
  hiphop: ['hip hop', 'hiphop', 'rap'],
  edm: ['edm', 'electronic music', 'dubstep', 'techno'],
  mmorpg: ['mmorpg', 'massively multiplayer'],
  rpg: ['rpg', 'role playing game'],
  sandbox: ['sandbox'],
  survival: ['survival', 'survival game', 'survival server', 'sinh ton'],
  design: ['design', 'graphic design', 'designer', 'thiet ke', 'do hoa'],
  writing: ['writing', 'writer', 'author', 'viet lach'],
  podcast: ['podcast'],
  youtube: ['youtube', 'youtuber'],
  tiktok: ['tiktok', 'tiktoker', 'short-form video', 'short video', 'video ngan'],
  fashion: ['fashion', 'style', 'clothing', 'thoi trang'],
  beauty: ['beauty', 'makeup', 'cosmetic', 'lam dep'],
  meditation: ['meditation', 'mindfulness', 'zen', 'thien dinh'],
  motivation: ['motivation', 'inspiration', 'self help', 'dong luc'],
  girlpower: ['girl power', 'women empowerment', 'nu quyen'],
  vintage: ['vintage', 'retro'],
};

const normalizeThemeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Detect whole words and phrases so short keywords do not match inside unrelated words. */
export function detectThemes(prompt: string): string[] {
  const normalizedPrompt = ` ${normalizeThemeText(prompt)} `;
  const detected: string[] = [];
  for (const [theme, keywords] of Object.entries(THEMES)) {
    if (keywords.some((keyword) => normalizedPrompt.includes(` ${normalizeThemeText(keyword)} `))) {
      detected.push(theme);
    }
  }
  return detected.length ? detected : ['community'];
}

const THEME_GUIDANCE: Record<string, string> = {
  gaming: 'Build around the named games, team-finding, match coordination, clips, events, and voice rooms.',
  valorant: 'Use Valorant-specific spaces for LFG, agents, maps, patch notes, clips, coaching, scrims, and team voice.',
  league: 'Use League of Legends spaces for roles, champions, patch notes, LFG, ranked teams, coaching, and esports.',
  dota: 'Use Dota-specific spaces for heroes, builds, patch notes, LFG, tournaments, coaching, and team voice.',
  fortnite: 'Use Fortnite-specific spaces for modes, squads, creative maps, updates, clips, tournaments, and voice.',
  pubg: 'Use PUBG-specific spaces for squad-finding, maps, loadouts, match clips, tournaments, and team voice.',
  genshin: 'Use Genshin-specific spaces for regions, characters, builds, co-op, events, lore, and help.',
  roblox: 'Use Roblox-specific spaces for games, experiences, development, group-finding, updates, and showcases.',
  minecraft: 'Focus on survival worlds, builds, redstone, resource sharing, realm announcements, and voice groups.',
  roleplay: 'Focus on character creation, lore, in-character scenes, story arcs, and roleplay coordination.',
  fps: 'Focus on specific shooters, squad-finding, aim/practice, match results, clips, and team voice rooms.',
  moba: 'Focus on the named MOBA, lanes/roles, team-finding, drafts, coaching, patches, and ranked play.',
  esports: 'Organize teams, tournaments, scrims, match schedules, results, recruitment, and fan discussion.',
  community: 'Create a social hub with introductions, topic-focused discussion, sharing, events, and support.',
  dating: 'Create respectful spaces for introductions, interests, conversation, events, and safety/moderation.',
  meme: 'Focus on meme sharing, original creations, reactions, and themed humor channels.',
  vietnamese: 'Use natural Vietnamese wording and preserve all Vietnamese diacritics in names and messages.',
  cute: 'Use gentle, playful decorations such as ♡, ୨୧, ʚɞ, pastel-style emoji, and soft friendly channel names.',
  kawaii: 'Use kawaii motifs such as ୨୧, ♡, ✿, cute emoji, and cheerful, gentle channel names.',
  pink: 'Use restrained pink and heart/flower motifs such as ♡, ❀, and 🌸 without over-decorating every name.',
  pastel: 'Use light, soft motifs such as ✿, ☁, and pastel-themed emoji with readable names.',
  aesthetic: 'Use clean decorative marks such as ✧, ⋆, and ◦ with consistent, minimal channel names.',
  soft: 'Use calm, gentle motifs such as ☁, ♡, and soft, welcoming channel names.',
  cottagecore: 'Use nature and cottage motifs such as ✿, ❀, leaves, gardens, and cozy channel names.',
  princess: 'Use elegant crown, sparkle, and ribbon motifs with graceful channel names.',
  fairy: 'Use light wing, flower, and sparkle motifs with whimsical but readable channel names.',
  magical: 'Use star, moon, and sparkle motifs with imaginative channel names.',
  flower: 'Use flower and garden motifs such as ✿ and ❀ with distinct channel names.',
  angel: 'Use gentle cloud, halo, and star motifs with calm channel names.',
  sparkle: 'Use a consistent sparkle motif such as ✦ or ✧ without repeating the same name.',
  rainbow: 'Use colorful rainbow and cloud motifs while keeping channel names distinct and readable.',
  unicorn: 'Use unicorn, star, and rainbow motifs with playful distinct channel names.',
  heart: 'Use heart motifs such as ♡ and ♥ sparingly with distinct channel names.',
  bunny: 'Use bunny, carrot, and soft flower motifs with cute distinct channel names.',
  cat: 'Use cat and paw motifs with playful distinct channel names.',
  school: 'Organize by subjects, classes, study groups, homework help, resources, announcements, and study voice rooms.',
  study: 'Focus on study sessions, notes/resources, questions, accountability, and quiet voice rooms.',
  english: 'Focus on language practice, vocabulary, grammar, writing feedback, speaking rooms, and resources.',
  anime: 'Focus on anime and manga discussion, recommendations, seasonal shows, fan art, and clearly marked spoilers.',
  music: 'Focus on genres, listening, releases, music creation, feedback, events, and listening voice rooms.',
  art: 'Focus on sharing work, works-in-progress, critique, resources, commissions, and creative collaboration.',
  photography: 'Focus on photo sharing, critique, techniques, equipment, editing, and themed challenges.',
  streaming: 'Focus on creator announcements, content planning, clips, collaborations, community chat, and voice rooms.',
  movie: 'Focus on films and series, recommendations, reviews, watch parties, and spoiler-separated discussion.',
  tech: 'Focus on the requested technology or programming stack, projects, Q&A, code review, resources, and collaboration.',
  crypto: 'Focus on project-specific news, research, market discussion, education, and scam-aware moderation.',
  business: 'Focus on the named industry, networking, collaboration, resources, opportunities, and professional events.',
  fitness: 'Focus on training plans, progress, nutrition, questions, accountability, and group challenges.',
  food: 'Focus on recipes, cooking techniques, meal ideas, food photos, reviews, and regional cuisine.',
  travel: 'Focus on destinations, itineraries, tips, trip planning, photos, and local recommendations.',
  sports: 'Focus on the named sport or teams, match discussion, schedules, results, training, and fan events.',
  chess: 'Focus on games, puzzles, openings, analysis, tournaments, coaching, and player matching.',
  pets: 'Focus on pet photos, care advice, species or breed channels, adoption, and community stories.',
  nature: 'Focus on outdoor activities, locations, safety, trip planning, wildlife, and shared experiences.',
  horror: 'Focus on horror media, scary stories, recommendations, watch parties, and spoiler-separated discussion.',
  fantasy: 'Focus on fantasy worlds, lore, characters, books/games, creative writing, and roleplay.',
  scifi: 'Focus on science fiction, space, robotics, worldbuilding, media discussion, and speculative ideas.',
  strategy: 'Focus on tactical planning, strategy discussion, analysis, guides, practice, and team coordination.',
  kpop: 'Focus on K-pop groups, releases, comebacks, fan projects, recommendations, and watch/listening events.',
  jpop: 'Focus on J-pop artists, releases, live events, recommendations, fan projects, and music discussion.',
  vocaloid: 'Focus on Vocaloid producers, songs, covers, software, fan art, and community projects.',
  rock: 'Focus on rock and metal genres, bands, releases, instruments, live shows, and music sharing.',
  hiphop: 'Focus on hip-hop and rap artists, releases, lyric discussion, beatmaking, cyphers, and events.',
  edm: 'Focus on electronic music genres, DJs, releases, production, mixes, festivals, and listening events.',
  discord: 'Create a Discord-community hub with onboarding, rules, announcements, topic channels, events, and voice.',
  mmorpg: 'Focus on guild recruitment, raids, builds, quests, trading, game updates, and party voice channels.',
  rpg: 'Focus on campaigns, characters, builds, quests, lore, party-finding, and game-specific discussion.',
  sandbox: 'Focus on player creations, building showcases, resources, collaboration, and community projects.',
  survival: 'Focus on survival gameplay, resources, bases, teams, progression, guides, and event coordination.',
  design: 'Focus on design portfolios, feedback, resources, tools, collaboration, and project showcases.',
  writing: 'Focus on writing prompts, works-in-progress, critique, publishing, resources, and writing sprints.',
  podcast: 'Focus on episodes, topics, guests, recording, promotion, feedback, and listener discussion.',
  youtube: 'Build a YouTube creator community with video announcements, ideas, scripts, production/editing help, thumbnail and title feedback, collaboration requests, audience discussion, and watch parties.',
  tiktok: 'Build a TikTok creator community around short-form vertical videos: trend and sound ideas, hooks and scripts, drafts, editing tips, feedback, creator collaborations, posting schedules, analytics, and live announcements.',
  fashion: 'Focus on outfits, trends, styling advice, inspiration, collections, and fashion discussion.',
  beauty: 'Focus on skincare, makeup, product advice, tutorials, reviews, and beauty routines.',
  meditation: 'Focus on guided practice, mindfulness, routines, resources, progress, and calm community spaces.',
  motivation: 'Focus on goals, accountability, progress, encouragement, habits, and personal development.',
  girl: 'Create a welcoming women-focused community with introductions, interests, events, support, and safety.',
  girlpower: 'Create an empowering women-focused community with achievement sharing, mentorship, support, and events.',
  vintage: 'Use a coherent retro/vintage identity with era-inspired channels, media, collections, and discussion.',
  star: 'Use a celestial star identity with astronomy, stargazing, space media, and themed community channels.',
  moon: 'Use a moon and night-sky identity with calm discussion, astronomy, night activities, and themed channels.',
};

/** Build concrete theme guidance for the AI prompt. */
export function buildThemeHint(themes: string[]): string {
  if (!themes.length) return '';
  const hints = themes.map((theme) => `- ${theme}: ${THEME_GUIDANCE[theme] ?? `Use channels and categories specific to ${theme}.`}`);
  return `DETECTED THEMES AND DESIGN GUIDANCE:\n${hints.join('\n')}`;
}

/** Parse AI response and extract JSON */
export function parseAiJson(raw: string): any {
  if (typeof raw !== 'string') {
    throw new Error('AI không trả về JSON hợp lệ');
  }

  const cleaned = raw.trim();
  const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : cleaned;

  const jsonLike = candidate.match(/\{[\s\S]*\}/);
  const payload = jsonLike ? jsonLike[0] : candidate;

  try {
    return JSON.parse(payload);
  } catch {
    throw new Error('AI không trả về JSON hợp lệ');
  }
}

function uniqueName(name: unknown, used: Set<string>): string {
  const base = (typeof name === 'string' && name.trim() ? name.trim() : 'Channel').slice(0, 100);
  const keyOf = (value: string) => normalizeThemeText(value);
  let candidate = base;
  let suffix = 2;

  while (used.has(keyOf(candidate))) {
    const tail = ` ${suffix++}`;
    candidate = `${base.slice(0, 100 - tail.length).trimEnd()}${tail}`;
  }

  used.add(keyOf(candidate));
  return candidate;
}

/** Validate and auto-fix design */
export function validateDesign(
  raw: any,
  options: { mode: 'ai' | 'import'; themes?: string[] } = { mode: 'import' },
): { design: ServerDesign; report: ValidationReport } {
  const fixes: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Design phải là object JSON');
  }

  if (!raw.serverName || typeof raw.serverName !== 'string') {
    throw new Error('Thiếu serverName');
  }

  if (!Array.isArray(raw.categories)) {
    throw new Error('Thiếu categories (phải là array)');
  }

  raw.categories = raw.categories.filter((item: any) => item && typeof item === 'object');

  for (const cat of raw.categories) {
    if (!cat || typeof cat !== 'object') continue;
    if (!Array.isArray(cat.channels)) {
      cat.channels = [];
      warnings.push(`Category "${String(cat.name ?? 'Unknown')}" thiếu channels`);
    }

    for (const ch of cat.channels ?? []) {
      if (!ch || typeof ch !== 'object') continue;
      if (ch.type !== undefined && ch.type !== null && !VALID_TYPES.includes(ch.type)) {
        fixes.push(`Channel "${String(ch.name ?? 'Unknown')}" type ${String(ch.type)} → Text (0)`);
        ch.type = ChannelType.GuildText;
      }
    }
  }

  // Auto-fix missing voice category
  const hasVoice = raw.categories.some((c: any) =>
    Array.isArray(c?.channels) && c.channels.some((ch: any) => ch?.type === ChannelType.GuildVoice || ch?.type === ChannelType.GuildStageVoice),
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
  const hasWelcome = raw.categories.some((c: any) => {
    const categoryName = typeof c?.name === 'string' ? c.name : '';
    return categoryName.toUpperCase().includes('WELCOME');
  });
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

  const categoryNames = new Set<string>();
  const channelNames = new Set<string>();
  for (const category of raw.categories) {
    if (!category || typeof category !== 'object') continue;

    const originalCategoryName = typeof category.name === 'string' && category.name.trim() ? category.name : 'Category';
    category.name = uniqueName(originalCategoryName, categoryNames);
    if (category.name !== originalCategoryName) {
      fixes.push(`Đổi tên category trùng "${originalCategoryName}" thành "${category.name}"`);
    }

    for (const channel of category.channels ?? []) {
      if (!channel || typeof channel !== 'object') continue;
      const originalChannelName = typeof channel.name === 'string' && channel.name.trim() ? channel.name : 'Channel';
      channel.name = uniqueName(originalChannelName, channelNames);
      if (channel.name !== originalChannelName) {
        fixes.push(`Đổi tên channel trùng "${originalChannelName}" thành "${channel.name}"`);
      }
    }
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
