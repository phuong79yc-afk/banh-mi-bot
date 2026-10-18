# Implementation Plan: Fix Discord Bot Railway Issues

## Overview
Fix critical issues with Discord bot deployment on Railway: database persistence loss, Components V2 instability, AI module crashes, and music module failures.

---

## FEAT-001: Database Persistence Fix (CRITICAL)

**Problem**: Daily and balance xu updates don't persist on Railway because SQLite database is stored on ephemeral filesystem at `./data/economy.db`. Railway redeploys clear this directory.

**Solution**: Make database path configurable via `DATABASE_PATH` environment variable to support Railway's persistent volume mounts.

- [ ] 1. **Update database initialization path in src/database/init.ts**
      Change line 17 from hardcoded `path.join(process.cwd(), 'data')` to:
      ```typescript
      const dataDir = process.env.DATABASE_PATH || path.join(process.cwd(), 'data');
      ```
      Update console log to show actual path used.
      Files: src/database/init.ts
      Verify: `npm run build` compiles successfully. Check console output shows correct database path when bot starts.

- [ ] 2. **Update daily module database path**
      In src/modules/daily-module/entry_point.ts (lines 48-50), replace hardcoded data directory check and database instantiation to use:
      ```typescript
      const dataDir = process.env.DATABASE_PATH || path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const db = new Database(path.join(dataDir, 'economy.db'));
      ```
      Files: src/modules/daily-module/entry_point.ts
      Verify: `npm run build`, start bot, check console logs for database path. Run `/daily` command, verify xu awarded.

- [ ] 3. **Update balance module database path**
      In src/modules/balance-module/entry_point.ts (line 37), change:
      ```typescript
      const dbPath = process.env.DATABASE_PATH 
        ? path.join(process.env.DATABASE_PATH, 'economy.db')
        : path.join(process.cwd(), 'data', 'economy.db');
      const db = new Database(dbPath);
      ```
      Files: src/modules/balance-module/entry_point.ts
      Verify: Run `/balance` command, verify xu balance matches /daily award.

- [ ] 4. **Search and update other modules using economy.db**
      Search codebase for `'economy.db'` string. Update shop-module, quest-module, vip-module, and any others found to use DATABASE_PATH env var with same pattern.
      Files: src/modules/shop-module/entry_point.ts, src/modules/quest-module/entry_point.ts, src/modules/vip-module/entry_point.ts (if they access economy.db)
      Verify: Build and spot-check each module's commands work.

- [ ] 5. **Document DATABASE_PATH in README**
      Add to README.md under "🔧 Cấu Hình (.env)" section:
      ```
      # Database path (optional, for Railway persistent volumes)
      DATABASE_PATH=/app/data  # Railway: set to mounted volume path
      ```
      Add note: "On Railway, set DATABASE_PATH to a mounted volume path to persist database across deploys."
      Files: README.md
      Verify: Read README, confirm documentation is clear.

- [ ] 6. **Integration test with custom DATABASE_PATH**
      Set `DATABASE_PATH=/tmp/testdb` in local .env file.
      Run `npm run build && npm start`.
      Execute `/daily` command in Discord.
      Check `/tmp/testdb/economy.db` file exists.
      Verify balance with `/balance` command.
      Stop and restart bot with same DATABASE_PATH, run `/balance` again - xu should persist.
      Files: N/A (test only)
      Verify: `sqlite3 /tmp/testdb/economy.db "SELECT * FROM daily_users;"` shows user with correct balance.

---

## FEAT-002: Components V2 Fallback (HIGH)

**Problem**: Discord Components V2 randomly fail to display on Railway. The smartReply utility provides automatic V2→EmbedBuilder fallback, but most modules build V2 directly without using it.

**Solution**: Add try-catch error handling to all modules using ContainerBuilder, falling back to EmbedBuilder when V2 fails.

- [ ] 1. **Review smartReply utility API**
      Read src/utils/smartReply.ts to understand `smartReply()` and `smartEditReply()` functions.
      They accept {title, description, color, fields, footer, thumbnail, image} and handle V2→Embed fallback automatically.
      Files: src/utils/smartReply.ts (reference only)
      Verify: Understanding confirmed - no code changes yet.

- [ ] 2. **Add fallback wrapper utility to smartReply**
      Create new export `safeV2Reply(interaction, containerBuilder, fallbackEmbedBuilder)` that:
      - Tries `interaction.reply({ components: [containerBuilder], flags: V2 })`
      - On error, catches and replies with `{ embeds: [fallbackEmbedBuilder] }`
      - Logs warning: `console.warn('[SafeV2] V2 failed, using embed fallback')`
      Files: src/utils/smartReply.ts
      Verify: `npm run build` compiles successfully.

