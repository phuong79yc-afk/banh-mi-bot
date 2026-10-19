# Implementation Plan: Migrate better-sqlite3 to Turso (@libsql/client)

## Context

This plan migrates all remaining `better-sqlite3` usage to Turso (`@libsql/client`). The migration affects 4 module files that currently use synchronous SQLite operations and must be converted to async Turso operations.

**Already completed:**
- ✅ `@libsql/client` installed
- ✅ `src/database/turso.ts` exports `getTursoDatabase()` and `tursoToSqliteFormat()`
- ✅ `src/database/init.ts` initializes all tables via Turso async
- ✅ `src/index.ts` awaits `initializeDatabase()` at startup

**Files requiring migration:**
1. `src/modules/vip-module/entry_point.ts` (simplest - 1 query, 3 sync functions)
2. `src/modules/shop-module/entry_point.ts` (has inline `require('better-sqlite3')` in `/balance` command)
3. `src/modules/balance-module/entry_point.ts` (has inline `require('better-sqlite3')` + exports used by other modules)
4. `src/modules/daily-module/entry_point.ts` (most complex - migrations, upserts, prepared statements)

## Schema Alignment Decision

**Decision: Add `currency` column to `transactions` table in `init.ts`**

**Rationale:** The balance-module creates `transactions` with a `currency` column (`'coins'` or `'gold'`) to distinguish between coin and gold ticket transactions. The current `init.ts` schema lacks this column. Adding it is safer than trying to encode currency info in the `description` field, which would:
- Break existing transaction queries in balance-module
- Require parsing description strings to filter by currency
- Make transaction history less structured

The `currency` column should be added to the schema in `init.ts` as:
```sql
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  currency TEXT NOT NULL,  -- NEW: 'coins' or 'gold'
  description TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
)
```

---

## Migration Order and Steps

Migration order follows simplest → most complex to validate the pattern works before tackling the hardest file.

---

### ✅ Step 1: Update database schema in `init.ts`

**What:** Add `currency` column to `transactions` table schema to match balance-module's usage.

**Files:**
- `d:\projects\code\src\database\init.ts`

**Changes:**
- Add `currency TEXT NOT NULL` column to the `transactions` table `CREATE TABLE IF NOT EXISTS` statement
- Position it after `type TEXT NOT NULL` and before `description TEXT NOT NULL`
- No migration of existing data needed (Turso is being deployed fresh to Railway; local dev can recreate)

**Verify:**
```powershell
npm run build
node dist/src/index.js
# Check console output: should show "✅ Turso database schema initialized successfully!"
# No errors about missing currency column
```

---

### ✅ Step 2: Migrate `vip-module/entry_point.ts` (SIMPLEST)

**What:** Replace the single `better-sqlite3` import and make 3 helper functions async. This module only reads data (1 SELECT query), making it the simplest migration.

**Files:**
- `d:\projects\code\src\modules\vip-module\entry_point.ts`

**Async Propagation Chain:**
```
getWealth(userId)           → becomes async
  ↓
buildVipInfo(interaction)   → becomes async
buildVipTiers(client, userId) → becomes async
buildVipBonus(interaction)  → becomes async
  ↓ (all are called from command execute functions)
vipInfoCommand.execute      → already async, add await
vip-tiersCommand.execute    → already async, add await
vip-bonusCommand.execute    → already async, add await
```

**Detailed Changes:**

1. **Replace import:**
   ```typescript
   // OLD:
   import Database from 'better-sqlite3';
   
   // NEW:
   import { getTursoDatabase, tursoToSqliteFormat } from '../../database/turso';
   ```

2. **Remove database initialization code:**
   - Delete lines: `const dataDir = ...`, `const db = new Database(...)`
   - The database is now initialized in `init.ts`

3. **Make `getWealth()` async:**
   ```typescript
   // OLD:
   function getWealth(userId: string): { gold: number; coins: number } {
     const row = stmtGetUser.get(userId) as UserData | undefined;
     return { gold: row?.gold_balance ?? 0, coins: row?.balance ?? 0 };
   }
   
   // NEW:
   async function getWealth(userId: string): Promise<{ gold: number; coins: number }> {
     const db = getTursoDatabase();
     const result = await db.execute({
       sql: 'SELECT gold_balance, balance FROM daily_users WHERE user_id = ?',
       args: [userId]
     });
     
     if (result.rows.length === 0) {
       return { gold: 0, coins: 0 };
     }
     
     const row = result.rows[0];
     return {
       gold: Number(row[0]) || 0,  // gold_balance is first column
       coins: Number(row[1]) || 0  // balance is second column
     };
   }
   ```

