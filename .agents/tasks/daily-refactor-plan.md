# Implementation Plan: Daily Check-in Module Refactor

## Overview
Refactor the daily check-in system to implement streak-based rewards with timezone-aware date handling, VIP role bonuses, currency integration (cowoncy via currencies.json), and quest tracking.

## Implementation Steps

- [ ] 1. **Add configuration constants and update interfaces**
      
      Add CONFIG constants at the top of `entry_point.ts`:
      - BASE_REWARD = 100
      - STREAK_BONUS_PER_DAY = 10
      - STREAK_BONUS_MAX = 100
      - BOOSTER_PERCENT = 5
      - TIMEZONE = 'Asia/Ho_Chi_Minh'
      
      Update the `DailyData` interface to include:
      - `lastDaily: string` (YYYY-MM-DD format) — replaces `last_checkin_date`
      - `streak: number` — replaces `current_streak`
      - Keep existing: `max_streak`, `total_checkins`, `total_rewards`
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build` — TypeScript compilation succeeds with no errors in daily-module.

---

- [ ] 2. **Implement timezone-aware date utilities**
      
      Create two helper functions after the interface definitions:
      
      **`todayStr()`**: Returns today's date as YYYY-MM-DD using:
      ```typescript
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
      ```
      
      **`daysBetween(a: string, b: string): number`**: Calculates days between two YYYY-MM-DD strings using Date.UTC math:
      ```typescript
      const [y1, m1, d1] = a.split("-").map(Number);
      const [y2, m2, d2] = b.split("-").map(Number);
      return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
      ```
      
      Replace all `new Date().toISOString().split('T')[0]` calls with `todayStr()`.
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build` and check that the code compiles without errors.

---

- [ ] 3. **Refactor streak logic with precise day-difference calculation**
      
      Update `processCheckIn()` function to use the new streak logic:
      
      - Get today using `todayStr()`
      - Get `lastDaily` from userData (use empty string if not set)
      - Calculate `diff = daysBetween(userData.lastDaily, today)` if lastDaily exists
      - Streak logic:
        - `diff === 0` → already claimed today, return error
        - `diff === 1` → streak continues: `newStreak = userData.streak + 1`
        - `diff > 1 OR no lastDaily` → streak resets: `newStreak = 1`
      - Update `last_checkin_date` → `lastDaily` in data structure
      - Update `current_streak` → `streak` in data structure
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build` — no TypeScript errors.

---

- [ ] 4. **Update reward calculation with streak bonus cap**
      
      Modify `calculateReward()` function:
      ```typescript
      function calculateReward(streak: number): number {
        const baseReward = BASE_REWARD; // 100
        const streakBonus = Math.min(streak * STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX);
        return baseReward + streakBonus;
      }
      ```
      
      This ensures:
      - Base: 100 coins
      - Streak bonus: streak × 10, capped at 100 (max at 10-day streak)
      - Max total: 200 coins per day
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build` — compilation succeeds.

---

- [ ] 5. **Replace coins.json with currencies.json (cowoncy)**
      
      Remove the `addCoinsToShop()` function entirely.
      
      Create a new `addCurrency()` helper function following the pattern from quest-module:
      ```typescript
      function addCurrency(userId: string, amount: number): void {
        const currPath = path.join(process.cwd(), 'data', 'currencies.json');
        let data: any = {};
        try {
          if (fs.existsSync(currPath)) {
            data = JSON.parse(fs.readFileSync(currPath, 'utf8'));
          }
        } catch {}
        const bal = data[userId] ?? { cowoncy: 0, blueTicket: 0, goldTicket: 0 };
        bal.cowoncy += amount;
        data[userId] = bal;
        fs.writeFileSync(currPath, JSON.stringify(data, null, 2));
      }
      ```
      
      Replace all calls to `addCoinsToShop(userId, amount)` with `addCurrency(userId, amount)`.
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build` — no errors. Check that the function writes to `data/currencies.json` (manual test or unit test).

---

- [ ] 6. **Implement VIP role check with +5% bonus**
      
      In the `/daily` command's execute function, after `processCheckIn()` returns the result:
      
      1. Get the member: `const member = interaction.guild?.members.cache.get(userId);`
      2. Check if member has ANY role whose name INCLUDES 'Premium Member', 'Bot Developer', or 'Bot Owner':
         ```typescript
         const vipRoleNames = ['Premium Member', 'Bot Developer', 'Bot Owner'];
         const hasVIP = member?.roles.cache.some(role => 
           vipRoleNames.some(vipName => role.name.includes(vipName))
         ) ?? false;
         ```
      3. Calculate VIP bonus:
         ```typescript
         const subtotal = result.reward;
         const boosterBonus = hasVIP ? Math.floor((subtotal * BOOSTER_PERCENT) / 100) : 0;
         const totalReward = subtotal + boosterBonus;
         ```
      4. If `boosterBonus > 0`, call `addCurrency(userId, boosterBonus)` to add the bonus.
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build` and test with a user who has a VIP role to confirm the +5% bonus is applied.

