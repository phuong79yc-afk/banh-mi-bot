# Quest module refactor

This refactor replaces the old quest data schema with a period-keyed system that auto-resets daily and weekly quests based on Vietnam UTC+7 timezone. The new implementation tracks message and command progress automatically, enforces daily caps with premium book upgrades, and presents quests through a rich Discord UI with inline fields, progress bars, and reset timers.

**Watch for:** Weekly reset day is calculated as Monday in UTC+7 but the formula uses `(dayOfWeek + 6) % 7`, which maps Sunday→Monday correctly but may confuse readers (*likely*). Daily cap enforcement clips rewards silently during multi-quest claims, sorting by descending reward to maximize payout (*confirmed*). The period key is ISO date string of period start, so old quest data from previous schema will not migrate automatically (*confirmed*).

**Verdict**: CHANGES_REQUESTED

## High-level view

Period keys drive auto-reset. Each period gets an ISO date string key computed from the start of the period in Vietnam time. When `getSlot()` detects a key mismatch, it wipes progress and claimed flags, creating a fresh slate. The weekly calculation shifts the current day backward by `(dayOfWeek + 6) % 7` days to land on Monday, which is correct but obscure.

Daily cap is enforced when claiming. The claim handler sorts ready quests by descending reward, then allocates room from the remaining cap budget. If a quest's reward exceeds the remaining room, the user receives only the clipped portion and sees a "daily limit reached" notice. Weekly quests ignore the cap entirely (room is `Infinity`).

Message tracking is rate-limited per-user at 5 seconds. Command tracking relies on external calls to the exported `trackCommand(userId, commandName)` function. Neither handler validates whether the quest target channel matches the message channel; the code checks `quest.channelId` but none of the quest definitions set it.

Currency integration reads and writes `data/currencies.json`. The book upgrade checks balance before deducting, and claim adds coins after computing the capped amount. All three currency functions follow the shop module's schema (`{ cowoncy, blueTicket, goldTicket }`).

The UI uses inline fields for the top row (completed count, earned/cap, reset timer) and per-quest detail fields with `📜` text, `🎁` reward, and `•` progress lines. Progress bars show `[ ✓ ]` when complete or `[ x/y ]` while in progress. Reset timer is `<t:X:R>` Discord timestamp.

Components include a StringSelectMenu for daily/weekly switching and three buttons (upgrade, claim, guide). The custom ID embeds user ID and period for owner validation. The upgrade button is disabled when the user already has the book.

<details>
<summary>Issues (7)</summary>

1. **Channel filter never triggers** — All quest definitions leave `channelId` undefined, so the channel filter in `trackProgress()` (line 148) never restricts message tracking to a specific channel. Either remove the filter or populate `channelId` in quest definitions (*confirmed*).

2. **Weekly Monday offset is correct but opaque** — The formula `(dayOfWeek + 6) % 7` correctly maps Sunday (0) to 6 and advances Monday to 0, but the modular arithmetic is harder to read than `(dayOfWeek === 0 ? 6 : dayOfWeek - 1)`. Consider adding a comment or simplifying (*confirmed*).

3. **Cap clipping is silent during partial claims** — When the daily cap clips a quest reward mid-claim, the user receives a generic "daily limit reached" message but not the specific amount clipped per quest. A user claiming 3 quests worth 100, 200, 300 with only 250 room left sees "gained 250" and may not realize the 300-reward quest was clipped to 50. Add per-quest clipping detail or make the message more explicit (*likely*).

4. **No migration path from old schema** — The old `quests.json` uses `{ quests: { questId: { progress, completed } }, totalCompleted, totalRewards, lastReset }`. The new code expects `{ quests: { daily: { key, prog, claimed, earned }, weekly: { ... } }, done, book }`. Users with existing quest data will lose all progress on first load. Add a migration check in `loadUser()` or document the breaking change (*confirmed*).

5. **Room calculation fails after first clip** — When claiming multiple quests with a cap, the code writes `room = isFinite(room) ? room - reward : Infinity`. If `room` is finite and `reward` exceeds `room`, the subtraction goes negative. The next quest will see negative room and clip incorrectly. Fix: `room = isFinite(room) ? Math.max(0, room - reward) : Infinity` (*confirmed*).

