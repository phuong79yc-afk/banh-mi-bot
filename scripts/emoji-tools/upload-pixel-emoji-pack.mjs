import { Client, GatewayIntentBits, Routes } from 'discord.js';
import 'dotenv/config';
import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const emojiDirectory = path.join(root, 'assets', 'emojis', 'pixel-pack');
const manifestPath = path.join(emojiDirectory, 'emoji-ids.json');
const legacyManifestPath = path.join(root, 'assets', 'emojis', 'bot-icons', 'emoji-ids.json');
const guildId = process.env.GUILD_ID;
const botToken = process.env.DISCORD_TOKEN;
const emojiNames = [
  'turtle',
  'banhcuon',
  'chopsticks',
  'nuoccham',
  'hanhphi',
  'daily',
  'quest',
  'coin',
  'shop',
  'vip',
  'music',
  'ai',
  'image',
  'moderation',
  'security',
  'ticket',
  'welcome',
  'goodbye',
  'server',
  'settings',
  'user',
  'giveaway',
  'minecraft',
  'game',
  'report',
  'voice',
  'message',
  'success',
  'error',
  'loading',
  'warning',
  'shield',
  'receipt',
  'package',
  'star',
  'chart',
  'trophy',
  'refresh',
  'backpack',
  'list',
  'dice',
  'target',
  'slots',
  'celebration',
  'note',
  'shuffle',
  'trash',
  'upload',
  'thought',
  'eye',
  'broom',
  'plus',
  'pencil',
  'paper',
  'search',
  'minus',
  'toggle',
  'bulb',
  'boot',
  'hammer',
  'pause',
  'lock',
  'unlock',
  'check',
  'info',
  'sponge',
  'police',
  'noentry',
  'mask',
  'controlpanel',
  'construction',
  'suit',
  'explosion',
  'tools',
  'antenna',
  'heart',
  'plugin',
  'floppy',
  'folders',
  'question',
  'book',
  'calculator',
  'flask',
  'pin',
  'sleepy',
  'alarm',
  'pickaxe',
  'banner',
  'medal',
  'diamond',
  'online',
  'offline',
  'idle',
  'bow',
  'potion',
  'chest',
  'beacon',
  'emerald',
  'redstone',
  'meat',
  'fire',
  'water',
  'tree',
  'rock',
];
const uploadAliases = {
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
  beacon: 'star',
  emerald: 'vip',
  redstone: 'minecraft',
  meat: 'banhcuon',
  fire: 'hanhphi',
  water: 'nuoccham',
  tree: 'hanhphi',
  rock: 'minecraft',
};
const uploadNames = emojiNames.filter((name) => !(name in uploadAliases));
const maxEmojiSlots = 50;
const replaceAll = process.argv.includes('--replace-all');
const deleteAll = process.argv.includes('--delete-all');
if (replaceAll && deleteAll) {
  throw new Error('Choose either --replace-all or --delete-all, not both.');
}

if (!botToken || !guildId) {
  throw new Error('Set DISCORD_TOKEN and GUILD_ID in the local .env file before uploading pixel emojis.');
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function saveManifest(manifest) {
  for (const targetPath of [manifestPath, legacyManifestPath]) {
    const temporaryPath = `${targetPath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, targetPath);
  }
}

try {
  await client.login(botToken);
  const guild = await client.guilds.fetch(guildId);
  const botMember = await guild.members.fetchMe();
  if (!botMember.permissions.has('ManageGuildExpressions')) {
    throw new Error('The bot needs Manage Expressions permission to replace server emoji.');
  }

  let existingEmojis = await client.rest.get(Routes.guildEmojis(guildId));

  if (deleteAll) {
    console.log(`Deleting all ${existingEmojis.length} existing server emoji...`);
    for (const emoji of existingEmojis) {
      await client.rest.delete(Routes.guildEmoji(guildId, emoji.id), {
        reason: 'Remove all server emoji at the server owner’s request',
      });
      console.log(`Deleted: ${emoji.name}`);
    }
    await saveManifest({});
    console.log('Deleted all server emoji and cleared both emoji manifests.');
  } else {
    console.log(`Uploading ${uploadNames.length} custom emojis. ${Object.keys(uploadAliases).length} themed extras use matching uploaded icons because this server supports up to ${maxEmojiSlots}.`);
    const imageBuffers = new Map();
    for (const name of uploadNames) {
      const image = await readFile(path.join(emojiDirectory, `${name}.png`));
      if (image.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
          image.readUInt32BE(16) !== 128 ||
          image.readUInt32BE(20) !== 128) {
        throw new Error(`${name}.png is not a valid 128x128 PNG; refusing to replace server emoji.`);
      }
      imageBuffers.set(name, image);
    }

    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

    if (replaceAll) {
      console.log(`Deleting all ${existingEmojis.length} existing server emoji...`);
      for (const emoji of existingEmojis) {
        await client.rest.delete(Routes.guildEmoji(guildId, emoji.id), {
          reason: 'Replace old server emoji with the pixel emoji pack',
        });
        console.log(`Deleted: ${emoji.name}`);
      }
      existingEmojis = [];
      for (const name of Object.keys(manifest)) delete manifest[name];
      await saveManifest(manifest);
    }

    for (const name of uploadNames) {
      const emojiName = `bc_${name}`;
      const existing = existingEmojis.find((emoji) => emoji.name === emojiName);
      if (existing) {
        manifest[name] = existing.id;
        await saveManifest(manifest);
        console.log(`Already uploaded: ${emojiName}`);
        continue;
      }

      if (existingEmojis.length >= maxEmojiSlots) {
        console.error(`Server emoji limit reached; cannot upload ${emojiName} or remaining emoji.`);
        break;
      }

      const image = imageBuffers.get(name);
      if (!image) throw new Error(`Validated image buffer is missing for ${name}.`);
      let uploaded;
      try {
        uploaded = await client.rest.post(Routes.guildEmojis(guildId), {
          body: {
            name: emojiName,
            image: `data:image/png;base64,${image.toString('base64')}`,
          },
          reason: 'Upload pixel emoji pack for bot command responses',
        });
      } catch (error) {
        if (error?.code === 30008) {
          console.error(`Server emoji limit reached; cannot upload ${emojiName} or remaining emoji.`);
          break;
        }
        throw error;
      }

      manifest[name] = uploaded.id;
      existingEmojis.push(uploaded);
      await saveManifest(manifest);
      console.log(`Uploaded: ${emojiName}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    const missingNames = uploadNames.filter((name) => !manifest[name]);
    if (missingNames.length) {
      console.error(`Upload incomplete; free server emoji slots and rerun for: ${missingNames.join(', ')}`);
      process.exitCode = 1;
    }
    console.log(`Updated pixel emoji manifest: ${path.relative(root, manifestPath)}`);
  }
} finally {
  client.destroy();
}