4. **Make `buildVipInfo()` async and add await:**
   - Change signature: `async function buildVipInfo(interaction: ChatInputCommandInteraction): Promise<ContainerBuilder>`
   - Change line: `const { gold, coins } = getWealth(interaction.user.id);`
   - To: `const { gold, coins } = await getWealth(interaction.user.id);`

5. **Make `buildVipTiers()` async and add await:**
   - Change signature: `async function buildVipTiers(client: Client, userId: string): Promise<ContainerBuilder>`
   - Change line: `const mine = getVIPTier(getWealth(userId).gold).tier;`
   - To: `const mine = getVIPTier((await getWealth(userId)).gold).tier;`

6. **Make `buildVipBonus()` async and add await:**
   - Change signature: `async function buildVipBonus(interaction: ChatInputCommandInteraction): Promise<ContainerBuilder>`
   - Change line: `const current = getVIPTier(getWealth(interaction.user.id).gold);`
   - To: `const current = getVIPTier((await getWealth(interaction.user.id)).gold);`

7. **Update command execute functions to await:**
   - `vipInfoCommand.execute`: `await sendV2(interaction, await buildVipInfo(interaction));`
   - `vip-tiersCommand.execute`: `await sendV2(interaction, await buildVipTiers(this.client, interaction.user.id));`
   - `vip-bonusCommand.execute`: `await sendV2(interaction, await buildVipBonus(interaction));`

**Verify:**
```powershell
npm run build
node dist/src/index.js
# In Discord: /vipinfo, /vip-tiers, /vip-bonus
# All commands should display correctly with user's gold balance from Turso
```

---

### ✅ Step 3: Migrate `balance-module/entry_point.ts`

**What:** Replace `better-sqlite3` with Turso and convert all database operations to async. This module has inline `require('better-sqlite3')` inside the `/balance` command AND exports `getUser()` and `addTransaction()` used by other modules.

**Files:**
- `d:\projects\code\src\modules\balance-module\entry_point.ts`

**Async Propagation Chain:**
```
getUser(userId)                → becomes async, returns Promise<UserData>
addTransaction(...)            → becomes async, returns Promise<void>
getTransactions(userId, limit) → becomes async, returns Promise<Transaction[]>
  ↓ (all are called from command execute functions)
balanceCommand.execute            → already async, add await
transactionHistoryCommand.execute → already async, add await
compensateCommand.execute         → already async, add await
bulkCompensateCommand.execute     → already async, add await
```

**Detailed Changes:**

1. **Replace import and remove inline require:**
   ```typescript
   // OLD (top of file):
   import Database from 'better-sqlite3';
   
   // NEW:
   import { getTursoDatabase, tursoToSqliteFormat } from '../../database/turso';
   ```
   
   **CRITICAL:** Remove the inline `require('better-sqlite3')` inside the `/balance` command's `execute` function. Search for `const Database = require('better-sqlite3')` inside the `balanceCommand.execute` function and delete those lines that create a new `Database` instance and call `db.close()`.

2. **Remove database initialization code:**
   - Delete: `const dataDir = ...`, `const db = new Database(...)`, `db.pragma(...)`, `db.exec(CREATE TABLE ...)` 
   - Tables are now created in `init.ts`

3. **Remove prepared statements:**
   - Delete: `const stmtGetUser = ...`, `const stmtEnsureUser = ...`, `const stmtGetTransactions = ...`, `const stmtAddTransaction = ...`
   - These will be replaced with inline Turso queries

