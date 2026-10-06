/**
 * Emoji Helper - Centralized emoji management
 * Use these emoji in commands, embeds, and messages
 */

// Standard Unicode Emoji (works everywhere, no upload needed)
export const EMOJI = {
  // Music & Audio
  MUSIC: '🎵',
  NOTES: '🎶',
  PLAY: '▶️',
  PAUSE: '⏸️',
  STOP: '⏹️',
  SKIP: '⏭️',
  PREVIOUS: '⏮️',
  LOOP: '🔁',
  SHUFFLE: '🔀',
  VOLUME_HIGH: '🔊',
  VOLUME_LOW: '🔉',
  VOLUME_OFF: '🔇',
  MICROPHONE: '🎤',
  HEADPHONES: '🎧',
  MUSICAL_NOTE: '🎼',
  RADIO: '📻',
  
  // Moderation & Actions
  HAMMER: '🔨',
  BAN: '🔨',
  KICK: '👢',
  BOOT: '👢',
  MUTE: '<a:mute:1555853916405628998>',
  UNMUTE: '<a:unmute:1555853968154824784>',
  WARNING: '⚠️',
  HOURGLASS: '⏱️',
  TIMEOUT: '⏱️',
  WASTEBASKET: '🗑️',
  TRASH: '🗑️',
  LOCK: '🔒',
  UNLOCK: '🔓',
  SNAIL: '🐌',
  BOMB: '💣',
  EXPLOSION: '💥',
  SHIELD: '🛡️',
  CROSSED_SWORDS: '⚔️',
  
  // Status & Feedback
  SUCCESS: '<a:white_check_mark:1555921911395909722>',
  CHECK: '<a:white_check_mark:1555921911395909722>',
  ERROR: '❌',
  CROSS: '❌',
  WARNING_SIGN: '⚠️',
  INFO: 'ℹ️',
  QUESTION: '❓',
  EXCLAMATION: '❗',
  LOADING: '⏳',
  HOURGLASS_DONE: '⌛',
  CLOCK: '🕐',
  ALARM: '⏰',
  STOPWATCH: '⏱️',
  
  // Ticket System
  TICKET: '🎫',
  BUG: '🐛',
  QUESTION_MARK: '❓',
  BULB: '💡',
  LIGHT_BULB: '💡',
  REPORT: '📋',
  CLIPBOARD: '📋',
  MEMO: '📝',
  PAGE: '📄',
  
  // User & People
  USER: '👤',
  USERS: '👥',
  PERSON: '🧑',
  POLICE: '👮',
  GUARD: '💂',
  DETECTIVE: '🕵️',
  ROBOT: '🤖',
  GHOST: '👻',
  ALIEN: '👽',
  
  // Utility & Tools
  GEAR: '⚙️',
  SETTINGS: '⚙️',
  WRENCH: '🔧',
  HAMMER_WRENCH: '🛠️',
  TOOLS: '🛠️',
  LINK: '🔗',
  CHAIN: '⛓️',
  PAPERCLIP: '📎',
  PUSHPIN: '📌',
  
  // Communication
  LOUDSPEAKER: '📢',
  MEGAPHONE: '📣',
  BELL: '🔔',
  MUTED_BELL: '🔕',
  SPEECH_BALLOON: '💬',
  THOUGHT_BALLOON: '💭',
  ENVELOPE: '✉️',
  EMAIL: '📧',
  INBOX: '📥',
  OUTBOX: '📦',
  
  // Statistics & Info
  BAR_CHART: '📊',
  CHART: '📈',
  GRAPH: '📉',
  PIE_CHART: '📉',
  CALENDAR: '📅',
  DATE: '📆',
  CARD_INDEX: '📇',
  BOOKMARK: '🔖',
  LABEL: '🏷️',
  
  // Games & Fun
  GAME_DIE: '🎲',
  DICE: '🎲',
  SLOT_MACHINE: '🎰',
  BOWLING: '🎳',
  DART: '🎯',
  CRYSTAL_BALL: '🔮',
  EIGHT_BALL: '🎱',
  JOYSTICK: '🕹️',
  GAME: '🎮',
  PLAYING_CARD: '🃏',
  MAHJONG: '🀄',
  
  // Emotions & Reactions
  JOY: '😂',
  LAUGHING: '😄',
  SMILE: '😊',
  GRIN: '😁',
  HEART_EYES: '😍',
  STAR_EYES: '🤩',
  THINKING: '🤔',
  NERD: '🤓',
  SUNGLASSES: '😎',
  PARTY: '🥳',
  CLOWN: '🤡',
  
  // Economy & Money
  COIN: '<a:money_with_wings:1555919069172080650>',
  MONEY_BAG: '<a:money_with_wings:1555919069172080650>',
  DOLLAR: '💵',
  YEN: '💴',
  EURO: '💶',
  POUND: '💷',
  CREDIT_CARD: '💳',
  MINUS: '<a:heavy_minus_sign:1555918969750425682>',
  RECEIPT: '🧾',
  SHOPPING_CART: '🛒',
  SHOP: '🏪',
  STORE: '🏬',
  
  // Rewards & Achievements
  TROPHY: '🏆',
  MEDAL: '🏅',
  FIRST_PLACE: '🥇',
  SECOND_PLACE: '🥈',
  THIRD_PLACE: '🥉',
  STAR: '⭐',
  GLOWING_STAR: '🌟',
  SPARKLES: '✨',
  FIRE: '🔥',
  HUNDRED: '💯',
  CROWN: '👑',
  GEM: '💎',
  GIFT: '🎁',
  PRESENT: '🎀',
  
  // Misc Symbols
  ARROW_RIGHT: '➡️',
  ARROW_LEFT: '⬅️',
  ARROW_UP: '⬆️',
  ARROW_DOWN: '⬇️',
  DOUBLE_RIGHT: '⏩',
  DOUBLE_LEFT: '⏪',
  UP_ARROW: '🔼',
  DOWN_ARROW: '🔽',
  REFRESH: '🔄',
  RECYCLE: '♻️',
  
  // Colors & Indicators
  RED_CIRCLE: '🔴',
  ORANGE_CIRCLE: '🟠',
  YELLOW_CIRCLE: '🟡',
  GREEN_CIRCLE: '🟢',
  BLUE_CIRCLE: '🔵',
  PURPLE_CIRCLE: '🟣',
  BROWN_CIRCLE: '🟤',
  BLACK_CIRCLE: '⚫',
  WHITE_CIRCLE: '⚪',
  
  // Nature & Weather
  SUN: '☀️',
  MOON: '🌙',
  STAR_SKY: '🌟',
  CLOUD: '☁️',
  RAIN: '🌧️',
  SNOW: '❄️',
  LIGHTNING: '⚡',
  RAINBOW: '🌈',
  
  // Food & Drink
  PIZZA: '🍕',
  BURGER: '🍔',
  CAKE: '🎂',
  COOKIE: '🍪',
  COFFEE: '☕',
  BEER: '🍺',
  WINE: '🍷',
  COCKTAIL: '🍸',
  
  // Animals
  CAT: '🐱',
  DOG: '🐶',
  PANDA: '🐼',
  LION: '🦁',
  UNICORN: '🦄',
  DRAGON: '🐉',
  BIRD: '🐦',
  PENGUIN: '🐧'
} as const;

