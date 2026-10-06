# Implementation Plan: Quest Module Refactor

## Overview
Refactor the quest module to implement a new quest system with daily/weekly quests, auto-tracking, cap system, and beautiful UI. The current implementation tracks simple message/reaction quests but lacks period management, command tracking, and proper currency integration.

---

## Codebase Analysis

### Module System Pattern
- **ModuleLoader**: Located in `src/core/ModuleLoader.ts`
- **Pattern**: Each module exports a default class with `initialize()` and `cleanup()` methods
- **Commands**: Stored in `this.commands` Collection, auto-registered by ModuleLoader
- **Events**: Registered in `registerEvents()` during `initialize()`

### Current Quest Module (`src/modules/quest-module/entry_point.ts`)
- **Structure**: Default export of `QuestModule` class with `initialize()`, `cleanup()`, `commands` Collection
- **Data**: Uses `data/quests.json` with flat structure
- **Tracking**: Message and reaction events only
- **Issues**: No period management, no command tracking, no cap system, coins added directly to `coins.json`

### Currency Integration (coins-module vs shop-module)
**Analysis**: The codebase has TWO currency systems that coexist:
1. **Legacy `coins.json`** (simple `{ userId: amount }`)
2. **New `currencies.json`** (multi-currency: `{ userId: { cowoncy, blueTicket, goldTicket } }`)

**coins-module** (`src/modules/coins-module/entry_point.ts`):
- Manages the NEW multi-currency system in `currencies.json`
- Functions: `addCurrency(userId, amount, currency)`, `removeCurrency(userId, amount, currency)`, `getUserBalance(userId, currency)`, `getFullBalance(userId)`
- Migration: Auto-migrates `coins.json` → `currencies.json` on first load
- Default currency: `'cowoncy'` (matches requirement)

**shop-module** (`src/modules/shop-module/entry_point.ts`):
- Has its OWN local copies of currency functions (not exported)
- Functions defined inside: `getUserBalance()`, `addCoins()`, `removeCoins()`, `deductCurrencies()`
- These are LOCAL to shop-module (lines ~140-200), NOT exported for other modules

**Correct Integration Path**:
- **DO NOT** import from shop-module (nothing is exported)
- **USE** coins-module functions by importing from `../coins-module/entry_point`
- Functions to use: `addCurrency(userId, reward, 'cowoncy')`, `getFullBalance(userId)` to check balance

**Note**: The current quest module directly manipulates `coins.json` (line 217-226), which bypasses the currency system. The refactor must use proper currency functions.

### Emojis Available (`src/config/emojis.ts`)
Available animated emojis (use via `emojis.<name>`):
- **Quest-related**: `sparkles`, `trophy`, `gift`, `star`, `flag`, `rocket`
- **Progress**: `success`, `loading`, `chart`, `fire`
- **Currency**: `coin`, `gem`, `shopping_bags`
- **UI**: `calendar`, `clock`, `bell`, `info`, `warning`, `error`, `refresh`
- **Actions**: `add`, `remove`, `edit`, `save`, `search`

Recommended usage:
- Quest icon: `emojis.sparkles` or `emojis.flag`
- Reward: `emojis.coin` (for cowoncy)
- Progress: `emojis.chart`
- Complete: `emojis.success`
- Timer: `emojis.clock`
- Book: Use Unicode 📗/📒 (not in custom emojis)

### Build System
- **Build**: `npm run build` (TypeScript compilation + asset copying)
- **Start**: `npm start` (runs `dist/src/index.js`)
- **Dev**: `npm run dev` (build + nodemon watch)
- **Test**: No test framework configured (no `npm test`)

---

## Implementation Plan

### Prerequisites
- All changes must maintain TypeScript type safety
- Module must follow existing ModuleLoader pattern
- Must use `data/quests.json` for persistence
- Verification: `npm run build` must pass without errors

---

