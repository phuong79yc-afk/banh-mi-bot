import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputDirectory = path.join(root, 'assets', 'emojis', 'pixel-pack');
const badges = {
  turtle: ['..OO.', '.OXXO', 'OXXXO', '.OXXO', '..OO.'],
  banhcuon: ['...RR..', '..RWWR.', '.RWWWWR', 'RWWWWWR', 'RWWWWWR', '.RWWWR.', '..RR...'],
  chopsticks: ['O...O', '.O.O.', '..OO.', '.O.O.', 'O...O'],
  antenna: ['...O...', '..O.O..', '.O...O.', 'O..O..O', '...O...', '...O...', '..OOO..'],
  construction: ['...OO...', '..OOOO..', '.O....O.', 'O......O', 'OOOOOOOO', '..O..O..', '..O..O..'],
  plugin: ['...OO...', '...OO...', 'OOOOOOOO', 'O......O', 'OOOOOOOO', '...OO...', '...OO...'],
  nuoccham: ['.OOOO.', 'O....O', 'O....O', '.O..O.', '..OO..'],
  hanhphi: ['..YY..', '.YYYY.', 'YYYYYY', '.YYYY.', '..YY..'],
  daily: ['.OOOO.', 'OXXXXO', 'OYYYYO', 'O.YY.O', 'O.YY.O', 'OXXXXO', '.OOOO.'],
  quest: ['...O....', '..OOO...', '.OOOOO..', 'OOO.OOO.', 'OO..O..OO', '.OOOOOO..', '..OOOO...'],
  coin: ['YYYYYYY', 'YOOOOOY', 'YOXXOOY', 'YXOXXOY', 'YOXXOOY', 'YOOOOOY', 'YYYYYYY'],
  shop: ['O.OOO.', 'OO..O.', 'O.OOO.', 'O....O', 'OOOOO.'],
  vip: ['..O.O..', '.O...O.', '.OOOOO.', '..OOO..', '..OOO..', '..O.O..', '..O.O..'],
  music: ['..O...', '.OO...', 'O.O...', '..O.O.', '..OOO.'],
  ai: ['.OOOO.', 'O.OO.O', 'OOOOOO', 'O.OO.O', '.OOOO.'],
  image: ['OOOOOO', 'O....O', 'O.OO.O', 'O..OOO', 'OOOOOO'],
  moderation: ['..OO..', '.OOOO.', 'OOOOOO', '.O..O.', '.O..O.'],
  security: ['..OO..', '.OOOO.', 'O.OO.O', '.O..O.', '..OO..'],
  ticket: ['.OOOOOO.', 'O..OO..O', 'O..OO..O', 'O..OO..O', '.OOOOOO.'],
  welcome: ['O...O.', 'O...O.', 'O.O.O.', 'OO.OO.', '.OOO..'],
  goodbye: ['.O..O...', '.O..O..O', '.O..O.O.', '.O..OO..', '.O..O...', '.O..O...', '.OOOO...'],
  server: ['.OOOO.', 'O....O', 'OOOOOO', 'O....O', 'OOOOOO'],
  book: ['OOOOOOO', 'O.....O', 'O.OOO.O', 'O.OOO.O', 'O.....O', 'O.OOO.O', 'O.....O', 'OOOOOOO'],
  settings: ['..O...', '.OOO..', 'OOOOO.', '.OOO..', '..O...'],
  user: ['..OO..', '.OOOO.', '.OOOO.', '..OO..', '.O..O.'],
  giveaway: ['O.O.O.', '.O.O..', 'OOOOO.', '.O.O..', 'O.O.O.'],
  minecraft: ['O.OO.O', '.OOOO.', 'OO..OO', '.OOOO.', 'O.OO.O'],
  game: ['O.O.O.', 'OOOOO.', 'O.O.O.', 'OOOOO.', 'O.O.O.'],
  report: ['..OOOO..', '.O....O.', 'O......O', 'O..OO..O', 'O......O', '.O....O.', '..OOOO..'],
  voice: ['O....O', 'OO..OO', 'O.OO.O', 'O.OO.O', '.OOOO.'],
  message: ['.OOOOOO.', 'O......O', 'O......O', 'O.OO...O', 'O...O..O', '.OOOOOO.'],
  success: ['....O.', '...O..', 'O.O...', '.O....', '..O...'],
  error: ['O....O', '.O..O.', '..OO..', '.O..O.', 'O....O'],
  loading: ['..OO..', '.O..O.', 'O....O', '.O..O.', '..OO..'],
  warning: ['...O...', '..O.O..', '.O...O.', 'O.....O', 'OOOOOOO', '...O...', '...O...'],
  shield: ['.OOOO.', 'OOOOOO', 'O.OO.O', '.O..O.', '..OO..'],
  receipt: ['.OOOOOO.', 'O......O', 'O.OO...O', 'O......O', 'O.OO...O', 'O......O', 'O.OO...O', '.OOOOOO.'],
  package: ['..OOOO.', '.O...OO', 'O...O.O', 'O..O..O', 'O.O...O', '.OOOOO.'],
  star: ['...Y...', '..YYY..', 'YYYYYYY', '.YYYY..', '..YY...', '.YY....', 'YY.....'],
  chart: ['O....O', 'O...OO', 'O..OOO', 'O.OOOO', 'OOOOOO'],
  trophy: ['O....O', 'O....O', '.OOOO.', '..OO..', 'OOOOOO', '..OO..', '..OO..'],
  refresh: ['..OOOO.', '.O...O.', 'O.....O', 'O....O.', '.O..O..', '..OO...', '...O...'],
  backpack: ['..OOOO..', '.O....O.', 'O.OOOO.O', 'O.O..O.O', 'O.OOOO.O', 'O......O', '.OOOOOO.'],
  list: ['.OOOOOO.', 'O......O', 'O.OOO..O', 'O......O', 'O.OOO..O', 'O......O', '.OOOOOO.'],
  dice: ['.OOOO.', 'O....O', 'O.O..O', 'O..O.O', 'O....O', '.OOOO.'],
  target: ['..OOOO..', '.O....O.', 'O..OO..O', 'O..OO..O', '.O....O.', '..OOOO..'],
  slots: ['OOOOOOO', 'O.O.O.O', 'O.O.O.O', 'OOOOOOO', 'O.O.O.O', 'O.O.O.O', 'OOOOOOO'],
  celebration: ['...O...', '..O.O..', '.O...O.', '...O...', '..O.O..', '.O...O.', 'O.....O'],
  note: ['...OO.', '...O.O', '...OO.', '...O..', '...O..', 'O..O..', '.OO...'],
  shuffle: ['O....O.', '.O..O..', '..OO...', '..OO...', '.O..O..', 'O....O.'],
  trash: ['.OOOO.', '..OO..', 'O....O', 'O....O', 'O.OO.O', 'O.OO.O', '.OOOO.'],
  upload: ['...O...', '..OOO..', '.O.O.O.', '...O...', '...O...', 'OOOOOOO', 'OOOOOOO'],
  thought: ['..OOOO..', '.O....O.', 'O.O..O.O', 'O......O', '.O....O.', '..OOOO..', '.....O..'],
  eye: ['...OO...', '.O....O.', 'O..OOOO..O', 'O.O....O.O', 'O..OOOO..O', '.O....O.', '...OO...'],
  broom: ['......O', '.....O.', '....O..', '...O...', '..O....', '.O.....', 'O......'],
  plus: ['...O...', '...O...', 'OOOOOOO', '...O...', '...O...'],
  pencil: ['......O', '.....OO', '....OO.', '...OO..', '..OO...', '.OO....', 'OO.....'],
  paper: ['OOOOOOO.', 'O.....O.', 'O.OOO.O.', 'O.O.O.O.', 'O.OOO.O.', 'O.....OO', 'OOOOOOO.'],
  search: ['..OOOO.', '.O....O', 'O.OOO.O', 'O.OOO.O', '.O....O', '..OOOO.', '......O'],
  minus: ['.......', '.......', 'OOOOOOO', '.......', '.......'],
  toggle: ['.OOOOOO.', 'O......O', 'O.OOO..O', 'O.O..O.O', 'O.OOO..O', 'O......O', '.OOOOOO.'],
  bulb: ['..OOOO..', '.O....O.', 'O......O', 'O..OO..O', '.O....O.', '..OOOO..', '...OO...'],
  boot: ['....OOO.', '....O..O', '....O..O', 'O...O..O', 'O...O..O', 'O...OOOO', '.OOOOOO.'],
  hammer: ['OOOOOOO', '...O...', '...O...', '..OO...', '.O.....', 'O......'],
  pause: ['OO..OO', 'OO..OO', 'OO..OO', 'OO..OO', 'OO..OO', 'OO..OO'],
  lock: ['..OOOO..', '.O....O.', '.O....O.', 'OOOOOOOO', 'O......O', 'O......O', 'OOOOOOOO'],
  unlock: ['..OOOO..', '.O....O.', 'O.......', 'OOOOOOOO', 'O......O', 'O......O', 'OOOOOOOO'],
  check: ['......O', '.....O.', 'O...O..', '.O.O...', '..O....', '.......'],
  info: ['...O...', '.......', '..OOO..', '...O...', '...O...', '...O...', '..OOOO.'],
  sponge: ['.O.O.O.', 'O.O.O.O', '.O.O.O.', 'O.O.O.O', '.O.O.O.', 'O.O.O.O', '.O.O.O.'],
  police: ['...OO...', '..OOOO..', '.O....O.', 'OOOOOOOO', 'O......O', 'O.OO..O.O'],
  noentry: ['..OOOO..', '.O....O.', 'O.OOOO.O', 'O.OOOO.O', 'O.OOOO.O', '.O....O.', '..OOOO..'],
  heart: ['.OO..OO.', 'OOOOOOOO', 'OOOOOOOO', '.OOOOOO.', '..OOOO..', '...OO...', '....O...'],
  floppy: ['OOOOOOOO', 'O......O', 'O.OOOO.O', 'O.O..O.O', 'O.OOOO.O', 'O......O', 'OOOOOOOO'],
  folders: ['..OOOO..', '.O....O.', 'OOOOOOOO', 'O......O', 'O.OOOO.O', 'O......O', 'OOOOOOOO'],
  question: ['..OOOO..', '.O....O.', '......O.', '.....O..', '....O...', '........', '....O...'],
  calculator: ['OOOOOOOO', 'O......O', 'O.OO...O', 'O......O', 'O.OO...O', 'O......O', 'OOOOOOOO'],
  flask: ['...OO...', '...OO...', '..O..O..', '..O..O..', '.O....O.', 'O......O', 'OOOOOOOO'],
  pin: ['...OO...', '..O..O..', '.O....O.', '.O....O.', '..O..O..', '...OO...', '...O....'],
  sleepy: ['........', 'O.O..O.O', '........', '...OO...', '..O..O..', '...OO...'],
  alarm: ['..OOOO..', '.O....O.', 'O.OOOO.O', 'O.O..O.O', 'O.OOOO.O', '.O....O.', '..OOOO..'],
  pickaxe: ['...OOOOO', '..O.....', '.O......', '..O.....', '...O....', '....O...', '.....O..', '......O.'],
  banner: ['O....O', 'O....O', 'OOOOOO', 'O....O', 'O....O', 'O....O'],
  medal: ['..OOOO..', '.O....O.', '.O....O.', '..OOOO..', '...OO...', '..OOOO..', '.O....O.'],
  diamond: ['...O...', '..O.O..', '.O...O.', 'O.....O', 'O.....O', '.O...O.', '..O.O..', '...O...'],
  online: ['..OOOO..', '.O....O.', 'O......O', 'O......O', 'O......O', '.O....O.', '..OOOO..'],
  offline: ['..OOOO..', '.O....O.', 'O.O..O.O', 'O..OO..O', 'O.O..O.O', '.O....O.', '..OOOO..'],
  idle: ['...OOOO.', '..O....O', '.O..OO..O', '.O.O..O.O', '.O..OO..O', '..O....O', '...OOOO.'],
  bow: ['O......O', '.O....O.', '..O..O..', '...OO...', '..O..O..', '.O....O.', 'O......O'],
  chest: ['..OOOOOO..', '.O......O.', 'OOOOOOOOOO', 'O..O..O..O', 'O..OOOO..O', 'O........O', '.OOOOOOOO.'],
  beacon: ['...O...', '..O.O..', '.O...O.', 'O.....O', '...O...', '...O...', '...O...'],
  emerald: ['..OOOO..', '.O....O.', 'O......O', 'O......O', 'O......O', '.O....O.', '..OOOO..'],
  redstone: ['...O...', '..ORO..', '.ORRRO.', 'ORRRRRO', '.ORRRO.', '..ORO..', '...O...'],
  meat: ['..OOOO..', '.ORRRRO.', 'ORRRRRRO', 'ORRWWRRO', '.ORRRRO.', '..OOOO..'],
  fire: ['...O...', '..OOO..', '..O.O..', '.O...O.', '.O.O.O.', 'O.....O', '.OOOOO.'],
  water: ['...O...', '..O.O..', '.O...O.', 'O.....O', '.OOOOO.', '..OOO..'],
  tree: ['...O...', '..OOO..', '.OOOOO.', 'OOOOOOO', '...O...', '...O...'],
  rock: ['...OOOO.', '..O....O', '.O......O', 'O........O', '.O......O', '..OOOOOO.'],
};

