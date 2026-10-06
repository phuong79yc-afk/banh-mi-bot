const Database = require('better-sqlite3');
const path = require('path');

const userId = '923215778776481793';
const dbPath = path.join(__dirname, 'data', 'economy.db');

const db = new Database(dbPath);

// Reset last_daily to allow daily again today
const result = db.prepare(`
  UPDATE daily_users 
  SET last_daily = '2026-10-04' 
  WHERE user_id = ?
`).run(userId);

console.log(`✅ Reset daily for user ${userId}`);
console.log(`Rows affected: ${result.changes}`);

// Show current data
const row = db.prepare('SELECT * FROM daily_users WHERE user_id = ?').get(userId);
console.log('\n📊 Current data:', row);

db.close();
