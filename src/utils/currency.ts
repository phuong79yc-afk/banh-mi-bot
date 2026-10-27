import { getTursoDatabase } from '../database/turso';

export interface CurrencyBalance {
  coins: number;
  gems: number;
}

async function ensureUser(userId: string): Promise<void> {
  const db = getTursoDatabase();
  await db.execute({
    sql: `INSERT OR IGNORE INTO daily_users
          (user_id, balance, gold_balance, streak, max_streak, total_checkins)
          VALUES (?, 0, 0, 0, 0, 0)`,
    args: [userId],
  });
}

function validateAmount(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new RangeError('Currency amount must be a non-negative safe integer');
  }
}

export async function getCurrencyBalance(userId: string): Promise<CurrencyBalance> {
  await ensureUser(userId);
  const result = await getTursoDatabase().execute({
    sql: 'SELECT balance, gold_balance FROM daily_users WHERE user_id = ?',
    args: [userId],
  });
  const row = result.rows[0];
  const columns = result.columns;
  return {
    coins: Number(row[columns.indexOf('balance')]) || 0,
    gems: Number(row[columns.indexOf('gold_balance')]) || 0,
  };
}

export async function getUserCoins(userId: string): Promise<number> {
  return (await getCurrencyBalance(userId)).coins;
}

export async function getUserGems(userId: string): Promise<number> {
  return (await getCurrencyBalance(userId)).gems;
}

export async function addCoins(userId: string, amount: number): Promise<number> {
  validateAmount(amount);
  await ensureUser(userId);
  await getTursoDatabase().execute({
    sql: 'UPDATE daily_users SET balance = balance + ? WHERE user_id = ?',
    args: [amount, userId],
  });
  return getUserCoins(userId);
}

export async function addGems(userId: string, amount: number): Promise<number> {
  validateAmount(amount);
  await ensureUser(userId);
  await getTursoDatabase().execute({
    sql: 'UPDATE daily_users SET gold_balance = gold_balance + ? WHERE user_id = ?',
    args: [amount, userId],
  });
  return getUserGems(userId);
}

export async function spendCoins(userId: string, amount: number): Promise<boolean> {
  validateAmount(amount);
  await ensureUser(userId);
  const result = await getTursoDatabase().execute({
    sql: 'UPDATE daily_users SET balance = balance - ? WHERE user_id = ? AND balance >= ?',
    args: [amount, userId, amount],
  });
  return result.rowsAffected > 0;
}

export async function spendGems(userId: string, amount: number): Promise<boolean> {
  validateAmount(amount);
  await ensureUser(userId);
  const result = await getTursoDatabase().execute({
    sql: 'UPDATE daily_users SET gold_balance = gold_balance - ? WHERE user_id = ? AND gold_balance >= ?',
    args: [amount, userId, amount],
  });
  return result.rowsAffected > 0;
}

export async function removeCoins(userId: string, amount: number): Promise<boolean> {
  return spendCoins(userId, amount);
}

export async function setCoins(userId: string, amount: number): Promise<number> {
  validateAmount(amount);
  await ensureUser(userId);
  await getTursoDatabase().execute({
    sql: 'UPDATE daily_users SET balance = ? WHERE user_id = ?',
    args: [amount, userId],
  });
  return amount;
}

export async function transferCoins(fromId: string, toId: string, amount: number): Promise<boolean> {
  validateAmount(amount);
  if (fromId === toId || amount === 0) return false;
  if (!(await spendCoins(fromId, amount))) return false;
  try {
    await addCoins(toId, amount);
    return true;
  } catch (error) {
    await addCoins(fromId, amount);
    throw error;
  }
}

export async function resetAllBalances(): Promise<number> {
  const result = await getTursoDatabase().execute(
    'UPDATE daily_users SET balance = 0, gold_balance = 0 WHERE balance != 0 OR gold_balance != 0',
  );
  return result.rowsAffected;
}
