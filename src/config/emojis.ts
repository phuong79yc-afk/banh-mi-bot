/** Discord custom emoji IDs loaded from the generated icon manifest. */
import uploadedPixelEmojiIds from '../../assets/emojis/pixel-pack/emoji-ids.json';

export const PIXEL_EMOJI_IDS: Record<string, string> = uploadedPixelEmojiIds;
const animatedEmojiMarkup: Record<string, string> = {};

export function syncAnimatedEmojiMarkup(
  emojis: Iterable<{ id: string; name: string | null; animated: boolean }>,
): void {
  const markup: Record<string, string> = {};
  for (const emoji of emojis) {
    if (!emoji.animated || !emoji.name) continue;
    const key = emoji.name.startsWith('pxa_')
      ? emoji.name.slice(4)
      : emoji.name.startsWith('px_') && emoji.name.endsWith('_anim')
        ? emoji.name.slice(3)
        : undefined;
    if (key) markup[key] = `<a:${emoji.name}:${emoji.id}>`;
  }
  for (const name of Object.keys(animatedEmojiMarkup)) delete animatedEmojiMarkup[name];
  Object.assign(animatedEmojiMarkup, markup);
}

const PIXEL_EMOJI_ALIASES: Record<string, string> = {
  turtle: 'robot',
  mascot: 'robot',
  bot: 'robot',
  banhcuon: 'package',
  chopsticks: 'package',
  nuoccham: 'drop',
  hanhphi: 'party',
  daily: 'calendar',
  quest: 'quest',
  coin: 'coin',
  shop: 'shop',
  vip: 'crown',
  music: 'music',
  ai: 'brain',
  image: 'frame',
  moderation: 'ban',
  security: 'shield',
  ticket: 'ticket',
  welcome: 'wave',
  goodbye: 'wave',
  server: 'signal',
  settings: 'gear',
  user: 'user',
  giveaway: 'gift',
  minecraft: 'pickaxe',
  game: 'dice',
  report: 'report',
  voice: 'music',
  message: 'bubble',
  success: 'check',
  error: 'cross',
  loading: 'hourglass',
  warning: 'warning',
  shield: 'shield',
  receipt: 'scroll',
  package: 'package',
  star: 'star',
  chart: 'chart',
  trophy: 'trophy',
  refresh: 'refresh',
  backpack: 'backpack',
  list: 'page',
  dice: 'dice',
  target: 'target',
  slots: 'slot',
  celebration: 'party',
  note: 'note',
  shuffle: 'shuffle',
  trash: 'trash',
  upload: 'upload',
  thought: 'bubble',
  eye: 'eye',
  broom: 'broom',
  plus: 'plus',
  pencil: 'pencil',
  paper: 'page',
  search: 'magnifier',
  minus: 'minus',
  toggle: 'toggle_on',
  bulb: 'bulb',
  boot: 'boot',
  hammer: 'hammer',
  pause: 'music',
  lock: 'lock',
  unlock: 'unlock',
  check: 'check',
  info: 'info',
  sponge: 'sponge',
  police: 'police',
  noentry: 'ban',
  mask: 'mask',
  controlpanel: 'sliders',
  construction: 'construction',
  suit: 'tie',
  explosion: 'explosion',
  tools: 'tools',
  antenna: 'signal',
  heart: 'heartbeat',
  plugin: 'plug',
  floppy: 'floppy',
  folders: 'folder',
  question: 'help',
  book: 'book',
  calculator: 'calc',
  flask: 'flask',
  pin: 'pin',
  sleepy: 'sleep',
  alarm: 'alarm',
  pickaxe: 'pickaxe',
  banner: 'banner',
  medal: 'medal',
  diamond: 'diamond',
  online: 'status_online',
  offline: 'status_offline',
  idle: 'status_idle',
  bow: 'pickaxe',
  potion: 'potion_blue',
  chest: 'chest',
  beacon: 'signal',
  emerald: 'emerald',
  redstone: 'ruby',
  meat: 'gift',
  fire: 'explosion',
  water: 'drop',
  tree: 'folder',
  rock: 'pickaxe',
  white_check_mark: 'check',
  export: 'upload',
  delete: 'trash',
  edit: 'pencil',
  edit_image: 'frame',
  save: 'floppy',
  add: 'plus',
  remove: 'trash',
  copy: 'note',
  cloud: 'bubble',
  art: 'palette',
  document: 'page',
  folder: 'folder',
  sparkles: 'star',
  menu: 'gear',
  video: 'frame',
  users: 'user',
  bell: 'alarm',
  crown: 'crown',
  terminal: 'brain',
  database: 'package',
  wifi: 'signal',
  calendar: 'calendar',
  clock: 'stopwatch',
  key: 'key',
  tag: 'shop',
  flag: 'report',
  gift: 'gift',
  link: 'plug',
  cache: 'chest',
  rocket: 'party',
  shopping_bags: 'shop',
  gem: 'diamond',
  id: 'user',
  gear: 'gear',
  wrench: 'wrench',
  scroll: 'scroll',
  ledger: 'coin',
  arrow_forward: 'check',
  pause_button: 'pause',
  track_next: 'music',
  stop_button: 'pause',
  mute: 'music',
  unmute: 'music',
  heavy_minus_sign: 'minus',
  money_with_wings: 'coin',
  tt_music: 'music',
  tt_video: 'frame',
  tt_photo: 'frame',
  tt_like: 'heartbeat',
  tt_share: 'upload',
  tt_comment: 'bubble',
  back: 'refresh',
  prev: 'refresh',
  next: 'refresh',
  bullet: 'robot',
  smile: 'wave',
  ghost: 'ghost',
  cat: 'user',
  flower: 'party',
  mushroom: 'potion_green',
  gamepad: 'dice',
  dog: 'user',
  bunny: 'user',
  dragon: 'minecraft',
  sword: 'hammer',
  mail: 'message',
  camera: 'frame',
  microphone: 'music',
  laptop: 'brain',
  leaf: 'wave',
  sun: 'star',
  moon: 'sleep',
  paw: 'user',
};

