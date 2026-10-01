import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Get GUILD_ID from .env (your current server)
const CURRENT_SERVER = process.env.GUILD_ID || '1482354951689605150';

const allEmoji = [
  { file: 'play.png', name: 'music_play' },
  { file: 'pause.png', name: 'music_pause' },
  { file: 'stop.png', name: 'music_stop' },
  { file: 'skip.png', name: 'music_skip' },
  { file: 'previous.png', name: 'music_prev' },
  { file: 'loop.png', name: 'music_loop' },
  { file: 'shuffle.png', name: 'music_shuffle' },
  { file: 'volume.png', name: 'music_volume' },
  { file: 'queue.png', name: 'music_queue' },
  { file: 'lyrics.png', name: 'music_lyrics' },
  { file: 'music.png', name: 'music' },
  { file: 'ban.png', name: 'mod_ban' },
  { file: 'kick.png', name: 'mod_kick' },
  { file: 'mute.png', name: 'mod_mute' },
  { file: 'warn.png', name: 'mod_warn' },
  { file: 'timeout.png', name: 'mod_timeout' },
  { file: 'lock.png', name: 'mod_lock' },
  { file: 'unlock.png', name: 'mod_unlock' },
  { file: 'slowmode.png', name: 'mod_slowmode' },
  { file: 'purge.png', name: 'mod_purge' },
  { file: 'nuke.png', name: 'mod_nuke' },
  { file: 'settings.png', name: 'util_settings' },
  { file: 'help.png', name: 'util_help' },
  { file: 'ping.png', name: 'util_ping' },
  { file: 'stats.png', name: 'util_stats' },
  { file: 'avatar.png', name: 'util_avatar' },
  { file: 'search.png', name: 'util_search' },
  { file: 'filter.png', name: 'util_filter' },
  { file: 'wallet.png', name: 'eco_wallet' },
  { file: 'coin.png', name: 'eco_coin' },
  { file: 'gift.png', name: 'eco_gift' },
  { file: 'success.png', name: 'status_success' },
  { file: 'error.png', name: 'status_error' },
  { file: 'loading.png', name: 'status_loading' },
  { file: 'info.png', name: 'status_info' },
  { file: 'ticket.png', name: 'ticket' },
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
];

client.once('ready', async () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}\n`);
  
  const guild = client.guilds.cache.get(CURRENT_SERVER);
  
  if (!guild) {
    console.error('❌ Current server not found!');
    process.exit(1);
  }

  console.log(`🎨 Uploading to current server: ${guild.name}`);
  console.log(`📊 Current emoji: ${guild.emojis.cache.size}/100\n`);
  
  // Check if we need to delete old emoji first
  const existingCount = guild.emojis.cache.size;
  const canUpload = 100 - existingCount;
  
  if (canUpload < allEmoji.length) {
    console.log(`⚠️  Not enough slots! Need ${allEmoji.length}, have ${canUpload}`);
    console.log(`\n🗑️  Delete old emoji first? (y/n)`);
    console.log(`   Or boost server for more slots (100 → 150/200/250)\n`);
  }

  const results: any[] = [];
  let uploaded = 0;
  
  for (const emoji of allEmoji) {
    try {
      // Check if emoji already exists
      const existing = guild.emojis.cache.find(e => e.name === emoji.name);
      if (existing) {
        console.log(`⏭️  ${emoji.name.padEnd(20)} - Already exists (${existing.id})`);
        results.push({
          name: emoji.name.toUpperCase().replace(/-/g, '_'),
          id: existing.id,
          format: `<:${existing.name}:${existing.id}>`
        });
        continue;
      }

      const pngPath = path.join(__dirname, '../discord-emoji-png', emoji.file);
      
      if (!fs.existsSync(pngPath)) {
        console.log(`⚠️  ${emoji.name.padEnd(20)} - File not found`);
        continue;
      }

      const created = await guild.emojis.create({
        attachment: pngPath,
        name: emoji.name
      });

      uploaded++;
      console.log(`✅ ${emoji.name.padEnd(20)} - <:${created.name}:${created.id}>`);
      
      results.push({
        name: emoji.name.toUpperCase().replace(/-/g, '_'),
        id: created.id,
        format: `<:${created.name}:${created.id}>`
      });

      await new Promise(resolve => setTimeout(resolve, 1200));
      
    } catch (error: any) {
      console.error(`❌ ${emoji.name.padEnd(20)} - ${error.message}`);
      
      if (error.message.includes('Maximum number')) {
        console.log('\n⚠️  Server reached limit!');
        console.log('   Options:');
        console.log('   1. Boost server (Nitro): 100 → 150/200/250 slots');
        console.log('   2. Delete unused emoji');
        console.log('   3. Use fallback Unicode emoji\n');
        break;
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 Upload complete!`);
  console.log(`✅ Uploaded: ${uploaded} new emoji`);
  console.log(`📝 Total: ${results.length}/${allEmoji.length} emoji`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (results.length > 0) {
    console.log('📝 Update src/utils/customEmoji.ts:\n');
    console.log('export const CUSTOM_EMOJI = {');
    results.forEach(r => {
      console.log(`  ${r.name}: '${r.format}',`);
    });
    console.log('} as const;\n');
  }

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
