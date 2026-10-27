import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const userId = process.argv[2];

if (!userId) {
  console.error('Usage: node reset-balance-turso.mjs <user_id>');
  console.error('Example: node reset-balance-turso.mjs 923215778776481793');
  process.exit(1);
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env');
  process.exit(1);
}

const db = createClient({ url, authToken });

console.log(`🔄 Resetting balance for user: ${userId}`);
console.log(`📡 Connecting to: ${url}`);

try {
  // Show current data
  const before = await db.execute({
    sql: 'SELECT * FROM daily_users WHERE user_id = ?',
    args: [userId]
  });
  
  if (before.rows.length > 0) {
    const row = before.rows[0];
    const cols = before.columns;
    console.log('\n📊 Current data BEFORE reset:');
    console.log(`  - Balance: ${row[cols.indexOf('balance')]}`);
    console.log(`  - Gold: ${row[cols.indexOf('gold_balance')]}`);
    console.log(`  - Streak: ${row[cols.indexOf('streak')]}`);
    console.log(`  - Last daily: ${row[cols.indexOf('last_daily')]}`);
  }

  // Reset balance, gold, and last_daily to allow fresh daily claim
  const result = await db.execute({
    sql: `UPDATE daily_users 
          SET balance = 0, 
              gold_balance = 0, 
              last_daily = NULL 
          WHERE user_id = ?`,
    args: [userId]
  });

  if (result.rowsAffected > 0) {
    console.log(`\n✅ Reset successful!`);
    
    // Show new data
    const after = await db.execute({
      sql: 'SELECT * FROM daily_users WHERE user_id = ?',
      args: [userId]
    });
    
    if (after.rows.length > 0) {
      const row = after.rows[0];
      const cols = after.columns;
      console.log('\n📊 Data AFTER reset:');
      console.log(`  - Balance: ${row[cols.indexOf('balance')]} (reset to 0)`);
      console.log(`  - Gold: ${row[cols.indexOf('gold_balance')]} (reset to 0)`);
      console.log(`  - Streak: ${row[cols.indexOf('streak')]} (unchanged)`);
      console.log(`  - Last daily: ${row[cols.indexOf('last_daily')]} (NULL - can claim again)`);
    }
    
    console.log(`\n✅ User ${userId} can now claim /daily and test from scratch!`);
  } else {
    console.log(`⚠️  User ${userId} not found in database`);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
