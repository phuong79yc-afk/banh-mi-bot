import { getTursoDatabase } from './turso';

/**
 * Initialize database schema BEFORE any modules load
 * This ensures all tables exist before modules try to query them
 */
export async function initializeDatabase() {
  console.log('🗄️  Initializing Turso database schema...');
  
  const db = getTursoDatabase();

  // Create daily_users table (core table used by many modules)
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

  // Create transactions table for audit trail
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      currency TEXT NOT NULL,
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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS freefire_notification_config (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS freefire_notified_articles (
      guild_id TEXT NOT NULL,
      article_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, article_id)
    )
  `);

  // Add indexes for better query performance
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_gold_transactions_user ON gold_transactions(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_daily_users_streak ON daily_users(streak DESC)`);

  console.log('✅ Turso database schema initialized successfully!');
}
