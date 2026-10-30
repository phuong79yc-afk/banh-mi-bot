/**
 * Server Generator Module - AI-powered Discord server setup
 * UI: Card (Components V2 Container) giống phong cách /daily, nút nằm TRONG khung
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  Collection,
  ContainerBuilder,
  Guild,
  Message,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  StringSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle,
  User,
} from 'discord.js';
import Groq from 'groq-sdk';
import { emojis } from '../../config/emojis';
import { keyRotator } from '../../utils/aiKeyRotator';
import {
  buildErrorCard as buildFeatureErrorCard,
  buildFeatureCard,
  buildSuccessCard as buildFeatureSuccessCard,
  FEATURES,
  getGuildFeatures,
  setGuildFeature,
  type FeatureKey,
} from '../../utils/serverFeatures';
import {
  buildThemeHint,
  detectThemes,
  parseAiJson,
  validateDesign,
  type ServerDesign,
  type ValidationReport,
} from './designValidator';

/* ───────────────────────────── Config UI ───────────────────────────── */
const THUMBNAIL_URL = ''; // Icon bên phải embed (để trống nếu không dùng)
const BANNER_URL = ''; // Banner dưới màn hình kết quả (để trống nếu không dùng)
const COLORS = {
  primary: 0x7be0b0, // xanh mint giống /daily
  warning: 0xfee75c,
  danger: 0xed4245,
  success: 0x57f287,
} as const;

/* ───────────────────────────── Types & constants ───────────────────────────── */
interface Step { label: string; done: number; total: number }

const VALID_CHANNEL_TYPES: number[] = [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildStageVoice];
const API_DELAY_MS = 300; // tránh rate limit khi tạo/xóa hàng loạt
const TREE_PAGE_CHARS = 1500; // số ký tự cây tối đa mỗi trang
const PROGRESS_THROTTLE_MS = 1200; // tần suất cập nhật thanh tiến trình
const MODEL = 'openai/gpt-oss-120b';
const MAX_GUILD_CHANNELS = 500;
const MAX_GUILD_CATEGORIES = 50;
const MAX_GUILD_ROLES = 250;

const customId = (action: string, userId: string, extra?: string | number) =>
  `gen:${action}:${userId}` + (extra !== undefined ? `:${extra}` : '');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);
const summarizeFailure = (label: string, error: unknown) =>
  `${label}: ${errorMessage(error).slice(0, 180)}`;

const toCategoryName = (name: string): string =>
  name.normalize('NFC').trim().replace(/\s+/g, ' ').toUpperCase();

const toTextChannelName = (name: string): string =>
  name
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const toVoiceChannelName = (name: string): string =>
  name.normalize('NFC').trim().replace(/\s+/g, ' ');

// Theme-specific decorative characters from kituhay.com
const THEME_STYLES = {
  gaming: {
    category: { left: '▰▰', right: '▰▰', icon: '⚔' },
    voice: { left: '╠', right: '╣', icon: '🎮' },
    text: { separator: '▸' }
  },
  community: {
    category: { left: '═══', right: '═══', icon: '✦' },
    voice: { left: '║', right: '║', icon: '♪' },
    text: { separator: '・' }
  },
  school: {
    category: { left: '┣━', right: '━┫', icon: '📚' },
    voice: { left: '┃', right: '┃', icon: '🎓' },
    text: { separator: '»' }
  },
  anime: {
    category: { left: '◆◇', right: '◇◆', icon: '✿' },
    voice: { left: '◈', right: '◈', icon: '☆' },
    text: { separator: '◦' }
  },
  music: {
    category: { left: '♫═', right: '═♫', icon: '♬' },
    voice: { left: '♪', right: '♪', icon: '🎵' },
    text: { separator: '♩' }
  },
  tech: {
    category: { left: '┤▓', right: '▓├', icon: '⚡' },
    voice: { left: '▌', right: '▐', icon: '💻' },
    text: { separator: '›' }
  },
  crypto: {
    category: { left: '▓▒', right: '▒▓', icon: '₿' },
    voice: { left: '▓', right: '▓', icon: '💎' },
    text: { separator: '◈' }
  },
  business: {
    category: { left: '━┫', right: '┣━', icon: '💼' },
    voice: { left: '┃', right: '┃', icon: '📊' },
    text: { separator: '►' }
  },
  minecraft: {
    category: { left: '▣▣', right: '▣▣', icon: '⛏' },
    voice: { left: '▥', right: '▥', icon: '🧱' },
    text: { separator: '◘' }
  },
  roleplay: {
    category: { left: '╰☆', right: '☆╮', icon: '🎭' },
    voice: { left: '❖', right: '❖', icon: '🎬' },
    text: { separator: '◈' }
  },
  fps: {
    category: { left: '▰►', right: '◄▰', icon: '🎯' },
    voice: { left: '▌', right: '▐', icon: '💥' },
    text: { separator: '▸' }
  },
  moba: {
    category: { left: '◤◢', right: '◣◥', icon: '⚡' },
    voice: { left: '◢', right: '◣', icon: '⚔️' },
    text: { separator: '◆' }
  },
  art: {
    category: { left: '✦✧', right: '✧✦', icon: '🎨' },
    voice: { left: '◇', right: '◇', icon: '🖌️' },
    text: { separator: '◦' }
  },
  photography: {
    category: { left: '◐◑', right: '◑◐', icon: '📷' },
    voice: { left: '◎', right: '◎', icon: '📸' },
    text: { separator: '◉' }
  },
  streaming: {
    category: { left: '▶▷', right: '◁◀', icon: '📺' },
    voice: { left: '▷', right: '◁', icon: '🎥' },
    text: { separator: '▸' }
  },
  fitness: {
    category: { left: '▓▓', right: '▓▓', icon: '💪' },
    voice: { left: '█', right: '█', icon: '🏋️' },
    text: { separator: '▪' }
  },
  food: {
    category: { left: '◈═', right: '═◈', icon: '🍜' },
    voice: { left: '◈', right: '◈', icon: '🍽️' },
    text: { separator: '◇' }
  },
  travel: {
    category: { left: '✈══', right: '══✈', icon: '🌍' },
    voice: { left: '✈', right: '✈', icon: '🗺️' },
    text: { separator: '◦' }
  },
  sports: {
    category: { left: '▬▬', right: '▬▬', icon: '⚽' },
    voice: { left: '▌', right: '▐', icon: '🏆' },
    text: { separator: '►' }
  },
  esports: {
    category: { left: '▰▱', right: '▱▰', icon: '🏅' },
    voice: { left: '▰', right: '▰', icon: '🎮' },
    text: { separator: '▸' }
  },
  movie: {
    category: { left: '◄◄', right: '►►', icon: '🎬' },
    voice: { left: '◄', right: '►', icon: '📽️' },
    text: { separator: '◆' }
  },
  meme: {
    category: { left: '◉◉', right: '◉◉', icon: '😂' },
    voice: { left: '◉', right: '◉', icon: '🤣' },
    text: { separator: '◎' }
  },
  dating: {
    category: { left: '♡═', right: '═♡', icon: '💕' },
    voice: { left: '♥', right: '♥', icon: '💖' },
    text: { separator: '◦' }
  },
  vietnamese: {
    category: { left: '◈══', right: '══◈', icon: '🇻🇳' },
    voice: { left: '◈', right: '◈', icon: '🎤' },
    text: { separator: '◇' }
  },
  english: {
    category: { left: '═══', right: '═══', icon: '🇬🇧' },
    voice: { left: '║', right: '║', icon: '🗣️' },
    text: { separator: '▸' }
  },
  study: {
    category: { left: '┫━', right: '━┣', icon: '📖' },
    voice: { left: '┃', right: '┃', icon: '📚' },
    text: { separator: '»' }
  },
  chess: {
    category: { left: '♜♞', right: '♞♜', icon: '♔' },
    voice: { left: '♜', right: '♜', icon: '♕' },
    text: { separator: '▪' }
  },
  strategy: {
    category: { left: '◢◤', right: '◥◣', icon: '🎯' },
    voice: { left: '◢', right: '◣', icon: '🧠' },
    text: { separator: '◆' }
  },
  horror: {
    category: { left: '▓░', right: '░▓', icon: '👻' },
    voice: { left: '▓', right: '▓', icon: '🎃' },
    text: { separator: '◈' }
  },
  fantasy: {
    category: { left: '◆✦', right: '✦◆', icon: '🔮' },
    voice: { left: '✦', right: '✦', icon: '⚔️' },
    text: { separator: '◇' }
  },
  scifi: {
    category: { left: '▓▓', right: '▓▓', icon: '🚀' },
    voice: { left: '▓', right: '▓', icon: '🛸' },
    text: { separator: '▸' }
  },
  
  // Music genres
  kpop: {
    category: { left: '★☆', right: '☆★', icon: '🎤' },
    voice: { left: '☆', right: '☆', icon: '🎶' },
    text: { separator: '★' }
  },
  jpop: {
    category: { left: '◈◇', right: '◇◈', icon: '🎌' },
    voice: { left: '◇', right: '◇', icon: '🎵' },
    text: { separator: '◈' }
  },
  vocaloid: {
    category: { left: '♫♪', right: '♪♫', icon: '🎙️' },
    voice: { left: '♫', right: '♫', icon: '🎧' },
    text: { separator: '♪' }
  },
  rock: {
    category: { left: '⚡▬', right: '▬⚡', icon: '🎸' },
    voice: { left: '⚡', right: '⚡', icon: '🎤' },
    text: { separator: '▸' }
  },
  hiphop: {
    category: { left: '▰▱', right: '▱▰', icon: '🎤' },
    voice: { left: '▰', right: '▰', icon: '🎵' },
    text: { separator: '▸' }
  },
  edm: {
    category: { left: '◢◣', right: '◤◥', icon: '🎧' },
    voice: { left: '◢', right: '◣', icon: '🎵' },
    text: { separator: '◆' }
  },
  
  // Specific games
  valorant: {
    category: { left: '◥◤', right: '◤◥', icon: '🔥' },
    voice: { left: '◥', right: '◤', icon: '💥' },
    text: { separator: '▸' }
  },
  league: {
    category: { left: '◇◆', right: '◆◇', icon: '⚔️' },
    voice: { left: '◆', right: '◇', icon: '🏆' },
    text: { separator: '◈' }
  },
  dota: {
    category: { left: '▣▢', right: '▢▣', icon: '⚡' },
    voice: { left: '▣', right: '▢', icon: '🎮' },
    text: { separator: '▪' }
  },
  fortnite: {
    category: { left: '▰▱', right: '▱▰', icon: '🎯' },
    voice: { left: '▱', right: '▰', icon: '🎮' },
    text: { separator: '▸' }
  },
  pubg: {
    category: { left: '▓▒', right: '▒▓', icon: '🎯' },
    voice: { left: '▓', right: '▒', icon: '💥' },
    text: { separator: '▸' }
  },
  genshin: {
    category: { left: '✦✧', right: '✧✦', icon: '⭐' },
    voice: { left: '✧', right: '✦', icon: '🎮' },
    text: { separator: '◦' }
  },
  roblox: {
    category: { left: '▪▫', right: '▫▪', icon: '🎮' },
    voice: { left: '▪', right: '▫', icon: '🎤' },
    text: { separator: '▸' }
  },
  
  // More niches
  discord: {
    category: { left: '◈◇', right: '◇◈', icon: '💬' },
    voice: { left: '◇', right: '◈', icon: '🎤' },
    text: { separator: '◦' }
  },
  mmorpg: {
    category: { left: '⚔️═', right: '═⚔️', icon: '🛡️' },
    voice: { left: '⚔️', right: '🛡️', icon: '🎮' },
    text: { separator: '▸' }
  },
  rpg: {
    category: { left: '◆◇', right: '◇◆', icon: '🎲' },
    voice: { left: '◆', right: '◇', icon: '🎮' },
    text: { separator: '◈' }
  },
  sandbox: {
    category: { left: '▢▣', right: '▣▢', icon: '🏗️' },
    voice: { left: '▢', right: '▣', icon: '🎮' },
    text: { separator: '▪' }
  },
  survival: {
    category: { left: '▓░', right: '░▓', icon: '🏕️' },
    voice: { left: '▓', right: '░', icon: '🎮' },
    text: { separator: '▸' }
  },
  
  // Professional
  design: {
    category: { left: '◐◑', right: '◑◐', icon: '✏️' },
    voice: { left: '◐', right: '◑', icon: '🎨' },
    text: { separator: '◦' }
  },
  writing: {
    category: { left: '━━', right: '━━', icon: '✍️' },
    voice: { left: '━', right: '━', icon: '📖' },
    text: { separator: '▸' }
  },
  podcast: {
    category: { left: '♪═', right: '═♪', icon: '🎙️' },
    voice: { left: '♪', right: '♪', icon: '🎧' },
    text: { separator: '◦' }
  },
  youtube: {
    category: { left: '▶▷', right: '◁◀', icon: '📹' },
    voice: { left: '▶', right: '◀', icon: '🎥' },
    text: { separator: '▸' }
  },
  
  // More lifestyle
  fashion: {
    category: { left: '✦✧', right: '✧✦', icon: '👗' },
    voice: { left: '✧', right: '✦', icon: '👠' },
    text: { separator: '◦' }
  },
  beauty: {
    category: { left: '◇◆', right: '◆◇', icon: '💄' },
    voice: { left: '◇', right: '◆', icon: '💅' },
    text: { separator: '◦' }
  },
  pets: {
    category: { left: '◉◎', right: '◎◉', icon: '🐾' },
    voice: { left: '◉', right: '◎', icon: '🐶' },
    text: { separator: '◦' }
  },
  nature: {
    category: { left: '◈══', right: '══◈', icon: '🌿' },
    voice: { left: '◈', right: '◈', icon: '🌳' },
    text: { separator: '◇' }
  },
  meditation: {
    category: { left: '◯◯', right: '◯◯', icon: '🧘' },
    voice: { left: '◯', right: '◯', icon: '☮️' },
    text: { separator: '◦' }
  },
  motivation: {
    category: { left: '▰▱', right: '▱▰', icon: '💪' },
    voice: { left: '▰', right: '▱', icon: '🔥' },
    text: { separator: '▸' }
  },
  
  // Cute & Aesthetic themes
  cute: {
    category: { left: '◌◦', right: '◦◌', icon: '♡' },
    voice: { left: '◌', right: '◌', icon: '🎀' },
    text: { separator: '◦' }
  },
  kawaii: {
    category: { left: '◠◡', right: '◡◠', icon: '✿' },
    voice: { left: '◠', right: '◡', icon: '💗' },
    text: { separator: '◦' }
  },
  pink: {
    category: { left: '♡═', right: '═♡', icon: '🌸' },
    voice: { left: '♡', right: '♡', icon: '💗' },
    text: { separator: '◦' }
  },
  pastel: {
    category: { left: '◌◦', right: '◦◌', icon: '🌈' },
    voice: { left: '◌', right: '◌', icon: '✨' },
    text: { separator: '◦' }
  },
  aesthetic: {
    category: { left: '◠═', right: '═◠', icon: '✧' },
    voice: { left: '◠', right: '◠', icon: '☁️' },
    text: { separator: '◦' }
  },
  soft: {
    category: { left: '◌◦', right: '◦◌', icon: '☁️' },
    voice: { left: '◌', right: '◌', icon: '🤍' },
    text: { separator: '◦' }
  },
  
  // Girls/Women themes
  girl: {
    category: { left: '♡◇', right: '◇♡', icon: '👧' },
    voice: { left: '♡', right: '◇', icon: '💕' },
    text: { separator: '◦' }
  },
  girlpower: {
    category: { left: '◈♀', right: '♀◈', icon: '👑' },
    voice: { left: '◈', right: '◈', icon: '💪' },
    text: { separator: '◆' }
  },
  princess: {
    category: { left: '◇♛', right: '♛◇', icon: '👸' },
    voice: { left: '♛', right: '♛', icon: '👑' },
    text: { separator: '◇' }
  },
  fairy: {
    category: { left: '✧◦', right: '◦✧', icon: '🧚' },
    voice: { left: '✧', right: '✧', icon: '✨' },
    text: { separator: '◦' }
  },
  magical: {
    category: { left: '◦✧', right: '✧◦', icon: '✨' },
    voice: { left: '◦', right: '◦', icon: '🌟' },
    text: { separator: '◦' }
  },
  flower: {
    category: { left: '✿❀', right: '❀✿', icon: '🌺' },
    voice: { left: '✿', right: '❀', icon: '🌸' },
    text: { separator: '◦' }
  },
  
  // More aesthetic
  cottagecore: {
    category: { left: '◦✿', right: '✿◦', icon: '🌿' },
    voice: { left: '◦', right: '◦', icon: '🍄' },
    text: { separator: '◦' }
  },
  vintage: {
    category: { left: '◇◆', right: '◆◇', icon: '📜' },
    voice: { left: '◇', right: '◆', icon: '🕰️' },
    text: { separator: '◦' }
  },
  angel: {
    category: { left: '◌◦', right: '◦◌', icon: '👼' },
    voice: { left: '◌', right: '◌', icon: '😇' },
    text: { separator: '◦' }
  },
  star: {
    category: { left: '☆★', right: '★☆', icon: '⭐' },
    voice: { left: '☆', right: '★', icon: '✨' },
    text: { separator: '★' }
  },
  moon: {
    category: { left: '☽◦', right: '◦☾', icon: '🌙' },
    voice: { left: '☽', right: '☾', icon: '🌛' },
    text: { separator: '◦' }
  },
  sparkle: {
    category: { left: '✦✧', right: '✧✦', icon: '✨' },
    voice: { left: '✦', right: '✧', icon: '💫' },
    text: { separator: '◦' }
  },
  rainbow: {
    category: { left: '◦◌', right: '◌◦', icon: '🌈' },
    voice: { left: '◦', right: '◌', icon: '🦄' },
    text: { separator: '◦' }
  },
  unicorn: {
    category: { left: '◦◠', right: '◠◦', icon: '🦄' },
    voice: { left: '◦', right: '◠', icon: '🌈' },
    text: { separator: '◦' }
  },
  heart: {
    category: { left: '♡♥', right: '♥♡', icon: '💖' },
    voice: { left: '♡', right: '♥', icon: '💕' },
    text: { separator: '◦' }
  },
  bunny: {
    category: { left: '◦◌', right: '◌◦', icon: '🐰' },
    voice: { left: '◦', right: '◌', icon: '🐇' },
    text: { separator: '◦' }
  },
  cat: {
    category: { left: '◦◌', right: '◌◦', icon: '🐱' },
    voice: { left: '◦', right: '◌', icon: '😺' },
    text: { separator: '◦' }
  }
};