const iconAliases = {
  broom: 'moderation',
  plus: 'success',
  pencil: 'settings',
  paper: 'report',
  search: 'report',
  minus: 'moderation',
  toggle: 'settings',
  bulb: 'ai',
  boot: 'moderation',
  hammer: 'moderation',
  pause: 'music',
  lock: 'security',
  unlock: 'security',
  check: 'success',
  info: 'report',
  sponge: 'moderation',
  police: 'moderation',
  noentry: 'security',
  mask: 'user',
  controlpanel: 'settings',
  construction: 'server',
  suit: 'user',
  explosion: 'warning',
  tools: 'settings',
  antenna: 'server',
  heart: 'welcome',
  plugin: 'server',
  floppy: 'success',
  folders: 'server',
  question: 'report',
  book: 'quest',
  calculator: 'report',
  flask: 'ai',
  pin: 'server',
  sleepy: 'loading',
  alarm: 'daily',
  pickaxe: 'minecraft',
  banner: 'server',
  medal: 'giveaway',
  diamond: 'vip',
  online: 'success',
  offline: 'error',
  idle: 'loading',
  bow: 'minecraft',
  potion: 'loading',
  chest: 'server',
  beacon: 'server',
  emerald: 'vip',
  redstone: 'minecraft',
  meat: 'banhcuon',
  fire: 'hanhphi',
  water: 'nuoccham',
  tree: 'hanhphi',
  rock: 'minecraft',
};

