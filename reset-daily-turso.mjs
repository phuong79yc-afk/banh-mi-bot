import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const userId = process.argv[2];

if (!userId) {
  console.error('Usage: node reset-daily-turso.mjs <user_id>');
  console.error('Example: node reset-daily-turso.mjs 923215778776481793');
  process.exit(1);
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env');
  process.exit(1);
}

const db = createClient({ url, authToken });

console.log(`🔄 Resetting daily for user: ${userId}`);
console.log(`📡 Connecting to: ${url}`);

try {
  // Reset last_daily to allow daily claim again
  const result = await db.execute({
    sql: 'UPDATE daily_users SET last_daily = NULL WHERE user_id = ?',
    args: [userId]
  });

  if (result.rowsAffected > 0) {
    console.log(`✅ Reset successful! User ${userId} can claim /daily again`);
    
    // Show current data
    const check = await db.execute({
      sql: 'SELECT * FROM daily_users WHERE user_id = ?',
      args: [userId]
    });
    
    if (check.rows.length > 0) {
      const row = check.rows[0];
      const cols = check.columns;
      console.log('\n📊 Current user data:');
      console.log(`  - Balance: ${row[cols.indexOf('balance')]}`);
      console.log(`  - Gold: ${row[cols.indexOf('gold_balance')]}`);
      console.log(`  - Streak: ${row[cols.indexOf('streak')]}`);
      console.log(`  - Last daily: ${row[cols.indexOf('last_daily')]}`);
    }
  } else {
    console.log(`⚠️  User ${userId} not found in database`);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
