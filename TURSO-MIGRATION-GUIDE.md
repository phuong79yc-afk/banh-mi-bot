# 🚀 Turso Migration Guide

## Tại sao cần migrate?

Railway free không có persistent storage → Database bị mất mỗi lần deploy.  
**Turso** = SQLite cloud với free tier 9GB → Database không bao giờ mất!

---

## 📋 Bước 1: Setup Turso

### 1.1. Đăng ký Turso
1. Vào https://turso.tech/
2. Click **Sign up** → Đăng nhập bằng GitHub
3. Free tier: 9 GB storage, 500 databases, 1 billion rows read/month

### 1.2. Cài Turso CLI
```powershell
# Windows PowerShell (Run as Administrator nếu bị lỗi)
irm get.turso.tech/install.ps1 | iex
```

### 1.3. Login và tạo database
```bash
# Login
turso auth login

# Tạo database
turso db create banh-mi-bot

# Lấy database URL (copy lại)
turso db show banh-mi-bot --url
# Output: libsql://banh-mi-bot-[username].turso.io

# Tạo auth token (copy lại)
turso db tokens create banh-mi-bot
# Output: eyJhbGc...very-long-token...
```

**⚠️ LƯU LẠI:**
- Database URL: `libsql://banh-mi-bot-xxx.turso.io`
- Auth Token: `eyJhbGc...`

---

## 📋 Bước 2: Cài package

```bash
cd /d d:\projects\code
npm install @libsql/client
```

---

## 📋 Bước 3: Update code

### 3.1. Tạo file Turso database wrapper

**File mới:** `src/database/turso.ts`

```typescript
import { createClient } from '@libsql/client';

let db: any = null;

export function getTursoDatabase() {
  if (db) return db;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  }

  console.log(`🚀 Connecting to Turso: ${url}`);
  
  db = createClient({
    url,
    authToken,
  });

  return db;
}
```

### 3.2. Update `src/database/init.ts`

**Replace toàn bộ file:**

```typescript
import { getTursoDatabase } from './turso';

/**
 * Initialize database schema BEFORE any modules load
 */
export async function initializeDatabase() {
  console.log('🗄️  Initializing Turso database schema...');
  
  const db = getTursoDatabase();

  // Create daily_users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS daily_users (
      user_id TEXT PRIMARY KEY,
      balance INTEGER NOT NULL DEFAULT 0,
      gold_balance INTEGER NOT NULL DEFAULT 0,
      streak INTEGER NOT NULL DEFAULT 0,
      max_streak INTEGER NOT NULL DEFAULT 0,
      total_checkins INTEGER NOT NULL DEFAULT 0,
      last_daily TEXT
    )
  `);

  // Create transactions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create gold_transactions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS gold_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Add indexes
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_gold_transactions_user ON gold_transactions(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_daily_users_streak ON daily_users(streak DESC)`);

  console.log('✅ Turso database schema initialized!');
}
```

### 3.3. Update `src/index.ts`

Tìm dòng:
```typescript
initializeDatabase();
```

Đổi thành:
```typescript
await initializeDatabase();
```

Và đảm bảo hàm chứa nó là `async`:
```typescript
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);
  await initializeDatabase(); // <-- Add await
  // ...
});
```

---

## 📋 Bước 4: Update tất cả modules

### 4.1. Modules cần update

Tất cả file dùng `better-sqlite3`:
- `src/modules/daily-module/entry_point.ts`
- `src/modules/balance-module/entry_point.ts`
- `src/modules/quest-module/entry_point.ts`
- `src/modules/shop-module/entry_point.ts`
- `src/modules/vip-module/entry_point.ts`

### 4.2. Pattern chung

**Before (better-sqlite3):**
```typescript
import Database from 'better-sqlite3';

const db = new Database(dbPath);
const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
const row = stmt.get(userId);
```

**After (Turso):**
```typescript
import { getTursoDatabase } from '../../database/turso';

const db = getTursoDatabase();
const result = await db.execute({
  sql: 'SELECT * FROM users WHERE user_id = ?',
  args: [userId]
});
const row = result.rows[0];
```

### 4.3. Key differences

| better-sqlite3 | Turso (@libsql/client) |
|---------------|------------------------|
| `db.prepare(sql)` | `db.execute({ sql, args })` |
| `stmt.get(...)` | `result.rows[0]` |
| `stmt.all(...)` | `result.rows` |
| `stmt.run(...)` | `await db.execute(...)` |
| Synchronous | **Async (need await)** |

---

## 📋 Bước 5: Set Railway env vars

Vào Railway → Service → **Variables** tab:

```env
TURSO_DATABASE_URL=libsql://banh-mi-bot-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...your-token...
```

---

## 📋 Bước 6: Deploy

```bash
npm run build
git add .
git commit -m "feat: migrate to Turso cloud database"
git push
```

Railway sẽ tự động deploy. Database giờ persistent và không bao giờ mất! 🎉

---

## ✅ Verify

Test trên Discord:
1. `/daily` - Nhận coins
2. `/balance` - Check balance
3. **Redeploy Railway** (trigger manual deploy)
4. `/balance` - Balance vẫn còn (không reset về 0)!

---

## 🆘 Troubleshooting

### Lỗi: "TURSO_DATABASE_URL not set"
→ Chưa set env vars trên Railway

### Lỗi: "Authentication failed"
→ Token sai hoặc expired, tạo lại: `turso db tokens create banh-mi-bot`

### Lỗi: "table already exists"
→ Bình thường, ignore (table đã tồn tại từ deploy trước)

---

## 📚 Resources

- Turso Docs: https://docs.turso.tech/
- Turso Pricing: https://turso.tech/pricing
- libsql Client API: https://docs.turso.tech/sdk/ts/reference