const PIXEL_EMOJI_KEYWORDS: Array<[RegExp, string]> = [
  [/banh.?cuon|dumpling|rice.?roll/, 'package'],
  [/chopstick/, 'package'],
  [/nuoc.?cham|dipping.?sauce/, 'drop'],
  [/hanh.?phi|fried.?shallot/, 'party'],
  [/daily|calendar|check.?in/, 'calendar'],
  [/quest|mission|task/, 'quest'],
  [/coin|money|balance|wallet|currency/, 'coin'],
  [/shop|store|buy|purchase/, 'shop'],
  [/vip|premium|crown|trophy/, 'crown'],
  [/music|song|play|pause|volume/, 'music'],
  [/ai|robot|brain|chatbot/, 'brain'],
  [/image|photo|camera|picture|video/, 'frame'],
  [/moderation|ban|kick|mute|warn|delete/, 'ban'],
  [/security|lock|unlock|shield|key/, 'shield'],
  [/ticket|support/, 'ticket'],
  [/welcome|hello|greet|goodbye|leave|farewell/, 'wave'],
  [/server|guild|channel/, 'signal'],
  [/setting|config|gear|wrench/, 'gear'],
  [/user|member|people|cat|dog|pet|paw/, 'user'],
  [/giveaway|gift|raffle|winner/, 'gift'],
  [/minecraft|block|craft/, 'pickaxe'],
  [/game|controller|joystick/, 'dice'],
  [/report|search|document|bug/, 'report'],
  [/voice|microphone|audio/, 'music'],
  [/message|mail|email|comment|chat/, 'bubble'],
  [/success|check|verified|done/, 'check'],
  [/error|fail|ghost|cross/, 'cross'],
  [/loading|wait|clock|hourglass/, 'hourglass'],
  [/warning|alert|caution/, 'warning'],
  [/bot|mascot|turtle/, 'robot'],
];

const LEGACY_EMOJI_IDS = new Set(['turtle', 'banhcuon', 'chopsticks']);

function resolvePixelEmojiName(name: string): string | undefined {
  const normalizedName = name.toLowerCase();
  let pixelName =
    PIXEL_EMOJI_ALIASES[normalizedName] ??
    (!LEGACY_EMOJI_IDS.has(normalizedName) && PIXEL_EMOJI_IDS[normalizedName]
      ? normalizedName
      : PIXEL_EMOJI_KEYWORDS.find(([pattern]) => pattern.test(normalizedName))?.[1] ?? normalizedName);
  const seen = new Set([normalizedName]);

  while (PIXEL_EMOJI_ALIASES[pixelName] && PIXEL_EMOJI_ALIASES[pixelName] !== pixelName) {
    if (seen.has(pixelName)) return undefined;
    seen.add(pixelName);
    pixelName = PIXEL_EMOJI_ALIASES[pixelName];
  }

  return LEGACY_EMOJI_IDS.has(pixelName) ? undefined : pixelName;
}