- [ ] 3. **Convert /help command in utility module**
      In src/modules/utility/entry_point.ts, /help command (line 526+):
      - Wrap the `interaction.editReply({ components: [buildMain()], flags: V2 })` call in try-catch
      - On catch, build fallback EmbedBuilder with command list as fields
      - Use pattern: `try { /* V2 reply */ } catch { /* EmbedBuilder fallback */ }`
      Files: src/modules/utility/entry_point.ts
      Verify: Run `/help`, verify menu shows. Simulate error by temporarily throwing in try block, verify embed fallback works.

- [ ] 4. **Convert /information command**
      Same pattern for /information command (line 642+). Wrap V2 reply in try-catch, fallback to EmbedBuilder with bot stats fields.
      Files: src/modules/utility/entry_point.ts
      Verify: Run `/information`, verify bot info shows.

- [ ] 5. **Add fallback to daily module commands**
      In src/modules/daily-module/entry_point.ts:
      - /daily command (line 320+): wrap `interaction.editReply` calls with try-catch, fallback to simple EmbedBuilder showing reward amount and streak
      - /daily-stats command (line 480+): similar fallback showing stats as embed fields
      - /daily-leaderboard (line 540+): fallback showing top 10 as embed description text
      Files: src/modules/daily-module/entry_point.ts
      Verify: Run `/daily`, `/daily-stats`, `/daily-leaderboard` - all show results (V2 or embed).

- [ ] 6. **Add fallback to VIP module**
      In src/modules/vip-module/entry_point.ts, wrap `sendV2()` calls (line 286+) with try-catch fallback to EmbedBuilder showing VIP tier and benefits.
      Files: src/modules/vip-module/entry_point.ts
      Verify: Run VIP commands, verify info displays.

- [ ] 7. **Add fallback to games module**
      In src/modules/games-module/entry_point.ts, wrap ContainerBuilder replies with try-catch, fallback to text-based EmbedBuilder with game status.
      Files: src/modules/games-module/entry_point.ts
      Verify: Run game commands, verify they respond.

- [ ] 8. **Add fallback to AFK module**
      In src/modules/afk-module/entry_point.ts, wrap ContainerBuilder usage with try-catch fallback to simple embeds.
      Files: src/modules/afk-module/entry_point.ts
      Verify: Run `/afk` and `/afk-list`, verify responses.

- [ ] 9. **Add fallback to music module**
      In src/modules/music-module/entry_point.ts, wrap now-playing card V2 replies with try-catch, fallback to EmbedBuilder with track title, duration, thumbnail.
      Files: src/modules/music-module/entry_point.ts
      Verify: Run `!bc play [song]`, verify now-playing shows (V2 or embed).

- [ ] 10. **Search and convert remaining modules**
      Search for `new ContainerBuilder()` in:
      - autoresponder-module
      - customrole-module  
      - giveaway-module
      - minecraft-module
      - quest-module
      - shop-module
      - ticket-module
      - settings-module
      - Any others found
      
      Add try-catch fallback pattern to each.
      Files: All module entry_point.ts files listed above
      Verify: `npm run build`, spot-test key commands from each module.

---

## FEAT-003: AI Module Error Handling (HIGH)

**Problem**: AI module crashes with "Groq is not initialized" error when GROQ_API_KEYS env var is missing or all keys are rate-limited. Error occurs at src/modules/ai-module/entry_point.ts line 223 in chatWithGroq method.

**Solution**: Add provider availability checks before generating responses, implement auto-fallback between providers, show user-friendly error messages.

- [ ] 1. **Add provider availability check helper**
      In src/modules/ai-module/entry_point.ts, add method:
      ```typescript
      private checkProviderAvailable(provider: Provider): boolean {
        if (provider === 'groq') return keyRotator.getGroqKey() !== null;
        if (provider === 'gemini') return keyRotator.getGeminiKey() !== null;
        return false;
      }
      ```
      Files: src/modules/ai-module/entry_point.ts
      Verify: `npm run build` compiles.

- [ ] 2. **Add early provider check in handleAIChat**
      In handleAIChat method (line 280+), after parsing model option but BEFORE showing loading card:
      ```typescript
      if (!this.checkProviderAvailable(provider)) {
        await interaction.editReply({
          components: [errorCard(`${provider} không khả dụng. Vui lòng thử model khác.`)],
          flags: V2
        });
        return;
      }
      ```
      Files: src/modules/ai-module/entry_point.ts
      Verify: Remove GROQ_API_KEYS from .env, run `/ai` with Groq model - should show error immediately.