4. **Make `getUser()` async:**
   ```typescript
   // OLD:
   function getUser(userId: string): UserData { ... }
   
   // NEW:
   async function getUser(userId: string): Promise<UserData> {
     const db = getTursoDatabase();
     
     // Ensure user exists
     await db.execute({
       sql: `INSERT OR IGNORE INTO daily_users (user_id, balance, gold_balance, streak, max_streak, total_checkins)
             VALUES (?, 0, 0, 0, 0, 0)`,
       args: [userId]
     });
     
     // Fetch user data
     const result = await db.execute({
       sql: 'SELECT * FROM daily_users WHERE user_id = ?',
       args: [userId]
     });
     
     if (result.rows.length === 0) {
       throw new Error('Failed to fetch user data after insert');
     }
     
     // Map row array to UserData object using column names
     const row = result.rows[0];
     const cols = result.columns;
     return {
       user_id: String(row[cols.indexOf('user_id')]),
       balance: Number(row[cols.indexOf('balance')]) || 0,
       gold_balance: Number(row[cols.indexOf('gold_balance')]) || 0,
       streak: Number(row[cols.indexOf('streak')]) || 0,
       max_streak: Number(row[cols.indexOf('max_streak')]) || 0,
       total_checkins: Number(row[cols.indexOf('total_checkins')]) || 0,
       last_daily: row[cols.indexOf('last_daily')] ? String(row[cols.indexOf('last_daily')]) : null
     };
   }
   ```

5. **Make `getTransactions()` async:**
   ```typescript
   // OLD:
   function getTransactions(userId: string, limit: number = 20): Transaction[] { ... }
   
   // NEW:
   async function getTransactions(userId: string, limit: number = 20): Promise<Transaction[]> {
     const db = getTursoDatabase();
     const result = await db.execute({
       sql: `SELECT * FROM transactions 
             WHERE user_id = ? 
             ORDER BY timestamp DESC 
             LIMIT ?`,
       args: [userId, limit]
     });
     
     const cols = result.columns;
     return result.rows.map(row => ({
       id: Number(row[cols.indexOf('id')]),
       user_id: String(row[cols.indexOf('user_id')]),
       type: String(row[cols.indexOf('type')]),
       amount: Number(row[cols.indexOf('amount')]),
       currency: String(row[cols.indexOf('currency')]),
       description: String(row[cols.indexOf('description')]),
       timestamp: String(row[cols.indexOf('timestamp')])
     }));
   }
   ```

6. **Make `addTransaction()` async:**
   ```typescript
   // OLD:
   function addTransaction(...) { ... }
   
   // NEW:
   async function addTransaction(
     userId: string,
     type: 'earn' | 'spend' | 'transfer' | 'admin',
     amount: number,
     currency: 'coins' | 'gold',
     description: string
   ): Promise<void> {
     const db = getTursoDatabase();
     await db.execute({
       sql: `INSERT INTO transactions (user_id, type, amount, currency, description, timestamp)
             VALUES (?, ?, ?, ?, ?, datetime('now'))`,
       args: [userId, type, amount, currency, description]
     });
   }
   ```

7. **Update exported functions signature:**
   ```typescript
   // Keep exports, but they're now async:
   export { addTransaction, getUser };
   ```

8. **Update all command execute functions:**
   - **`compensateCommand.execute`:**
     - Change: `const userData = getUser(targetUser.id);` → `const userData = await getUser(targetUser.id);`
     - Change the inline `db.prepare().run()` to:
       ```typescript
       const db = getTursoDatabase();
       await db.execute({
         sql: 'UPDATE daily_users SET balance = balance + ?, gold_balance = gold_balance + ? WHERE user_id = ?',
         args: [coins, gold, targetUser.id]
       });
       ```
     - Change: `addTransaction(...)` → `await addTransaction(...)`
     - Change: `const newUserData = getUser(targetUser.id);` → `const newUserData = await getUser(targetUser.id);`
   
   - **`bulkCompensateCommand.execute`:**
     - Change all `db.prepare().all()` queries to async Turso:
       ```typescript
       const db = getTursoDatabase();
       let users: UserData[] = [];
       
       if (filter === 'all') {
         const result = await db.execute('SELECT * FROM daily_users');
         users = tursoToSqliteFormat(result);
       } else if (filter === 'daily-today') {
         const today = new Date().toISOString().split('T')[0];
         const result = await db.execute({
           sql: 'SELECT * FROM daily_users WHERE last_daily = ?',
           args: [today]
         });
         users = tursoToSqliteFormat(result);
       } else if (filter === 'has-streak') {
         const result = await db.execute('SELECT * FROM daily_users WHERE streak > 0');
         users = tursoToSqliteFormat(result);
       }
       ```
     - Change the `stmtUpdate.run()` loop to:
       ```typescript
       const db = getTursoDatabase();
       for (const user of users) {
         try {
           await db.execute({
             sql: 'UPDATE daily_users SET balance = balance + ?, gold_balance = gold_balance + ? WHERE user_id = ?',
             args: [coins, gold, user.user_id]
           });
           
           if (coins > 0) {
             await addTransaction(user.user_id, 'admin', coins, 'coins', `Đền bù hàng loạt: ${reason}`);
           }
           if (gold > 0) {
             await addTransaction(user.user_id, 'admin', gold, 'gold', `Đền bù hàng loạt: ${reason}`);
           }
           success++;
         } catch (err) { ... }
       }
       ```
   
   - **`balanceCommand.execute`:**
     - **CRITICAL:** Remove the inline `const Database = require('better-sqlite3')` and the lines that create a local `db` instance and call `db.close()`
     - Change: `const userData = getUser(targetUser.id);` → `const userData = await getUser(targetUser.id);`
   
   - **`transactionHistoryCommand.execute`:**
     - Change: `const transactions = getTransactions(targetUser.id, limit);` → `const transactions = await getTransactions(targetUser.id, limit);`

