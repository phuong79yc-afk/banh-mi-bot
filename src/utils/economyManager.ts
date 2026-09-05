import fs from 'fs';
import path from 'path';

const ECONOMY_FILE = path.join(process.cwd(), 'data', 'economy.json');

interface UserBalance {
  userId: string;
  username: string;
  balance: number;
  bank: number;
  lastDaily: number;
  lastWork: number;
}

interface EconomyData {
  users: Record<string, UserBalance>;
}

// Ensure data directory and file exist
function ensureDataFile() {
  const dataDir = path.dirname(ECONOMY_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(ECONOMY_FILE)) {
    fs.writeFileSync(ECONOMY_FILE, JSON.stringify({ users: {} }, null, 2));
  }
}

// Load economy data
function loadData(): EconomyData {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(ECONOMY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    
    // Handle old format (array) - migrate to new format
    if (Array.isArray(parsed)) {
      console.log('⚠️  Migrating economy data from old format to new format...');
      const newData: EconomyData = { users: {} };
      for (const user of parsed) {
        if (user.userId) {
          newData.users[user.userId] = {
            userId: user.userId,
            username: user.username || 'Unknown',
            balance: user.balance || 0,
            bank: user.bank || 0,
            lastDaily: user.lastDaily || 0,
            lastWork: user.lastWork || 0
          };
        }
      }
      saveData(newData);
      console.log('✅ Migration complete!');
      return newData;
    }
    
    // Handle new format
    if (parsed.users) {
      return parsed as EconomyData;
    }
    
    // Handle empty or corrupted file
    return { users: {} };
  } catch (error) {
    console.error('❌ Error loading economy data:', error);
    return { users: {} };
  }
}

// Save economy data
function saveData(data: EconomyData) {
  ensureDataFile();
  fs.writeFileSync(ECONOMY_FILE, JSON.stringify(data, null, 2));
}

// Get or create user
export function getUser(userId: string, username: string): UserBalance {
  const data = loadData();
  
  // Ensure users object exists
  if (!data.users) {
    data.users = {};
  }
  
  if (!data.users[userId]) {
    data.users[userId] = {
      userId,
      username,
      balance: 0,
      bank: 0,
      lastDaily: 0,
      lastWork: 0
    };
    saveData(data);
  }
  return data.users[userId];
}

// Update user
export function updateUser(userId: string, updates: Partial<UserBalance>) {
  const data = loadData();
  if (data.users[userId]) {
    data.users[userId] = { ...data.users[userId], ...updates };
    saveData(data);
  }
}

// Add money to wallet
export function addMoney(userId: string, username: string, amount: number) {
  const user = getUser(userId, username);
  user.balance += amount;
  updateUser(userId, { balance: user.balance });
  return user.balance;
}

// Remove money from wallet
export function removeMoney(userId: string, username: string, amount: number): boolean {
  const user = getUser(userId, username);
  if (user.balance < amount) return false;
  user.balance -= amount;
  updateUser(userId, { balance: user.balance });
  return true;
}

// Deposit to bank
export function deposit(userId: string, username: string, amount: number): boolean {
  const user = getUser(userId, username);
  if (user.balance < amount) return false;
  user.balance -= amount;
  user.bank += amount;
  updateUser(userId, { balance: user.balance, bank: user.bank });
  return true;
}

// Withdraw from bank
export function withdraw(userId: string, username: string, amount: number): boolean {
  const user = getUser(userId, username);
  if (user.bank < amount) return false;
  user.bank -= amount;
  user.balance += amount;
  updateUser(userId, { balance: user.balance, bank: user.bank });
  return true;
}

// Get leaderboard
export function getLeaderboard(limit: number = 10): UserBalance[] {
  const data = loadData();
  return Object.values(data.users)
    .sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank))
    .slice(0, limit);
}

// Check if daily is available
export function canDaily(userId: string): { available: boolean; nextIn?: number } {
  const user = getUser(userId, '');
  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000; // 24 hours
  const timeSince = now - user.lastDaily;
  
  if (timeSince >= cooldown) {
    return { available: true };
  }
  
  return { available: false, nextIn: cooldown - timeSince };
}

// Check if work is available
export function canWork(userId: string): { available: boolean; nextIn?: number } {
  const user = getUser(userId, '');
  const now = Date.now();
  const cooldown = 60 * 60 * 1000; // 1 hour
  const timeSince = now - user.lastWork;
  
  if (timeSince >= cooldown) {
    return { available: true };
  }
  
  return { available: false, nextIn: cooldown - timeSince };
}