6. **`trackProgress` reads user twice per call** — `trackProgress()` calls `loadUser(userId)` at the start (line 140), then `getSlot()` calls `loadUser(userId)` again (line 117). The first load is unused; the function should call `getSlot()` directly and rely on its internal load (*confirmed*).

7. **StringSelectMenu custom ID embeds stale period** — The custom ID is `quest:view:${user.id}:${period}`, where `period` is the *current* period when the menu was built (line 205). When the user switches from daily to weekly, the collector reads `periodFromId` from the custom ID (line 243) but never uses it for the view action. The view handler reads the new period from `i.values[0]` (line 248), so the stale period in the ID is dead data. Remove it or use it consistently (*confirmed*).

</details>

<details>
<summary>Details</summary>

## Period key calculation and auto-reset

The `periodInfo()` function computes a period key by shifting `Date.now()` into Vietnam UTC+7, extracting the date components, then computing midnight in UTC. For weekly periods, the code backs up to the previous Monday by subtracting `((dayOfWeek + 6) % 7) * DAY` from the daily start.

The modular arithmetic `(dayOfWeek + 6) % 7` is correct: Sunday (0) becomes 6, Monday (1) becomes 0, Tuesday (2) becomes 1, etc. This maps Monday to 0, which is the intended start of the ISO week. However, the formula is opaque. Readers familiar with ISO week rules will expect either an explicit "Sunday→6, else day-1" branch or a comment explaining the offset.

The period key is the ISO date string of the period start: `new Date(start).toISOString().slice(0, 10)`. For daily quests on 2025-01-15, the key is `"2025-01-15"`. For weekly quests starting Monday 2025-01-13, the key is `"2025-01-13"` regardless of which day in the week the user opens the quest UI.

When `getSlot(userId, period)` loads user data and finds `user.quests[period]?.key !== key`, it wipes the slot: `{ key, prog: {}, claimed: {}, earned: 0 }`. This is the auto-reset mechanism. Every period boundary, the key changes and the next access rebuilds the slot from scratch.

## Channel filter dead code

Every quest in `QUESTS` defines `period`, `kind`, `text`, `target`, and `reward`. Two quests (`msg_10`, `msg_50`) also define `cmd: undefined` (though that field is irrelevant for message quests). None define `channelId`.

The `trackProgress()` function checks `if (kind === 'message' && quest.channelId && quest.channelId !== key)` at line 148. Since `quest.channelId` is always undefined, the condition short-circuits and the channel filter never applies. Message tracking counts messages in any channel.

Either remove the filter or populate `channelId` in quest definitions. If the intent is to restrict `msg_10` and `msg_50` to a specific channel (e.g., general chat), add `channelId: '...'` to those definitions.

## Daily cap enforcement with reward sorting

The claim handler (line 172) filters ready quests, sorts by descending reward (`b.reward - a.reward`), then iterates and allocates room:

```typescript
let room = period === 'daily' ? Math.max(0, cap - sl.earned) : Infinity;
let gained = 0;
let clipped = false;
for (const quest of ready) {
  const reward = Math.min(quest.reward, room);
  if (reward < quest.reward) clipped = true;
  gained += reward;
  room = isFinite(room) ? room - reward : Infinity;
  sl.claimed[quest.id] = true;
  userData.done = (userData.done ?? 0) + 1;
}
```

Sorting by descending reward maximizes payout when the cap is tight. If the user has 3 ready quests (100, 200, 300) and 350 room left, claiming in descending order yields 300 + 50 = 350. Claiming in ascending order would yield 100 + 200 + 50 = 350, but the last quest would be clipped more severely.

However, the room update has a bug: `room = isFinite(room) ? room - reward : Infinity`. If `room` is 50 and `reward` is 300, the update computes `50 - 300 = -250`. The next quest will see negative room, and `Math.min(quest.reward, -250)` returns -250, which is nonsensical. The clipped flag will be set for every subsequent quest, and `gained` will accumulate negative amounts.

Fix: `room = isFinite(room) ? Math.max(0, room - reward) : Infinity`.