**Verify:**
```powershell
npm run build
node dist/src/index.js
# In Discord: /balance, /transaction-history, /compensate (admin), /bulk-compensate (admin)
# All commands should work with Turso data
```

---

### ✅ Step 4: Migrate `shop-module/entry_point.ts`

**What:** Remove inline `require('better-sqlite3')` inside the `/balance` command execute function. This module duplicates the balance command and creates its own DB connection inline.

**Files:**
- `d:\projects\code\src\modules\shop-module\entry_point.ts`

**Changes:**

1. **Remove inline `require('better-sqlite3')` in the `/balance` command execute:**
   - Locate the `balanceCommand` object in `shop-module/entry_point.ts`
   - Inside the `execute` function, find these lines:
     ```typescript
     const Database = require('better-sqlite3');
     const dataDir = process.env.DATABASE_PATH || path.join(process.cwd(), 'data');
     const dbPath = path.join(dataDir, 'economy.db');
     const db = new Database(dbPath);
     ```
   - Replace with:
     ```typescript
     import { getTursoDatabase } from '../../database/turso';
     ```
     (Add this import at the top of the file if not present)

2. **Replace the inline database operations:**
   ```typescript
   // OLD:
   let dailyData: any;
   try {
     db.prepare(`
       INSERT OR IGNORE INTO daily_users (user_id, balance, gold_balance, streak, max_streak, total_checkins)
       VALUES (?, 0, 0, 0, 0, 0)
     `).run(targetUser.id);

     dailyData = db.prepare('SELECT * FROM daily_users WHERE user_id = ?').get(targetUser.id);
   } finally {
     db.close();
   }
   
   // NEW:
   const db = getTursoDatabase();
   
   await db.execute({
     sql: `INSERT OR IGNORE INTO daily_users (user_id, balance, gold_balance, streak, max_streak, total_checkins)
           VALUES (?, 0, 0, 0, 0, 0)`,
     args: [targetUser.id]
   });

   const result = await db.execute({
     sql: 'SELECT * FROM daily_users WHERE user_id = ?',
     args: [targetUser.id]
   });
   
   const dailyData = result.rows.length > 0 ? {
     gold_balance: Number(result.rows[0][result.columns.indexOf('gold_balance')]) || 0,
     balance: Number(result.rows[0][result.columns.indexOf('balance')]) || 0,
     streak: Number(result.rows[0][result.columns.indexOf('streak')]) || 0,
     total_checkins: Number(result.rows[0][result.columns.indexOf('total_checkins')]) || 0
   } : { gold_balance: 0, balance: 0, streak: 0, total_checkins: 0 };
   ```

3. **No `db.close()` call** - Turso is a singleton connection, never closed.

**Alternative (Recommended):** Instead of duplicating balance logic, import and reuse the `getUser()` function from balance-module:
```typescript
// At top of file:
import { getUser } from '../balance-module/entry_point';

// Inside balanceCommand.execute:
const userData = await getUser(targetUser.id);
const dailyData = userData; // userData already has all needed fields
```

**Verify:**
```powershell
npm run build
node dist/src/index.js
# In Discord: /balance (from shop-module)
# Should display user balance from Turso without errors
```