const PREFERRED_THEME_STYLE_PRIORITY: (keyof typeof THEME_STYLES)[] = [
  'valorant', 'league', 'dota', 'fortnite', 'pubg', 'genshin', 'roblox',
  'minecraft', 'fps', 'moba', 'esports', 'mmorpg', 'rpg', 'gaming',
  'vocaloid', 'kpop', 'jpop', 'rock', 'hiphop', 'edm', 'music',
  'kawaii', 'cute', 'pink', 'pastel', 'aesthetic', 'soft', 'cottagecore', 'vintage',
  'girlpower', 'princess', 'fairy', 'magical', 'flower', 'angel', 'sparkle', 'rainbow',
  'unicorn', 'heart', 'bunny', 'cat', 'girl', 'star', 'moon', 'discord',
  'anime', 'streaming', 'youtube', 'podcast', 'movie', 'art', 'photography',
  'design', 'writing', 'tech', 'crypto', 'business', 'school', 'study', 'english',
  'fitness', 'food', 'travel', 'sports', 'chess', 'pets', 'nature', 'dating',
  'meditation', 'motivation', 'beauty', 'fashion', 'strategy', 'sandbox', 'survival',
  'discord', 'meme', 'horror', 'fantasy', 'scifi', 'vietnamese', 'community',
];
const THEME_STYLE_PRIORITY: (keyof typeof THEME_STYLES)[] = [
  ...PREFERRED_THEME_STYLE_PRIORITY,
  ...Object.keys(THEME_STYLES)
    .filter((theme) => !PREFERRED_THEME_STYLE_PRIORITY.includes(theme as keyof typeof THEME_STYLES))
    .sort((a, b) => b.length - a.length) as (keyof typeof THEME_STYLES)[],
];

// Prefer themes detected from the user's prompt; inspect generated content only for imports.
const detectDesignTheme = (
  design: ServerDesign,
  requestedThemes: string[] = [],
): keyof typeof THEME_STYLES => {
  const requestedTheme = THEME_STYLE_PRIORITY.find((theme) => requestedThemes.includes(theme));
  if (requestedTheme) return requestedTheme;

  const text = JSON.stringify(design).toLowerCase();
  
  // Cute & Aesthetic themes (check FIRST - highest priority for keywords)
  if (/(kawaii|かわいい)/i.test(text)) return 'kawaii';
  if (/(pink|hồng|màu hồng)/i.test(text)) return 'pink';
  if (/(pastel)/i.test(text)) return 'pastel';
  if (/(aesthetic|aesthetics)/i.test(text)) return 'aesthetic';
  if (/(soft|softcore)/i.test(text)) return 'soft';
  if (/(cottagecore|cottage)/i.test(text)) return 'cottagecore';
  if (/(vintage|retro)/i.test(text)) return 'vintage';
  if (/(angel|thiên thần)/i.test(text)) return 'angel';
  if (/(star|ngôi sao|⭐)/i.test(text)) return 'star';
  if (/(moon|mặt trăng|🌙)/i.test(text)) return 'moon';
  if (/(sparkle|lấp lánh)/i.test(text)) return 'sparkle';
  if (/(rainbow|cầu vồng)/i.test(text)) return 'rainbow';
  if (/(unicorn|kỳ lân)/i.test(text)) return 'unicorn';
  if (/(heart|trái tim|♡|💕)/i.test(text)) return 'heart';
  if (/(bunny|rabbit|thỏ)/i.test(text)) return 'bunny';
  if (/(cat|mèo|kitty)/i.test(text)) return 'cat';
  if (/(cute|dễ thương|đẹp|xinh)/i.test(text)) return 'cute';
  
  // Girls/Women themes
  if (/(princess|công chúa)/i.test(text)) return 'princess';
  if (/(fairy|tiên|phép thuật)/i.test(text)) return 'fairy';
  if (/(magical|magic|ma thuật)/i.test(text)) return 'magical';
  if (/(flower|hoa|🌸)/i.test(text)) return 'flower';
  if (/(girl.?power|nữ quyền)/i.test(text)) return 'girlpower';
  if (/(girl|gái|con gái|women|phụ nữ)/i.test(text)) return 'girl';
  
  // Specific games
  if (/(valorant|valo)/i.test(text)) return 'valorant';
  if (/(league of legends|lol|league)/i.test(text)) return 'league';
  if (/(dota|dota2)/i.test(text)) return 'dota';
  if (/(fortnite)/i.test(text)) return 'fortnite';
  if (/(pubg|battleground)/i.test(text)) return 'pubg';
  if (/(genshin|impact)/i.test(text)) return 'genshin';
  if (/(roblox)/i.test(text)) return 'roblox';
  
  // Game genres
  if (/(minecraft|survival|creative|build|block)/i.test(text)) return 'minecraft';
  if (/(roleplay|rp|character|story|lore)/i.test(text)) return 'roleplay';
  if (/(fps|shooter|csgo|valorant|cod|battlefield)/i.test(text)) return 'fps';
  if (/(moba|arena)/i.test(text)) return 'moba';
  if (/(mmorpg|massively)/i.test(text)) return 'mmorpg';
  if (/(rpg|role.playing)/i.test(text)) return 'rpg';
  if (/(sandbox)/i.test(text)) return 'sandbox';
  if (/(survival|survive)/i.test(text)) return 'survival';
  if (/(esport|tournament|competitive|pro)/i.test(text)) return 'esports';
  if (/(gaming|game|esport|gamer|pvp|clan)/i.test(text)) return 'gaming';
  
  // Music genres
  if (/(kpop|k-pop|korean pop)/i.test(text)) return 'kpop';
  if (/(jpop|j-pop|japanese pop)/i.test(text)) return 'jpop';
  if (/(vocaloid|miku|hatsune)/i.test(text)) return 'vocaloid';
  if (/(rock|metal|guitar)/i.test(text)) return 'rock';
  if (/(hiphop|hip-hop|rap)/i.test(text)) return 'hiphop';
  if (/(edm|electronic|dubstep|techno)/i.test(text)) return 'edm';
  if (/(music|song|producer|dj|beat)/i.test(text)) return 'music';
  
  // Creative
  if (/(anime|manga|otaku|weeb)/i.test(text)) return 'anime';
  if (/(streaming|stream|twitch|youtube)/i.test(text)) return 'streaming';
  if (/(youtube|youtuber)/i.test(text)) return 'youtube';
  if (/(podcast)/i.test(text)) return 'podcast';
  if (/(art|draw|design|paint|illustration)/i.test(text)) return 'art';
  if (/(photo|camera|photography)/i.test(text)) return 'photography';
  if (/(design|graphic|designer)/i.test(text)) return 'design';
  if (/(writing|writer|author)/i.test(text)) return 'writing';
  
  // Tech & Business
  if (/(code|programming|dev|tech|github)/i.test(text)) return 'tech';
  if (/(crypto|bitcoin|nft|blockchain|trading)/i.test(text)) return 'crypto';
  if (/(business|startup|entrepreneur|company)/i.test(text)) return 'business';
  
  // Education
  if (/(study|homework|education|learn)/i.test(text)) return 'study';
  if (/(school|university|college|class)/i.test(text)) return 'school';
  if (/(english|learning|esl)/i.test(text)) return 'english';
  if (/(viet|vietnam|tieng viet)/i.test(text)) return 'vietnamese';
  
  // Lifestyle
  if (/(fitness|gym|workout|exercise)/i.test(text)) return 'fitness';
  if (/(food|cooking|recipe|chef)/i.test(text)) return 'food';
  if (/(travel|trip|vacation|tour)/i.test(text)) return 'travel';
  if (/(sport|football|basketball|soccer)/i.test(text)) return 'sports';
  if (/(chess|strategy|board)/i.test(text)) return 'chess';
  if (/(fashion|style|clothing)/i.test(text)) return 'fashion';
  if (/(beauty|makeup|cosmetic)/i.test(text)) return 'beauty';
  if (/(pet|dog|cat|animal)/i.test(text)) return 'pets';
  if (/(nature|outdoor|hiking)/i.test(text)) return 'nature';
  if (/(meditation|mindful|zen)/i.test(text)) return 'meditation';
  if (/(motivation|inspire|self.help)/i.test(text)) return 'motivation';
  
  // Social
  if (/(movie|film|cinema|series)/i.test(text)) return 'movie';
  if (/(meme|funny|joke|humor)/i.test(text)) return 'meme';
  if (/(dating|romance|relationship|love)/i.test(text)) return 'dating';
  if (/(discord)/i.test(text)) return 'discord';
  
  // Genres
  if (/(horror|scary|spooky|creepy)/i.test(text)) return 'horror';
  if (/(fantasy|magic|wizard|dragon)/i.test(text)) return 'fantasy';
  if (/(scifi|sci-fi|space|robot|futuristic)/i.test(text)) return 'scifi';
  
  return 'community'; // default
};

