// AFK Manager - Handle AFK status and mentions
import { loadJsonDb, saveJsonDb } from '../../utils/jsonDb';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'afk.json');

export interface AFKUser {
  userId: string;
  guildId: string;
  reason: string;
  timestamp: number;
  mentions: Array<{
    userId: string;
    username: string;
    channelId: string;
    messageUrl: string;
    timestamp: number;
  }>;
}

export interface AFKData {
  [key: string]: AFKUser; // key: `${guildId}_${userId}`
}

export class AFKManager {
  private data: AFKData = {};

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      this.data = loadJsonDb(DB_PATH);
      const totalAFK = Object.keys(this.data).length;
      console.log(`✅ Loaded ${totalAFK} AFK users`);
    } catch (error) {
      console.error('Error loading AFK data:', error);
      this.data = {};
    }
  }

  private saveData() {
    try {
      saveJsonDb(DB_PATH, this.data);
    } catch (error) {
      console.error('Error saving AFK data:', error);
    }
  }

  private getKey(guildId: string, userId: string): string {
    return `${guildId}_${userId}`;
  }

  // Set user AFK
  setAFK(guildId: string, userId: string, reason: string = 'AFK'): AFKUser {
    const key = this.getKey(guildId, userId);
    
    const afkUser: AFKUser = {
      userId,
      guildId,
      reason,
      timestamp: Date.now(),
      mentions: []
    };

    this.data[key] = afkUser;
    this.saveData();

    return afkUser;
  }

  // Remove AFK status
  removeAFK(guildId: string, userId: string): AFKUser | null {
    const key = this.getKey(guildId, userId);
    const afkUser = this.data[key];

    if (!afkUser) return null;

    delete this.data[key];
    this.saveData();

    return afkUser;
  }

  // Get AFK status
  getAFK(guildId: string, userId: string): AFKUser | null {
    const key = this.getKey(guildId, userId);
    return this.data[key] || null;
  }

  // Check if user is AFK
  isAFK(guildId: string, userId: string): boolean {
    const key = this.getKey(guildId, userId);
    return !!this.data[key];
  }

  // Add mention to AFK user
  addMention(
    guildId: string,
    afkUserId: string,
    mentionerId: string,
    mentionerUsername: string,
    channelId: string,
    messageUrl: string
  ) {
    const key = this.getKey(guildId, afkUserId);
    const afkUser = this.data[key];

    if (!afkUser) return;

    afkUser.mentions.push({
      userId: mentionerId,
      username: mentionerUsername,
      channelId,
      messageUrl,
      timestamp: Date.now()
    });

    // Keep only last 10 mentions
    if (afkUser.mentions.length > 10) {
      afkUser.mentions = afkUser.mentions.slice(-10);
    }

    this.saveData();
  }

  // Get time elapsed string
  getTimeElapsed(timestamp: number): string {
    const elapsed = Date.now() - timestamp;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  }

  // Get all AFK users
  getAllAFK(): AFKUser[] {
    return Object.values(this.data);
  }

  // Get statistics
  getStats(): { totalAFK: number } {
    return {
      totalAFK: Object.keys(this.data).length
    };
  }

  // Clean up old AFK (older than 7 days)
  cleanup() {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    let cleaned = 0;

    for (const key in this.data) {
      if (this.data[key].timestamp < sevenDaysAgo) {
        delete this.data[key];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.saveData();
      console.log(`🧹 Cleaned up ${cleaned} old AFK status`);
    }
  }
}

export const afkManager = new AFKManager();

// Auto-cleanup every 24 hours
setInterval(() => {
  afkManager.cleanup();
}, 24 * 60 * 60 * 1000);
