// Reset daily for specific user - using compiled dist code
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATABASE_PATH || path.join(__dirname, 'data');
const db = new Database(path.join(dataDir, 'economy.db'));

const userId = process.argv[2] || '1144806767595900979';

try {
  const stmt = db.prepare(`UPDATE daily_users SET last_daily = NULL WHERE user_id = ?`);
  const result = stmt.run(userId);
  
  if (result.changes > 0) {
    console.log(`✅ Reset daily for user ${userId}`);
  } else {
    console.log(`⚠️  User ${userId} not found`);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}