/* ───────────────────────────── UI helpers ───────────────────────────── */
/**
 * Card = "embed" dựng bằng Components V2 Container.
 * Embed thường KHÔNG chứa được nút; Container thì có, nên nút sẽ nằm trong cùng khung có viền màu.
 * Bố cục: header (tiêu đề + avatar) → nội dung → banner/file → đường kẻ → nút → footer.
 */
class Card {
  private blocks: string[] = [];
  private headline?: string;
  private image?: string;
  private fileName?: string;

  constructor(
    private user: User,
    private title: string,
    private color: number,
  ) {}

  /** Tiêu đề lớn (giống title của embed) */
  setTitle(text: string) {
    this.headline = text;
    return this;
  }

  /** Thêm một khối nội dung markdown */
  setDescription(markdown: string) {
    this.blocks.push(markdown);
    return this;
  }

  setImage(url: string) {
    this.image = url;
    return this;
  }

  /** Hiển thị file đính kèm (file phải được gửi kèm trong `files`) */
  addFile(name: string) {
    this.fileName = name;
    return this;
  }

  build(rows: Rows = []) {
    const container = new ContainerBuilder();

    const header = this.headline ? `-# ${this.title}\n## ${this.headline}` : `### ${this.title}`;
    container.addSectionComponents((section) =>
      section
        .addTextDisplayComponents((t) => t.setContent(header))
        .setThumbnailAccessory((thumb) => thumb.setURL(THUMBNAIL_URL || this.user.displayAvatarURL())),
    );

    for (const block of this.blocks) container.addTextDisplayComponents((t) => t.setContent(block));

    if (this.image) {
      const url = this.image;
      container.addMediaGalleryComponents((gallery) => gallery.addItems((item) => item.setURL(url)));
    }

    if (this.fileName) {
      const name = this.fileName;
      container.addFileComponents((file) => file.setURL(`attachment://${name}`));
    }

    container.addSeparatorComponents((sep) => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    for (const r of rows) container.addActionRowComponents(r);

    container.addTextDisplayComponents((t) => t.setContent(`-# Bánh Cuốn Bot`));

    return container;
  }
}

/** Khung chung: tiêu đề + màu viền */
const baseEmbed = (user: User, title: string, color: number = COLORS.primary) => new Card(user, title, color);

/** Các dòng dạng quote ">" giống /daily */
const quote = (...lines: string[]) => lines.map((l) => `> ${l}`).join('\n');
const codeBlock = (text: string) => `\`\`\`\n${text}\n\`\`\``;

/** Thanh tiến trình: ▰▰▰▰▱▱▱▱ 50% */
function bar(done: number, total: number, size = 12) {
  const pct = total === 0 ? 100 : Math.min(100, Math.round((done / total) * 100));
  const filled = Math.round((pct / 100) * size);
  return `${'▰'.repeat(filled)}${'▱'.repeat(size - filled)} **${pct}%**`;
}

/** Embed thông báo: tiêu đề + các dòng quote + gợi ý */
function infoEmbed(user: User, color: number, title: string, lines: string[], hint?: string) {
  return baseEmbed(user, title, color).setDescription(
    quote(...lines) + (hint ? `\n\n-# ${emojis.info} ${hint}` : ''),
  );
}

function errorEmbed(user: User, title: string, body?: string, detail?: string, hint?: string) {
  return baseEmbed(user, title, COLORS.danger).setDescription(
    `${emojis.error} ${body ?? title}` +
      (detail ? `\n${codeBlock(detail.slice(0, 800))}` : '') +
      (hint ? `\n\n-# ${emojis.info} ${hint}` : ''),
  );
}

const notFoundEmbed = (user: User) =>
  errorEmbed(
    user,
    'Không tìm thấy thiết kế',
    'Thiết kế đã hết hạn hoặc chưa được tạo.',
    undefined,
    'Vui lòng tạo lại bằng `/generator`',
  );

/** Embed tiến trình: danh sách bước (✅ ⏳ ▫️) + thanh tổng */
function progressEmbed(user: User, color: number, title: string, steps: Step[], hint?: string) {
  const total = steps.reduce((s, x) => s + x.total, 0);
  const done = steps.reduce((s, x) => s + x.done, 0);
  const current = steps.findIndex((s) => s.done < s.total);
  const lines = steps.map((s, idx) => {
    const icon = s.done >= s.total ? emojis.success : idx === current ? emojis.loading : emojis.bullet;
    return `${icon} ${s.label} ~ \`${s.done}/${s.total}\``;
  });
  return baseEmbed(user, title, color).setDescription(
    `${quote(...lines)}\n\n${bar(done, total)}` + (hint ? `\n\n-# ${emojis.info} ${hint}` : ''),
  );
}

/** Cập nhật tiến trình (có throttle để tránh rate limit khi edit) */
class ProgressTracker {
  private last = 0;
  constructor(
    public steps: Step[],
    private push: (steps: Step[]) => Promise<unknown>,
  ) {}

  async tick(index: number) {
    this.steps[index].done++;
    const finished = this.steps.every((s) => s.done >= s.total);
    const now = Date.now();
    if (finished || now - this.last >= PROGRESS_THROTTLE_MS) {
      this.last = now;
      await this.push(this.steps).catch((error) => {
        console.warn('Failed to update server generator progress:', error);
      });
    }
  }
}

const row = (...buttons: ButtonBuilder[]) => new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

const button = (
  action: string,
  userId: string,
  label: string,
  emoji: string,
  style: ButtonStyle,
  extra?: string | number,
) => new ButtonBuilder().setCustomId(customId(action, userId, extra)).setLabel(label).setEmoji(emoji).setStyle(style);

type Rows = ActionRowBuilder<ButtonBuilder>[];

/** Payload gửi / sửa / update tin nhắn (Components V2: không dùng content/embeds) */
const payload = (card: Card, rows: Rows = []) => ({
  flags: MessageFlags.IsComponentsV2 as any,
  components: [card.build(rows)],
});

/** Payload cho reply ẩn (chỉ người dùng thấy) */
const ephemeral = (card: Card, rows: Rows = []) => ({
  flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
  components: [card.build(rows)],
});

/* ─────────── Cây cấu trúc (có phân trang) ─────────── */
/** Dựng cây ANSI rồi chia thành các trang theo số ký tự */
function buildTreePages(design: ServerDesign): string[] {
  const lines: string[] = [];
  const cats = design.categories ?? [];
  cats.forEach((cat, ci) => {
    const lastCat = ci === cats.length - 1;
    lines.push(`${lastCat ? '└──' : '├──'} \x1b[33m${cat.emoji ?? ''} ${cat.name}\x1b[0m`);
    const chans = cat.channels ?? [];
    chans.forEach((ch, hi) => {
      const indent = lastCat ? '    ' : '│   ';
      const branch = hi === chans.length - 1 ? '└──' : '├──';
      const isText = !ch.type || ch.type === ChannelType.GuildText;
      const icon = isText ? '\x1b[32m#\x1b[0m' : '\x1b[34m♪\x1b[0m';
      lines.push(`${indent}${branch} ${icon} ${ch.emoji ? `${ch.emoji} ` : ''}${ch.name}`);
    });
  });

  const header = `\x1b[36m${design.serverName}\x1b[0m`;
  const pages: string[] = [];
  let current: string[] = [];
  let size = header.length;

  for (const line of lines) {
    if (size + line.length + 1 > TREE_PAGE_CHARS && current.length) {
      pages.push([header, ...current].join('\n'));
      current = [];
      size = header.length;
    }
    current.push(line);
    size += line.length + 1;
  }
  pages.push([header, ...current].join('\n'));
  return pages;
}

function buildStats(design: ServerDesign) {
  const channels = design.categories.flatMap((c) => c.channels ?? []);
  const voice = channels.filter(
    (c) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice,
  ).length;
  return {
    categories: design.categories.length,
    text: channels.length - voice,
    voice,
    roles: design.roles?.length ?? 0,
    total: channels.length,
  };
}

/** Màn hình kết quả: thống kê + cây (phân trang) + nút nằm trong cùng khung */
function buildDesignView(user: User, design: ServerDesign, page = 0, report?: ValidationReport) {
  const s = buildStats(design);
  const pages = buildTreePages(design);
  const safePage = Math.min(Math.max(page, 0), pages.length - 1);

  const description = [
    quote(
      `${emojis.folder} Categories \`${s.categories}\` · ${emojis.message} Text \`${s.text}\` · ${emojis.music} Voice \`${s.voice}\``,
      `${emojis.users} Roles \`${s.roles}\` · ➡️ Tổng kênh \`${s.total}\` · 📄 Trang \`${safePage + 1}/${pages.length}\``,
    ),
    `**${emojis.document} Cấu trúc server**\n\`\`\`ansi\n${pages[safePage]}\n\`\`\``,
  ];

  if (report?.themes.length) {
    description.push(`-# 🎯 Chủ đề nhận diện: ${report.themes.join(' · ')}`);
  }

  if (report?.fixes.length) {
    const shown = report.fixes.slice(0, 5).map((f) => `-# • ${f}`);
    if (report.fixes.length > 5) shown.push(`-# • … và ${report.fixes.length - 5} mục khác`);
    description.push(['-# 🛠️ Đã tự động chỉnh sửa:', ...shown].join('\n'));
  }

  if (report?.warnings.length) {
    const shown = report.warnings.slice(0, 5).map((warning) => `-# • ${warning}`);
    if (report.warnings.length > 5) shown.push(`-# • … và ${report.warnings.length - 5} cảnh báo khác`);
    description.push(['-# ⚠️ Lưu ý:', ...shown].join('\n'));
  }

  const card = baseEmbed(user, 'Server Generator')
    .setTitle(`${emojis.sparkles} ${design.serverName}`)
    .setDescription(description.join('\n\n'));

  if (BANNER_URL) card.setImage(BANNER_URL);

  const rows: Rows = [];
  if (pages.length > 1) {
    rows.push(
      row(
        button('page', user.id, 'Trước', emojis.prev, ButtonStyle.Secondary, safePage - 1).setDisabled(safePage === 0),
        button('page', user.id, 'Sau', emojis.next, ButtonStyle.Secondary, safePage + 1).setDisabled(
          safePage === pages.length - 1,
        ),
      ),
    );
  }

  rows.push(
    row(
      button('export', user.id, 'Export vào server', emojis.rocket, ButtonStyle.Success),
      button('menu', user.id, 'Menu', emojis.settings, ButtonStyle.Secondary),
    ),
  );

  return payload(card, rows);
}

/** Menu: mô tả từng tác vụ + 2 hàng nút trong cùng khung */
function buildMenuView(user: User) {
  const card = baseEmbed(user, 'Generator Menu')
    .setTitle(`${emojis.sparkles} Chọn tác vụ`)
    .setDescription(
      quote(
        `${emojis.download} **Tải JSON** • ${emojis.mail} **DM** • ${emojis.clipboard} **Import**`,
        `${emojis.settings} **Welcome/Bye** • ${emojis.refresh} **Tạo lại** • ${emojis.trash} **Xóa toàn bộ**`,
      ),
    );

  return payload(card, [
    row(
      button('json', user.id, 'JSON', emojis.download, ButtonStyle.Primary),
      button('dm', user.id, 'DM', emojis.mail, ButtonStyle.Primary),
      button('importfile', user.id, 'Import', emojis.clipboard, ButtonStyle.Primary),
    ),
    row(
      button('welcbye', user.id, 'Welcome/Bye', emojis.settings, ButtonStyle.Primary),
      button('retry', user.id, 'Tạo lại', emojis.refresh, ButtonStyle.Secondary),
      button('delete', user.id, 'Xóa', emojis.trash, ButtonStyle.Danger),
      button('back', user.id, 'Quay lại', emojis.back, ButtonStyle.Secondary),
    ),
  ]);
}

/** Welcome/Goodbye Settings Menu với toggle buttons */
async function buildWelcomeByeMenu(user: User, guildId: string) {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const welcomeConfigPath = path.join(process.cwd(), 'data', 'welcome-config.json');
  const goodbyeConfigPath = path.join(process.cwd(), 'data', 'goodbye-config.json');
  
  let welcomeEnabled = false;
  let goodbyeEnabled = false;
  let welcomeChannel = 'Chưa thiết lập';
  let goodbyeChannel = 'Chưa thiết lập';
  
  try {
    const welcomeData = JSON.parse(await fs.readFile(welcomeConfigPath, 'utf-8'));
    if (welcomeData[guildId]) {
      welcomeEnabled = welcomeData[guildId].enabled ?? false;
      if (welcomeData[guildId].channelId) {
        welcomeChannel = `<#${welcomeData[guildId].channelId}>`;
      }
    }
  } catch {}
  
  try {
    const goodbyeData = JSON.parse(await fs.readFile(goodbyeConfigPath, 'utf-8'));
    if (goodbyeData[guildId]) {
      goodbyeEnabled = goodbyeData[guildId].enabled ?? false;
      if (goodbyeData[guildId].channelId) {
        goodbyeChannel = `<#${goodbyeData[guildId].channelId}>`;
      }
    }
  } catch {}
  
  const card = baseEmbed(user, 'Welcome & Goodbye Settings')
    .setTitle(`${emojis.sparkles} Cấu hình Welcome/Goodbye`)
    .setDescription(
      quote(
        `${emojis.users} **Welcome System**`,
        `Status: ${welcomeEnabled ? `${emojis.success} Đang bật` : `❌ Đang tắt`}`,
        `Channel: ${welcomeChannel}`,
        '',
        `👋 **Goodbye System**`,
        `Status: ${goodbyeEnabled ? `${emojis.success} Đang bật` : `❌ Đang tắt`}`,
        `Channel: ${goodbyeChannel}`,
      ),
    );
  
  return payload(card, [
    row(
      button('togglewelc', user.id, welcomeEnabled ? '✅ Welcome: ON' : '❌ Welcome: OFF', '👋', 
        welcomeEnabled ? ButtonStyle.Success : ButtonStyle.Secondary),
      button('togglebye', user.id, goodbyeEnabled ? '✅ Goodbye: ON' : '❌ Goodbye: OFF', '👋',
        goodbyeEnabled ? ButtonStyle.Success : ButtonStyle.Secondary),
    ),
    row(
      button('editwelcome', user.id, 'Chỉnh sửa', emojis.edit, ButtonStyle.Primary),
      button('menu', user.id, 'Quay lại', emojis.back, ButtonStyle.Secondary),
    ),
  ]);
}

const loadingGenerateView = (user: User) =>
  payload(
    infoEmbed(
      user,
      COLORS.warning,
      'Đang tạo server với AI...',
      [
        `${emojis.chart} Phân tích yêu cầu của bạn`,
        `${emojis.art} Thiết kế cấu trúc server`,
        `${emojis.star} Chọn emoji phù hợp`,
        `${emojis.edit} Đặt tên channels và roles`,
      ],
      'Mất khoảng 10–20 giây · Model: GPT-OSS 120B',
    ),
  );

function promptModal(userId: string) {
  return new ModalBuilder()
    .setCustomId(customId('prompt', userId))
    .setTitle('🎨 Server Generator - AI Design')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('prompt')
          .setLabel('📝 Mô tả server bạn muốn tạo')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('VD: Gaming VN có kênh chào mừng, Community anime với goodbye channel, Server đơn giản')
          .setRequired(true)
          .setMinLength(10)
          .setMaxLength(4000),
      ),
    );
}

