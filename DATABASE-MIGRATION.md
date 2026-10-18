# 🗄️ Database Migration Guide

## Vấn đề với SQLite trên DanBot

SQLite file (`data/economy.db`) có thể bị mất khi:
- Container restart
- Server maintenance
- Deploy code mới

**Giải pháp**: Migrate sang cloud database (PostgreSQL/MongoDB)

---

## Option 1: PostgreSQL (Recommended) ⭐

### 1.1. Setup PostgreSQL trên ElephantSQL (Free)

1. **Đăng ký**: https://www.elephantsql.com/
2. **Create New Instance**:
   - Name: `banh-cuon-bot`
   - Plan: Tiny Turtle (Free - 20MB)
   - Data center: Gần bạn nhất
3. **Copy connection string**:
   ```
   postgres://username:password@host.db.elephantsql.com/database
   ```

### 1.2. Install PostgreSQL packages

```bash
npm install pg
npm install --save-dev @types/pg
```

### 1.3. Create migration script

File: `src/utils/database.ts`

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      balance INTEGER DEFAULT 0,
      bank INTEGER DEFAULT 0,
      last_daily BIGINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'coins',
      description TEXT,
      timestamp BIGINT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      acquired_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export { pool };
```

### 1.4. Update balance module

Replace SQLite với PostgreSQL queries:

```typescript
// Old (SQLite)
db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);

// New (PostgreSQL)
const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
const user = result.rows[0];
```

### 1.5. Add to .env

```env
DATABASE_URL=postgres://username:password@host.db.elephantsql.com/database
```

---

## Option 2: MongoDB Atlas (Alternative)

### 2.1. Setup MongoDB Atlas (Free)

1. **Đăng ký**: https://www.mongodb.com/cloud/atlas/register
2. **Create Cluster**:
   - Shared (Free M0)
   - Provider: AWS/GCP/Azure
   - Region: Gần bạn nhất
3. **Create Database User**: username + password
4. **Whitelist IP**: `0.0.0.0/0` (allow all, hoặc DanBot IP)
5. **Get Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/banh-cuon-bot
   ```

### 2.2. Install MongoDB packages

```bash
npm install mongodb mongoose
npm install --save-dev @types/mongoose
```

### 2.3. Create Mongoose schemas

File: `src/models/User.ts`

```typescript
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  lastDaily: { type: Number, default: 0 },
  inventory: [{
    itemId: String,
    quantity: Number,
    acquiredAt: Date
  }],
  transactions: [{
    type: String,
    amount: Number,
    currency: String,
    description: String,
    timestamp: Number
  }]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
```

### 2.4. Connect in index.ts

```typescript
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI!);
console.log('✅ MongoDB connected');
```

### 2.5. Add to .env

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/banh-cuon-bot
```

---

## Option 3: Keep SQLite + Auto Backup

Nếu không muốn migrate, setup auto backup:

### 3.1. Backup script

File: `scripts/auto-backup-db.sh`

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar -czf "backups/db_$TIMESTAMP.tar.gz" data/*.db data/*.json
echo "Backup created: db_$TIMESTAMP.tar.gz"

# Upload to cloud storage (optional)
# aws s3 cp "backups/db_$TIMESTAMP.tar.gz" s3://your-bucket/
```

### 3.2. Cron job (chạy mỗi 6 giờ)

```bash
crontab -e
```

Add:
```
0 */6 * * * /home/container/scripts/auto-backup-db.sh
```

### 3.3. Download backup định kỳ

Dùng SFTP download `backups/` folder về máy local

---

## Migration Steps (SQLite → PostgreSQL)

### Step 1: Export data từ SQLite

```javascript
// export-sqlite.js
const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('data/economy.db');

const users = db.prepare('SELECT * FROM users').all();
const transactions = db.prepare('SELECT * FROM transactions').all();

fs.writeFileSync('migration/users.json', JSON.stringify(users, null, 2));
fs.writeFileSync('migration/transactions.json', JSON.stringify(transactions, null, 2));

console.log('✅ Exported:', users.length, 'users,', transactions.length, 'transactions');
```

Run: `node export-sqlite.js`

### Step 2: Import vào PostgreSQL

```javascript
// import-postgres.js
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const users = JSON.parse(fs.readFileSync('migration/users.json'));
const transactions = JSON.parse(fs.readFileSync('migration/transactions.json'));

async function migrate() {
  for (const user of users) {
    await pool.query(
      'INSERT INTO users (user_id, balance, bank, last_daily) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [user.user_id, user.balance, user.bank, user.last_daily]
    );
  }
  
  for (const tx of transactions) {
    await pool.query(
      'INSERT INTO transactions (user_id, type, amount, currency, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
      [tx.user_id, tx.type, tx.amount, tx.currency, tx.description, tx.timestamp]
    );
  }
  
  console.log('✅ Migration complete!');
  process.exit(0);
}

migrate();
```

Run: `DATABASE_URL=your_url node import-postgres.js`

---

## Comparison

| Feature | SQLite | PostgreSQL | MongoDB |
|---------|--------|------------|---------|
| **Setup** | ✅ Easy | 🟡 Medium | 🟡 Medium |
| **Performance** | ✅ Fast | ✅ Fast | ✅ Fast |
| **Persistence** | ❌ Local file | ✅ Cloud | ✅ Cloud |
| **Free Tier** | ✅ Unlimited | ✅ 20MB | ✅ 512MB |
| **Backup** | Manual | ✅ Auto | ✅ Auto |
| **Scalability** | ❌ Limited | ✅ Good | ✅ Excellent |
| **Relations** | ✅ SQL | ✅ SQL | 🟡 NoSQL |

**Recommendation**: 
- **Small bot (<100 users)**: SQLite + manual backup
- **Medium bot (100-10k users)**: PostgreSQL
- **Large bot (>10k users)**: MongoDB Atlas

---

## 🆘 Troubleshooting

### Connection timeout
- Check firewall/IP whitelist
- Verify connection string
- Test with: `psql postgresql://...` or MongoDB Compass

### Data loss
- Always backup before migration
- Test migration on staging database first
- Keep SQLite files as backup

### Performance issues
- Add indexes on frequently queried columns
- Use connection pooling
- Enable query caching

---

## ✅ Migration Checklist

- [ ] Backup current SQLite database
- [ ] Create cloud database (ElephantSQL/MongoDB Atlas)
- [ ] Install new database packages
- [ ] Create migration scripts
- [ ] Test migration locally
- [ ] Update bot code to use new database
- [ ] Test all features (balance, shop, daily, etc.)
- [ ] Deploy to DanBot
- [ ] Verify data integrity
- [ ] Setup auto-backup (cloud DB usually has this)

---

## 📚 Resources

- PostgreSQL: https://www.elephantsql.com/docs/
- MongoDB: https://www.mongodb.com/docs/atlas/
- Mongoose: https://mongoosejs.com/docs/
- node-postgres: https://node-postgres.com/

Good luck! 🚀