// Custom Emoji (requires upload to Discord server)
// Replace IDs after uploading your custom emoji
export const CUSTOM_EMOJI = {
  // Music (example IDs - replace with your actual emoji IDs)
  MUSIC_PLAY: '<:music_play:000000000000000000>',
  MUSIC_PAUSE: '<:music_pause:000000000000000000>',
  MUSIC_STOP: '<:music_stop:000000000000000000>',
  MUSIC_QUEUE: '<:music_queue:000000000000000000>',
  
  // Moderation (example IDs)
  MOD_BAN: '<:mod_ban:000000000000000000>',
  MOD_KICK: '<:mod_kick:000000000000000000>',
  MOD_MUTE: '<:mod_mute:000000000000000000>',
  MOD_WARN: '<:mod_warn:000000000000000000>',
  
  // Status (example IDs)
  STATUS_ONLINE: '<:status_online:000000000000000000>',
  STATUS_OFFLINE: '<:status_offline:000000000000000000>',
  STATUS_IDLE: '<:status_idle:000000000000000000>',
  STATUS_DND: '<:status_dnd:000000000000000000>',
  
  // Brand/Logo (example IDs)
  LOGO: '<:bot_logo:000000000000000000>',
  VERIFIED: '<:verified:000000000000000000>',
  PREMIUM: '<:premium:000000000000000000>'
} as const;

// Helper function to get emoji
export const getEmoji = (name: keyof typeof EMOJI): string => {
  return EMOJI[name] || '❓';
};

// Helper function to get custom emoji
export const getCustomEmoji = (name: keyof typeof CUSTOM_EMOJI): string => {
  return CUSTOM_EMOJI[name] || '❓';
};

// Helper to format emoji with text
export const formatWithEmoji = (emoji: string, text: string): string => {
  return `${emoji} ${text}`;
};

// Status emoji helper
export const getStatusEmoji = (status: 'success' | 'error' | 'warning' | 'info' | 'loading'): string => {
  const statusMap = {
    success: EMOJI.SUCCESS,
    error: EMOJI.ERROR,
    warning: EMOJI.WARNING,
    info: EMOJI.INFO,
    loading: EMOJI.LOADING
  };
  return statusMap[status] || EMOJI.QUESTION;
};

// Music state emoji
export const getMusicEmoji = (state: 'playing' | 'paused' | 'stopped' | 'loading'): string => {
  const musicMap = {
    playing: EMOJI.PLAY,
    paused: EMOJI.PAUSE,
    stopped: EMOJI.STOP,
    loading: EMOJI.LOADING
  };
  return musicMap[state] || EMOJI.MUSIC;
};

// Moderation action emoji
export const getModEmoji = (action: 'ban' | 'kick' | 'mute' | 'warn' | 'timeout'): string => {
  const modMap = {
    ban: EMOJI.BAN,
    kick: EMOJI.KICK,
    mute: EMOJI.MUTE,
    warn: EMOJI.WARNING,
    timeout: EMOJI.TIMEOUT
  };
  return modMap[action] || EMOJI.SHIELD;
};

// Export all for easy import
export default {
  EMOJI,
  CUSTOM_EMOJI,
  getEmoji,
  getCustomEmoji,
  formatWithEmoji,
  getStatusEmoji,
  getMusicEmoji,
  getModEmoji
};