---

### ✅ Step 5: Migrate `daily-module/entry_point.ts` (MOST COMPLEX)

**What:** Replace all `better-sqlite3` usage with Turso. This module is the most complex due to:
- Table migrations (`runMigrations()` with `PRAGMA table_info`)
- JSON → SQLite migration (`migrateFromJson()` with loop and `insertStmt.run()`)
- Prepared statements with named parameters (`@user_id`, `@balance`, etc.)
- `UPSERT` with `ON CONFLICT` clause
- Multiple synchronous functions called throughout commands

**Files:**
- `d:\projects\code\src\modules\daily-module\entry_point.ts`

**Async Propagation Chain:**
```
getUserData(userId)                → becomes async, returns Promise<UserDailyData>
hasCheckedInToday(userId)          → becomes async, returns Promise<boolean>
processCheckIn(userId)             → becomes async, returns Promise<CheckInResult>
migrateFromJson()                  → becomes async, returns Promise<void>
runMigrations()                    → REMOVE (migrations now in init.ts)
  ↓ (called from command execute functions)
dailyCommand.execute               → already async, add await
daily-statsCommand.execute         → already async, add await
daily-leaderboardCommand.execute   → already async, add await
  ↓ (called in initialize)
DailyModule.initialize()           → already async, add await to migrateFromJson()
```

**Detailed Changes:**

1. **Replace import:**
   ```typescript
   // OLD:
   import Database from 'better-sqlite3';
   
   // NEW:
   import { getTursoDatabase, tursoToSqliteFormat } from '../../database/turso';
   ```

2. **Remove database initialization code:**
   - Delete: `const dataDir = ...`, `if (!fs.existsSync(dataDir)) ...`
   - Delete: `const db = new Database(...)`, `db.pragma('journal_mode = WAL')`, `db.pragma('synchronous = NORMAL')`
   - Delete: `db.exec(CREATE TABLE IF NOT EXISTS daily_users ...)` - table is now in `init.ts`
   - Delete: `function runMigrations() { ... }` and its call - the `gold_balance` column is already in `init.ts` schema
   - Keep the const declarations like `BASE_REWARD`, `TIMEZONE`, etc. - these don't touch the database

3. **Remove prepared statements:**
   - Delete: `const stmtGetUser = ...`, `const stmtUpsertUser = ...`, `const stmtGetAll = ...`

4. **Make `migrateFromJson()` async:**
   ```typescript
   // OLD:
   function migrateFromJson(): void { ... }
   
   // NEW:
   async function migrateFromJson(): Promise<void> {
     const dataPath = path.join(process.cwd(), 'data', 'daily.json');
     if (!fs.existsSync(dataPath)) {
       console.log('[Daily] No daily.json found, skipping migration');
       return;
     }

     try {
       const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
       let migrated = 0;
       const db = getTursoDatabase();

       for (const [userId, userData] of Object.entries(jsonData) as [string, any][]) {
         const result = await db.execute({
           sql: `INSERT OR IGNORE INTO daily_users (user_id, balance, streak, max_streak, total_checkins, last_daily)
                 VALUES (?, ?, ?, ?, ?, ?)`,
           args: [
             userId,
             userData.total_rewards || 0,
             userData.streak || userData.current_streak || 0,
             userData.max_streak || 0,
             userData.total_checkins || 0,
             userData.lastDaily || userData.last_checkin_date || null
           ]
         });

         // Turso doesn't return .changes, check rowsAffected instead
         if (result.rowsAffected > 0) migrated++;
       }

       console.log(`[Daily] Migrated ${migrated} users from JSON to SQLite`);
     } catch (error) {
       console.error('[Daily] Migration error:', error);
     }
   }
   ```

