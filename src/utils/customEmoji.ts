/**
 * Shared emoji aliases for command utilities.
 * Uses the server icon set for common bot statuses and Unicode elsewhere.
 */
import { emojis } from '../config/emojis';

export const CUSTOM_EMOJI = {
  // 🎵 Music Commands
  MUSIC: '🎵',
  MUSIC_PAUSE: '⏸️',
  MUSIC_PLAY: '▶️',
  MUSIC_SKIP: '⏭️',
  MUSIC_STOP: '⏹️',
  MUSIC_QUEUE: '📋',
  MUSIC_SHUFFLE: '🔀',
  MUSIC_LOOP: '🔁',
  MUSIC_VOLUME: '🔊',
  MUSIC_LYRICS: '📝',
  MUSIC_NOWPLAYING: '🎶',
  MUSIC_PREVIOUS: '⏮️',
  MUSIC_PREV: '⏮️',
  MUSIC_NOTE: '🎼',
  MUSIC_MIC: '🎤',
  
  // 🛡️ Moderation Commands
  MOD_BAN: '🔨',
  MOD_UNBAN: '🔓',
  MOD_KICK: '👢',
  MOD_MUTE: '🔇',
  MOD_UNMUTE: '🔊',
  MOD_WARN: '⚠️',
  MOD_LOCK: '🔒',
  MOD_UNLOCK: '🔓',
  MOD_TIMEOUT: '⏱️',
  MOD_NUKE: '💥',
  MOD_PURGE: '🗑️',
  MOD_SLOWMODE: '🐌',
  MOD_HAMMER: '🔨',
  MOD_SHIELD: '🛡️',
  
  // ✨ Status Indicators
  STATUS_SUCCESS: '✅',
  STATUS_ERROR: emojis.error,
  STATUS_LOADING: '⏳',
  STATUS_WARNING: '⚠️',
  SUCCESS: '✅',
  ERROR: emojis.error,
  LOADING: '⏳',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  CHECK: '✔️',
  CROSS: '❌',
  
  // 🎮 Utility Commands
  UTIL_HELP: '❓',
  UTIL_PING: '🏓',
  UTIL_STATS: '📊',
  UTIL_AVATAR: '🖼️',
  UTIL_SETTINGS: '⚙️',
  UTIL_INFO: 'ℹ️',
  UTIL_SEARCH: '🔍',
  UTIL_LINK: '🔗',
  
  // 💰 Economy Commands
  ECO_WALLET: '👛',
  ECO_COIN: '💸',
  ECO_GIFT: '🎁',
  ECO_SHOP: '🏪',
  ECO_DAILY: '📅',
  ECO_BANK: '🏦',
  ECO_MONEY: '💸',
  ECO_DIAMOND: '💎',
  ECO_GOLD: '🏅',
  ECO_MINUS: '➖',
  
  // 🎯 General Icons
  CROWN: '👑',
  HEART: '❤️',
  CALENDAR: '📅',
  CLOCK: '⏰',
  GLOBE: '🌍',
  CHART: '📈',
  COIN: '💸',
  GIFT: '🎁',
  ENVELOPE: '✉️',
  GEM: '💎',
  CONFETTI: '🎉',
  TROPHY: '🏆',
  CASTLE: '🏰',
  SHIELD: '🛡️',
  TICKET: '🎫',
  SPARKLES: '✨',
  FIRE: '🔥',
  ROCKET: '🚀',
  STAR: '⭐',
  ZAP: '⚡',
  
  // 🍯 Honeypot System
  HONEYPOT: '🍯',
  BEE: '🐝',
  TRAP: '🪤',
  ALARM: '🚨',
  BANNED_USER: '⛔',
  ROBOT: '🤖',
  
  // 🛡️ AutoMod System
  AUTOMOD: '🤖',
  AUTOMOD_KEYWORD: '🔑',
  AUTOMOD_SPAM: '🚫',
  AUTOMOD_MENTION: '📢',
  AUTOMOD_LINK: '🔗',
  AUTOMOD_CAPS: '🔠',
  FILTER: '🔍',
  BLOCK: '🚧',
  
  // 🔒 Security Commands
  SECURITY_SHIELD: '🛡️',
  SECURITY_LOCK: '🔒',
  SECURITY_UNLOCK: '🔓',
  SECURITY_CHECK: '✅',
  SECURITY_INFO: 'ℹ️',
  SECURITY_TOGGLE: '🔄',
  SECURITY_PURGE: '🗑️',
  SECURITY_KEY: '🔑',
  SECURITY_EYE: '👁️',
  
  // 🎮 Fun Commands
  FUN_DICE: '🎲',
  FUN_8BALL: '🎱',
  FUN_MEME: '😂',
  FUN_JOKE: '🤣',
  FUN_GAME: '🎮',
  FUN_CARD: '🃏',
  FUN_PARTY: '🎊',
  
  // 🤖 AI Commands
  AI_BRAIN: '🧠',
  AI_ROBOT: '🤖',
  AI_SPARKLE: '✨',
  AI_THINKING: '🤔',
  AI_CHAT: '💬',
  AI_IMAGE: '🖼️',
  AI_MAGIC: '🪄',
  
  // 👥 User/Member
  USER: '👤',
  USERS: '👥',
  MEMBER: '🧑',
  ADMIN: '👮',
  OWNER: '👑',
  BOT: '🤖',
  
  // 📊 Server/Channel
  SERVER: '🏠',
  CHANNEL: '💬',
  VOICE: '🔊',
  TEXT: '📝',
  ANNOUNCEMENT: '📢',
  RULES: '📜',
  
  // 🌈 Colors & Themes
  RED: '🔴',
  BLUE: '🔵',
  GREEN: '🟢',
  YELLOW: '🟡',
  PURPLE: '🟣',
  ORANGE: '🟠',
  RAINBOW: '🌈',
  
  // 📅 Time & Date
  TIME: '⏰',
  DATE: '📅',
  TIMER: '⏱️',
  STOPWATCH: '⏲️',
  HOURGLASS: '⏳',
  
  // 📱 Tech
  MOBILE: '📱',
  DESKTOP: '🖥️',
  LAPTOP: '💻',
  KEYBOARD: '⌨️',
  MOUSE: '🖱️',
  
  // 🎨 Art & Design
  PAINT: '🎨',
  BRUSH: '🖌️',
  PALETTE: '🎨',
  FRAME: '🖼️',
  
  // 📚 Education
  BOOK: '📚',
  NOTEBOOK: '📓',
  PENCIL: '✏️',
  PEN: '🖊️',
  PAPER: '📄',
  
  // 🌟 Special
  BOOM: '💥',
  FLASH: '⚡',
  COMET: '☄️',
  SUN: '☀️',
  MOON: '🌙',
  CLOUD: '☁️',
  RAIN: '🌧️',
  SNOW: '❄️',
  
  // 💬 Communication
  SPEECH: '💬',
  THOUGHT: '💭',
  LOUDSPEAKER: '📢',
  MEGAPHONE: '📣',
  BELL: '🔔',
  MUTE_BELL: '🔕',
  
  // 🎯 Actions
  UP: '⬆️',
  DOWN: '⬇️',
  LEFT: '⬅️',
  RIGHT: '➡️',
  REFRESH: '🔄',
  REPEAT: '🔁',
  SHUFFLE: '🔀',
  FORWARD: '⏩',
  BACKWARD: '⏪',
  PLAY: '▶️',
  PAUSE: '⏸️',
  STOP: '⏹️',
  RECORD: '⏺️',
  EJECT: '⏏️',
  
  // ✔️ Checkmarks & Crosses
  HEAVY_CHECK: '✔️',
  BALLOT_X: '✖️',
  HEAVY_X: '❌',
  HEAVY_PLUS: '➕',
  HEAVY_MINUS: '➖',
  
  // 🔢 Numbers (for rankings, counts)
  ONE: '1️⃣',
  TWO: '2️⃣',
  THREE: '3️⃣',
  FOUR: '4️⃣',
  FIVE: '5️⃣',
  SIX: '6️⃣',
  SEVEN: '7️⃣',
  EIGHT: '8️⃣',
  NINE: '9️⃣',
  TEN: '🔟',
  
  // 🔤 Letters
  A: '🇦',
  B: '🇧',
  C: '🇨',
  D: '🇩',
  E: '🇪',
  
  // 🎪 Events
  TICKET_EVENT: '🎫',
  CIRCUS: '🎪',
  BALLOON: '🎈',
  TADA: '🎉',
  PARTY_POPPER: '🎊',
  
  // 🏁 Flags & Symbols
  FLAG_VI: '🇻🇳',
  FLAG_US: '🇺🇸',
  FLAG_UK: '🇬🇧',
  FLAG_JP: '🇯🇵',
  FLAG_KR: '🇰🇷',
  
  // 💯 Special Numbers
  HUNDRED: '💯',
  BANGBANG: '‼️',
  INTERROBANG: '⁉️',
  
  // 🔥 Trending
  TRENDING_UP: '📈',
  TRENDING_DOWN: '📉',
  HOT: '🔥',
  NEW: '🆕',
  COOL: '🆒',
  FREE: '🆓',
  
  // 🎁 Premium
  PREMIUM: '💎',
  VIP: '👑',
  SPECIAL: '✨',
  
} as const;

