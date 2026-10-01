import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN!;
const GUILD_ID = process.env.GUILD_ID!;

interface EmojiMapping {
  fileName: string;
  emojiName: string;
  category: string;
}

// Mapping file names to emoji names
const EMOJI_MAPPINGS: EmojiMapping[] = [
  // Music (11)
  { fileName: 'play.png', emojiName: 'music_play', category: 'Music' },
  { fileName: 'pause.png', emojiName: 'music_pause', category: 'Music' },
  { fileName: 'stop.png', emojiName: 'music_stop', category: 'Music' },
  { fileName: 'skip.png', emojiName: 'music_skip', category: 'Music' },
  { fileName: 'previous.png', emojiName: 'music_prev', category: 'Music' },
  { fileName: 'loop.png', emojiName: 'music_loop', category: 'Music' },
  { fileName: 'shuffle.png', emojiName: 'music_shuffle', category: 'Music' },
  { fileName: 'volume.png', emojiName: 'music_volume', category: 'Music' },
  { fileName: 'queue.png', emojiName: 'music_queue', category: 'Music' },
  { fileName: 'lyrics.png', emojiName: 'music_lyrics', category: 'Music' },
  { fileName: 'music.png', emojiName: 'music', category: 'Music' },

  // Moderation (10)
  { fileName: 'ban.png', emojiName: 'mod_ban', category: 'Moderation' },
  { fileName: 'kick.png', emojiName: 'mod_kick', category: 'Moderation' },
  { fileName: 'mute.png', emojiName: 'mod_mute', category: 'Moderation' },
  { fileName: 'warn.png', emojiName: 'mod_warn', category: 'Moderation' },
  { fileName: 'timeout.png', emojiName: 'mod_timeout', category: 'Moderation' },
  { fileName: 'lock.png', emojiName: 'mod_lock', category: 'Moderation' },
  { fileName: 'unlock.png', emojiName: 'mod_unlock', category: 'Moderation' },
  { fileName: 'slowmode.png', emojiName: 'mod_slowmode', category: 'Moderation' },
  { fileName: 'purge.png', emojiName: 'mod_purge', category: 'Moderation' },
  { fileName: 'nuke.png', emojiName: 'mod_nuke', category: 'Moderation' },

  // Utility (7)
  { fileName: 'settings.png', emojiName: 'util_settings', category: 'Utility' },
  { fileName: 'help.png', emojiName: 'util_help', category: 'Utility' },
  { fileName: 'ping.png', emojiName: 'util_ping', category: 'Utility' },
  { fileName: 'stats.png', emojiName: 'util_stats', category: 'Utility' },
  { fileName: 'avatar.png', emojiName: 'util_avatar', category: 'Utility' },
  { fileName: 'search.png', emojiName: 'util_search', category: 'Utility' },
  { fileName: 'filter.png', emojiName: 'util_filter', category: 'Utility' },

  // Economy (3)
  { fileName: 'wallet.png', emojiName: 'eco_wallet', category: 'Economy' },
  { fileName: 'coin.png', emojiName: 'eco_coin', category: 'Economy' },
  { fileName: 'gift.png', emojiName: 'eco_gift', category: 'Economy' },

  // Status (5)
  { fileName: 'success.png', emojiName: 'status_success', category: 'Status' },
  { fileName: 'error.png', emojiName: 'status_error', category: 'Status' },
  { fileName: 'loading.png', emojiName: 'status_loading', category: 'Status' },
  { fileName: 'info.png', emojiName: 'status_info', category: 'Status' },
  { fileName: 'ticket.png', emojiName: 'ticket', category: 'Status' },
];