---

- [ ] 7. **Integrate quest tracking**
      
      At the top of the file, add the import:
      ```typescript
      import { trackCommand } from '../quest-module/entry_point';
      ```
      
      In the `/daily` command's execute function, after successful check-in (after `addCurrency()` calls), add:
      ```typescript
      try {
        trackCommand(userId, 'daily');
      } catch (error) {
        console.error('Failed to track quest:', error);
      }
      ```
      
      Remove the existing manual quest progress update code (lines with `questDataPath`, `dailyQuest`, etc.) since `trackCommand` handles it.
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build` — no TypeScript errors. Test `/daily` command and check that quest progress updates in `data/quests.json`.

---

- [ ] 8. **Update embed style with quote formatting**
      
      Refactor the success embed in the `/daily` command to match the reference style:
      
      - **Author**: `'Điểm danh hằng ngày'` with user avatar
      - **Color**: `#7BE0B0` (not `#57F287`)
      - **Description format** (quote-style lines):
        ```
        > • Điểm danh hằng ngày ~ `100` {coin emoji}
        > {fire emoji} Điểm danh liên tục **X** ngày ~ `Y` {coin emoji}
        > <@&roleId> ~ **+5%** {coin emoji}  (only if VIP)
        
        > ➡️ **Tổng nhận:** `total` {coin emoji}
        ```
      - Use animated emojis from `emojis.ts`: `emojis.coin`, `emojis.fire`, arrow can be plain `➡️`
      - **Image**: `attachment://daily-banner.gif` (already exists)
      - Add `.setTimestamp()`
      - **Footer**: `${interaction.user.username} • Banhcuon-bot`
      
      Update the booster bonus display:
      - Remove the old "Bonus VIP (x2)" line (it's now +5%)
      - Add VIP role line only if `hasVIP` is true
      - Format: `> {role mention} ~ **+5%** {emojis.coin}`
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build`, then test `/daily` command. Verify embed matches the quote format and color is #7BE0B0.

---

- [ ] 9. **Update already-claimed error with next claim timestamp**
      
      In the `/daily` command, update the `hasCheckedInToday` block:
      
      - Change to ephemeral reply: `await interaction.editReply()` with content only (no embed if you want simple, or keep embed and make it simpler)
      - Add next claim time using Discord timestamp:
        ```typescript
        const tomorrow = Math.floor(Date.now() / 1000) + 86400;
        const message = `❌ Hôm nay bạn đã điểm danh rồi, hãy quay lại vào ngày mai nhé!\n\n⏰ **Quay lại vào:** <t:${tomorrow}:R>`;
        ```
      - Keep the existing embed structure but add the timestamp message at the end of description
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build`, test `/daily` twice in a row. Second attempt should show the relative timestamp.

---

- [ ] 10. **Update /daily-stats and /daily-leaderboard to use new data fields**
      
      Update references throughout:
      - `last_checkin_date` → `lastDaily`
      - `current_streak` → `streak`
      
      In `/daily-stats`:
      - Update field names to match new structure
      - Ensure `hasCheckedInToday()` function also uses `todayStr()` for comparison
      
      In `/daily-leaderboard`:
      - Update sort to use `userData.streak` instead of `current_streak`
      - **Fix the template literal bug**: Change line 358 from:
        ```typescript
        .setTitle('${emojis.trophy} Bảng Xếp Hạng Điểm Danh')
        ```
        to:
        ```typescript
        .setTitle(`${emojis.trophy} Bảng Xếp Hạng Điểm Danh`)
        ```
        (Use backticks, not single quotes)
      - Update description to use `entry.streak` instead of `entry.current_streak`
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build`, then test `/daily-stats` and `/daily-leaderboard` — both commands should display correct data with proper emoji rendering.

---

- [ ] 11. **Update hasCheckedInToday and getUserData helpers**
      
      Update `hasCheckedInToday()` function:
      - Replace `userData.last_checkin_date` with `userData.lastDaily`
      - Use `todayStr()` instead of `new Date().toISOString().split('T')[0]`
      
      Update `getUserData()` function:
      - Change `last_checkin_date: ''` to `lastDaily: ''`
      - Change `current_streak: 0` to `streak: 0`
      - Keep other fields: `max_streak`, `total_checkins`, `total_rewards`
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build` — TypeScript compilation succeeds with no type errors.

---

- [ ] 12. **Data migration: Rename fields in data/daily.json**
      
      Since the existing `data/daily.json` uses `current_streak` and `last_checkin_date`, add a migration function that runs once on module initialization:
      
      ```typescript
      function migrateDailyData(): void {
        try {
          const data = loadData();
          let migrated = false;
          for (const userId in data) {
            const user = data[userId];
            // Rename current_streak → streak
            if ('current_streak' in user && !('streak' in user)) {
              (user as any).streak = user.current_streak;
              delete (user as any).current_streak;
              migrated = true;
            }
            // Rename last_checkin_date → lastDaily
            if ('last_checkin_date' in user && !('lastDaily' in user)) {
              (user as any).lastDaily = user.last_checkin_date;
              delete (user as any).last_checkin_date;
              migrated = true;
            }
          }
          if (migrated) {
            saveData(data);
            console.log('[Daily] Data migration completed');
          }
        } catch (error) {
          console.error('[Daily] Migration error:', error);
        }
      }
      ```
      
      Call `migrateDailyData()` in the `initialize()` method, right after the console.log for module initialization.
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build`, start the bot, check console for migration message. Verify `data/daily.json` has `streak` and `lastDaily` fields instead of old names.

---

- [ ] 13. **Remove old VIP bonus code**
      
      Remove the old VIP bonus logic that checks for these roles:
      - `'👑 Chủ Bánh Cuốn'`
      - `'👨‍🍳 Đầu Bếp'`
      - `'✨ Huyền Thoại'`
      - `'🌟 Người Sáng Lập'`
      
      These were giving x2 bonus. The new VIP roles from shop-module (Premium Member, Bot Developer, Bot Owner) now give +5% instead.
      
      Remove the `limitedVIPRoles` array and related `hasLimitedVIP` check.
      
      **Files:** `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build` — no unused variables or compilation errors.

---

- [ ] 14. **Final integration test**
      
      Test all daily module commands end-to-end:
      
      1. `/daily` — first check-in of the day (verify currency added to currencies.json, quest tracked)
      2. `/daily` — second attempt same day (verify already-claimed error with timestamp)
      3. `/daily-stats` — verify stats display correctly with new field names
      4. `/daily-leaderboard` — verify leaderboard displays and emoji renders
      5. Test with VIP role user to verify +5% bonus is calculated and displayed
      6. Check `data/currencies.json` — verify cowoncy balance increased
      7. Check `data/quests.json` — verify daily quest progress tracked
      
      **Files:** All changes in `c:\projects\code\src\modules\daily-module\entry_point.ts`
      
      **Verify:** Run `npm run build && node dist/src/index.js`. Execute all test scenarios above and confirm expected behavior. All commands work without errors, data persists correctly, and quest tracking integrates properly.

---

## Summary of Changes

**Configuration:**
- Added 5 new constants for reward calculation and timezone

**Data Model:**
- Updated DailyData interface: `lastDaily` (replaces `last_checkin_date`), `streak` (replaces `current_streak`)
- Migration function handles existing data

**Logic:**
- Timezone-aware date handling using Intl.DateTimeFormat with Asia/Ho_Chi_Minh
- Precise day-difference calculation using Date.UTC
- Streak bonus capped at 100 (10-day streak max bonus)
- VIP role detection (+5% bonus for Premium Member, Bot Developer, Bot Owner)

**Integration:**
- Currency system: switched from coins.json to currencies.json (cowoncy)
- Quest tracking: integrated via `trackCommand()` import from quest-module
- Removed manual quest update code

**Presentation:**
- Embed uses quote-style formatting with `>` prefix
- Color changed to #7BE0B0
- Next claim timestamp using Discord's `<t:UNIX:R>` format
- Fixed template literal bug in leaderboard title

**Cleanup:**
- Removed addCoinsToShop() function
- Removed old VIP role bonus code (x2 multiplier)
- Removed manual quest tracking code

