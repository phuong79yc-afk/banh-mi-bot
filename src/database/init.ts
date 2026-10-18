import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

/**
 * Initialize database schema BEFORE any modules load
 * This ensures all tables exist before modules try to query them
 */
export function initializeDatabase() {
  // Ensure data directory exists (supports DATABASE_PATH env var for persistent storage)
  const dataDir = process.env.DATABASE_PATH || path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'economy.db');
  console.log(`🗄️  Using database path: ${dbPath}`);
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  console.log('🗄️  Initializing database schema...');

  // Create daily_users table (core table used by many modules)
  db.exec(`
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

  // Create transactions table for audit trail
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES daily_users(user_id)
    )
  `);

  // Create gold_transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS gold_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES daily_users(user_id)
    )
  `);

  // Add indexes for better query performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_gold_transactions_user ON gold_transactions(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_daily_users_streak ON daily_users(streak DESC)`);

  db.close();
  console.log('✅ Database schema initialized successfully!');
}