async function uploadEmoji() {
  console.log('🎨 Starting emoji upload process...\n');

  if (!TOKEN || !GUILD_ID) {
    console.error('❌ Error: DISCORD_TOKEN or GUILD_ID not found in .env file');
    console.log('Please add to .env:');
    console.log('DISCORD_TOKEN=your_bot_token');
    console.log('GUILD_ID=your_server_id');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const emojiDir = join(__dirname, '..', 'discord-emoji-png');

  // Check if directory exists
  try {
    readdirSync(emojiDir);
  } catch (error) {
    console.error('❌ Error: discord-emoji-png folder not found');
    process.exit(1);
  }

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  // Get existing emojis
  console.log('📋 Checking existing emojis...\n');
  let existingEmojis: any[] = [];
  try {
    const guild: any = await rest.get(Routes.guild(GUILD_ID));
    existingEmojis = guild.emojis || [];
    console.log(`Found ${existingEmojis.length} existing emojis\n`);
  } catch (error: any) {
    console.error('❌ Error fetching guild info:', error.message);
  }

  const results: { name: string; id: string; url: string }[] = [];

  // Upload emojis
  for (const mapping of EMOJI_MAPPINGS) {
    const filePath = join(emojiDir, mapping.fileName);

    try {
      // Check if file exists
      const fileBuffer = readFileSync(filePath);
      const base64Image = `data:image/png;base64,${fileBuffer.toString('base64')}`;

      // Check if emoji already exists
      const existingEmoji = existingEmojis.find((e: any) => e.name === mapping.emojiName);

      if (existingEmoji) {
        console.log(`⏭️  ${mapping.fileName.padEnd(20)} → :${mapping.emojiName}: already exists (ID: ${existingEmoji.id})`);
        results.push({
          name: mapping.emojiName,
          id: existingEmoji.id,
          url: `https://cdn.discordapp.com/emojis/${existingEmoji.id}.png`
        });
        skippedCount++;
        continue;
      }

      // Upload emoji
      const emoji: any = await rest.post(Routes.guildEmojis(GUILD_ID), {
        body: {
          name: mapping.emojiName,
          image: base64Image,
        },
      });

      console.log(`✅ ${mapping.fileName.padEnd(20)} → :${mapping.emojiName}: (ID: ${emoji.id})`);
      
      results.push({
        name: mapping.emojiName,
        id: emoji.id,
        url: `https://cdn.discordapp.com/emojis/${emoji.id}.png`
      });

      successCount++;

      // Rate limit: Wait 1 second between uploads
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error: any) {
      console.error(`❌ ${mapping.fileName.padEnd(20)} → Error: ${error.message}`);
      errorCount++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Uploaded: ${successCount}`);
  console.log(`⏭️  Skipped: ${skippedCount} (already exists)`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📦 Total: ${EMOJI_MAPPINGS.length}`);
  console.log('='.repeat(60));

  // Generate customEmoji.ts file
  if (results.length > 0) {
    console.log('\n📝 Generating customEmoji.ts file...');
    generateEmojiFile(results);
    console.log('✅ File created: src/utils/customEmoji.ts');
  }

  console.log('\n🎉 Done! All emojis uploaded successfully!');
  console.log('\n💡 Usage:');
  console.log('   import { CUSTOM_EMOJI } from "./utils/customEmoji";');
  console.log('   .setTitle(`${CUSTOM_EMOJI.MUSIC_PLAY} Now Playing`)');
}

function generateEmojiFile(results: { name: string; id: string; url: string }[]) {
  const groupedEmojis: { [key: string]: typeof results } = {
    Music: [],
    Moderation: [],
    Utility: [],
    Economy: [],
    Status: [],
  };

  // Group emojis by category
  for (const result of results) {
    const mapping = EMOJI_MAPPINGS.find(m => m.emojiName === result.name);
    if (mapping) {
      groupedEmojis[mapping.category].push(result);
    }
  }

  let fileContent = `// Auto-generated custom emoji mappings
// Generated at: ${new Date().toISOString()}
// Total emojis: ${results.length}

export const CUSTOM_EMOJI = {\n`;

  // Music
  fileContent += '  // 🎵 Music Commands\n';
  for (const emoji of groupedEmojis.Music) {
    const constName = emoji.name.toUpperCase();
    fileContent += `  ${constName}: '<:${emoji.name}:${emoji.id}>',\n`;
  }

  // Moderation
  fileContent += '\n  // 🛡️ Moderation Commands\n';
  for (const emoji of groupedEmojis.Moderation) {
    const constName = emoji.name.toUpperCase();
    fileContent += `  ${constName}: '<:${emoji.name}:${emoji.id}>',\n`;
  }

  // Utility
  fileContent += '\n  // ⚙️ Utility Commands\n';
  for (const emoji of groupedEmojis.Utility) {
    const constName = emoji.name.toUpperCase();
    fileContent += `  ${constName}: '<:${emoji.name}:${emoji.id}>',\n`;
  }

  // Economy
  fileContent += '\n  // 💰 Economy Commands\n';
  for (const emoji of groupedEmojis.Economy) {
    const constName = emoji.name.toUpperCase();
    fileContent += `  ${constName}: '<:${emoji.name}:${emoji.id}>',\n`;
  }

  // Status
  fileContent += '\n  // ℹ️ Status Icons\n';
  for (const emoji of groupedEmojis.Status) {
    const constName = emoji.name.toUpperCase();
    fileContent += `  ${constName}: '<:${emoji.name}:${emoji.id}>',\n`;
  }

  fileContent += '} as const;\n\n';

  // Add helper type
  fileContent += `// Type-safe emoji keys
export type CustomEmojiKey = keyof typeof CUSTOM_EMOJI;

// Helper function to get emoji by key
export function getEmoji(key: CustomEmojiKey): string {
  return CUSTOM_EMOJI[key];
}

// All emoji IDs for reference
export const EMOJI_IDS = {\n`;

  for (const emoji of results) {
    const constName = emoji.name.toUpperCase();
    fileContent += `  ${constName}: '${emoji.id}',\n`;
  }

  fileContent += '} as const;\n';

  // Write to file
  const { writeFileSync } = require('fs');
  const outputPath = join(__dirname, '..', 'src', 'utils', 'customEmoji.ts');
  writeFileSync(outputPath, fileContent, 'utf-8');
}

// Run the upload
uploadEmoji().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
