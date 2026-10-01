import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const newEmoji = [
  { file: 'crown.png', name: 'crown' },
  { file: 'trophy.png', name: 'trophy' },
  { file: 'heart.png', name: 'heart' },
  { file: 'sparkles.png', name: 'sparkles' },
  { file: 'chart.png', name: 'chart' },
  { file: 'shield.png', name: 'shield' },
  { file: 'calendar.png', name: 'calendar' },
  { file: 'dice.png', name: 'dice' },
  { file: 'globe.png', name: 'globe' },
  { file: 'clock.png', name: 'clock' },
  { file: 'gem.png', name: 'gem' },
  { file: 'confetti.png', name: 'confetti' },
  { file: 'castle.png', name: 'castle' },
  { file: 'dart.png', name: 'dart' },
  { file: 'envelope.png', name: 'envelope' }
];

client.once('ready', async () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
  
  const GUILD_ID = process.env.GUILD_ID || '1482354951689605150';
  const guild = client.guilds.cache.get(GUILD_ID);
  
  if (!guild) {
    console.error('❌ Guild not found!');
    process.exit(1);
  }

  console.log(`\n🎨 Uploading ${newEmoji.length} new emoji to: ${guild.name}\n`);

  const results: any[] = [];
  
  for (const emoji of newEmoji) {
    try {
      const pngPath = path.join(__dirname, '../discord-emoji-png', emoji.file);
      
      if (!fs.existsSync(pngPath)) {
        console.log(`⚠️  ${emoji.name.padEnd(20)} - File not found: ${emoji.file}`);
        continue;
      }

      const created = await guild.emojis.create({
        attachment: pngPath,
        name: emoji.name
      });

      console.log(`✅ ${emoji.name.padEnd(20)} - <:${created.name}:${created.id}>`);
      
      results.push({
        name: emoji.name.toUpperCase(),
        id: created.id,
        format: `<:${created.name}:${created.id}>`
      });

      // Wait 1s between uploads to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error(`❌ ${emoji.name.padEnd(20)} - ${error.message}`);
    }
  }

  console.log(`\n🎉 Upload complete! ${results.length}/${newEmoji.length} emoji uploaded\n`);
  
  // Generate TypeScript code
  console.log('📝 Add these to customEmoji.ts:\n');
  console.log('export const CUSTOM_EMOJI = {');
  console.log('  // ... existing emoji ...\n');
  results.forEach(r => {
    console.log(`  ${r.name}: '${r.format}',`);
  });
  console.log('} as const;\n');

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
