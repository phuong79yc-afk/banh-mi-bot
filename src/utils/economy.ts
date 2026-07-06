import { getDailyConfig } from './gameConfig';
import { getStartingBalance, getCurrencySymbol, getDailyReward } from './economySettings';

// Simple in-memory economy system
// Trong production nên dùng database (MongoDB, MySQL, etc.)

interface UserBalance {
  userId: string;
  balance: number;
  lastDaily: number;
  lastActivity: number; // Thêm tracking hoạt động
}

const economy = new Map<string, UserBalance>();

// Cleanup inactive users (không hoạt động > 30 ngày)
setInterval(() => {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  
  for (const [userId, user] of economy.entries()) {
    if (now - user.lastActivity > thirtyDays) {
      economy.delete(userId);
      console.log(`🧹 Đã xóa user không hoạt động: ${userId}`);
    }
  }
}, 24 * 60 * 60 * 1000); // Chạy mỗi 24h

export function getBalance(userId: string): number {
  const user = economy.get(userId);
  if (user) {
    user.lastActivity = Date.now();
    return user.balance;
  }
  // Return starting balance for new users
  return getStartingBalance();
}

export function addBalance(userId: string, amount: number): number {
  const startingBalance = getStartingBalance();
  const user = economy.get(userId) || { 
    userId, 
    balance: startingBalance, 
    lastDaily: 0, 
    lastActivity: Date.now() 
  };
  user.balance += amount;
  user.lastActivity = Date.now();
  economy.set(userId, user);
  return user.balance;
}

export function removeBalance(userId: string, amount: number): boolean {
  const user = economy.get(userId);
  if (!user || user.balance < amount) return false;
  user.balance -= amount;
  user.lastActivity = Date.now();
  economy.set(userId, user);
  return true;
}

export function canClaimDaily(userId: string): boolean {
  const user = economy.get(userId);
  if (!user) return true;
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  return now - user.lastDaily >= dayInMs;
}

export function claimDaily(userId: string): number {
  const startingBalance = getStartingBalance();
  const user = economy.get(userId) || { 
    userId, 
    balance: startingBalance, 
    lastDaily: 0, 
    lastActivity: Date.now() 
  };
  
  // Use daily reward from settings instead of random from gameConfig
  const reward = getDailyReward();
  
  user.balance += reward;
  user.lastDaily = Date.now();
  user.lastActivity = Date.now();
  economy.set(userId, user);
  return reward;
}

export function getTimeUntilDaily(userId: string): number {
  const user = economy.get(userId);
  if (!user) return 0;
  const dayInMs = 24 * 60 * 60 * 1000;
  const timePassed = Date.now() - user.lastDaily;
  return Math.max(0, dayInMs - timePassed);
}

export function getLeaderboard(limit: number = 10): Array<{ userId: string; balance: number }> {
  return Array.from(economy.values())
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit)
    .map(u => ({ userId: u.userId, balance: u.balance }));
}

// Thêm function để lấy stats
export function getEconomyStats(): { totalUsers: number; totalCoins: number } {
  const totalUsers = economy.size;
  const totalCoins = Array.from(economy.values()).reduce((sum, user) => sum + user.balance, 0);
  return { totalUsers, totalCoins };
}
