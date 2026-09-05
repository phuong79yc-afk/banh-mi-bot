// Snipe Manager - Track deleted and edited messages
import { loadJsonDb, saveJsonDb } from '../../utils/jsonDb';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'snipe.json');

export interface SnipedMessage {
  messageId: string;
  channelId: string;
  guildId: string;
  authorId: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  attachments: string[];
  timestamp: number;
  deletedAt?: number;
  editedFrom?: string; // Original content before edit
  editedAt?: number;
}

export interface SnipeData {
  deleted: { [channelId: string]: SnipedMessage[] };
  edited: { [channelId: string]: SnipedMessage[] };
}

class SnipeManager {
  private data: SnipeData = { deleted: {}, edited: {} };
  private maxPerChannel = 10;
  private maxAge = 28 * 24 * 60 * 60 * 1000; // 28 days

  constructor() {
    this.loadData();
    this.startCleanup();
  }

  private loadData() {
    try {
      this.data = loadJsonDb(DB_PATH);
      if (!this.data.deleted) this.data.deleted = {};
      if (!this.data.edited) this.data.edited = {};
      const totalDeleted = Object.values(this.data.deleted).reduce((sum, arr) => sum + arr.length, 0);
      const totalEdited = Object.values(this.data.edited).reduce((sum, arr) => sum + arr.length, 0);
      console.log(`✅ Loaded ${totalDeleted} deleted, ${totalEdited} edited messages`);
    } catch (error) {
      console.error('Error loading snipe data:', error);
      this.data = { deleted: {}, edited: {} };
    }
  }

  private saveData() {
    try {
      saveJsonDb(DB_PATH, this.data);
    } catch (error) {
      console.error('Error saving snipe data:', error);
    }
  }

  // Add deleted message
  addDeleted(
    messageId: string,
    channelId: string,
    guildId: string,
    authorId: string,
    authorUsername: string,
    content: string,
    attachments: string[],
    timestamp: number
  ) {
    if (!this.data.deleted[channelId]) {
      this.data.deleted[channelId] = [];
    }

    const sniped: SnipedMessage = {
      messageId,
      channelId,
      guildId,
      authorId,
      authorUsername,
      content,
      attachments,
      timestamp,
      deletedAt: Date.now()
    };

    this.data.deleted[channelId].unshift(sniped);

    // Keep only last N messages
    if (this.data.deleted[channelId].length > this.maxPerChannel) {
      this.data.deleted[channelId] = this.data.deleted[channelId].slice(0, this.maxPerChannel);
    }

    this.saveData();
  }

  // Add edited message
  addEdited(
    messageId: string,
    channelId: string,
    guildId: string,
    authorId: string,
    authorUsername: string,
    oldContent: string,
    newContent: string,
    attachments: string[],
    timestamp: number
  ) {
    if (!this.data.edited[channelId]) {
      this.data.edited[channelId] = [];
    }

    const sniped: SnipedMessage = {
      messageId,
      channelId,
      guildId,
      authorId,
      authorUsername,
      content: newContent,
      editedFrom: oldContent,
      attachments,
      timestamp,
      editedAt: Date.now()
    };

    this.data.edited[channelId].unshift(sniped);

    // Keep only last N messages
    if (this.data.edited[channelId].length > this.maxPerChannel) {
      this.data.edited[channelId] = this.data.edited[channelId].slice(0, this.maxPerChannel);
    }

    this.saveData();
  }

  // Get deleted messages
  getDeleted(channelId: string, page: number = 1): SnipedMessage[] {
    if (!this.data.deleted[channelId]) return [];
    
    const start = (page - 1) * 1;
    const end = start + 1;
    
    return this.data.deleted[channelId].slice(start, end);
  }

  // Get edited messages
  getEdited(channelId: string, page: number = 1): SnipedMessage[] {
    if (!this.data.edited[channelId]) return [];
    
    const start = (page - 1) * 1;
    const end = start + 1;
    
    return this.data.edited[channelId].slice(start, end);
  }

  // Get total count
  getDeletedCount(channelId: string): number {
    return this.data.deleted[channelId]?.length || 0;
  }

  getEditedCount(channelId: string): number {
    return this.data.edited[channelId]?.length || 0;
  }

  // Cleanup old messages
  cleanup() {
    const cutoff = Date.now() - this.maxAge;
    let cleaned = 0;

    // Clean deleted messages
    for (const channelId in this.data.deleted) {
      const before = this.data.deleted[channelId].length;
      this.data.deleted[channelId] = this.data.deleted[channelId].filter(
        msg => (msg.deletedAt || 0) > cutoff
      );
      const after = this.data.deleted[channelId].length;
      cleaned += before - after;

      if (this.data.deleted[channelId].length === 0) {
        delete this.data.deleted[channelId];
      }
    }

    // Clean edited messages
    for (const channelId in this.data.edited) {
      const before = this.data.edited[channelId].length;
      this.data.edited[channelId] = this.data.edited[channelId].filter(
        msg => (msg.editedAt || 0) > cutoff
      );
      const after = this.data.edited[channelId].length;
      cleaned += before - after;

      if (this.data.edited[channelId].length === 0) {
        delete this.data.edited[channelId];
      }
    }

    if (cleaned > 0) {
      this.saveData();
      console.log(`🧹 Cleaned up ${cleaned} old sniped messages`);
    }
  }

  // Start auto-cleanup
  private startCleanup() {
    // Run cleanup every 6 hours
    setInterval(() => {
      this.cleanup();
    }, 6 * 60 * 60 * 1000);
  }

  // Get statistics
  getStats(): { totalDeleted: number; totalEdited: number } {
    return {
      totalDeleted: Object.values(this.data.deleted).reduce((sum, arr) => sum + arr.length, 0),
      totalEdited: Object.values(this.data.edited).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

export const snipeManager = new SnipeManager();
