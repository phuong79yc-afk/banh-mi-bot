import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: join(projectRoot, '.env') });

const token = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN;
const guildId = process.env.GUILD_ID;
const emojiNames = ['tt_music', 'tt_video', 'tt_photo', 'tt_like', 'tt_share', 'tt_comment'];
const requestedName = process.argv[2];
const uploadNames = requestedName ? emojiNames.filter((name) => name === requestedName) : emojiNames;
const emojiDir = join(projectRoot, 'assets', 'emojis', 'tiktok');

if (requestedName && uploadNames.length === 0) {
  throw new Error(`Unknown TikTok emoji: ${requestedName}`);
}

if (!token || !guildId) {
  throw new Error('DISCORD_TOKEN (or BOT_TOKEN) and GUILD_ID must be set in .env');
}

for (const name of uploadNames) {
  if (!existsSync(join(emojiDir, `${name}.png`))) {
    throw new Error(`Missing ${name}.png; run generate-tiktok-emojis.mjs first`);
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

try {
  await client.login(token);
  const guild = await client.guilds.fetch(guildId);
  const botMember = await guild.members.fetch(client.user.id);
  const canManage = botMember.permissions.has(PermissionFlagsBits.ManageGuildExpressions)
    || botMember.permissions.has(PermissionFlagsBits.Administrator);

  if (!canManage) {
    throw new Error('Bot needs Manage Expressions permission in the target server');
  }

  const existing = await guild.emojis.fetch();
  const tierLimits = [50, 100, 150, 250];
  const limit = tierLimits[guild.premiumTier] ?? 50;
  const missing = uploadNames.filter((name) => !existing.some((emoji) => emoji.name === name));

  if (existing.size + missing.length > limit) {
    throw new Error(`Not enough emoji slots: ${existing.size}/${limit} used, ${missing.length} needed`);
  }

  console.log(`Updating TikTok emoji set on ${guild.name} (${missing.length} new, ${existing.size}/${limit} slots used)`);

  for (const name of uploadNames) {
    const alreadyThere = existing.find((emoji) => emoji.name === name);
    if (alreadyThere) {
      await alreadyThere.delete('Replace old TikTok emoji with white version');
      console.log(`Deleted old :${name}:`);
    }

    const created = await guild.emojis.create({
      attachment: join(emojiDir, `${name}.png`),
      name,
      reason: 'TikTok module emoji set',
    });
    console.log(`Created :${created.name}: <${created.animated ? 'a' : ''}:${created.name}:${created.id}>`);
    await new Promise((done) => setTimeout(done, 1500));
  }
} finally {
  client.destroy();
}