const names = Object.keys(badges).filter((name) => !(name in iconAliases));
const colors = {
  outline: '#24341d',
  skin: '#b5c94a',
  skinLight: '#d3e56d',
  shellEdge: '#44501a',
  shell: '#6b7a2c',
  shellLight: '#879b38',
  eye: '#1d2418',
  white: '#fff8dd',
  red: '#e65f59',
  pink: '#ff9bb0',
  orange: '#f1a34b',
  yellow: '#ffdf62',
  gold: '#c99532',
  blue: '#59b8e4',
  cyan: '#a5f4ff',
  purple: '#ad82df',
  green: '#69c77d',
  brown: '#79513b',
};

const badgeColors = {
  turtle: ['skinLight', 'shellEdge'],
  banhcuon: ['white', 'pink'],
  chopsticks: ['brown', 'gold'],
  nuoccham: ['orange', 'yellow'],
  hanhphi: ['yellow', 'gold'],
  daily: ['blue', 'white'],
  quest: ['purple', 'white'],
  coin: ['yellow', 'gold'],
  shop: ['pink', 'white'],
  vip: ['yellow', 'pink'],
  music: ['purple', 'pink'],
  ai: ['cyan', 'blue'],
  image: ['green', 'yellow'],
  moderation: ['red', 'white'],
  security: ['blue', 'cyan'],
  ticket: ['orange', 'yellow'],
  welcome: ['green', 'yellow'],
  goodbye: ['blue', 'purple'],
  server: ['blue', 'cyan'],
  settings: ['shellLight', 'white'],
  user: ['skinLight', 'white'],
  giveaway: ['pink', 'yellow'],
  minecraft: ['green', 'brown'],
  game: ['purple', 'cyan'],
  report: ['orange', 'white'],
  voice: ['blue', 'white'],
  message: ['cyan', 'white'],
  success: ['green', 'white'],
  error: ['red', 'white'],
  loading: ['purple', 'cyan'],
  warning: ['yellow', 'red'],
  shield: ['blue', 'yellow'],
};
const fallbackBadgeColors = [
  ['blue', 'cyan'],
  ['yellow', 'gold'],
  ['purple', 'pink'],
  ['green', 'yellow'],
  ['orange', 'white'],
  ['red', 'pink'],
  ['cyan', 'blue'],
];