5. **Make `getUserData()` async:**
   ```typescript
   // OLD:
   function getUserData(userId: string): UserDailyData { ... }
   
   // NEW:
   async function getUserData(userId: string): Promise<UserDailyData> {
     const db = getTursoDatabase();
     const result = await db.execute({
       sql: 'SELECT * FROM daily_users WHERE user_id = ?',
       args: [userId]
     });
     
     if (result.rows.length === 0) {
       return {
         user_id: userId,
         balance: 0,
         gold_balance: 0,
         streak: 0,
         max_streak: 0,
         total_checkins: 0,
         last_daily: null,
       };
     }
     
     const row = result.rows[0];
     const cols = result.columns;
     return {
       user_id: String(row[cols.indexOf('user_id')]),
       balance: Number(row[cols.indexOf('balance')]) || 0,
       gold_balance: Number(row[cols.indexOf('gold_balance')]) || 0,
       streak: Number(row[cols.indexOf('streak')]) || 0,
       max_streak: Number(row[cols.indexOf('max_streak')]) || 0,
       total_checkins: Number(row[cols.indexOf('total_checkins')]) || 0,
       last_daily: row[cols.indexOf('last_daily')] ? String(row[cols.indexOf('last_daily')]) : null,
     };
   }
   ```

6. **Make `hasCheckedInToday()` async:**
   ```typescript
   // OLD:
   function hasCheckedInToday(userId: string): boolean { ... }
   
   // NEW:
   async function hasCheckedInToday(userId: string): Promise<boolean> {
     const db = getTursoDatabase();
     const result = await db.execute({
       sql: 'SELECT last_daily FROM daily_users WHERE user_id = ?',
       args: [userId]
     });
     
     if (result.rows.length === 0) return false;
     
     const lastDaily = result.rows[0][0];
     return !!lastDaily && lastDaily === getTodayString();
   }
   ```

7. **Make `processCheckIn()` async:**
   ```typescript
   // OLD:
   function processCheckIn(userId: string): CheckInResult { ... }
   
   // NEW:
   async function processCheckIn(userId: string): Promise<CheckInResult> {
     const userData = await getUserData(userId);
     const today = getTodayString();

     if (userData.last_daily) {
       const diff = daysBetween(userData.last_daily, today);
       if (diff === 0) return { success: false, alreadyClaimed: true };
       if (diff === 1) return { success: true, streak: userData.streak + 1 };
     }

     return { success: true, streak: 1 };
   }
   ```

8. **Replace the UPSERT in `dailyCommand.execute`:**
   The original uses `stmtUpsertUser.run({ @user_id, @balance, ... })` with named parameters. Turso uses positional args:
   ```typescript
   // OLD:
   stmtUpsertUser.run({
     user_id: userId,
     balance: rewards.total,
     gold_balance: 1,
     streak,
     max_streak: Math.max(userDataBefore.max_streak, streak),
     total_checkins: 1,
     last_daily: getTodayString(),
   });
   
   // NEW:
   const db = getTursoDatabase();
   const userDataBefore = await getUserData(userId);
   
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
       userId,
       rewards.total,
       1,  // gold_balance insert value
       streak,
       Math.max(userDataBefore.max_streak, streak),
       1,  // total_checkins insert value (incremented in UPDATE)
       getTodayString(),
       // UPDATE clause values:
       rewards.total,  // balance increment
       1,              // gold_balance increment
       streak,
       Math.max(userDataBefore.max_streak, streak),
       getTodayString()
     ]
   });
   ```

9. **Update `dailyCommand.execute`:**
   - Change: `const result = processCheckIn(userId);` → `const result = await processCheckIn(userId);`
   - Change: `const userDataBefore = getUserData(userId);` → `const userDataBefore = await getUserData(userId);`
   - Replace `stmtUpsertUser.run(...)` with the Turso UPSERT above
   - Change: `const userDataAfter = getUserData(userId);` → `const userDataAfter = await getUserData(userId);`

10. **Update `daily-statsCommand.execute`:**
    - Change: `const data = getUserData(userId);` → `const data = await getUserData(userId);`
    - Change: `const checkedToday = hasCheckedInToday(userId);` → `const checkedToday = await hasCheckedInToday(userId);`

11. **Update `daily-leaderboardCommand.execute`:**
    - Replace:
      ```typescript
      // OLD:
      const leaderboard = stmtGetAll.all() as UserDailyData[];
      
      // NEW:
      const db = getTursoDatabase();
      const result = await db.execute({
        sql: 'SELECT * FROM daily_users ORDER BY streak DESC, total_checkins DESC LIMIT 10',
        args: []
      });
      
      const leaderboard = tursoToSqliteFormat(result) as UserDailyData[];
      ```

12. **Update `DailyModule.initialize()`:**
    - Change: `migrateFromJson();` → `await migrateFromJson();`

