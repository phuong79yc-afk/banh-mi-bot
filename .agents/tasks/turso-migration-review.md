# Turso Migration Review

## Summary

Migration of four Discord bot modules from synchronous better-sqlite3 to async Turso (@libsql/client). The changes convert all database operations to async/await, replace prepared statements with parameterized queries, and map Turso's array-based row format to object properties using column indices. The daily-module's JSON migration code was removed since it's a one-time operation already complete on the deployed instance.

Three concerns:
1. **Admin reset command unmigrated** (confirmed) — `admin-reset-command.ts` still uses better-sqlite3 synchronously
2. **Dashboard API unmigrated** (confirmed) — web dashboard routes still create inline better-sqlite3 connections
3. **Temp backup file present** (confirmed) — `temp_daily.ts` contains unmigrated better-sqlite3 code, should be removed if not needed

**Watch for:** Unmigrated better-sqlite3 code in admin utilities, web dashboard using wrong database connection, temp/backup files confusing the migration scope.

**Verdict**: CHANGES_REQUESTED

---

## High-level view

Four bot modules now use Turso exclusively: balance-module, daily-module, vip-module, and shop-module. All database calls are async, all row mappings use column indices, all exports maintain their interfaces with Promise wrappers. The transaction schema gained a `currency` column to distinguish coins from gold tickets as planned.

Three files outside the migration scope still reference better-sqlite3: an admin reset utility, the web dashboard's balance endpoint, and a temp file with pre-migration daily-module code. The first two are actual runtime code that will fail if better-sqlite3 is uninstalled; the third is likely a backup that should be deleted.

---

<details>
<summary>Issues (3)</summary>

1. **Admin reset command unmigrated** — `src/modules/admin-reset-command.ts` still imports and uses better-sqlite3 synchronously. Will break if better-sqlite3 is removed. Migrate to Turso or remove if unused.
2. **Dashboard API unmigrated** — `src/web/api/dashboardRoutes.ts` line 214 creates inline better-sqlite3 connections and calls `db.close()` after reads. This bypasses Turso entirely and reads stale local SQLite data. Migrate to Turso singleton.
3. **Temp backup file present** — `temp_daily.ts` at project root contains unmigrated better-sqlite3 code. Delete if this is a backup, or clarify if it's required runtime code.

</details>

---

<details>
<summary>Details</summary>

## Row mapping pattern across all modules

Turso returns rows as arrays with a separate `columns` array, while better-sqlite3 returned objects. All four migrated modules use column index mapping:

```typescript
const row = result.rows[0];
const cols = result.columns;
return {
  user_id: String(row[cols.indexOf('user_id')]),
  balance: Number(row[cols.indexOf('balance')]) || 0,
  // ...
};
```

VIP-module uses positional access `row[0]` and `row[1]` for its two-column SELECT, which is valid when column order is explicit. No direct property access like `row.user_id` remains.

## Daily-module UPSERT with positional args

The daily check-in writes balance, gold_balance, streak, and stats in a single UPSERT. The migrated query uses positional args with duplicate values for INSERT and UPDATE clauses:

```typescript
await db.execute({
  sql: `INSERT INTO daily_users (user_id, balance, gold_balance, streak, max_streak, total_checkins, last_daily)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          balance = balance + ?,
          gold_balance = gold_balance + ?,
          streak = ?,
          max_streak = MAX(max_streak, ?),
          total_checkins = total_checkins + 1,
          last_daily = ?`,
  args: [
    userId, rewards.total, 1, streak, Math.max(userDataBefore.max_streak, streak), 1, getTodayString(),
    rewards.total, 1, streak, Math.max(userDataBefore.max_streak, streak), getTodayString()
  ]
});
```

The args array has 13 elements: 7 for INSERT values, 6 for UPDATE assignments. This matches the query placeholders. The logic preserves the original behavior where `balance` increments by `rewards.total` and `gold_balance` increments by 1 on each check-in.

## Shop-module reuses balance-module's getUser

Shop-module's `/balance` command replaced inline better-sqlite3 code with an import from balance-module:

```typescript
import { getUser as getDailyUser } from '../balance-module/entry_point';
const dailyData = await getDailyUser(targetUser.id);
```

