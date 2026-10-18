// Script để reset dữ liệu daily cho testing
const Database = require('better-sqlite3');
const path = require('path');

const dataDir = process.env.DATABASE_PATH || path.join(process.cwd(), 'data');
const db = new Database(path.join(dataDir, 'economy.db'));

// Reset daily data cho 1 user cụ thể
// Sử dụng: node reset-daily.js <USER_ID>
const userId = process.argv[2];

if (!userId) {
  console.log('Usage: node reset-daily.js <USER_ID>');
  console.log('Example: node reset-daily.js 923215778776481793');
  process.exit(1);
}

try {
  // Reset last_daily để có thể claim lại
  const stmt = db.prepare(`
    UPDATE daily_users 
    SET last_daily = NULL
    WHERE user_id = ?
  `);
  
  const result = stmt.run(userId);
  
  if (result.changes > 0) {
    console.log(`✅ Reset daily data for user ${userId}`);
    console.log('You can now use /daily again!');
  } else {
    console.log(`⚠️  User ${userId} not found in database`);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}
