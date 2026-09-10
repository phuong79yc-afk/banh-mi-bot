/**
 * Custom Emoji IDs for Discord Bot
 * Auto-generated: 2026-09-09T10:06:21.660Z
 * 
 * Uploaded: 46/50 emojis
 */

export const EMOJI_IDS = {
  "video": "1547153565771108382",
  "wifi": "1547153591205367858",
  "trophy": "1547153659140382780",
  "menu": "1547153698558316545",
  "calendar": "1547153734197444678",
  "add": "1547153760877416458",
  "document": "1547153789230911558",
  "clock": "1547153819312332862",
  "edit": "1547153870562533386",
  "art": "1547154019317710858",
  "loading": "1547154056210812970",
  "refresh": "1547154083318726737",
  "crown": "1547154122803777627",
  "shield": "1547154183034118154",
  "star": "1547154229716717568",
  "remove": "1547154254790139914",
  "copy": "1547154286033772645",
  "flag": "1547154317545312307",
  "save": "1547154345114607636",
  "terminal": "1547154406468878366",
  "unlock": "1547154449502441502",
  "gift": "1547154482578726934",
  "heart": "1547154559204331550",
  "sparkles": "1547154595074285689",
  "music": "1547154623473786900",
  "chart": "1547154656898322544",
  "bell": "1547154723616989234",
  "success": "1547154783465508894",
  "database": "1547154820543283230",
  "users": "1547154898855141386",
  "user": "1547154933818724453",
  "server": "1547155077242953811",
  "warning": "1547155128673374248",
  "search": "1547155236744069151",
  "export": "1547155335788367943",
  "delete": "1547155419989024768",
  "cloud": "1547155554168999996",
  "error": "1547155697358217216",
  "message": "1547155806183489656",
  "link": "1547155852740399115",
  "image": "1547155900836610048",
  "folder": "1547156020441255966",
  "pin": "1547156080730054676",
  "key": "1547156118227259413",
  "tag": "1547156296229322764",
  "info": "1547156468703432784"
} as const;

// Helper function to get emoji string (animated format)
export function getEmoji(name: keyof typeof EMOJI_IDS): string {
  const id = EMOJI_IDS[name];
  return id ? `<a:${name}:${id}>` : '❓';
}

// Export ready-to-use emoji strings
export const emojis = {
  // Core Status (5/5)
  success: getEmoji('success'),
  error: getEmoji('error'),
  loading: getEmoji('loading'),
  warning: getEmoji('warning'),
  info: getEmoji('info'),
  
  // Actions (9)
  export: getEmoji('export'),
  delete: getEmoji('delete'),
  refresh: getEmoji('refresh'),
  edit: getEmoji('edit'),
  save: getEmoji('save'),
  search: getEmoji('search'),
  add: getEmoji('add'),
  remove: getEmoji('remove'),
  copy: getEmoji('copy'),
  
  // Categories/Content (9)
  art: getEmoji('art'),
  document: getEmoji('document'),
  folder: getEmoji('folder'),
  sparkles: getEmoji('sparkles'),
  chart: getEmoji('chart'),
  menu: getEmoji('menu'),
  image: getEmoji('image'),
  music: getEmoji('music'),
  video: getEmoji('video'),
  
  // Social/Community (10/10)
  user: getEmoji('user'),
  users: getEmoji('users'),
  message: getEmoji('message'),
  bell: getEmoji('bell'),
  heart: getEmoji('heart'),
  star: getEmoji('star'),
  trophy: getEmoji('trophy'),
  gift: getEmoji('gift'),
  crown: getEmoji('crown'),
  shield: getEmoji('shield'),
  
  // Tools/Tech (8)
  terminal: getEmoji('terminal'),
  database: getEmoji('database'),
  server: getEmoji('server'),
  cloud: getEmoji('cloud'),
  wifi: getEmoji('wifi'),
  unlock: getEmoji('unlock'),
  key: getEmoji('key'),
  link: getEmoji('link'),
  
  // Misc (5/5)
  calendar: getEmoji('calendar'),
  clock: getEmoji('clock'),
  pin: getEmoji('pin'),
  tag: getEmoji('tag'),
  flag: getEmoji('flag')
} as const;