- [ ] **1. Create helper utilities and types**
      
      Create the period management logic, quest tracking types, and timezone handling as internal utility functions at the top of the refactored entry_point.ts.
      
      **Files**: `src/modules/quest-module/entry_point.ts` (new version, backup old first)
      
      **What to do**:
      - Define TypeScript interfaces: `Quest`, `UserQuestData`, `QuestSlot` (daily/weekly), `QuestProgress`
      - Implement `periodInfo(period: 'daily' | 'weekly')` function returning `{ key: string, resetAt: number }` using Vietnam time (UTC+7)
      - Daily key format: `YYYY-MM-DD`, weekly: `YYYY-W##` (ISO week starting Monday)
      - Implement `getSlot(userId: string, period: 'daily' | 'weekly')` that auto-resets if key changed
      - Define constants: `QUEST_CAP = 1000`, `QUEST_CAP_BOOK = 2000`, `BOOK_PRICE = 5000`, `TZ_OFFSET_H = 7`
      - Define `QUESTS` array with the 6 quests from spec (use exact IDs and text)
      
      **Verify**: TypeScript compilation passes (`npm run build`), no errors on imports

---

- [ ] **2. Implement data layer and auto-reset logic**
      
      Create functions to load/save quest data with automatic period reset when keys don't match.
      
      **Files**: `src/modules/quest-module/entry_point.ts` (continuation)
      
      **What to do**:
      - Implement `loadData()` and `saveData(data)` functions for `data/quests.json`
      - Implement `getUserData(userId)` that initializes new users with empty progress
      - Data structure: `{ [userId]: { quests: { daily: slot, weekly: slot }, done: number, book: boolean } }`
      - Slot structure: `{ key: string, prog: { [questId]: number }, claimed: { [questId]: boolean }, earned: number }`
      - Auto-reset: If `slot.key !== periodInfo(period).key`, clear prog/claimed, reset earned to 0, update key
      - Edge case: Preserve `done` count and `book` status across resets
      
      **Verify**: Create test data in `data/quests.json`, run build, manually test getUserData() initializes correctly

---