// Type-safe emoji keys
export type CustomEmojiKey = keyof typeof CUSTOM_EMOJI;

/**
 * Get emoji by key with fallback
 */
export function getCustomEmoji(key: string): string {
  const emoji = CUSTOM_EMOJI[key as CustomEmojiKey];
  return emoji || '❓'; // Fallback to question mark if not found
}

/**
 * Get emoji by key (type-safe)
 */
export function getEmoji(key: CustomEmojiKey): string {
  return CUSTOM_EMOJI[key];
}

/**
 * Get random emoji from array
 */
export function getRandomEmoji(keys: CustomEmojiKey[]): string {
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return CUSTOM_EMOJI[randomKey];
}

/**
 * Create emoji string with count
 */
export function emojiWithCount(key: CustomEmojiKey, count: number): string {
  return `${CUSTOM_EMOJI[key]} ${count}`;
}

/**
 * Combine multiple emojis
 */
export function combineEmojis(...keys: CustomEmojiKey[]): string {
  return keys.map(key => CUSTOM_EMOJI[key]).join(' ');
}

/**
 * Progress bar with emojis
 */
export function emojiProgressBar(percentage: number, length: number = 10): string {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '🟩'.repeat(filled) + '⬜'.repeat(empty);
}

/**
 * Star rating with emojis
 */
