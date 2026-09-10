// Sticky Messages Manager - Pin important messages that auto-repost
import { loadJsonDb, saveJsonDb } from '../../utils/jsonDb';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'sticky-messages.json');

export type StickyMode = 'threshold' | 'inactive';

export interface StickyMessage {
  id: string;
  guildId: string;
  channelId: string;
  message: string;
  embed?: any; // Discord embed JSON
  mode: StickyMode;
  threshold?: number; // messages count (1-500)
  delay?: number; // seconds (1-15)
  allowMentions: boolean;
  webhookUrl?: string;
  lastMessageId?: string;
  messageCount: number; // Counter for threshold mode
  lastActivity: number; // Timestamp for inactive mode
  createdBy: string;
  createdAt: number;
}

export interface StickyData {
  [guildId: string]: StickyMessage[];
}

class StickyManager {
  private data: StickyData = {};
  private maxPerGuild = 3;
  private inactiveTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      this.data = loadJsonDb(DB_PATH);
      const totalGuilds = Object.keys(this.data).length;
      const totalStickies = Object.values(this.data).reduce((sum, arr) => sum + arr.length, 0);
      console.log(`✅ Loaded ${totalStickies} sticky messages from ${totalGuilds} guilds`);
    } catch (error) {
      console.error('Error loading sticky messages:', error);
      this.data = {};
    }
  }

  private saveData() {
    try {
      saveJsonDb(DB_PATH, this.data);
    } catch (error) {
      console.error('Error saving sticky messages:', error);
    }
  }

  // Add sticky message
  add(
    guildId: string,
    channelId: string,
    message: string,
    userId: string,
    options: {
      embed?: any;
      mode?: StickyMode;
      threshold?: number;
      delay?: number;
      allowMentions?: boolean;
      webhookUrl?: string;
    } = {}
  ): { success: boolean; error?: string; sticky?: StickyMessage } {
    if (!this.data[guildId]) {
      this.data[guildId] = [];
    }

    // Check limit
    if (this.data[guildId].length >= this.maxPerGuild) {
      return {
        success: false,
        error: `Cannot create more than ${this.maxPerGuild} sticky messages in this guild!`
      };
    }

    // Check if channel already has sticky
    const exists = this.data[guildId].some(s => s.channelId === channelId);
    if (exists) {
      return {
        success: false,
        error: 'This channel already has a sticky message. Remove it first!'
      };
    }

    const sticky: StickyMessage = {
      id: `${guildId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      guildId,
      channelId,
      message,
      embed: options.embed,
      mode: options.mode || 'threshold',
      threshold: options.threshold || 3,
      delay: options.delay || 5,
      allowMentions: options.allowMentions ?? false,
      webhookUrl: options.webhookUrl,
      messageCount: 0,
      lastActivity: Date.now(),
      createdBy: userId,
      createdAt: Date.now()
    };

    this.data[guildId].push(sticky);
    this.saveData();

    return { success: true, sticky };
  }

  // Remove sticky message
  remove(guildId: string, channelId: string): { success: boolean; error?: string } {
    if (!this.data[guildId]) {
      return { success: false, error: "This guild doesn't have any sticky messages!" };
    }

    const index = this.data[guildId].findIndex(s => s.channelId === channelId);

    if (index === -1) {
      return {
        success: false,
        error: 'No sticky message found in this channel!'
      };
    }

    // Clear timer if exists
    const timerId = `${guildId}_${channelId}`;
    if (this.inactiveTimers.has(timerId)) {
      clearTimeout(this.inactiveTimers.get(timerId)!);
      this.inactiveTimers.delete(timerId);
    }

    this.data[guildId].splice(index, 1);
    
    // Clean up empty guild data
    if (this.data[guildId].length === 0) {
      delete this.data[guildId];
    }

    this.saveData();
    return { success: true };
  }

  // Get sticky for channel
  get(guildId: string, channelId: string): StickyMessage | null {
    if (!this.data[guildId]) return null;
    return this.data[guildId].find(s => s.channelId === channelId) || null;
  }

  // Get all stickies for guild
  getAll(guildId: string): StickyMessage[] {
    return this.data[guildId] || [];
  }

  // Update sticky mode
  updateMode(
    guildId: string,
    channelId: string,
    mode: StickyMode
  ): { success: boolean; error?: string } {
    const sticky = this.get(guildId, channelId);
    
    if (!sticky) {
      return { success: false, error: 'No sticky message found in this channel!' };
    }

    sticky.mode = mode;
    this.saveData();

    return { success: true };
  }

  // Update threshold
  updateThreshold(
    guildId: string,
    channelId: string,
    threshold: number
  ): { success: boolean; error?: string } {
    if (threshold < 1 || threshold > 500) {
      return { success: false, error: 'Threshold must be between 1 and 500!' };
    }

    const sticky = this.get(guildId, channelId);
    
    if (!sticky) {
      return { success: false, error: 'No sticky message found in this channel!' };
    }

    sticky.threshold = threshold;
    this.saveData();

    return { success: true };
  }

  // Update delay
  updateDelay(
    guildId: string,
    channelId: string,
    delay: number
  ): { success: boolean; error?: string } {
    if (delay < 1 || delay > 15) {
      return { success: false, error: 'Delay must be between 1 and 15 seconds!' };
    }

    const sticky = this.get(guildId, channelId);
    
    if (!sticky) {
      return { success: false, error: 'No sticky message found in this channel!' };
    }

    sticky.delay = delay;
    this.saveData();

    return { success: true };
  }

  // Update allow mentions
  updateAllowMentions(
    guildId: string,
    channelId: string,
    allow: boolean
  ): { success: boolean; error?: string } {
    const sticky = this.get(guildId, channelId);
    
    if (!sticky) {
      return { success: false, error: 'No sticky message found in this channel!' };
    }

    sticky.allowMentions = allow;
    this.saveData();

    return { success: true };
  }

  // Update webhook
  updateWebhook(
    guildId: string,
    channelId: string,
    webhookUrl?: string
  ): { success: boolean; error?: string } {
    const sticky = this.get(guildId, channelId);
    
    if (!sticky) {
      return { success: false, error: 'No sticky message found in this channel!' };
    }

    sticky.webhookUrl = webhookUrl;
    this.saveData();

    return { success: true };
  }

  // Update last message ID
  updateLastMessageId(guildId: string, channelId: string, messageId: string) {
    const sticky = this.get(guildId, channelId);
    if (sticky) {
      sticky.lastMessageId = messageId;
      this.saveData();
    }
  }

  // Increment message count (for threshold mode)
  incrementCount(guildId: string, channelId: string): number {
    const sticky = this.get(guildId, channelId);
    if (sticky) {
      sticky.messageCount++;
      sticky.lastActivity = Date.now();
      this.saveData();
      return sticky.messageCount;
    }
    return 0;
  }

  // Reset message count
  resetCount(guildId: string, channelId: string) {
    const sticky = this.get(guildId, channelId);
    if (sticky) {
      sticky.messageCount = 0;
      this.saveData();
    }
  }

  // Update last activity (for inactive mode)
  updateActivity(guildId: string, channelId: string) {
    const sticky = this.get(guildId, channelId);
    if (sticky) {
      sticky.lastActivity = Date.now();
      this.saveData();
    }
  }

  // Start inactive timer
  startInactiveTimer(
    guildId: string,
    channelId: string,
    callback: () => void
  ) {
    const sticky = this.get(guildId, channelId);
    if (!sticky || sticky.mode !== 'inactive') return;

    const timerId = `${guildId}_${channelId}`;
    
    // Clear existing timer
    if (this.inactiveTimers.has(timerId)) {
      clearTimeout(this.inactiveTimers.get(timerId)!);
    }

    // Set new timer
    const delay = (sticky.delay || 5) * 1000;
    const timer = setTimeout(() => {
      callback();
      this.inactiveTimers.delete(timerId);
    }, delay);

    this.inactiveTimers.set(timerId, timer);
  }

  // Clear inactive timer
  clearInactiveTimer(guildId: string, channelId: string) {
    const timerId = `${guildId}_${channelId}`;
    if (this.inactiveTimers.has(timerId)) {
      clearTimeout(this.inactiveTimers.get(timerId)!);
      this.inactiveTimers.delete(timerId);
    }
  }

  // Get statistics
  getStats(): { totalGuilds: number; totalStickies: number } {
    return {
      totalGuilds: Object.keys(this.data).length,
      totalStickies: Object.values(this.data).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

export const stickyManager = new StickyManager();