export const EMOJI_IDS: Record<string, string> = new Proxy(PIXEL_EMOJI_IDS, {
  get(target, property, receiver) {
    if (typeof property !== 'string') return Reflect.get(target, property, receiver);
    const pixelName = resolvePixelEmojiName(property);
    return pixelName ? target[pixelName] : undefined;
  },
});

export function getPixelEmoji(name: string): string | undefined {
  const animatedMarkup = animatedEmojiMarkup[name.toLowerCase()];
  if (animatedMarkup) return animatedMarkup;

  const pixelName = resolvePixelEmojiName(name);
  const id = pixelName ? PIXEL_EMOJI_IDS[pixelName] : undefined;
  return id && pixelName ? `<:px_${pixelName}:${id}>` : undefined;
}

const EMOJI_FALLBACKS: Record<string, string> = {
  success: '✅',
  error: '❌',
  loading: '⏳',
  warning: '⚠️',
  info: 'ℹ️',
  export: '📤',
  delete: '🗑️',
  refresh: '🔄',
  edit: '✏️',
  edit_image: '🖌️',
  save: '💾',
  search: '🔍',
  add: '➕',
  remove: '➖',
  copy: '📋',
  unlock: '🔓',
  lock: '🔒',
  cloud: '☁️',
  art: '🎨',
  document: '📄',
  folder: '📁',
  sparkles: '✨',
  chart: '📊',
  menu: '☰',
  image: '🖼️',
  music: '🎵',
  video: '🎬',
  star: '⭐',
  trophy: '🏆',
  user: '👤',
  users: '👥',
  message: '💬',
  bell: '🔔',
  heart: '❤️',
  crown: '👑',
  shield: '🛡️',
  terminal: '💻',
  database: '🗃️',
  server: '🖥️',
  wifi: '📶',
  calendar: '📅',
  clock: '⏰',
  pin: '📍',
  key: '🔑',
  tag: '🏷️',
  flag: '🚩',
  gift: '🎁',
  link: '🔗',
  cache: '🧊',
  rocket: '🚀',
  coin: '🪙',
  fire: '🔥',
  shopping_bags: '🛍️',
  gem: '💎',
  id: '🪪',
  gear: '⚙️',
  wrench: '🔧',
  ticket: '🎟️',
  scroll: '📜',
  ledger: '📒',
  arrow_forward: '▶️',
  pause_button: '⏸️',
  track_next: '⏭️',
  stop_button: '⏹️',
  mute: '🔇',
  unmute: '🔊',
  heavy_minus_sign: '➖',
  money_with_wings: '💸',
  white_check_mark: '✅',
  tt_music: '🎼',
  tt_video: '🎞️',
  tt_photo: '📸',
  tt_like: '❤️',
  tt_share: '📤',
  tt_comment: '💭',
};

export function getEmoji(name: string): string {
  const pixelEmoji = getPixelEmoji(name);
  if (pixelEmoji) return pixelEmoji;

  return EMOJI_FALLBACKS[name] ?? '✨';
}

const emojiAliases: Record<string, string> = {
  ...Object.fromEntries(
    Object.keys(PIXEL_EMOJI_IDS)
      .filter((name) => !LEGACY_EMOJI_IDS.has(name))
      .map((name) => [`px_${name}`, `<:px_${name}:${PIXEL_EMOJI_IDS[name]}>`]),
  ),
  ...Object.fromEntries(
    Object.keys(PIXEL_EMOJI_IDS).map((name) => [`pixel_${name}`, getPixelEmoji(name) ?? '']),
  ),
  ...Object.fromEntries(Object.keys(PIXEL_EMOJI_ALIASES).map((name) => [name, getEmoji(name)])),
  settings: getEmoji('gear'),
  download: getEmoji('save'),
  mail: getEmoji('message'),
  clipboard: getEmoji('document'),
  trash: getEmoji('delete'),
  coins: getEmoji('coin'),
  back: getEmoji('back'),
  prev: getEmoji('prev'),
  next: getEmoji('next'),
  bullet: getEmoji('bullet'),
};

export const emojis: Record<string, string> = new Proxy(emojiAliases, {
  get(target, property, receiver) {
    if (typeof property !== 'string') return Reflect.get(target, property, receiver);
    return Reflect.get(target, property, receiver) ?? getEmoji(property);
  },
});
