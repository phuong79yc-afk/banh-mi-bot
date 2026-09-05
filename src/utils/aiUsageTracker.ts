/**
 * AI Usage Tracking System
 * Track daily AI requests per user with free/premium tiers
 */

import fs from 'fs';
import path from 'path';

export interface UserUsage {
  userId: string;
  username: string;
  tier: 'free' | 'premium';
  dailyUsage: {
    date: string; // YYYY-MM-DD format
    aiTextRequests: number;
    aiImageRequests: number;
  };
  totalUsage: {
    aiTextRequests: number;
    aiImageRequests: number;
  };
  premiumExpiry?: string; // ISO date string
}

// Usage limits
export const USAGE_LIMITS = {
  free: {
    aiText: 50,   // 50 AI text requests per day
    aiImage: 10   // 10 AI image requests per day
  },
  premium: {
    aiText: -1,   // Unlimited AI text requests (-1 = unlimited)
    aiImage: -1   // Unlimited AI image requests (-1 = unlimited)
  }
};

const USAGE_DB_PATH = path.join(process.cwd(), 'data', 'ai-usage.json');

/**
 * Load usage database
 */
function loadUsageDB(): Map<string, UserUsage> {
  try {
    if (fs.existsSync(USAGE_DB_PATH)) {
      const data = fs.readFileSync(USAGE_DB_PATH, 'utf-8');
      const usersArray = JSON.parse(data);
      return new Map(usersArray.map((u: UserUsage) => [u.userId, u]));
    }
  } catch (error) {
    console.error('❌ Error loading AI usage DB:', error);
  }
  return new Map();
}

/**
 * Save usage database
 */
function saveUsageDB(usageMap: Map<string, UserUsage>): void {
  try {
    const dataDir = path.dirname(USAGE_DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const usersArray = Array.from(usageMap.values());
    fs.writeFileSync(USAGE_DB_PATH, JSON.stringify(usersArray, null, 2));
  } catch (error) {
    console.error('❌ Error saving AI usage DB:', error);
  }
}

// In-memory cache
let usageCache: Map<string, UserUsage> = loadUsageDB();

/**
 * Get current date string (YYYY-MM-DD)
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get or create user usage record
 */
export function getUserUsage(userId: string, username: string): UserUsage {
  let usage = usageCache.get(userId);
  const today = getCurrentDate();
  
  if (!usage) {
    // Create new user record
    usage = {
      userId,
      username,
      tier: 'free',
      dailyUsage: {
        date: today,
        aiTextRequests: 0,
        aiImageRequests: 0
      },
      totalUsage: {
        aiTextRequests: 0,
        aiImageRequests: 0
      }
    };
    usageCache.set(userId, usage);
    saveUsageDB(usageCache);
  } else {
    // Reset daily usage if new day
    if (usage.dailyUsage.date !== today) {
      usage.dailyUsage = {
        date: today,
        aiTextRequests: 0,
        aiImageRequests: 0
      };
      saveUsageDB(usageCache);
    }
    
    // Check premium expiry
    if (usage.tier === 'premium' && usage.premiumExpiry) {
      const expiry = new Date(usage.premiumExpiry);
      if (expiry < new Date()) {
        usage.tier = 'free';
        delete usage.premiumExpiry;
        saveUsageDB(usageCache);
      }
    }
  }
  
  return usage;
}

/**
 * Check if user can make AI text request
 */
export function canUseAIText(userId: string, username: string): { allowed: boolean; remaining: number; limit: number; tier: string } {
  const usage = getUserUsage(userId, username);
  const limit = USAGE_LIMITS[usage.tier].aiText;
  const used = usage.dailyUsage.aiTextRequests;
  
  // Premium unlimited check
  if (limit === -1) {
    return {
      allowed: true,
      remaining: -1, // Unlimited
      limit: -1,
      tier: usage.tier
    };
  }
  
  const remaining = Math.max(0, limit - used);
  
  return {
    allowed: used < limit,
    remaining,
    limit,
    tier: usage.tier
  };
}

/**
 * Check if user can make AI image request
 */
export function canUseAIImage(userId: string, username: string): { allowed: boolean; remaining: number; limit: number; tier: string } {
  const usage = getUserUsage(userId, username);
  const limit = USAGE_LIMITS[usage.tier].aiImage;
  const used = usage.dailyUsage.aiImageRequests;
  
  // Premium unlimited check
  if (limit === -1) {
    return {
      allowed: true,
      remaining: -1, // Unlimited
      limit: -1,
      tier: usage.tier
    };
  }
  
  const remaining = Math.max(0, limit - used);
  
  return {
    allowed: used < limit,
    remaining,
    limit,
    tier: usage.tier
  };
}

/**
 * Record AI text request
 */
export function recordAITextUsage(userId: string, username: string): void {
  const usage = getUserUsage(userId, username);
  usage.dailyUsage.aiTextRequests++;
  usage.totalUsage.aiTextRequests++;
  saveUsageDB(usageCache);
}

/**
 * Record AI image request
 */
export function recordAIImageUsage(userId: string, username: string): void {
  const usage = getUserUsage(userId, username);
  usage.dailyUsage.aiImageRequests++;
  usage.totalUsage.aiImageRequests++;
  saveUsageDB(usageCache);
}

/**
 * Upgrade user to premium
 */
export function upgradeToPremium(userId: string, username: string, days: number = 30): void {
  const usage = getUserUsage(userId, username);
  usage.tier = 'premium';
  
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  usage.premiumExpiry = expiry.toISOString();
  
  saveUsageDB(usageCache);
}

/**
 * Remove premium from user
 */
export function removePremium(userId: string): boolean {
  const usage = usageCache.get(userId);
  
  if (!usage) {
    return false; // User not found
  }
  
  if (usage.tier !== 'premium') {
    return false; // User doesn't have premium
  }
  
  usage.tier = 'free';
  delete usage.premiumExpiry;
  
  saveUsageDB(usageCache);
  return true;
}

/**
 * Get usage statistics
 */
export function getUsageStats(userId: string, username: string): UserUsage {
  return getUserUsage(userId, username);
}

/**
 * Reset all daily usage (admin function)
 */
export function resetAllDailyUsage(): void {
  const today = getCurrentDate();
  
  for (const usage of usageCache.values()) {
    usage.dailyUsage = {
      date: today,
      aiTextRequests: 0,
      aiImageRequests: 0
    };
  }
  
  saveUsageDB(usageCache);
  console.log('✅ Reset all daily AI usage');
}

/**
 * Export singleton instance for easy use
 */
export const aiUsageTracker = {
  canUse: (userId: string, username: string = 'Unknown') => canUseAIText(userId, username).allowed,
  trackUsage: (userId: string, username: string = 'Unknown') => recordAITextUsage(userId, username),
  getUsage: (userId: string, username: string = 'Unknown') => {
    const check = canUseAIText(userId, username);
    return {
      remaining: check.remaining,
      limit: check.limit,
      tier: check.tier
    };
  },
  getStats: getUsageStats
};