- [ ] 3. **Implement auto-fallback logic**
      In handleAIChat, if selected provider unavailable:
      - Check if alternate provider available (Groq→Gemini or Gemini→Groq)
      - If yes, auto-switch model to alternate provider's default model
      - Log: `console.log('[AI] Auto-switching from ${provider} to ${alternateProvider}')`
      - If no providers available, show error: "Không có AI provider nào khả dụng"
      Files: src/modules/ai-module/entry_point.ts
      Verify: Test with only Gemini keys - selecting Groq model should auto-switch to Gemini and work.

- [ ] 4. **Improve error messages in chatWithGroq/chatWithGemini**
      Update error thrown when key is null:
      - chatWithGroq: `throw new Error('Groq không khả dụng (không có API key hoặc tất cả keys bị giới hạn)')`
      - chatWithGemini: similar message
      Files: src/modules/ai-module/entry_point.ts
      Verify: Error messages are user-friendly in Vietnamese.

- [ ] 5. **Add comprehensive error logging on startup**
      In initialize() method, after checkKeys():
      ```typescript
      const groqAvailable = keyRotator.getGroqKey() !== null;
      const geminiAvailable = keyRotator.getGeminiKey() !== null;
      if (!groqAvailable) console.warn('  ⚠️  No Groq keys available - Groq models disabled');
      if (!geminiAvailable) console.warn('  ⚠️  No Gemini keys available - Gemini models disabled');
      if (!groqAvailable && !geminiAvailable) console.error('  ❌ NO AI PROVIDERS AVAILABLE - /ai command will not work');
      ```
      Files: src/modules/ai-module/entry_point.ts
      Verify: Start bot with no keys, check console shows clear warnings.

- [ ] 6. **Update /ai-models command status display**
      In handleModelsCommand (line 690+), update status dot logic:
      - 🟢 if active > 0
      - 🟡 if total > 0 but active === 0 (all blocked/rate-limited)
      - 🔴 if total === 0 (no keys configured)
      Files: src/modules/ai-module/entry_point.ts
      Verify: Run `/ai-models`, verify status colors match key availability.

- [ ] 7. **Add global error catch in handleAIChat**
      Wrap entire handleAIChat body in outer try-catch:
      ```typescript
      async handleAIChat(interaction) {
        try {
          // ... existing defer logic ...
          try {
            // ... main logic ...
          } catch (error) {
            // ... existing error handler ...
          }
        } catch (fatalError) {
          console.error('[AI] Fatal error:', fatalError);
          await interaction.editReply({
            components: [errorCard('Đã xảy ra lỗi nghiêm trọng. Vui lòng thử lại sau.')],
            flags: V2
          }).catch(() => {});
        }
      }
      ```
      Files: src/modules/ai-module/entry_point.ts
      Verify: No unhandled promise rejections in console when errors occur.

---

## FEAT-004: Music Module Investigation (MEDIUM)

**Problem**: User reports music commands don't work. Music module exists at src/modules/music-module/entry_point.ts using discord-player v7 with prefix commands (!bc play, !bc skip, etc.).

**Solution**: Verify module initialization, add comprehensive error handling, implement V2 fallback for now-playing cards.

- [ ] 1. **Check music module is loaded and enabled**
      Search for src/modules/music-module/metadata.json, verify `"enabled": true`.
      Check main bot entry point (src/index.ts or module loader) logs to confirm music module loads on startup.
      Files: src/modules/music-module/metadata.json, src/index.ts (read only)
      Verify: Start bot, check console logs for "Music module" initialization message.

- [ ] 2. **Verify discord-player initialization**
      Read src/modules/music-module/entry_point.ts constructor and initialize() method.
      Confirm Player instance created with `new Player(client)` or `useMainPlayer()`.
      Verify extractors registered (YouTubei, Spotify, etc.).
      Files: src/modules/music-module/entry_point.ts
      Verify: Start bot, music module logs show Player initialized.

- [ ] 3. **Add startup diagnostics to music module**
      In initialize() method, add:
      ```typescript
      try {
        const player = useMainPlayer();
        if (!player) throw new Error('Player not initialized');
        console.log('  ✅ Discord Player ready');
        console.log('  📀 Extractors:', player.extractors.list().join(', '));
      } catch (error) {
        console.error('  ❌ Music module failed to initialize:', error);
      }
      ```
      Files: src/modules/music-module/entry_point.ts
      Verify: Start bot, check console shows extractors loaded.