- [ ] **3. Implement quest tracking with rate limiting**
      
      Create the core tracking logic for messages and commands, with deduplication and rate limiting.
      
      **Files**: `src/modules/quest-module/entry_point.ts` (continuation)
      
      **What to do**:
      - Create `msgCooldowns = new Map<string, number>()` for message rate limiting (1 per 5s per user)
      - Implement `track(userId: string, kind: 'message' | 'command', key?: string)` function:
        * Loop through QUESTS where quest.kind matches AND quest.period is valid
        * For 'command' kind, also match quest.cmd === key
        * Increment prog[questId] up to quest.target (don't exceed)
        * Save data after updates
        * Return true if any quest was updated
      - Export named function `trackCommand(userId: string, commandName: string)` that calls `track(userId, 'command', commandName)`
      - Implement message handler (to be registered in step 5): check cooldown, call track if passed
      
      **Verify**: Add console.log in track(), run bot, send messages, check logs show updates

---

- [ ] **4. Integrate with coins-module for currency management**
      
      Import and use coins-module functions for adding cowoncy rewards when quests are claimed.
      
      **Files**: `src/modules/quest-module/entry_point.ts` (continuation)
      
      **What to do**:
      - Add import at top: `import { addCurrency, getFullBalance } from '../coins-module/entry_point';`
      - Implement `claimQuests(userId: string, period: 'daily' | 'weekly')` function:
        * Get slot = getUserData(userId).quests[period]
        * Find ready quests: prog >= target AND not claimed
        * Calculate cap: user.book ? QUEST_CAP_BOOK : QUEST_CAP
        * Calculate room left: cap - slot.earned
        * Clip total rewards to room left, track which quests hit cap
        * Call `addCurrency(userId, rewardAmount, 'cowoncy')` for each quest claimed
        * Mark quests as claimed in slot.claimed[questId] = true
        * Update slot.earned += rewardAmount
        * Increment userData.done by number of quests claimed
        * Save data
        * Return: `{ claimed: Quest[], capped: Quest[], totalReward: number }`
      - Handle cap messaging: "Đã đạt giới hạn kiếm {cap} coins/ngày" if any quests capped
      
      **Verify**: Add test code to claim quests, check `data/currencies.json` shows correct cowoncy increase

---

- [ ] **5. Build quest UI with embed and components**
      
      Create the /quest command with beautiful embed showing quests, progress bars, and period switching.
      
      **Files**: `src/modules/quest-module/entry_point.ts` (continuation)
      
      **What to do**:
      - Import emojis: `import { emojis } from '../../config/emojis';`
      - Implement `buildQuestEmbed(userId: string, period: 'daily' | 'weekly', interaction)`:
        * Get slot and user data
        * Calculate: completed count, earned/cap, resetAt timestamp from periodInfo
        * Create EmbedBuilder with color '#5865F2'
        * setAuthor with book status: '📗 Sổ Nhiệm Vụ Xịn' vs '📒 Sổ Nhiệm Vụ'
        * setTitle: `${emojis.sparkles} Nhiệm Vụ ${period === 'daily' ? 'Hàng Ngày' : 'Hàng Tuần'}`
        * Add 3 inline header fields: "Hoàn thành" (X/Y), "Kiếm được" (earned/cap + coin emoji), "Reset" (<t:X:R>)
        * Add one field per quest: `📜 text\n🎁 {reward} {emojis.coin}\n• progress bar` with note if claimed or ready
        * Progress bar: `[▰▰▰▰▰▱▱▱▱▱] X/target` (10 blocks, filled = progress/target * 10)
        * Add note after bar: "✅ Đã nhận" if claimed, "🎁 Sẵn sàng nhận!" if ready (prog >= target && !claimed)
      - Create StringSelectMenu with 2 options: Daily, Weekly (customId: 'quest_period')
      - Create 3 buttons: "📗 Nâng cấp sổ" (customId: 'quest_book', disabled if book=true), "✅ Nhận thưởng" ('quest_claim'), "💡 Hướng dẫn" ('quest_guide')
      - Use quote reply pattern from shop: await interaction.deferReply(), then editReply
      
      **Verify**: Run `/quest` in Discord, check embed displays correctly with all fields

---

- [ ] **6. Implement interactive components (buttons and select menu)**
      
      Handle period switching, claim, book upgrade, and guide interactions.
      
      **Files**: `src/modules/quest-module/entry_point.ts` (continuation)
      
      **What to do**:
      - Create message component collector (5 min timeout)
      - Handle 'quest_period' select menu: rebuild embed with new period, update message
      - Handle 'quest_claim' button:
        * Call claimQuests(userId, currentPeriod)
        * Show result: "Đã nhận {count} nhiệm vụ! +{total} {emojis.coin}" + cap warning if capped
        * Rebuild embed to show updated earned/claimed status
      - Handle 'quest_book' button:
        * Check: `getFullBalance(userId).cowoncy >= BOOK_PRICE`
        * If not enough: reply ephemeral error
        * Call coins-module `removeCurrency(userId, BOOK_PRICE, 'cowoncy')`
        * Set userData.book = true, save data
        * Reply success, rebuild embed with new book title and cap
      - Handle 'quest_guide' button: reply ephemeral with guide embed explaining how to complete each quest type
      - User-lock check: `if (i.user.id !== interaction.user.id)` reply error ephemeral
      
      **Verify**: Click buttons, verify claim adds coins, book upgrade deducts and increases cap

---

- [ ] **7. Register /quest command and export trackCommand**
      
      Register the slash command in the module's command collection and export the tracking function.
      
      **Files**: `src/modules/quest-module/entry_point.ts` (final structure)
      
      **What to do**:
      - In QuestModule class, implement `registerCommands()` method
      - Define questCommand object with SlashCommandBuilder: `.setName('quest').setDescription('Xem nhiệm vụ hàng ngày và tuần')`
      - Execute function: defer immediately, call buildQuestEmbed('daily'), send with components, attach collector
      - Add questCommand to `this.commands.set('quest', questCommand)`
      - Export named function outside class (after default export): `export { trackCommand };`
      - Module pattern: `export default class QuestModule { ... }` then `export { trackCommand };` at end of file
      
      **Verify**: Run `/quest` command, check it appears in Discord command list, no TypeScript errors

---

- [ ] **8. Register message and command event handlers**
      
      Hook into Discord events for auto-tracking quest progress.
      
      **Files**: `src/modules/quest-module/entry_point.ts` (in initialize() method)
      
      **What to do**:
      - In `initialize()` method, register event handlers on `this.client`
      - Message handler: `this.client.on('messageCreate', async (message) => { ... })`
        * Ignore bots: `if (message.author.bot) return;`
        * Check cooldown in msgCooldowns Map, skip if < 5s since last
        * Call track(message.author.id, 'message')
        * Set cooldown: `msgCooldowns.set(userId, Date.now())`
      - Note: Command tracking is external (step 9), not an event listener here
      - Store event handler reference for cleanup in `this.messageHandler = ...`
      
      **Verify**: Send messages in Discord, check quest progress updates in data/quests.json

---

- [ ] **9. Add command tracking integration point**
      
      Document how other modules/handlers should call trackCommand when slash commands execute.
      
      **Files**: Integration documentation (in code comments), then actual integration in `src/handlers/prefixCommandHandler.ts` or command modules
      
      **What to do**:
      - Add JSDoc comment above trackCommand export explaining usage:
        ```typescript
        /**
         * Track command usage for quests. Call this from any command that should count towards quest progress.
         * Example: trackCommand(interaction.user.id, 'shop') after /shop executes.
         * @param userId - Discord user ID
         * @param commandName - Name of command executed (e.g., 'shop', 'daily')
         */
        ```
      - Integration points to add tracking calls:
        * shop-module: Add `trackCommand(userId, 'shop')` in execute() after defer
        * Any 'daily' command module: Add `trackCommand(userId, 'daily')` after successful checkin
      - Import: `import { trackCommand } from '../quest-module/entry_point';` in each module
      - Note: Since quest-module loads first (lower priority), other modules can import it safely
      
      **Verify**: Execute /shop and /daily commands, check quest progress increments in data/quests.json for matching quest IDs

---

- [ ] **10. Implement cleanup method and test full workflow**
      
      Add proper cleanup for event handlers and test the complete quest workflow.
      
      **Files**: `src/modules/quest-module/entry_point.ts` (cleanup method)
      
      **What to do**:
      - Implement `async cleanup()` method:
        * Remove message event listener: `this.client.off('messageCreate', this.messageHandler)`
        * Clear cooldowns: `msgCooldowns.clear()`
        * Log: `console.log('🧹 Quest module cleanup')`
      - Full workflow test:
        1. Start bot, run `/quest` - verify daily view shows all 6 quests (2 daily + 4 shared)
        2. Send 10 messages - verify 'msg_10' quest reaches 10/10 and shows "Sẵn sàng nhận"
        3. Click "✅ Nhận thưởng" - verify coins added, earned updates, quest marked "Đã nhận"
        4. Switch to weekly view - verify weekly quests visible
        5. Execute /shop 3 times - verify 'shop_3' quest increments
        6. Test book upgrade: verify price check, deduction, cap increase
        7. Test period reset: manually change date in periodInfo, restart bot, verify progress resets
      
      **Verify**: All workflow steps complete without errors, data persists correctly in quests.json and currencies.json

---

## Integration Notes

### Currency Function Signatures (coins-module)
Based on `src/modules/coins-module/entry_point.ts`:
```typescript
// Import from: '../coins-module/entry_point'
function addCurrency(userId: string, amount: number, currency: CurrencyType = 'cowoncy'): number
function removeCurrency(userId: string, amount: number, currency: CurrencyType = 'cowoncy'): number
function getUserBalance(userId: string, currency: CurrencyType = 'cowoncy'): number
function getFullBalance(userId: string): CurrencyBalance // { cowoncy, blueTicket, goldTicket }
```

**Note**: These are exported from coins-module, NOT shop-module. Shop-module has local copies but they are not exported.

### Period Reset Logic Details
- **Daily**: Reset at `00:00:00` Vietnam time (UTC+7)
  - Key format: `2025-01-15` (ISO date)
  - Implementation: `new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })`
  - Next reset: Start of next day in UTC+7
  
- **Weekly**: Reset at Monday `00:00:00` Vietnam time
  - Key format: `2025-W03` (ISO week number, week starts Monday)
  - Implementation: Use ISO week calculation, week starts Monday per spec
  - Next reset: Start of next Monday in UTC+7

### Quest Filtering by Period
- QUESTS array has both daily and weekly quests
- When displaying for a period:
  - Show quests where `quest.period === period` (exact match)
  - Progress/claimed state stored per period in separate slots
  - Completed count = quests completed in THAT period slot

### Command Tracking Integration
External modules call `trackCommand(userId, cmdName)` after command execution:
- shop-module: After /shop executes
- daily-module (if exists): After /daily checkin succeeds
- Pattern: Import the named export, call after defer/reply to avoid blocking

---

## Risks and Compatibility Issues

### Risk 1: Currency System Confusion
**Issue**: Two currency systems coexist (coins.json vs currencies.json)
**Mitigation**: Use only coins-module functions, which handle migration automatically. Do NOT directly manipulate JSON files.
**Compatibility**: coins-module already migrates old data, safe to use.

### Risk 2: Module Load Order
**Issue**: If quest-module loads after shop/daily modules, they can't import trackCommand at module load time
**Mitigation**: Check metadata.json priority. Quest-module should have priority < 10 to load early. Other modules can import lazily or after init.
**Check**: Verify `src/modules/quest-module/metadata.json` sets `"priority": 5`

### Risk 3: Event Listener Memory Leaks
**Issue**: Message event listener created but not cleaned up properly
**Mitigation**: Store handler reference, remove in cleanup(). ModuleLoader calls cleanup on reload/unload.
**Pattern**: `this.messageHandler = (msg) => { ... }; client.on('messageCreate', this.messageHandler);`

### Risk 4: Timezone Handling
**Issue**: Node.js timezone handling can be tricky, especially for ISO weeks
**Mitigation**: Use explicit 'Asia/Ho_Chi_Minh' timezone in toLocaleDateString. Test edge cases around midnight.
**Fallback**: If Intl issues, use UTC+7 offset math: `new Date(Date.now() + 7*60*60*1000)`

### Risk 5: Period Key Format Breaking Changes
**Issue**: If weekly key format changes, old data won't auto-reset
**Mitigation**: Store format version in data: `version: 1`. Check on load, force reset if version changed.
**Implementation**: Add `const DATA_VERSION = 1` constant, store in root of quests.json

### Risk 6: Concurrent Claim Attempts
**Issue**: User rapidly clicking claim button could double-reward
**Mitigation**: Use collector reply deferUpdate pattern, check quest state again before adding coins.
**Pattern**: `await i.deferUpdate(); const freshData = getUserData(userId); ...`

---

## File Structure Summary

```
src/modules/quest-module/
├── entry_point.ts          # Main module (refactored, ~800-1000 lines)
└── metadata.json           # Module metadata (set priority: 5)

data/
└── quests.json            # Quest data storage (format: UserQuestData by userId)
```

No separate files needed - quest module is self-contained with all logic in entry_point.ts following the existing module pattern seen in shop-module and coins-module.

---

## Testing Strategy

Since no test framework is configured:
1. **Manual testing**: Follow step 10 workflow test checklist
2. **Build verification**: `npm run build` must pass at each step
3. **Type checking**: No TypeScript errors in VS Code
4. **Runtime testing**: Start bot with `npm start`, execute commands, check data files
5. **Edge cases**: Test at period boundaries (midnight, Monday), test cap limits, test book status

**Validation commands**:
```bash
# Build (must pass)
npm run build

# Run bot
npm start

# Check data (after testing)
cat data/quests.json | jq
cat data/currencies.json | jq
```

---

## Success Criteria

- [ ] `/quest` command displays quest list with period tabs (daily/weekly)
- [ ] Message tracking increments quest progress with 5s rate limit
- [ ] Command tracking works when `/shop` and `/daily` executed
- [ ] Claim button adds cowoncy via coins-module, respects cap
- [ ] Book upgrade deducts 5000 cowoncy, increases cap to 2000
- [ ] Period reset (daily/weekly) clears progress and claimed status
- [ ] All emojis display correctly (animated custom emojis from config)
- [ ] Progress bars render correctly (10 blocks, filled proportional to progress)
- [ ] UI matches spec: 3 header fields, quest fields, buttons/select menu
- [ ] No TypeScript compilation errors, builds successfully
- [ ] Module cleanup removes event listeners properly
- [ ] Data persists correctly across bot restarts