/* ───────────────────────────── AI prompt ───────────────────────────── */
/**
 * Lưu ý: tên channel/category/role chỉ dùng emoji unicode.
 * Custom emoji của bot (<:name:id>) KHÔNG dùng được trong tên channel.
 */
const SYSTEM_PROMPT = `You are a Discord server structure designer. Generate a JSON design for a Discord server based on user requirements.

AVAILABLE THEMES (30+ themes auto-detected from user prompts):

GAMING:
- Gaming: general gaming communities, clans, guilds, PvP/PvE
- Minecraft: survival, creative, build servers, redstone
- Roleplay: character roleplay, story-driven communities
- FPS: shooter games (CSGO, Valorant, COD, Battlefield)
- MOBA: League of Legends, Dota 2, arena games
- Esports: tournaments, competitive gaming, pro teams

SOCIAL & COMMUNITY:
- Community: general social hubs, hangout servers, friend groups
- Dating: romance, relationships, singles meetup
- Meme: funny content, jokes, humor communities
- Vietnamese: Vietnamese language communities

EDUCATION:
- School: general education, classes, student groups
- Study: homework help, tutoring, learning groups
- English: language learning, ESL, grammar

CREATIVE & ARTS:
- Anime: manga, otaku communities, episode discussions
- Music: producers, DJs, artists, beat-making, karaoke
- Art: drawing, design, painting, illustration
- Photography: camera enthusiasts, photo sharing
- Streaming: Twitch/YouTube content creators
- Movie: film discussions, series, Netflix watch parties

TECH & BUSINESS:
- Tech: programming, development, coding projects
- Crypto: blockchain, trading, NFT, DeFi
- Business: startups, entrepreneurs, networking

LIFESTYLE:
- Fitness: gym, workout, bodybuilding, health
- Food: cooking, recipes, culinary arts
- Travel: trips, vacations, adventure
- Sports: football, basketball, athletics
- Chess: board games, strategy games

GENRES:
- Horror: scary content, creepy stories
- Fantasy: magic, medieval, dragons
- Sci-Fi: space, futuristic, robots

Output ONLY valid JSON in this exact format:ver structure designer. Generate a JSON design for a Discord server based on user requirements.

Output ONLY valid JSON in this exact format:
{
  "serverName": "Server Name",
  "categories": [
    {
      "name": "CATEGORY NAME",
      "emoji": "👋",
      "channels": [
        {"name": "channel-name", "type": 0, "emoji": "💬"},
        {"name": "Voice Lobby", "type": 2, "emoji": "🎙️"}
      ]
    }
  ],
  "roles": [
    {"name": "Owner", "emoji": "👑", "color": "#FF0000", "permissions": []}
  ],
  "welcome": {
    "title": "Welcome Title",
    "description": "Welcome message with {user} placeholder",
    "color": "#57f287",
    "thumbnail": "👋",
    "footer": "Enjoy your stay!"
  },
  "goodbye": {
    "title": "Goodbye Title", 
    "description": "Goodbye message with {user} placeholder",
    "color": "#fee75c",
    "thumbnail": "👋",
    "footer": "See you again!"
  }
}

CRITICAL RULES:
1. Channel types: 0=Text, 2=Voice, 13=Stage ONLY (never use type 5).
2. Text channels: lowercase with hyphens (general-chat, game-discussion, memes-and-fun). Preserve native spelling and diacritics.
3. Voice channels: Title Case with spaces (Voice Lobby, Gaming Room, Music Lounge, AFK Room). Preserve native spelling and diacritics.
4. Categories: UPPERCASE. Preserve native spelling and diacritics.
5. Use ONLY standard unicode emoji. Never use custom emoji like <:name:id>.
6. For Vietnamese, always use correct Vietnamese diacritics in channel, category, role, and message names.
  - Text channels: trò-chuyện, cộng-đồng, quy-định (lowercase with hyphens)
  - Voice channels: Phòng Trò Chuyện, Phòng Chơi Game, Phòng Nhạc (Title Case with spaces)
  - Categories: CHÀO MỪNG, CỘNG ĐỒNG, GIỌNG NÓI (UPPERCASE with spaces)
7. Always include: Welcome category, Community category, Voice category.
   Voice minimum: Voice Lobby, a gaming/general room, Music, AFK.
8. Roles hierarchy: Owner, Admin, Moderator, VIP/Booster, Member (adapt names to the theme).
9. Welcome/Goodbye messages: MUST include {user} placeholder. Use emoji for thumbnail. Match theme and be friendly/warm.
10. Colors: Use hex format (#RRGGBB). Welcome = green tones, Goodbye = warm/orange tones.
11. Every category name must be unique; every text and voice channel name must be unique across the whole server.
12. Give each channel a distinct purpose-specific name. Do not repeat generic names like "General", "Chat", "Lobby", or "Voice" across categories.

VIETNAMESE EXAMPLES (preserve diacritics):
Text channels: trò-chuyện, cộng-đồng, quy-định, thông-báo, gợi-ý, trò-chơi, giải-đấu, sự-kiện, hình-ảnh, hỗ-trợ, câu-hỏi, giải-trí
Voice channels: Phòng Trò Chuyện, Phòng Chơi Game, Phòng Nhạc, Phòng Thư Giãn, Phòng Học, Phòng Karaoke, Phòng Họp
Categories: CHÀO MỪNG, CỘNG ĐỒNG, TRÒ CHƠI, GIỌNG NÓI, SỰ KIỆN, HỖ TRỢ, GIẢI ĐẤU

THEME HINTS for the request are provided in the user message. Use them as inspiration and mix freely.

DECORATION LEVELS (match the user's request, do NOT over-decorate):
- Level 1 (default / "simple", "clean", "minimal"): one plain emoji per item.
- Level 2 ("cute", "đẹp", "ngầu", "cool"): emoji + light symbols such as ★ ✦ ❃ ♡.
- Level 3 ("VIP", "premium", "fancy", "ký tự đặc biệt"): full decoration such as ༺ ༻ ╭──╮ ★彡.

Only decorate when the user asks for it.`;

const buildUserPrompt = (prompt: string, themeHint: string) =>
  `Create a Discord server structure for: ${prompt}

${themeHint}

Treat the user's requested topic, audience, language, and details as requirements. Do not replace a specific topic with a generic community template.
Make most categories and channels directly useful for the requested topic; include a few practical support categories such as welcome, rules, and voice where appropriate.
Use the detected theme guidance above to choose concrete, topic-specific channels, not generic filler.
Preserve Vietnamese diacritics exactly when the request uses Vietnamese.

Default style: clean, with just 1 emoji per item. Only use decorative characters if the user explicitly asks for them.`;

/* ───────────────────────────── Module ───────────────────────────── */
export default class ServerGeneratorModule {
  name = 'server-generator-module';
  description = 'AI-powered Discord server setup generator';
  version = '2.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  private groq: Groq | null = null;
  private designs = new Map<string, ServerDesign>(); // userId -> design
  private reports = new Map<string, ValidationReport>(); // userId -> báo cáo validate
  private deleteCodes = new Map<string, string>(); // userId -> mã xác nhận xóa

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    const apiKey = keyRotator.getGroqKey();
    if (apiKey) {
      this.groq = new Groq({ apiKey });
      console.log('  ✅ Groq AI initialized for server generator');
    }