- [ ] 4. **Add comprehensive error handling to prefix command handler**
      Locate messageCreate event listener that handles `!bc` commands.
      Wrap each command handler (play, skip, pause, etc.) in try-catch:
      ```typescript
      try {
        // ... command logic ...
      } catch (error) {
        console.error(`[Music] ${commandName} error:`, error);
        await message.reply(`❌ Lỗi: ${error.message}`).catch(() => {});
      }
      ```
      Files: src/modules/music-module/entry_point.ts
      Verify: Run `!bc play invalid` - should show error message, not crash.

- [ ] 5. **Add specific error checks for common failures**
      In play command handler, add checks:
      - User not in voice channel: `if (!member.voice.channel) return message.reply('❌ Bạn phải vào voice channel trước!')`
      - Bot lacks voice permissions: check `member.voice.channel.permissionsFor(client.user).has(['Connect', 'Speak'])`
      - Track not found: catch SearchResult errors and show "❌ Không tìm thấy bài hát"
      Files: src/modules/music-module/entry_point.ts
      Verify: Test each error scenario, verify user gets clear error message.

- [ ] 6. **Add V2 fallback to now-playing cards**
      Locate nowPlaying() function that builds ContainerBuilder (line 95+).
      Wrap all message.reply/channel.send calls using now-playing cards in try-catch:
      ```typescript
      try {
        await channel.send({ components: [nowPlayingCard], flags: V2 });
      } catch (error) {
        // Fallback to EmbedBuilder
        const embed = new EmbedBuilder()
          .setTitle('🎵 Now Playing')
          .setDescription(`**${track.title}**\n${track.author}`)
          .addFields({ name: 'Duration', value: track.duration })
          .setThumbnail(track.thumbnail);
        await channel.send({ embeds: [embed] });
      }
      ```
      Files: src/modules/music-module/entry_point.ts
      Verify: Music plays and now-playing shows (V2 or embed).

- [ ] 7. **Test music commands end-to-end**
      Join voice channel in test Discord server.
      Run `!bc play never gonna give you up`.
      Verify bot joins voice, plays audio, shows now-playing card.
      Run `!bc queue` - verify queue shown.
      Run `!bc skip` - verify skips to next song or stops if queue empty.
      Run `!bc stop` - verify bot leaves voice and clears queue.
      Files: N/A (manual testing)
      Verify: All commands work or show clear errors. Check console logs for any errors.

- [ ] 8. **Document music commands troubleshooting**
      Add to README.md under music section:
      - Required dependencies: discord-player, @discord-player/extractor, ffmpeg-static
      - Common issues: ffmpeg not found (check ffmpeg-static installed), permissions (bot needs Connect/Speak)
      - Error logs location: console output shows [Music] prefixed errors
      Files: README.md
      Verify: Documentation is clear and helpful.

---

## Final Integration Verification

After completing all FEATs:

- [ ] 1. **Full build and startup test**
      ```bash
      npm run build
      npm start
      ```
      Verify bot starts without errors, all modules load, database initializes at correct path.

- [ ] 2. **Database persistence test on Railway**
      Deploy to Railway with DATABASE_PATH set to persistent volume mount.
      Run `/daily` command multiple times across redeploys.
      Verify xu balance persists.

- [ ] 3. **V2 fallback stress test**
      Test all major commands: /help, /daily, /ai, /balance, music commands.
      Verify all respond successfully (V2 or embed fallback).

- [ ] 4. **AI error handling test**
      Test /ai with missing keys, rate-limited keys, invalid models.
      Verify all show user-friendly errors, no crashes.

- [ ] 5. **Music comprehensive test**
      Test all music commands: play, skip, queue, pause, resume, stop.
      Verify audio plays correctly and now-playing displays work.

- [ ] 6. **Monitor Railway logs**
      After deploy, watch Railway logs for:
      - Database path confirmation
      - Any V2 fallback warnings
      - AI provider availability
      - Music module errors
      Verify no critical errors occur.

---

## Notes

- **No test framework**: This project has no automated tests. All verification must be done manually by running bot and testing commands in Discord.
- **Railway environment**: DATABASE_PATH must point to mounted persistent volume on Railway (e.g., `/app/data` if volume mounted there).
- **Components V2 instability**: V2 failures are unpredictable. Fallbacks ensure bot always responds even if V2 doesn't render.
- **AI keys**: Bot supports multiple Groq and Gemini keys with automatic rotation. Empty keys array causes "not initialized" error.
- **Music dependencies**: discord-player v7 requires proper Player initialization and extractor registration. Missing ffmpeg or permissions cause playback failures.

