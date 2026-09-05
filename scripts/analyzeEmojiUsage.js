const fs = require('fs');
const path = require('path');

// Existing custom emoji
const existingEmoji = {
  'MUSIC_PLAY': '🎵',
  'MUSIC_PAUSE': '⏸️',
  'MUSIC_STOP': '⏹️',
  'MUSIC_SKIP': '⏭️',
  'MUSIC_PREV': '⏮️',
  'MUSIC_LOOP': '🔁',
  'MUSIC_SHUFFLE': '🔀',
  'MUSIC_VOLUME': '🔊',
  'MUSIC_QUEUE': '📜',
  'MUSIC_LYRICS': '📝',
  'MUSIC': '🎶',
  'MOD_BAN': '🔨',
  'MOD_KICK': '👢',
  'MOD_MUTE': '🔇',
  'MOD_WARN': '⚠️',
  'MOD_TIMEOUT': '⏱️',
  'MOD_LOCK': '🔒',
  'MOD_UNLOCK': '🔓',
  'MOD_SLOWMODE': '🐌',
  'MOD_PURGE': '🗑️',
  'MOD_NUKE': '💣',
  'UTIL_SETTINGS': '⚙️',
  'UTIL_HELP': '❓',
  'UTIL_PING': '📡',
  'UTIL_STATS': '📊',
  'UTIL_AVATAR': '👤',
  'UTIL_SEARCH': '🔍',
  'UTIL_FILTER': '🎛️',
  'ECO_WALLET': '💼',
  'ECO_COIN': '🪙',
  'ECO_GIFT': '🎁',
  'STATUS_SUCCESS': '✅',
  'STATUS_ERROR': '❌',
  'STATUS_LOADING': '⏳',
  'STATUS_INFO': 'ℹ️',
  'TICKET': '🎫'
};

// Unicode emoji found in commands
const unicodeUsed = {
  // Common
  '🏓': 'PING',
  '📚': 'BOOK/HELP',
  '🤖': 'BOT',
  '💰': 'MONEY',
  '🛡️': 'SHIELD',
  '👥': 'USERS',
  '💚': 'HEART_GREEN',
  '🌐': 'GLOBE',
  '📨': 'ENVELOPE',
  '✨': 'SPARKLES',
  '🪙': 'COIN (already have)',
  '🌙': 'MOON',
  '😄': 'SMILE',
  '😂': 'LAUGH',
  '🎲': 'DICE',
  '🎯': 'DART',
  '🏆': 'TROPHY',
  '⚀⚁⚂⚃⚄⚅': 'DICE_FACES',
  '🟢🟡🔴⚫': 'STATUS_DOTS',
  '📈': 'CHART_UP',
  '🕐': 'CLOCK',
  '💎': 'GEM',
  '🎊': 'CONFETTI',
  '👑': 'CROWN',
  '🆔': 'ID',
  '📅': 'CALENDAR',
  '📥': 'INBOX',
  '🎮': 'GAME',
  '🎭': 'MASK',
  '😊': 'EMOJI_ICON',
  '🏰': 'CASTLE',
  '📁': 'FOLDER',
  '🏷️': 'TAG',
  '💡': 'BULB',
  '🎃': 'PUMPKIN',
  '🎄': 'TREE',
  '🐞': 'BUG',
  '💔': 'BROKEN_HEART',
  '🏴‍☠️': 'PIRATE',
  '🤷': 'SHRUG',
  '🇫🇮': 'FLAG_FI',
  '💸': 'MONEY_FLY',
  '🐛': 'BUG2',
  '👓': 'GLASSES',
  '🍺': 'BEER'
};

console.log('📊 Emoji Analysis:\n');
console.log(`✅ Existing custom emoji: ${Object.keys(existingEmoji).length}`);
console.log(`📝 Unicode emoji in use: ${Object.keys(unicodeUsed).length}`);

// New emoji needed
const newEmojiNeeded = [
  'USER', 'CROWN', 'ID_CARD', 'CALENDAR', 'INBOX', 'GAME', 'THEATER',
  'SMILE', 'LAUGH', 'DICE', 'DART', 'TROPHY', 'CHART', 'CLOCK',
  'GEM', 'CONFETTI', 'CASTLE', 'FOLDER', 'TAG', 'SHIELD', 'HEART',
  'GLOBE', 'ENVELOPE', 'SPARKLES', 'MOON', 'STATUS_ONLINE', 'STATUS_IDLE',
  'STATUS_DND', 'STATUS_OFFLINE', 'DICE_1', 'DICE_2', 'DICE_3', 
  'DICE_4', 'DICE_5', 'DICE_6'
];

console.log(`\n🎨 New emoji to create: ${newEmojiNeeded.length}`);
console.log('\nRecommended new emoji:');
newEmojiNeeded.forEach((name, i) => {
  console.log(`${i + 1}. ${name}`);
});

console.log('\n💡 Priority emoji (most used):');
const priority = ['CROWN', 'CALENDAR', 'TROPHY', 'DICE', 'HEART', 'SPARKLES', 'CHART', 'SHIELD'];
priority.forEach(name => console.log(`   - ${name}`));