    this.registerCommands();
    this.setupTextCommand();
    this.setupInteractionHandler();
    console.log(`✅ Server Generator module registered ${this.commands.size} command(s)`);
  }

  async shutdown() {
    console.log(`Shutting down ${this.name}`);
  }

  /* ─────────────── AI ─────────────── */
  private async generateServerDesign(prompt: string): Promise<{ design: ServerDesign; report: ValidationReport }> {
    if (!this.groq) throw new Error('AI service không khả dụng');

    const themes = detectThemes(prompt);
    const completion = await this.groq.chat.completions.create({
      model: MODEL,
      temperature: 0.85,
      max_tokens: 4000,
      top_p: 0.95,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(prompt, buildThemeHint(themes)) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    return validateDesign(parseAiJson(raw), { mode: 'ai', themes });
  }

  private aiErrorEmbed(user: User, error: Error) {
    return errorEmbed(user, 'Lỗi AI', 'Không thể tạo thiết kế server.', error.message, 'Vui lòng thử lại sau');
  }

  /* ─────────────── Commands ─────────────── */
  private registerCommands() {
    this.commands.set('generator', {
      data: new SlashCommandBuilder()
        .setName('generator')
        .setDescription('✨ Tạo cấu trúc server bằng AI: kênh, category, welcome/goodbye tự động 🎨')
        .addStringOption((option) =>
          option
            .setName('mode')
            .setDescription('Chọn tạo server bằng AI hoặc quản lý tính năng')
            .addChoices(
              { name: 'Tạo server bằng AI', value: 'create' },
              { name: 'Quản lý tính năng server', value: 'features' }
            )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      execute: async (interaction: ChatInputCommandInteraction) => {
        if (interaction.options.getString('mode') === 'features') {
          if (!interaction.guildId) {
            await interaction.reply(payload(errorEmbed(interaction.user, 'Lỗi', 'Lệnh này chỉ dùng trong server.')));
            return;
          }
          await interaction.reply(buildFeatureCard(interaction.user, interaction.guildId));
          return;
        }

        const startTime = Date.now();
        
        // Show modal NGAY LẬP TỨC - không được có bất kỳ logic nào trước
        // Discord chỉ cho 3 giây để respond, phải ưu tiên showModal trước
        await interaction.showModal(promptModal(interaction.user.id)).catch((error: any) => {
          const elapsed = Date.now() - startTime;
          console.error(`❌ Modal show failed after ${elapsed}ms:`, error.code, error.message);
        });
        
        const elapsed = Date.now() - startTime;
        if (elapsed > 1000) {
          console.warn(`⚠️ Modal shown in ${elapsed}ms (slow!)`);
        }
      },
    });
  }

  /** Lệnh text: !gen <mô tả> */
  private setupTextCommand() {
    this.client.on('messageCreate', async (message: Message) => {
      if (message.author.bot || !message.guild) return;
      if (!message.content.startsWith('!gen ')) return;

      const user = message.author;
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        return void message.reply(payload(errorEmbed(user, 'Thiếu quyền', 'Bạn cần quyền **Administrator**!')));
      }

      const prompt = message.content.slice(5).trim();
      if (prompt.length < 10) {
        return void message.reply(
          payload(
            errorEmbed(user, 'Prompt quá ngắn', 'Tối thiểu 10 ký tự.', undefined, 'Ví dụ: `!gen server gaming cute Vietnam`'),
          ),
        );
      }

      console.log(`🎨 Text command by ${user.tag}: ${prompt.substring(0, 100)}`);
      const reply = await message.reply(loadingGenerateView(user));

      try {
        const { design, report } = await this.generateServerDesign(prompt);
        this.designs.set(user.id, design);
        this.reports.set(user.id, report);
        await reply.edit(buildDesignView(user, design, 0, report));
      } catch (error: any) {
        console.error('Text command generation error:', error);
        await reply.edit(payload(this.aiErrorEmbed(user, error)));
      }
    });
  }

  /* ─────────────── Interaction router ─────────────── */
  private setupInteractionHandler() {
    this.client.on('interactionCreate', async (interaction) => {
      const startTime = Date.now(); // Track routing performance
      
      try {
        if (interaction.isModalSubmit() && interaction.customId.startsWith('gen:')) {
          const routeTime = Date.now() - startTime;
          if (routeTime > 100) {
            console.warn(`⚠️ Generator modal routing took ${routeTime}ms`);
          }
          
          // Log total time from interaction creation
          const totalTime = Date.now() - interaction.createdTimestamp;
          if (totalTime > 2000) {
            console.warn(`⚠️ Generator modal ${interaction.customId} is ${totalTime}ms old (may timeout)`);
          }
          
          await this.handleModal(interaction);
        } else if (interaction.isButton() && interaction.customId.startsWith('gen:')) {
          const routeTime = Date.now() - startTime;
          if (routeTime > 100) {
            console.warn(`⚠️ Generator button routing took ${routeTime}ms`);
          }
          await this.handleButton(interaction);
        } else if (interaction.isStringSelectMenu() && interaction.customId.startsWith('settings:')) {
          await this.handleFeatureSelect(interaction);
        }
      } catch (error) {
        console.error('Server generator interaction error:', error);
      }
    });
  }

  private async handleFeatureSelect(interaction: StringSelectMenuInteraction) {
    const [, action, ownerId] = interaction.customId.split(':');
    if (action !== 'toggle') return;

    if (interaction.user.id !== ownerId) {
      await interaction.reply(buildFeatureErrorCard(interaction.user, 'Lỗi', 'Menu này không thuộc về bạn.'));
      return;
    }

    if (!interaction.guildId) {
      await interaction.reply(buildFeatureErrorCard(interaction.user, 'Lỗi', 'Lệnh này chỉ dùng trong server.'));
      return;
    }

    const feature = FEATURES.find((option) => option.value === interaction.values[0]);
    if (!feature) {
      await interaction.reply(buildFeatureErrorCard(interaction.user, 'Lỗi', 'Tính năng không hợp lệ.'));
      return;
    }

    try {
      const newState = !getGuildFeatures(interaction.guildId)[feature.value];
      setGuildFeature(interaction.guildId, feature.value as FeatureKey, newState);
      await interaction.reply(buildFeatureSuccessCard(interaction.user, feature.label, newState));
      await interaction.message.edit(buildFeatureCard(interaction.user, interaction.guildId));
    } catch (error) {
      console.error('Error toggling server feature:', error);
      await interaction.reply(
        buildFeatureErrorCard(interaction.user, 'Lỗi', 'Không thể cập nhật cài đặt tính năng.')
      ).catch(() => {});
    }
  }

  private parseId(id: string) {
    const [, action, ownerId, extra] = id.split(':');
    return { action, ownerId, extra };
  }

  /* ─────────────── Modals ─────────────── */
  private async handleModal(i: ModalSubmitInteraction) {
    const { action, ownerId } = this.parseId(i.customId);
    if (i.user.id !== ownerId) return;

    switch (action) {
      case 'prompt':
        return this.onPromptSubmit(i);
      case 'importjson':
        return this.onImportSubmit(i);
      case 'editwelcbye':
        return this.onEditWelcomeSubmit(i);
      case 'confirmdelete':
        return this.onDeleteConfirm(i);
    }
  }

  private async onPromptSubmit(i: ModalSubmitInteraction) {
    try {
      await i.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (error: any) {
      if (error.code === 10062 || error.code === 40060) {
        console.error(`Modal submit interaction issue: ${error.code}`);
        return;
      }
      throw error;
    }

    await i.editReply(loadingGenerateView(i.user));

    try {
      const { design, report } = await this.generateServerDesign(i.fields.getTextInputValue('prompt'));
      this.designs.set(i.user.id, design);
      this.reports.set(i.user.id, report);
      await i.editReply(buildDesignView(i.user, design, 0, report));
    } catch (error: any) {
      console.error('Modal generation error:', error);
      await i.editReply(payload(this.aiErrorEmbed(i.user, error))).catch(() => {});
    }
  }

  private async onImportSubmit(i: ModalSubmitInteraction) {
    try {
      await i.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (error: any) {
      if (error.code === 10062 || error.code === 40060) return;
      throw error;
    }

    try {
      const { design, report } = validateDesign(JSON.parse(i.fields.getTextInputValue('json_content')), {
        mode: 'import',
      });
      this.designs.set(i.user.id, design);
      this.reports.set(i.user.id, report);
      await i.editReply(buildDesignView(i.user, design, 0, report));
    } catch (error: any) {
      await i.editReply(
        payload(errorEmbed(i.user, 'Lỗi Import', 'JSON không hợp lệ.', error.message, 'Kiểm tra lại format JSON')),
      );
    }
  }

  private async onEditWelcomeSubmit(i: ModalSubmitInteraction) {
    try {
      await i.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (error: any) {
      if (error.code === 10062 || error.code === 40060) return;
      throw error;
    }

    const welcomeEnabled = i.fields.getTextInputValue('welcome_enabled').trim().toLowerCase();
    const goodbyeEnabled = i.fields.getTextInputValue('goodbye_enabled').trim().toLowerCase();
    const channelId = i.fields.getTextInputValue('channel_id').trim();
    const welcomeMsg = i.fields.getTextInputValue('welcome_message').trim();
    const goodbyeMsg = i.fields.getTextInputValue('goodbye_message').trim();

    if (!welcomeEnabled && !goodbyeEnabled && !channelId && !welcomeMsg && !goodbyeMsg) {
      return i.editReply(
        payload(errorEmbed(i.user, 'Không có thay đổi', 'Vui lòng nhập ít nhất một trường để cập nhật.'))
      );
    }

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Load welcome config
      const welcomeConfigPath = path.join(process.cwd(), 'data', 'welcome-config.json');
      const goodbyeConfigPath = path.join(process.cwd(), 'data', 'goodbye-config.json');
      
      let updates: string[] = [];
      
      // Update welcome
      if (welcomeEnabled || welcomeMsg) {
        let welcomeData: any = {};
        try {
          const data = await fs.readFile(welcomeConfigPath, 'utf-8');
          welcomeData = JSON.parse(data);
        } catch {}
        
        if (!welcomeData[i.guildId!]) {
          welcomeData[i.guildId!] = { 
            guildId: i.guildId!,
            channelId: '',
            message: 'Welcome to the server, {user}!',
            embedEnabled: true,
            enabled: true 
          };
        }
        
        // Toggle enabled status
        if (welcomeEnabled) {
          const shouldEnable = welcomeEnabled === 'on' || welcomeEnabled === '1' || welcomeEnabled === 'true';
          welcomeData[i.guildId!].enabled = shouldEnable;
          updates.push(`${shouldEnable ? emojis.success : '❌'} Welcome ${shouldEnable ? 'đã bật' : 'đã tắt'}`);
        }
        
        // Update message
        if (welcomeMsg) {
          welcomeData[i.guildId!].message = welcomeMsg;
          updates.push(`${emojis.success} Welcome message đã cập nhật`);
        }
        
        // Update channel
        if (channelId) {
          welcomeData[i.guildId!].channelId = channelId;
        }
        
        await fs.writeFile(welcomeConfigPath, JSON.stringify(welcomeData, null, 2));
      }
      
      // Update goodbye
      if (goodbyeEnabled || goodbyeMsg) {
        let goodbyeData: any = {};
        try {
          const data = await fs.readFile(goodbyeConfigPath, 'utf-8');
          goodbyeData = JSON.parse(data);
        } catch {}
        
        if (!goodbyeData[i.guildId!]) {
          goodbyeData[i.guildId!] = { 
            channelId: '',
            message: '{user} has left the server. Goodbye!',
            embedEnabled: true,
            enabled: true 
          };
        }
        
        // Toggle enabled status
        if (goodbyeEnabled) {
          const shouldEnable = goodbyeEnabled === 'on' || goodbyeEnabled === '1' || goodbyeEnabled === 'true';
          goodbyeData[i.guildId!].enabled = shouldEnable;
          updates.push(`${shouldEnable ? emojis.success : '❌'} Goodbye ${shouldEnable ? 'đã bật' : 'đã tắt'}`);
        }
        
        // Update message
        if (goodbyeMsg) {
          goodbyeData[i.guildId!].message = goodbyeMsg;
          updates.push(`${emojis.success} Goodbye message đã cập nhật`);
        }
        
        // Update channel
        if (channelId && !welcomeMsg && !welcomeEnabled) {
          goodbyeData[i.guildId!].channelId = channelId;
        }
        
        await fs.writeFile(goodbyeConfigPath, JSON.stringify(goodbyeData, null, 2));
      }
      
      await i.editReply(
        payload(
          infoEmbed(
            i.user,
            COLORS.success,
            'Cập nhật thành công!',
            updates.length ? updates : [`${emojis.info} Không có thay đổi nào được áp dụng`],
            'Thử nghiệm bằng cách vào/rời server'
          )
        )
      );
    } catch (error: any) {
      await i.editReply(
        payload(errorEmbed(i.user, 'Lỗi cập nhật', 'Không thể lưu cấu hình.', error.message))
      );
    }
  }

  private async onEditWelcome(i: ButtonInteraction) {
    try {
      // Show modal để chọn welcome hoặc goodbye
      const modal = new ModalBuilder()
        .setCustomId(customId('editwelcbye', i.user.id))
        .setTitle('✏️ Chỉnh sửa Welcome/Goodbye')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('welcome_enabled')
              .setLabel('Bật Welcome? (on/off, trống = không đổi)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('on hoặc off')
              .setRequired(false)
              .setMaxLength(3)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('goodbye_enabled')
              .setLabel('Bật Goodbye? (on/off, trống = không đổi)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('on hoặc off')
              .setRequired(false)
              .setMaxLength(3)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('channel_id')
              .setLabel('Channel ID (để trống = giữ nguyên)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('1234567890123456789')
              .setRequired(false)
              .setMaxLength(20)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('welcome_message')
              .setLabel('Welcome Message (để trống = không đổi)')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Chào mừng {user} đến {server}! 🎉')
              .setRequired(false)
              .setMaxLength(500)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('goodbye_message')
              .setLabel('Goodbye Message (để trống = không đổi)')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('{user} đã rời {server}. Tạm biệt! 👋')
              .setRequired(false)
              .setMaxLength(500)
          )
        );
      
      await i.showModal(modal);
    } catch (error) {
      console.error('Error showing welcome edit modal:', error);
    }
  }

  private async onToggleWelcome(i: ButtonInteraction) {
    if (!i.guildId) {
      return i.reply(ephemeral(errorEmbed(i.user, 'Lỗi', 'Lệnh chỉ dùng trong server'))).catch(() => {});
    }

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const welcomeConfigPath = path.join(process.cwd(), 'data', 'welcome-config.json');
      
      let welcomeData: any = {};
      try {
        const data = await fs.readFile(welcomeConfigPath, 'utf-8');
        welcomeData = JSON.parse(data);
      } catch {}
      
      if (!welcomeData[i.guildId]) {
        welcomeData[i.guildId] = {
          guildId: i.guildId,
          channelId: '',
          message: 'Welcome to the server, {user}!',
          embedEnabled: true,
          enabled: false
        };
      }
      
      // Toggle
      welcomeData[i.guildId].enabled = !welcomeData[i.guildId].enabled;
      await fs.writeFile(welcomeConfigPath, JSON.stringify(welcomeData, null, 2));
      
      // Update UI
      const menu = await buildWelcomeByeMenu(i.user, i.guildId);
      await i.update(menu);
    } catch (error: any) {
      await i.reply(ephemeral(errorEmbed(i.user, 'Lỗi', 'Không thể cập nhật', error.message))).catch(() => {});
    }
  }

  private async onToggleGoodbye(i: ButtonInteraction) {
    if (!i.guildId) {
      return i.reply(ephemeral(errorEmbed(i.user, 'Lỗi', 'Lệnh chỉ dùng trong server'))).catch(() => {});
    }

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const goodbyeConfigPath = path.join(process.cwd(), 'data', 'goodbye-config.json');
      
      let goodbyeData: any = {};
      try {
        const data = await fs.readFile(goodbyeConfigPath, 'utf-8');
        goodbyeData = JSON.parse(data);
      } catch {}
      
      if (!goodbyeData[i.guildId]) {
        goodbyeData[i.guildId] = {
          channelId: '',
          message: '{user} has left the server. Goodbye!',
          embedEnabled: true,
          enabled: false
        };
      }
      
      // Toggle
      goodbyeData[i.guildId].enabled = !goodbyeData[i.guildId].enabled;
      await fs.writeFile(goodbyeConfigPath, JSON.stringify(goodbyeData, null, 2));
      
      // Update UI
      const menu = await buildWelcomeByeMenu(i.user, i.guildId);
      await i.update(menu);
    } catch (error: any) {
      await i.reply(ephemeral(errorEmbed(i.user, 'Lỗi', 'Không thể cập nhật', error.message))).catch(() => {});
    }
  }

  private async onDeleteConfirm(i: ModalSubmitInteraction) {
    const submitTime = Date.now();
    
    // Defer ngay lập tức để tránh timeout
    try {
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const deferTime = Date.now() - submitTime;
      if (deferTime > 1000) {
        console.warn(`⚠️ [DELETE CONFIRM] Slow defer: ${deferTime}ms from modal submit`);
      }
    } catch (error: any) {
      const failTime = Date.now() - submitTime;
      console.error(`❌ [DELETE CONFIRM] Defer failed after ${failTime}ms - code: ${error.code}`);
      if (error.code === 10062 || error.code === 40060) {
        console.log('Delete modal interaction expired');
        return;
      }
      throw error;
    }

    const entered = i.fields.getTextInputValue('confirm_code').trim();
    const expected = this.deleteCodes.get(i.user.id);

    console.log(`[DELETE CONFIRM] User: ${i.user.id}, Entered: "${entered}", Expected: "${expected}"`);

    if (!expected || entered !== expected) {
      return i.editReply(
        payload(errorEmbed(i.user, 'Mã xác nhận sai', 'Code không đúng.', undefined, 'Vui lòng thử lại')),
      );
    }

    this.deleteCodes.delete(i.user.id);

    const plan = this.planWipe(i);
    const steps: Step[] = [
      { label: `${emojis.shield} Xóa roles`, done: 0, total: plan.roles.length },
      { label: `${emojis.folder} Xóa categories`, done: 0, total: plan.categories.length },
      { label: `${emojis.message} Xóa text channels`, done: 0, total: plan.text.length },
      { label: `${emojis.music} Xóa voice channels`, done: 0, total: plan.voice.length },
    ];

    const render = (s: Step[]) =>
      i.editReply(payload(progressEmbed(i.user, COLORS.danger, 'Đang xóa...', s, 'Vui lòng không tắt bot')));

    await render(steps).catch(() => {});

    try {
      const r = await this.wipeGuild(plan, new ProgressTracker(steps, render));

      await i
        .editReply(
          payload(
            infoEmbed(
              i.user,
              COLORS.success,
              'Xóa thành công!',
              [
                `${emojis.shield} Roles ~ \`${r.roles}\``,
                `${emojis.folder} Categories ~ \`${r.categories}\``,
                `${emojis.message} Text channels ~ \`${r.text}\``,
                `${emojis.music} Voice channels ~ \`${r.voice}\``,
                '',
                bar(1, 1),
              ].filter((l) => l !== ''),
              'Được giữ lại: @everyone, role của bot, system channels và channel hiện tại',
            ),
          ),
        )
        .catch(() => {});
    } catch (error: any) {
      await i.editReply(payload(errorEmbed(i.user, 'Lỗi Delete', 'Không thể xóa.', error.message))).catch(() => {});
    }
  }

  /* ─────────────── Buttons ─────────────── */
  private async handleButton(i: ButtonInteraction) {
    const { action, ownerId, extra } = this.parseId(i.customId);
    
    // Check ownership cho reply ngay
    if (i.user.id !== ownerId) {
      return i.reply(ephemeral(errorEmbed(i.user, 'Lỗi', 'Đây không phải button của bạn!'))).catch(() => {});
    }

    try {
      switch (action) {
        // Actions cần defer NGAY - xử lý lâu
        case 'export':
          await i.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
          return this.onExportDeferred(i, this.designs.get(i.user.id), this.reports.get(i.user.id)?.themes);
        case 'json':
          await i.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
          return this.onSendJsonDeferred(i, this.designs.get(i.user.id), false);
        case 'dm':
          await i.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
          return this.onSendJsonDeferred(i, this.designs.get(i.user.id), true);
        case 'template':
          await i.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
          return this.onTemplateDeferred(i);
          
        // Modal actions - KHÔNG defer, show modal ngay
        case 'delete':
          return this.onDeleteRequest(i);
        case 'retry':
          return i.showModal(promptModal(i.user.id)).catch(() => {});
        case 'importfile':
          return i.showModal(this.importModal(i.user.id)).catch(() => {});
        case 'editwelcome':
          return this.onEditWelcome(i);
          
        // Actions chỉ update UI, không cần defer
        case 'menu': {
          const design = this.designs.get(i.user.id);
          if (!design) return i.update(payload(notFoundEmbed(i.user))).catch(() => {});
          return i.update(buildMenuView(i.user)).catch(() => {});
        }
        case 'welcbye': {
          if (!i.guildId) return i.reply(ephemeral(errorEmbed(i.user, 'Lỗi', 'Lệnh chỉ dùng trong server'))).catch(() => {});
          const menu = await buildWelcomeByeMenu(i.user, i.guildId);
          return i.update(menu).catch(() => {});
        }
        case 'togglewelc':
          return this.onToggleWelcome(i);
        case 'togglebye':
          return this.onToggleGoodbye(i);
        case 'back': {
          const design = this.designs.get(i.user.id);
          if (!design) return i.update(payload(notFoundEmbed(i.user))).catch(() => {});
          return i.update(buildDesignView(i.user, design, 0, this.reports.get(i.user.id))).catch(() => {});
        }
        case 'page': {
          const design = this.designs.get(i.user.id);
          if (!design) return i.update(payload(notFoundEmbed(i.user))).catch(() => {});
          return i.update(buildDesignView(i.user, design, Number(extra) || 0, this.reports.get(i.user.id))).catch(() => {});
        }
      }
    } catch (error: any) {
      if (error.code === 10062 || error.code === 40060) {
        console.error('Button interaction expired or already acknowledged');
        return;
      }
      throw error;
    }
  }

  private importModal(userId: string) {
    return new ModalBuilder()
      .setCustomId(customId('importjson', userId))
      .setTitle('📥 Import Server Design')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('json_content')
            .setLabel('Paste JSON content')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Paste your server design JSON here...')
            .setRequired(true)
            .setMinLength(50)
            .setMaxLength(4000),
        ),
      );
  }

  private async onSendJsonDeferred(i: ButtonInteraction, design: ServerDesign | undefined, viaDm: boolean) {
    // Interaction đã được defer ở handleButton
    if (!design) return i.editReply(payload(notFoundEmbed(i.user)));

    const file = {
      attachment: Buffer.from(JSON.stringify(design, null, 2), 'utf-8'),
      name: 'server-design.json',
    };

    if (!viaDm) {
      return i.editReply({
        ...payload(
          infoEmbed(i.user, COLORS.success, 'JSON Export', [
            `${emojis.document} File thiết kế server của bạn`,
            `${emojis.info} Tải file đính kèm bên dưới`,
          ]).addFile(file.name),
        ),
        files: [file],
      });
    }

    try {
      await i.user.send({
        ...payload(
          infoEmbed(i.user, COLORS.success, 'Server Design Export', [
            `${emojis.document} Đây là file thiết kế server của bạn`,
          ]).addFile(file.name),
        ),
        files: [file],
      });

      await i.editReply(
        payload(
          infoEmbed(
            i.user,
            COLORS.success,
            'Đã gửi DM!',
            [`${emojis.save} File JSON đã được gửi vào tin nhắn riêng`],
            'Kiểm tra DM để tải file',
          ),
        ),
      );
    } catch {
      await i.editReply(
        payload(
          errorEmbed(
            i.user,
            'Không thể gửi DM',
            'Có thể bạn đã tắt DM từ thành viên server.',
            undefined,
            'Bật DM trong User Settings → Privacy & Safety',
          ),
        ),
      );
    }
  }

  private async onTemplateDeferred(i: ButtonInteraction) {
    // Show template selection menu
    const templates = {
      gaming: '🎮 Gaming Server',
      community: '💬 Community',
      school: '📚 Study/School',
      anime: '🎌 Anime/Manga',
      music: '🎵 Music',
      tech: '💻 Technology',
      crypto: '₿ Crypto/NFT',
      business: '💼 Business',
    };

    const rows = [
      row(
        button('gen_tpl_gaming', i.user.id, 'Gaming', '🎮', ButtonStyle.Primary),
        button('gen_tpl_community', i.user.id, 'Community', '💬', ButtonStyle.Primary),
        button('gen_tpl_school', i.user.id, 'School', '📚', ButtonStyle.Primary),
        button('gen_tpl_anime', i.user.id, 'Anime', '🎌', ButtonStyle.Primary),
      ),
      row(
        button('gen_tpl_music', i.user.id, 'Music', '🎵', ButtonStyle.Primary),
        button('gen_tpl_tech', i.user.id, 'Tech', '💻', ButtonStyle.Primary),
        button('gen_tpl_crypto', i.user.id, 'Crypto', '₿', ButtonStyle.Primary),
        button('gen_tpl_business', i.user.id, 'Business', '💼', ButtonStyle.Primary),
      ),
      row(button('menu', i.user.id, 'Back', '◀', ButtonStyle.Secondary)),
    ];

    await i.editReply({
      ...payload(
        infoEmbed(
          i.user,
          COLORS.primary,
          'Choose Template',
          [
            '🎯 Chọn chủ đề server bạn muốn:',
            '',
            '• **Gaming** - Server game với roles, voice channels',
            '• **Community** - Cộng đồng giao lưu, sự kiện',
            '• **School** - Học tập, môn học, lớp học',
            '• **Anime** - Anime/Manga fan server',
            '• **Music** - Âm nhạc, producer, DJ',
            '• **Tech** - Lập trình, công nghệ',
            '• **Crypto** - Cryptocurrency, NFT, Trading',
            '• **Business** - Kinh doanh, startup',
          ],
          'Chọn template rồi tải file JSON để chỉnh sửa',
        ),
      ),
      ...rows,
    });
  }

  private getTemplate(type: string): ServerDesign {
    const templates: Record<string, ServerDesign> = {
      gaming: {
        serverName: '🎮 Gaming Server',
        roles: [
          { name: 'Owner', emoji: '👑', color: '#FF0000' },
          { name: 'Admin', emoji: '🛡️', color: '#FFA500' },
          { name: 'Moderator', emoji: '⚔️', color: '#FFFF00' },
          { name: 'VIP', emoji: '⭐', color: '#FFD700' },
          { name: 'Gamer', emoji: '🎮', color: '#00FF00' },
          { name: 'Member', emoji: '👤', color: '#808080' },
        ],
        categories: [
          {
            name: 'WELCOME',
            emoji: '👋',
            channels: [
              { name: 'welcome', type: 0, emoji: '👋' },
              { name: 'rules', type: 0, emoji: '📜' },
              { name: 'announcements', type: 0, emoji: '📢' },
            ],
          },
          {
            name: 'COMMUNITY',
            emoji: '💬',
            channels: [
              { name: 'general', type: 0, emoji: '💬' },
              { name: 'off-topic', type: 0, emoji: '🎲' },
              { name: 'introductions', type: 0, emoji: '🙋' },
            ],
          },
          {
            name: 'GAMING',
            emoji: '🎮',
            channels: [
              { name: 'game-discussion', type: 0, emoji: '🎮' },
              { name: 'looking-for-group', type: 0, emoji: '🔍' },
              { name: 'tournaments', type: 0, emoji: '🏆' },
            ],
          },
          {
            name: 'VOICE CHANNELS',
            emoji: '🔊',
            channels: [
              { name: 'Lobby', type: 2, emoji: '🎙️' },
              { name: 'Gaming 1', type: 2, emoji: '🎮' },
              { name: 'Gaming 2', type: 2, emoji: '🎮' },
              { name: 'Music Room', type: 2, emoji: '🎵' },
              { name: 'AFK', type: 2, emoji: '💤' },
            ],
          },
        ],
      },
      community: {
        serverName: '💬 Community Hub',
        roles: [
          { name: 'Admin', emoji: '⚡', color: '#E74C3C' },
          { name: 'Moderator', emoji: '🛡️', color: '#3498DB' },
          { name: 'Active Member', emoji: '⭐', color: '#F1C40F' },
          { name: 'Member', emoji: '👥', color: '#95A5A6' },
        ],
        categories: [
          {
            name: 'INFO',
            emoji: 'ℹ️',
            channels: [
              { name: 'welcome', type: 0, emoji: '👋' },
              { name: 'rules', type: 0, emoji: '📜' },
              { name: 'announcements', type: 0, emoji: '📣' },
              { name: 'updates', type: 0, emoji: '🆕' },
            ],
          },
          {
            name: 'CHAT',
            emoji: '💬',
            channels: [
              { name: 'general', type: 0, emoji: '💬' },
              { name: 'casual-chat', type: 0, emoji: '☕' },
              { name: 'memes', type: 0, emoji: '😂' },
              { name: 'introductions', type: 0, emoji: '👋' },
            ],
          },
          {
            name: 'EVENTS',
            emoji: '🎉',
            channels: [
              { name: 'events', type: 0, emoji: '🎊' },
              { name: 'giveaways', type: 0, emoji: '🎁' },
              { name: 'contests', type: 0, emoji: '🏆' },
            ],
          },
          {
            name: 'VOICE',
            emoji: '🔊',
            channels: [
              { name: 'Lounge', type: 2, emoji: '🛋️' },
              { name: 'Hangout', type: 2, emoji: '💬' },
              { name: 'Music', type: 2, emoji: '🎵' },
            ],
          },
        ],
      },
      school: {
        serverName: '📚 Study Server',
        roles: [
          { name: 'Teacher', emoji: '👨‍🏫', color: '#E74C3C' },
          { name: 'Student Leader', emoji: '📚', color: '#3498DB' },
          { name: 'Student', emoji: '🎓', color: '#95A5A6' },
        ],
        categories: [
          {
            name: 'INFO',
            emoji: 'ℹ️',
            channels: [
              { name: 'announcements', type: 0, emoji: '📢' },
              { name: 'schedule', type: 0, emoji: '📅' },
              { name: 'resources', type: 0, emoji: '📚' },
            ],
          },
          {
            name: 'SUBJECTS',
            emoji: '📖',
            channels: [
              { name: 'math', type: 0, emoji: '🔢' },
              { name: 'science', type: 0, emoji: '🔬' },
              { name: 'english', type: 0, emoji: '📝' },
              { name: 'programming', type: 0, emoji: '💻' },
            ],
          },
          {
            name: 'STUDY',
            emoji: '✍️',
            channels: [
              { name: 'homework-help', type: 0, emoji: '❓' },
              { name: 'study-groups', type: 0, emoji: '👥' },
              { name: 'projects', type: 0, emoji: '📊' },
            ],
          },
          {
            name: 'VOICE',
            emoji: '🎙️',
            channels: [
              { name: 'Study Room 1', type: 2, emoji: '📚' },
              { name: 'Study Room 2', type: 2, emoji: '📚' },
              { name: 'Group Study', type: 2, emoji: '👥' },
            ],
          },
        ],
      },
      anime: {
        serverName: '🎌 Anime Hub',
        roles: [
          { name: 'Admin', emoji: '⚔️', color: '#E74C3C' },
          { name: 'Moderator', emoji: '🛡️', color: '#9B59B6' },
          { name: 'Otaku', emoji: '🎌', color: '#E91E63' },
          { name: 'Member', emoji: '👤', color: '#95A5A6' },
        ],
        categories: [
          {
            name: 'INFO',
            emoji: 'ℹ️',
            channels: [
              { name: 'welcome', type: 0, emoji: '👋' },
              { name: 'rules', type: 0, emoji: '📜' },
              { name: 'announcements', type: 0, emoji: '📢' },
            ],
          },
          {
            name: 'ANIME',
            emoji: '🎌',
            channels: [
              { name: 'anime-discussion', type: 0, emoji: '🎌' },
              { name: 'manga', type: 0, emoji: '📖' },
              { name: 'recommendations', type: 0, emoji: '⭐' },
              { name: 'spoilers', type: 0, emoji: '🚨' },
            ],
          },
          {
            name: 'COMMUNITY',
            emoji: '💬',
            channels: [
              { name: 'general', type: 0, emoji: '💬' },
              { name: 'art-sharing', type: 0, emoji: '🎨' },
              { name: 'memes', type: 0, emoji: '😂' },
            ],
          },
          {
            name: 'VOICE',
            emoji: '🔊',
            channels: [
              { name: 'Watch Together', type: 2, emoji: '📺' },
              { name: 'Voice Chat', type: 2, emoji: '💬' },
            ],
          },
        ],
      },
      music: {
        serverName: '🎵 Music Community',
        roles: [
          { name: 'Producer', emoji: '🎧', color: '#E74C3C' },
          { name: 'DJ', emoji: '🎚️', color: '#9B59B6' },
          { name: 'Artist', emoji: '🎤', color: '#3498DB' },
          { name: 'Fan', emoji: '🎵', color: '#95A5A6' },
        ],
        categories: [
          {
            name: 'INFO',
            emoji: 'ℹ️',
            channels: [
              { name: 'welcome', type: 0, emoji: '👋' },
              { name: 'rules', type: 0, emoji: '📜' },
              { name: 'events', type: 0, emoji: '🎊' },
            ],
          },
          {
            name: 'MUSIC',
            emoji: '🎵',
            channels: [
              { name: 'music-discussion', type: 0, emoji: '🎵' },
              { name: 'share-your-music', type: 0, emoji: '🎶' },
              { name: 'feedback', type: 0, emoji: '💬' },
              { name: 'production-tips', type: 0, emoji: '🎚️' },
            ],
          },
          {
            name: 'COLLAB',
            emoji: '🤝',
            channels: [
              { name: 'collaborations', type: 0, emoji: '🤝' },
              { name: 'samples-loops', type: 0, emoji: '🔄' },
            ],
          },
          {
            name: 'VOICE',
            emoji: '🎙️',
            channels: [
              { name: 'Listening Party', type: 2, emoji: '🎧' },
              { name: 'Studio Session', type: 2, emoji: '🎚️' },
              { name: 'Music Voice', type: 2, emoji: '🎵' },
            ],
          },
        ],
      },
      tech: {
        serverName: '💻 Tech Community',
        roles: [
          { name: 'Senior Dev', emoji: '🚀', color: '#E74C3C' },
          { name: 'Developer', emoji: '💻', color: '#3498DB' },
          { name: 'Learning', emoji: '📚', color: '#F1C40F' },
          { name: 'Member', emoji: '👤', color: '#95A5A6' },
        ],
        categories: [
          {
            name: 'INFO',
            emoji: 'ℹ️',
            channels: [
              { name: 'welcome', type: 0, emoji: '👋' },
              { name: 'rules', type: 0, emoji: '📜' },
              { name: 'resources', type: 0, emoji: '📚' },
            ],
          },
          {
            name: 'PROGRAMMING',
            emoji: '💻',
            channels: [
              { name: 'general-dev', type: 0, emoji: '💻' },
              { name: 'web-dev', type: 0, emoji: '🌐' },
              { name: 'mobile-dev', type: 0, emoji: '📱' },
              { name: 'backend', type: 0, emoji: '⚙️' },
            ],
          },
          {
            name: 'HELP',
            emoji: '❓',
            channels: [
              { name: 'help', type: 0, emoji: '❓' },
              { name: 'code-review', type: 0, emoji: '👀' },
              { name: 'projects', type: 0, emoji: '📊' },
            ],
          },
          {
            name: 'VOICE',
            emoji: '🎙️',
            channels: [
              { name: 'Pair Programming', type: 2, emoji: '👥' },
              { name: 'Voice Chat', type: 2, emoji: '💬' },
            ],
          },
        ],
      },
      crypto: {
        serverName: '₿ Crypto Hub',
        roles: [
          { name: 'Whale', emoji: '🐋', color: '#FFD700' },
          { name: 'Trader', emoji: '📈', color: '#00FF00' },
          { name: 'Holder', emoji: '💎', color: '#3498DB' },
          { name: 'Member', emoji: '👤', color: '#95A5A6' },
        ],
        categories: [
          {
            name: 'INFO',
            emoji: 'ℹ️',
            channels: [
              { name: 'welcome', type: 0, emoji: '👋' },
              { name: 'rules', type: 0, emoji: '📜' },
              { name: 'announcements', type: 0, emoji: '📢' },
            ],
          },
          {
            name: 'TRADING',
            emoji: '📈',
            channels: [
              { name: 'crypto-discussion', type: 0, emoji: '₿' },
              { name: 'trading-signals', type: 0, emoji: '📊' },
              { name: 'nft', type: 0, emoji: '🎨' },
              { name: 'technical-analysis', type: 0, emoji: '📈' },
            ],
          },
          {
            name: 'COMMUNITY',
            emoji: '💬',
            channels: [
              { name: 'general', type: 0, emoji: '💬' },
              { name: 'memes', type: 0, emoji: '😂' },
            ],
          },
          {
            name: 'VOICE',
            emoji: '🎙️',
            channels: [
              { name: 'Trading Voice', type: 2, emoji: '📈' },
              { name: 'Voice Chat', type: 2, emoji: '💬' },
            ],
          },
        ],
      },
      business: {
        serverName: '💼 Business Hub',
        roles: [
          { name: 'CEO', emoji: '👔', color: '#2C3E50' },
          { name: 'Manager', emoji: '📊', color: '#3498DB' },
          { name: 'Entrepreneur', emoji: '🚀', color: '#F1C40F' },
          { name: 'Member', emoji: '👤', color: '#95A5A6' },
        ],
        categories: [
          {
            name: 'INFO',
            emoji: 'ℹ️',
            channels: [
              { name: 'welcome', type: 0, emoji: '👋' },
              { name: 'rules', type: 0, emoji: '📜' },
              { name: 'announcements', type: 0, emoji: '📢' },
            ],
          },
          {
            name: 'BUSINESS',
            emoji: '💼',
            channels: [
              { name: 'general-business', type: 0, emoji: '💼' },
              { name: 'marketing', type: 0, emoji: '📈' },
              { name: 'finance', type: 0, emoji: '💰' },
              { name: 'startups', type: 0, emoji: '🚀' },
            ],
          },
          {
            name: 'NETWORKING',
            emoji: '🤝',
            channels: [
              { name: 'networking', type: 0, emoji: '🤝' },
              { name: 'opportunities', type: 0, emoji: '💡' },
              { name: 'partnerships', type: 0, emoji: '🔗' },
            ],
          },
          {
            name: 'VOICE',
            emoji: '🎙️',
            channels: [
              { name: 'Meeting Room', type: 2, emoji: '👥' },
              { name: 'Networking Voice', type: 2, emoji: '🤝' },
            ],
          },
        ],
      },
    };

    return templates[type] || templates.gaming;
  }

  private async onDeleteRequest(i: ButtonInteraction) {
    // Modal phải show ngay, KHÔNG được defer trước
    if (!i.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return i.reply(ephemeral(errorEmbed(i.user, 'Thiếu quyền', 'Bạn cần quyền **Administrator**!'))).catch(() => {});
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    this.deleteCodes.set(i.user.id, code);

    try {
      await i.showModal(
        new ModalBuilder()
          .setCustomId(customId('confirmdelete', i.user.id))
          .setTitle('⚠️ Xác nhận xóa TOÀN BỘ')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('confirm_code')
                .setLabel(`Nhập mã xác nhận: ${code}`)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Nhập mã 4 số để xác nhận')
                .setRequired(true)
                .setMinLength(4)
                .setMaxLength(4),
            ),
        ),
      );
    } catch (error: any) {
      if (error.code === 10062 || error.code === 40060) {
        console.error('Delete modal interaction expired');
        return;
      }
      throw error;
    }
  }

  /* ─────────────── Export ─────────────── */
  private async onExportDeferred(i: ButtonInteraction, design: ServerDesign | undefined, themes: string[] = []) {
    // Interaction đã được defer ở handleButton
    if (!design) return i.editReply(payload(notFoundEmbed(i.user)));

    if (!i.memberPermissions?.has(PermissionFlagsBits.Administrator) || !i.guild) {
      return i.editReply(payload(errorEmbed(i.user, 'Thiếu quyền', 'Bạn cần quyền **Administrator**!')));
    }

    const stats = buildStats(design);
    let botMember;
    try {
      botMember = i.guild.members.me ?? await i.guild.members.fetchMe();
    } catch (error) {
      return i.editReply(payload(errorEmbed(
        i.user,
        'Không kiểm tra được quyền bot',
        'Không thể xác minh quyền của bot trong server.',
        errorMessage(error),
      )));
    }
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)
      || !botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return i.editReply(payload(errorEmbed(
        i.user,
        'Bot thiếu quyền',
        'Cấp cho bot quyền **Manage Roles** và **Manage Channels**, sau đó thử export lại.',
      )));
    }

    if (i.guild.roles.cache.size + stats.roles > MAX_GUILD_ROLES) {
      return i.editReply(payload(errorEmbed(
        i.user,
        'Vượt giới hạn role',
        `Server chỉ có thể có tối đa ${MAX_GUILD_ROLES} role. Thiết kế cần thêm ${stats.roles}, hiện server có ${i.guild.roles.cache.size}.`,
      )));
    }
    if (i.guild.channels.cache.size + stats.categories + stats.total > MAX_GUILD_CHANNELS
      || i.guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildCategory).size + stats.categories > MAX_GUILD_CATEGORIES) {
      return i.editReply(payload(errorEmbed(
        i.user,
        'Vượt giới hạn channel',
        `Discord giới hạn ${MAX_GUILD_CHANNELS} channel tổng cộng và ${MAX_GUILD_CATEGORIES} category mỗi server. Hãy giảm kích thước thiết kế hoặc dọn bớt channel trước.`,
      )));
    }

    const steps: Step[] = [
      { label: `${emojis.shield} Tạo roles`, done: 0, total: stats.roles },
      { label: `${emojis.folder} Tạo categories`, done: 0, total: stats.categories },
      { label: `${emojis.message} Tạo channels`, done: 0, total: stats.total },
    ];

    const render = (s: Step[]) =>
      i.editReply(
        payload(
          progressEmbed(
            i.user,
            COLORS.warning,
            'Đang export vào server...',
            s,
            'Quá trình này mất vài phút, vui lòng KHÔNG tắt bot',
          ),
        ),
      );

    await render(steps).catch((error) => {
      console.warn('Failed to show server generator export progress:', error);
    });

    try {
      const r = await this.applyDesign(i.guild, design, new ProgressTracker(steps, render), themes);

      const lines = [
        `${emojis.shield} Roles ~ \`${r.roles}\``,
        `${emojis.folder} Categories ~ \`${r.categories}\``,
        `${emojis.message} Channels ~ \`${r.channels}\``,
      ];

      if (r.failures.length) {
        lines.push('', `⚠️ Có **${r.failures.length}** mục không tạo được:`);
        lines.push(...r.failures.slice(0, 5).map((failure) => `• ${failure}`));
        if (r.failures.length > 5) lines.push(`• … và ${r.failures.length - 5} lỗi khác`);
      }
      
      if (design.welcome || design.goodbye) {
        lines.push('');
        if (design.welcome) lines.push(`${emojis.success} Welcome system enabled`);
        if (design.goodbye) lines.push(`${emojis.success} Goodbye system enabled`);
        lines.push('-# Ready to use! New members will see these messages');
      }
      
      lines.push('');
      lines.push(bar(1, 1));

      await i.editReply(
        payload(
          infoEmbed(
            i.user,
            COLORS.success,
            r.failures.length ? 'Export hoàn tất một phần' : 'Export thành công!',
            lines,
            'Kiểm tra Discord server để xem kết quả!',
          ),
        ),
      );
    } catch (error: any) {
      await i.editReply(
        payload(errorEmbed(i.user, 'Lỗi Export', 'Không thể export vào server.', error.message, 'Kiểm tra quyền của bot')),
      );
    }
  }

  /** Tạo roles → categories → channels theo thiết kế */
  private async applyDesign(
    guild: Guild,
    design: ServerDesign,
    tracker: ProgressTracker,
    requestedThemes: string[] = [],
  ) {
    let roles = 0;
    let categories = 0;
    let channels = 0;
    const failures: string[] = [];

    // Detect theme for styling
    const theme = detectDesignTheme(design, requestedThemes);
    const style = THEME_STYLES[theme];

    for (const role of design.roles ?? []) {
      try {
        await guild.roles.create({
          name: role.name,
          color: (role.color || '#99AAB5') as any, // Default gray if no color provided
          permissions: (role.permissions ?? []) as any,
        });
        roles++;
        await sleep(API_DELAY_MS);
      } catch (err) {
        console.error(`Failed to create role "${role.name}":`, err);
        failures.push(summarizeFailure(`Role "${role.name}"`, err));
      }
      await tracker.tick(0);
    }

    for (const cat of design.categories) {
      let category;
      try {
        // Format category name with theme-specific style
        const cleanName = toCategoryName(cat.name);
        const emoji = cat.emoji || style.category.icon;
        const categoryName = `${style.category.left} ${emoji} ${cleanName} ${style.category.right}`;
        
        category = await guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory,
        });
        categories++;
        await sleep(API_DELAY_MS);
      } catch (err) {
        console.error(`Failed to create category "${cat.name}":`, err);
        failures.push(summarizeFailure(`Category "${cat.name}"`, err));
      }
      await tracker.tick(1);

      for (const ch of cat.channels ?? []) {
        if (category) {
          try {
            const type = VALID_CHANNEL_TYPES.includes(ch.type as number) ? (ch.type as number) : ChannelType.GuildText;
            const isVoice = type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice;
            const cleanName = isVoice ? toVoiceChannelName(ch.name) : toTextChannelName(ch.name);
            
            // Format channel name based on type and theme
            let channelName: string;
            if (isVoice) {
              // Voice channels with theme-specific decorations
              const emoji = ch.emoji || style.voice.icon;
              channelName = `${style.voice.left} ${emoji} ${cleanName} ${style.voice.right}`;
            } else {
              // Text channels with theme separator
              channelName = ch.emoji 
                ? `${ch.emoji} ${style.text.separator} ${cleanName}`
                : cleanName;
            }

            await guild.channels.create({
              name: channelName,
              type: type as any,
              parent: category.id,
            });
            channels++;
            await sleep(API_DELAY_MS);
          } catch (err) {
            console.error(`Failed to create channel "${ch.name}":`, err);
            failures.push(summarizeFailure(`Channel "${ch.name}"`, err));
          }
        }
        await tracker.tick(2);
      }
    }

    // Save welcome/goodbye designs if present
    if (design.welcome || design.goodbye) {
      try {
        this.saveWelcomeGoodbyeDesigns(guild.id, design.welcome, design.goodbye);
      } catch (error) {
        console.error('Failed to save welcome/goodbye designs:', error);
        failures.push(summarizeFailure('Welcome/Goodbye settings', error));
      }
    }

    return { roles, categories, channels, failures };
  }

  /** Save welcome/goodbye designs to data file */
  private saveWelcomeGoodbyeDesigns(guildId: string, welcome?: any, goodbye?: any) {
    try {
      const fs = require('fs');
      const path = require('path');
      const designsPath = path.join(process.cwd(), 'data', 'welcome-designs.json');
      const welcomeConfigPath = path.join(process.cwd(), 'data', 'welcome-config.json');
      const goodbyeConfigPath = path.join(process.cwd(), 'data', 'goodbye-config.json');
      
      // Save designs
      let designs: any = {};
      if (fs.existsSync(designsPath)) {
        designs = JSON.parse(fs.readFileSync(designsPath, 'utf-8'));
      }
      
      if (!designs[guildId]) {
        designs[guildId] = {};
      }
      
      if (welcome) {
        designs[guildId].welcome = {
          type: 'welcome',
          title: welcome.title || 'Welcome!',
          description: welcome.description || 'Welcome {user} to the server!',
          color: welcome.color || '#57f287',
          thumbnail: welcome.thumbnail || '👋',
          footer: welcome.footer || 'Enjoy your stay!',
        };
      }
      
      if (goodbye) {
        designs[guildId].goodbye = {
          type: 'goodbye',
          title: goodbye.title || 'Goodbye!',
          description: goodbye.description || '{user} has left the server',
          color: goodbye.color || '#fee75c',
          thumbnail: goodbye.thumbnail || '👋',
          footer: goodbye.footer || 'See you again!',
        };
      }
      
      fs.writeFileSync(designsPath, JSON.stringify(designs, null, 2), 'utf-8');
      console.log(`✅ Saved welcome/goodbye designs for guild ${guildId}`);
      
      // Auto-enable welcome system
      if (welcome) {
        let welcomeConfig: any = {};
        if (fs.existsSync(welcomeConfigPath)) {
          welcomeConfig = JSON.parse(fs.readFileSync(welcomeConfigPath, 'utf-8'));
        }
        
        // Find first text channel to use as welcome channel
        const guild = this.client.guilds.cache.get(guildId);
        const firstTextChannel = guild?.channels.cache.find((ch: any) => ch.type === 0); // GuildText
        
        if (firstTextChannel) {
          welcomeConfig[guildId] = {
            guildId,
            channelId: firstTextChannel.id,
            message: welcome.description || 'Welcome {user}!',
            embedEnabled: true,
            enabled: true, // AUTO-ENABLE
          };
          
          fs.writeFileSync(welcomeConfigPath, JSON.stringify(welcomeConfig, null, 2), 'utf-8');
          console.log(`✅ Auto-enabled welcome system in #${firstTextChannel.name}`);
        }
      }
      
      // Auto-enable goodbye system
      if (goodbye) {
        let goodbyeConfig: any = {};
        if (fs.existsSync(goodbyeConfigPath)) {
          goodbyeConfig = JSON.parse(fs.readFileSync(goodbyeConfigPath, 'utf-8'));
        }
        
        // Find first text channel
        const guild = this.client.guilds.cache.get(guildId);
        const firstTextChannel = guild?.channels.cache.find((ch: any) => ch.type === 0);
        
        if (firstTextChannel) {
          goodbyeConfig[guildId] = {
            channelId: firstTextChannel.id,
            message: goodbye.description || 'Goodbye {user}!',
            embedEnabled: true,
            enabled: true, // AUTO-ENABLE
          };
          
          fs.writeFileSync(goodbyeConfigPath, JSON.stringify(goodbyeConfig, null, 2), 'utf-8');
          console.log(`✅ Auto-enabled goodbye system in #${firstTextChannel.name}`);
        }
      }
      
    } catch (error) {
      throw error;
    }
  }

  /* ─────────────── Wipe ─────────────── */
  private planWipe(i: ModalSubmitInteraction) {
    const guild = i.guild!;

    return {
      roles: [...guild.roles.cache.filter((r) => !r.managed && r.id !== guild.id).values()], // Xóa tất cả trừ @everyone và bot roles
      categories: [...guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).values()],
      text: [
        ...guild.channels.cache
          .filter(
            (c) =>
              [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum].includes(c.type as number) &&
              c.id !== guild.rulesChannelId &&
              c.id !== guild.publicUpdatesChannelId &&
              c.id !== i.channelId,
          )
          .values(),
      ],
      voice: [
        ...guild.channels.cache
          .filter((c) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice)
          .values(),
      ],
    };
  }

  private async wipeGuild(plan: ReturnType<ServerGeneratorModule['planWipe']>, tracker: ProgressTracker) {
    const result = { roles: 0, categories: 0, text: 0, voice: 0 };

    const groups: [keyof typeof result, any[]][] = [
      ['roles', plan.roles],
      ['categories', plan.categories],
      ['text', plan.text],
      ['voice', plan.voice],
    ];

    for (const [index, [key, items]] of groups.entries()) {
      for (const item of items) {
        try {
          await item.delete();
          result[key]++;
          await sleep(200);
        } catch (err: any) {
          // Skip if bot doesn't have permission (role is higher than bot's role)
          if (err.code === 50013) {
            console.warn(`Skipped deleting ${key} "${item.name}" - Missing Permissions (role hierarchy)`);
          } else {
            console.error(`Failed to delete ${key}:`, err);
          }
        }
        await tracker.tick(index);
      }
    }

    return result;
  }
}