export function emojiStarRating(rating: number, max: number = 5): string {
  const filled = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = max - filled - half;
  return '⭐'.repeat(filled) + (half ? '✨' : '') + '☆'.repeat(empty);
}

/**
 * Emoji bullet list
 */
export function emojiBullet(key: CustomEmojiKey, text: string): string {
  return `${CUSTOM_EMOJI[key]} ${text}`;
}

/**
 * Emoji banner
 */
export function emojiBanner(text: string, emoji: CustomEmojiKey = 'SPARKLES'): string {
  const e = CUSTOM_EMOJI[emoji];
  return `${e} ${text} ${e}`;
}

// Emoji collections for easy access
export const EmojiCollections = {
  music: ['MUSIC', 'MUSIC_NOTE', 'MUSIC_MIC', 'MUSIC_PLAY', 'MUSIC_PAUSE'] as CustomEmojiKey[],
  status: ['SUCCESS', 'ERROR', 'WARNING', 'INFO', 'LOADING'] as CustomEmojiKey[],
  mod: ['MOD_BAN', 'MOD_KICK', 'MOD_MUTE', 'MOD_WARN', 'MOD_SHIELD'] as CustomEmojiKey[],
  economy: ['ECO_COIN', 'ECO_WALLET', 'ECO_BANK', 'ECO_SHOP', 'ECO_DIAMOND'] as CustomEmojiKey[],
  fun: ['FUN_DICE', 'FUN_8BALL', 'FUN_MEME', 'FUN_GAME', 'FUN_PARTY'] as CustomEmojiKey[],
  security: ['SECURITY_SHIELD', 'SECURITY_LOCK', 'SECURITY_KEY', 'SECURITY_EYE'] as CustomEmojiKey[],
  ai: ['AI_BRAIN', 'AI_ROBOT', 'AI_SPARKLE', 'AI_MAGIC', 'AI_CHAT'] as CustomEmojiKey[],
};

/**
 * Get random emoji from collection
 */
export function getCollectionEmoji(collection: keyof typeof EmojiCollections): string {
  return getRandomEmoji(EmojiCollections[collection]);
}
