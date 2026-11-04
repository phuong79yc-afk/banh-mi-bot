import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const token = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN;
const guildId = process.env.GUILD_ID;
const emojiDirectory = path.join(projectRoot, 'assets', 'emojis', 'tiktok-live');
const emojiNames = [
  'pxa_broadcast',
  'pxa_live_bell',
  'pxa_live_off',
  'pxa_megaphone',
  'pxa_rose',
  'pxa_tiktok',
  'pxa_tiktok_live',
  'pxa_video',
];

if (!token || !guildId) {
  throw new Error('DISCORD_TOKEN (or BOT_TOKEN) and GUILD_ID must be set in .env');
}

const images = new Map();
for (const name of emojiNames) {
  const image = await readFile(path.join(emojiDirectory, `${name}.gif`));
  if (image.subarray(0, 3).toString('ascii') !== 'GIF') {
    throw new Error(`${name}.gif is not a valid GIF`);
  }
  images.set(name, image);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

try {
  await client.login(token);
  const guild = await client.guilds.fetch(guildId);
  const botMember = await guild.members.fetchMe();
  if (
    !botMember.permissions.has(PermissionFlagsBits.ManageGuildExpressions) &&
    !botMember.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    throw new Error('Bot needs Manage Expressions permission in the target server');
  }

  const existing = await guild.emojis.fetch();
  const maxAnimatedEmojiCount = [50, 100, 150, 250][guild.premiumTier] ?? 50;
  const missing = emojiNames.filter((name) => {
    const emoji = existing.find((item) => item.name === name);
    if (emoji && !emoji.animated) {
      throw new Error(`:${name}: already exists as a static emoji; refusing to replace it`);
    }
    return !emoji;
  });
  const animatedCount = existing.filter((emoji) => emoji.animated).size;
  if (animatedCount + missing.length > maxAnimatedEmojiCount) {
    throw new Error(
      `Not enough animated emoji slots: ${animatedCount}/${maxAnimatedEmojiCount} used, ${missing.length} needed`,
    );
  }

  console.log(
    `Uploading ${missing.length} TikTok LIVE animated emojis to ${guild.name} (${animatedCount}/${maxAnimatedEmojiCount} animated slots used)`,
  );
  for (const name of missing) {
    const created = await guild.emojis.create({
      attachment: images.get(name),
      name,
      reason: 'Add animated pixel emojis for TikTok LIVE notifications',
    });
    console.log(`Created <a:${created.name}:${created.id}>`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
} finally {
  client.destroy();
}
