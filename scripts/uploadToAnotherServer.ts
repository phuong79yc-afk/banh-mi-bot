import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ALL EMOJI TO UPLOAD (can upload all remaining)
const allEmoji = [
  // Phase 1 - Already uploaded (36)
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
  
  // Phase 2 - New emoji (14)
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
  { file: 'envelope.png', name: 'envelope' },
];

client.once('ready', async () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
  console.log(`\n📋 Available servers:\n`);
  
  // List all servers bot is in
  client.guilds.cache.forEach((guild, index) => {
    console.log(`${index + 1}. ${guild.name} (ID: ${guild.id}) - ${guild.memberCount} members`);
  });
  
  console.log(`\n❓ Which server to upload to?`);
  console.log(`   Set EMOJI_SERVER_ID in .env or provide as argument\n`);
  
  const targetServerId = process.env.EMOJI_SERVER_ID || process.argv[2];
  
  if (!targetServerId) {
    console.log('❌ Please provide server ID:');
    console.log('   Method 1: Add to .env: EMOJI_SERVER_ID=your_server_id');
    console.log('   Method 2: Run with: npm run upload-emoji-other <server_id>');
    console.log('\n💡 TIP: Create a new private server just for emoji storage!');
    process.exit(1);
  }

  const guild = client.guilds.cache.get(targetServerId);
  
  if (!guild) {
    console.error(`❌ Server not found! Bot is not in server ID: ${targetServerId}`);
    console.log('\n📝 Make sure:');
    console.log('   1. Bot has been invited to the server');
    console.log('   2. Server ID is correct');
    console.log('   3. Bot has "Manage Emojis" permission\n');
    process.exit(1);
  }

  console.log(`\n🎨 Uploading ${allEmoji.length} emoji to: ${guild.name}\n`);
  console.log(`📊 Server emoji slots: ${guild.emojis.cache.size}/100 (animated + static)\n`);

  const results: any[] = [];
  const errors: any[] = [];
  
  for (let i = 0; i < allEmoji.length; i++) {
    const emoji = allEmoji[i];
    
    try {
      const pngPath = path.join(__dirname, '../discord-emoji-png', emoji.file);
      
      if (!fs.existsSync(pngPath)) {
        console.log(`⚠️  ${emoji.name.padEnd(20)} - File not found: ${emoji.file}`);
        errors.push({ name: emoji.name, error: 'File not found' });
        continue;
      }

      const created = await guild.emojis.create({
        attachment: pngPath,
        name: emoji.name
      });

      console.log(`✅ [${i + 1}/${allEmoji.length}] ${emoji.name.padEnd(20)} - <:${created.name}:${created.id}>`);
      
      results.push({
        name: emoji.name.toUpperCase().replace(/-/g, '_'),
        id: created.id,
        format: `<:${created.name}:${created.id}>`
      });

      // Wait 1.2s between uploads to avoid rate limit (50 per minute)
      await new Promise(resolve => setTimeout(resolve, 1200));
      
    } catch (error: any) {
      console.error(`❌ [${i + 1}/${allEmoji.length}] ${emoji.name.padEnd(20)} - ${error.message}`);
      errors.push({ name: emoji.name, error: error.message });
      
      if (error.message.includes('Maximum number of emojis')) {
        console.log('\n⚠️  Server reached emoji limit! Consider:');
        console.log('   1. Boost server for more slots (100 → 150/200/250)');
        console.log('   2. Use another server for remaining emoji');
        console.log('   3. Delete unused emoji\n');
        break;
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 Upload complete!`);
  console.log(`✅ Success: ${results.length}/${allEmoji.length} emoji`);
  console.log(`❌ Failed: ${errors.length}/${allEmoji.length} emoji`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (results.length > 0) {
    console.log('📝 TypeScript code for customEmoji.ts:\n');
    console.log('export const CUSTOM_EMOJI = {');
    results.forEach(r => {
      console.log(`  ${r.name}: '${r.format}',`);
    });
    console.log('} as const;\n');
  }

  if (errors.length > 0) {
    console.log('❌ Errors encountered:\n');
    errors.forEach(e => {
      console.log(`   ${e.name}: ${e.error}`);
    });
  }

  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Copy the TypeScript code above');
  console.log('   2. Update src/utils/customEmoji.ts with new IDs');
  console.log('   3. Rebuild: npm run build');
  console.log('   4. Test in Discord!\n');

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