async function removePreviousGenericSprites() {
  const previousNames = [
    'heart', 'star', 'smile', 'gem', 'ghost', 'cat', 'flower', 'mushroom',
    'potion', 'gamepad', 'coin', 'crown', 'cloud', 'dog', 'bunny', 'dragon',
    'sword', 'shield', 'book', 'bell', 'mail', 'camera', 'microphone', 'laptop',
    'leaf', 'sun', 'moon', 'fire', 'water', 'key', 'lock', 'paw',
  ];
  const present = new Set(await readdir(outputDirectory));
  for (const name of previousNames) {
    const file = `${name}.png`;
    if (present.has(file)) await rm(path.join(outputDirectory, file));
  }
}

async function drawTurtle(context) {
  const mascotSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 320">
    <path d="M105 215 L90 285 Q88 300 105 300 L140 300 Q155 298 150 282 L150 238Z" fill="#b5c94a"/>
    <path d="M265 235 L255 285 Q253 302 270 302 L305 302 Q320 300 316 284 L310 232Z" fill="#b5c94a"/>
    <path d="M330 210 Q380 205 392 190 Q400 215 360 245Z" fill="#b5c94a"/>
    <path d="M80 90 Q20 95 12 150 Q10 215 80 230 Q150 245 190 200 L200 90Z" fill="#b5c94a"/>
    <path d="M130 90 Q170 10 270 5 Q360 5 385 70 Q410 130 360 210 Q300 250 200 245 Q130 235 125 150Z" fill="#6b7a2c"/>
    <path d="M150 80 L220 30 M220 30 L270 8 M220 30 L250 110 L215 175 L145 160 L150 80 M250 110 L340 100 L385 70 M340 100 L360 200 M215 175 L240 245 M250 110 L215 175" stroke="#44501a" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="60" cy="145" r="15" fill="#1d2418"/><circle cx="120" cy="140" r="15" fill="#1d2418"/>
    <path d="M70 180 Q90 200 112 178" stroke="#1d2418" stroke-width="9" fill="none" stroke-linecap="round"/>
  </svg>`;
  const source = await loadImage(Buffer.from(mascotSvg));
  const pixelCanvas = createCanvas(21, 16);
  const pixelContext = pixelCanvas.getContext('2d');
  pixelContext.drawImage(source, 0, 0, 21, 16);
  context.imageSmoothingEnabled = false;
  context.drawImage(pixelCanvas, 0, 15, 128, 98);
}

function drawBadge(context, name) {
  const pattern = badges[name] ?? badges[iconAliases[name]];
  if (!pattern) throw new Error(`Missing pixel badge for ${name}.`);
  const nameHash = [...name].reduce((hash, character) => hash + character.charCodeAt(0), 0);
  const [mainName, detailName] =
    badgeColors[name] ?? fallbackBadgeColors[nameHash % fallbackBadgeColors.length];
  const main = colors[mainName];
  const detail = colors[detailName];
  const badgePixel = Math.min(14, Math.floor(112 / Math.max(pattern.length, ...pattern.map((row) => row.length))));
  const xOffset = (128 - pattern[0].length * badgePixel) / 2;
  const yOffset = (128 - pattern.length * badgePixel) / 2;

  for (let y = 0; y < pattern.length; y++) {
    for (let x = 0; x < pattern[y].length; x++) {
      if (pattern[y][x] !== '.') {
          context.fillStyle = colors.outline;
        context.fillRect(xOffset + x * badgePixel + 3, yOffset + y * badgePixel + 4, badgePixel, badgePixel);
      }
    }
  }

  for (let y = 0; y < pattern.length; y++) {
    for (let x = 0; x < pattern[y].length; x++) {
      const pixel = pattern[y][x];
      const color =
        pixel === 'O' ? main :
        pixel === 'X' ? detail :
        pixel === 'R' ? colors.red :
        pixel === 'W' ? colors.white :
        pixel === 'Y' ? colors.yellow :
        undefined;
      if (color) {
        context.fillStyle = color;
        context.fillRect(xOffset + x * badgePixel, yOffset + y * badgePixel, badgePixel, badgePixel);
      }
    }
  }

  const highlightX = xOffset + Math.floor(pattern[0].length / 2) * badgePixel;
  const highlightY = yOffset + Math.floor(pattern.length / 2) * badgePixel;
  context.fillStyle = detail;
  context.fillRect(highlightX, highlightY, badgePixel / 2, badgePixel / 2);
}

await mkdir(outputDirectory, { recursive: true });
await removePreviousGenericSprites();
const generatedFiles = new Set(names.map((name) => `${name}.png`));
for (const file of await readdir(outputDirectory)) {
  if (file.endsWith('.png') && !generatedFiles.has(file)) {
    await rm(path.join(outputDirectory, file));
  }
}

for (const name of names) {
  const canvas = createCanvas(128, 128);
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  if (name === 'turtle') await drawTurtle(context);
  else drawBadge(context, name);

  await writeFile(path.join(outputDirectory, `${name}.png`), await canvas.encode('png'));
}

console.log(`Generated ${names.length} Bánh Cuốn Bot pixel emojis in ${outputDirectory}`);