## Redundant load in trackProgress

`trackProgress()` calls `loadUser(userId)` at line 140, storing the result in `user`. Then, for each matching quest, it calls `getSlot(userId, quest.period)` at line 149. `getSlot()` internally calls `loadUser(userId)` again (line 117), loads the slot, checks the key, and saves if the key changed.

After the loop, `trackProgress()` writes back to `user.quests[quest.period]` and calls `saveUser(userId, user)`. The problem: `getSlot()` may have already saved a fresh slot (if the key changed), and `trackProgress()` then overwrites it with stale data from the first `loadUser()` call.

This is a race between two save operations on the same file. In practice, `trackProgress()` loops over multiple quests in the same period, so all quests will see the same key and `getSlot()` won't re-save. But the redundant load and potential overwrite is fragile.

Fix: remove the initial `loadUser(userId)` at line 140. Instead, call `getSlot()` for each quest and track which slots changed. At the end, reload the user, merge changes, and save once.

Alternatively, accept that `getSlot()` may save mid-loop and reload `user` before the final save to merge changes.

## No migration from old schema

The old `data/quests.json` schema (visible in the current file) stores:

```json
{
  "userId": {
    "quests": {
      "questId": { "progress": 0, "completed": false }
    },
    "totalCompleted": 3,
    "totalRewards": 700,
    "lastReset": "2026-10-04"
  }
}
```

The new schema expects:

```json
{
  "userId": {
    "quests": {
      "daily": { "key": "2025-01-15", "prog": {}, "claimed": {}, "earned": 0 },
      "weekly": { ... }
    },
    "done": 0,
    "book": false
  }
}
```

When `loadUser()` reads old data, it returns `{ quests: { send_messages_10: { progress: 0, completed: false }, ... }, totalCompleted: 3, totalRewards: 700, lastReset: "2026-10-04" }`. Then `getSlot(userId, 'daily')` executes:

```typescript
user.quests ??= {};
if (user.quests[period]?.key !== key) {
  user.quests[period] = { key, prog: {}, claimed: {}, earned: 0 };
  saveUser(userId, user);
}
```

`user.quests` is already defined (as the old quest map), so the `??=` does nothing. `user.quests['daily']` is undefined, so the condition `user.quests['daily']?.key !== key` is true, and the code creates a fresh daily slot. The old quest data is left dangling in `user.quests` but ignored.

The user loses all old progress and counts. The `totalCompleted` and `totalRewards` fields are discarded. The new `done` field starts at 0.

Add a migration check in `loadUser()`: if the top-level keys include `totalCompleted` or `lastReset`, treat it as old schema and return `{}` (forcing a fresh start) or map `totalCompleted` to `done`.



## StringSelectMenu owner check and custom ID

The StringSelectMenu custom ID is `quest:view:${user.id}:${period}` (line 205). When the collector receives an interaction, it splits the custom ID and extracts `uid` and `periodFromId` (line 243-244).

The owner check compares `i.user.id !== uid` (line 247). If a different user clicks the menu, they see "❌ Bạn không thể sử dụng button này!".

For the view action (line 248-253), the code reads the new period from `i.values[0]` (line 249) and ignores `periodFromId`. The period embedded in the custom ID is never used for the view action. It *is* used for the claim, upgrade, and guide actions (line 255, 257, 259).

When the user switches from daily to weekly, the menu rebuilds with `quest:view:${user.id}:weekly` (line 205). The next time the user switches back to daily, they interact with the new menu (custom ID `quest:view:${user.id}:daily`). The collector reads both interactions because the collector is bound to the original reply message, not to a specific custom ID.

This means the `periodFromId` in the view custom ID is redundant. For consistency, either remove it from the view custom ID or use it to validate the switch (reject stale switches).



</details>

## File map

<details>
<summary>Files changed</summary>

- **src/modules/quest-module/entry_point.ts** — Complete refactor with period-keyed schema, auto-reset, cap enforcement, message/command tracking, currency integration, and Discord UI with inline fields and components.

Full diff: `git diff main -- src/modules/quest-module/entry_point.ts`

</details>
