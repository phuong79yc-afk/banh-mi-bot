import fs from 'fs';
import path from 'path';

interface UserEconomy {
  userId: string;
  guildId: string;
  balance: number;
  lastDaily: number;
  dailyStreak?: number;
}

class EconomyDatabase {
  private dbPath: string;
  private users: Map<string, UserEconomy>;

  constructor() {
    this.dbPath = path.join(__dirname, '../../data/economy.json');
    this.users = new Map();
    this.load();
  }

  private getCacheKey(userId: string, guildId: string): string {
    return `${guildId}::${userId}`;
  }

  private load(): void {
    try {
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        const entries: UserEconomy[] = JSON.parse(data);
        
        entries.forEach(entry => {
          const key = this.getCacheKey(entry.userId, entry.guildId);
          this.users.set(key, entry);
        });

        console.log(`✅ Loaded ${this.users.size} economy users from database`);
      } else {
        fs.writeFileSync(this.dbPath, '[]', 'utf-8');
        console.log('📝 Created new economy database');
      }
    } catch (error) {
      console.error('Failed to load economy database:', error);
    }
  }

  private save(): void {
    try {
      const entries = Array.from(this.users.values());
      fs.writeFileSync(this.dbPath, JSON.stringify(entries, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save economy database:', error);
    }
  }

  public getUser(userId: string, guildId: string): UserEconomy {
    const key = this.getCacheKey(userId, guildId);
    let user = this.users.get(key);

    if (!user) {
      user = {
        userId,
        guildId,
        balance: 0,
        lastDaily: 0
      };
      this.users.set(key, user);
      this.save();
    }

    return user;
  }

  public addBalance(userId: string, guildId: string, amount: number): number {
    const user = this.getUser(userId, guildId);
    user.balance += amount;
    this.save();
    return user.balance;
  }

  public removeBalance(userId: string, guildId: string, amount: number): boolean {
    const user = this.getUser(userId, guildId);
    if (user.balance < amount) return false;
    
    user.balance -= amount;
    this.save();
    return true;
  }

  public setLastDaily(userId: string, guildId: string): void {
    const user = this.getUser(userId, guildId);
    const oneDayMs = 24 * 60 * 60 * 1000;
    const twoDaysMs = 48 * 60 * 60 * 1000;
    
    // Check if streak should be reset (missed more than 48 hours)
    if (Date.now() - user.lastDaily > twoDaysMs) {
      user.dailyStreak = 0;
    }
    
    user.lastDaily = Date.now();
    this.save();
  }
  
  public setDailyStreak(userId: string, guildId: string, streak: number): void {
    const user = this.getUser(userId, guildId);
    user.dailyStreak = streak;
    this.save();
  }

  public canClaimDaily(userId: string, guildId: string): boolean {
    const user = this.getUser(userId, guildId);
    const oneDayMs = 24 * 60 * 60 * 1000;
    return Date.now() - user.lastDaily >= oneDayMs;
  }

  public getTopUsers(guildId: string, limit: number = 10): UserEconomy[] {
    return Array.from(this.users.values())
      .filter(u => u.guildId === guildId)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);
  }
}

export const economyDatabase = new EconomyDatabase();