This eliminates the duplication and the inline `db.close()` call.



## Schema change: currency column added

The `transactions` table schema in `init.ts` now includes `currency TEXT NOT NULL` to distinguish `'coins'` from `'gold'` in transaction records. Balance-module's `addTransaction()` function signature enforces this with a union type parameter `currency: 'coins' | 'gold'`. All calls pass a valid currency string.

## Unmigrated admin reset command

`src/modules/admin-reset-command.ts` is a standalone admin utility that resets a user's `last_daily` field for testing. It still uses:

```typescript
import Database from 'better-sqlite3';
const db = new Database(path.join(dataDir, 'economy.db'));
```

This file was not included in the migration scope. If better-sqlite3 is uninstalled, this command will fail at import time. The command uses synchronous `stmt.run()` and checks `result.changes`, which is better-sqlite3 API.

To migrate this command:
- Replace `import Database from 'better-sqlite3'` with `import { getTursoDatabase } from '../database/turso'`
- Make the `execute` function async if not already
- Replace `const stmt = db.prepare('UPDATE ...'); stmt.run(...)` with `await db.execute({ sql: 'UPDATE ...', args: [...] })`
- Replace `result.changes > 0` check with `result.rowsAffected > 0`

## Unmigrated dashboard API

`src/web/api/dashboardRoutes.ts` line 214 creates an inline better-sqlite3 connection inside a route handler:

```typescript
const Database = require('better-sqlite3');
const db = new Database(dbPath);
const row = db.prepare('SELECT balance, gold_balance FROM daily_users WHERE user_id = ?').get(userId);
db.close();
```

This reads from the local SQLite file, not from Turso. When deployed to Railway with Turso as the database, this route will return stale data (or fail if the local `economy.db` file doesn't exist in the Railway container). The inline `db.close()` call after every request is also inefficient even if the file exists.

To migrate this route:
- Import `getTursoDatabase` at the top of the file
- Replace the inline `require('better-sqlite3')` block with an async Turso query
- Make the route handler async if not already
- Map the row result from array to object using column indices

## Temp daily file at project root

`temp_daily.ts` at the project root contains pre-migration daily-module code with better-sqlite3 imports. This file is not referenced in any imports or build configs. If it's a backup, delete it. If it serves another purpose, document it or move it to a `backup/` directory.

## Quest-module confirmed JSON-only

Grep confirms zero `better-sqlite3` or `import Database` references in the quest-module directory.

## Schema files

`src/database/init.ts` shows only the expected addition: the `currency` column in the `transactions` table. `src/database/turso.ts` is unchanged. Neither file has better-sqlite3 imports.

</details>

---

<details>
<summary>File map</summary>

## Changed files

- **src/modules/balance-module/entry_point.ts** — Replaced better-sqlite3 with Turso, made `getUser()`, `getTransactions()`, `addTransaction()` async, updated all command execute functions to await async operations
- **src/modules/daily-module/entry_point.ts** — Replaced better-sqlite3 with Turso, removed JSON migration and `runMigrations()`, made `getUserData()`, `hasCheckedInToday()`, `processCheckIn()` async, converted UPSERT to positional args
- **src/modules/vip-module/entry_point.ts** — Replaced better-sqlite3 with Turso, made `getWealth()` and all build functions async, updated command handlers to await
- **src/modules/shop-module/entry_point.ts** — Removed inline better-sqlite3 require in balance command, now imports and awaits `getUser()` from balance-module

## Unchanged files (verified clean)

- **src/database/turso.ts** — Singleton connection, no changes
- **src/database/init.ts** — Added `currency` column to transactions table as planned
- **src/modules/quest-module/entry_point.ts** — JSON-only, no database usage (not reviewed in detail, verified no better-sqlite3 imports)

## Unmigrated files (concern)

- **src/modules/admin-reset-command.ts** — Still uses better-sqlite3 synchronously, will break if package removed
- **src/web/api/dashboardRoutes.ts** — Dashboard balance endpoint still uses better-sqlite3, reads stale local file instead of Turso
- **temp_daily.ts** — Backup file at project root with pre-migration better-sqlite3 code, should be deleted if not needed

[Full diff available in repository history]

</details>
