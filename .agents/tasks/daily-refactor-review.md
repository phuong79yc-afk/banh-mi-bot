# Daily module refactor to SQLite

The daily check-in system was migrated from JSON file storage to SQLite with better-sqlite3. All three commands (/daily, /daily-stats, /daily-leaderboard) now operate against the database. The migration preserves existing user data through a one-time import from daily.json. TypeScript compilation succeeds with no errors.

**Watch for:** Migration field mismatch (**confirmed**) — the migration reads `userData.streak` but one user has `current_streak` instead, losing their streak data. Literal fire emoji in leaderboard instead of animated custom emoji (**confirmed**). Placeholder banner URL (**confirmed**). Misleading SQL comment about a nonexistent trigger (**confirmed**).

**Verdict**: NEEDS_CHANGES

## High-level view

The SQLite schema adds tracking for max_streak and total_checkins alongside balance, streak, and last_daily. Prepared statements handle user lookup and upsert with balance accumulation via `balance + @balance` in the ON CONFLICT clause. The migration from daily.json uses INSERT OR IGNORE to avoid overwriting existing SQLite data, but reads `userData.streak` when the existing JSON contains `current_streak` for one user and `streak` for another — the first user loses their streak. No addCurrency calls remain; the daily module manages its own balance column. All emojis use the animated custom format except for one literal 🔥 in the leaderboard. The banner uses `setImage(url)` with a placeholder URL, no AttachmentBuilder.

<details>
<summary>Issues (4)</summary>

1. **Migration field name mismatch** — JSON contains `current_streak` for one user and `streak` for another (also `last_checkin_date` vs `lastDaily`). Migration reads `userData.streak` but one user has `current_streak`. Normalize the read to check both field names or run a one-time script to standardize daily.json before deploying.

2. **Literal fire emoji in leaderboard** — Line 488 uses `🔥` instead of `emojis.fire`. Replace with `${emojis.fire}` for consistency with the rest of the module.

3. **Placeholder banner URL** — All three embeds use `https://i.imgur.com/placeholder.png`. Replace with the actual banner URL or remove `.setImage()` if no banner is intended.

4. **SQL comment mismatch** — Line 343 says "Increments by 1 in the SQL trigger" but there is no trigger in the schema. The increment happens via `total_checkins + 1` in the UPDATE clause. Remove or correct the comment.

</details>

<details>
<summary>Details</summary>

## Migration field name mismatch

The migration reads five fields from each JSON user object:

```typescript
userData.total_rewards || 0,
userData.streak || 0,
userData.max_streak || 0,
userData.total_checkins || 0,
userData.lastDaily || null
```

The actual daily.json has inconsistent field names:

- User `923215778776481793` has `current_streak`, `last_checkin_date`
- User `1144806767595900979` has `streak`, `lastDaily`

The migration reads `userData.streak` which doesn't exist for the first user (it's `current_streak`), and `userData.lastDaily` which doesn't exist for the first user (it's `last_checkin_date`). The first user will migrate with streak=0 and last_daily=null, losing their streak data.

Normalize the read:

```typescript
userData.streak || userData.current_streak || 0,
userData.lastDaily || userData.last_checkin_date || null
```

Or clean up daily.json before deploying.

## Literal fire emoji in leaderboard

Line 488 uses `🔥` instead of `emojis.fire`:

```typescript
return `${medal} <@${entry.user_id}> • 🔥 **${entry.streak}** ngày • ${emojis.chart} **${entry.total_checkins}** lần`;
```

Replace with `${emojis.fire}` for consistency.

</details>

<details>
<summary>File map</summary>

- `src/modules/daily-module/entry_point.ts` — Full rewrite: SQLite schema, prepared statements, migration from daily.json, three slash commands, timezone-aware streak logic

</details>