**Verify:**
```powershell
npm run build
node dist/src/index.js
# In Discord: /daily, /daily-stats, /daily-leaderboard
# All commands should work with Turso data
# Check that daily rewards update balance and streak correctly
# Check that leaderboard shows top 10 by streak
```

---

## Edge Cases and Gotchas

### 1. **Turso row format vs better-sqlite3**
- **better-sqlite3:** Returns rows as objects: `{ user_id: '123', balance: 100 }`
- **Turso:** Returns rows as arrays by default: `[['123', 100], ...]` with separate `columns` array
- **Solution:** Use `tursoToSqliteFormat(result)` helper OR manually map using `result.columns.indexOf(columnName)`

### 2. **No `db.close()` with Turso**
- Turso uses a singleton connection managed by `getTursoDatabase()`
- **Never call `db.close()`** - the connection stays open for the lifetime of the bot
- Remove all `db.close()` calls and `finally { db.close() }` blocks

### 3. **UPSERT with ON CONFLICT - positional args**
- The daily-module UPSERT has **duplicate column references** in INSERT and UPDATE clauses
- Turso uses positional args: the args array must list INSERT values first, then UPDATE values
- Example: `INSERT ... VALUES (?, ?, ?) ON CONFLICT DO UPDATE SET col = ?` → args: `[insert_val1, insert_val2, insert_val3, update_val1]`

### 4. **No `.changes` property in Turso result**
- **better-sqlite3:** `stmt.run()` returns `{ changes: 1 }`
- **Turso:** `db.execute()` returns `{ rowsAffected: 1 }`
- Update migration logic to check `result.rowsAffected` instead of `result.changes`

### 5. **Exported functions from balance-module**
- `getUser()` and `addTransaction()` are exported and imported by other modules (possibly daily-module for quest tracking)
- Their signatures change from sync to async
- **Check all imports of these functions** and add `await` where they're called
- The daily-module already has a dynamic import: `const { trackCommand } = await import('../quest-module/entry_point');` - ensure this pattern works with the new async balance-module exports

### 6. **All function callers need `await`**
- Every function that becomes async requires its **entire call chain** to become async
- Check that all `execute` functions are already `async` (they are - Discord.js command handlers)
- Don't forget intermediate helper functions (like `buildVipInfo`, `buildVipTiers`, etc.)

### 7. **Error handling with async**
- Wrap all `await db.execute()` calls in try-catch blocks where appropriate
- Turso network errors will throw; better-sqlite3 file errors threw differently
- Existing error handling should mostly work, but test edge cases (network failures, malformed SQL)

### 8. **Schema must exist before modules load**
- The `init.ts` already runs before module loading in `index.ts`
- All modules can assume tables exist
- **Do NOT create tables in module files** - rely on `init.ts`

### 9. **Concurrency and race conditions**
- better-sqlite3 was synchronous and single-threaded
- Turso is async and uses network I/O
- **Potential race condition:** Two `/daily` commands for the same user at the exact same moment
- Turso's `ON CONFLICT` clause is atomic at the database level, so this should be safe
- If issues arise, consider adding a busy-user check like shop-module does

### 10. **Migration from better-sqlite3 to Turso is one-way**
- Once deployed to Railway with Turso, the local SQLite `economy.db` file is no longer used
- For local dev: either connect to the Turso dev instance OR recreate local data
- The JSON migration (`migrateFromJson()`) is a one-time operation - after first run, the JSON file can be archived

---

## Summary

**Migration sequence:**
1. ✅ Update schema in `init.ts` (add `currency` column)
2. ✅ Migrate `vip-module` (simplest - 1 query, 3 functions)
3. ✅ Migrate `balance-module` (medium - exports used by others)
4. ✅ Migrate `shop-module` (simple - remove inline require)
5. ✅ Migrate `daily-module` (most complex - upserts, migrations, many queries)

**After all migrations:**
- Run full build and test all commands in Discord
- Verify Railway deployment works with Turso connection
- Remove `better-sqlite3` from `package.json` dependencies
- Archive or delete local `data/economy.db` file (no longer used)
- Update README.md to reflect Turso as the database (if needed)

**Key principles:**
- Every database access becomes `await db.execute({ sql, args })`
- Use `tursoToSqliteFormat(result)` for easy object mapping
- Never close the Turso connection
- All helpers that touch the DB must be async
- Test after each step before moving to the next file
