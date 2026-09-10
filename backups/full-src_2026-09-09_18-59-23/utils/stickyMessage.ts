// Sticky Message System - Like Supporter
// Auto-repost messages with threshold/inactive modes, 3 per server limit

import fs from 'fs';
import path from 'path';
import { TextChannel, Message } from 'discord.js';

export type StickMode = 'threshold' | 'inactive';

export interface StickyMessage {
  id: string;
  guildId: string;
  channelId: string;
  message: string; // Message content or JSON embed
  mode: StickMode;
  threshold?: number; // Messages before repost (for threshold mode)
  inactiveDelay?: number; // Seconds of inactivity (for inactive mode)
  allowMentions: boolean;
  webhookUrl?: string; // Custom webhook
  lastMessageId?: string; // Last sticky message ID
  lastPostedAt?: number; // Last post timestamp
  messageCount: number; // Counter for threshold mode
  createdAt: number;
  createdBy: string;
}

export interface GuildStickyMessages {
  guildId: string;
  stickies: StickyMessage[];
}

class StickyMessageManager {
  private dataPath: string;
  private cache: Map<string, StickyMessage[]>; // guildId -> stickies
  private maxPerGuild: number = 3;
  private inactivityTimers: Map<string, NodeJS.Timeout>; // channelId -> timer

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'sticky-messages.json');
    this.cache = new Map();
    this.inactivityTimers = new Map();
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (!fs.existsSync(this.dataPath)) {
        const dataDir = path.dirname(this.dataPath);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(this.dataPath, JSON.stringify([], null, 2));
        console.log('✅ Created sticky-messages.json');
        return;
      }

      const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8')) as GuildStickyMessages[];
      
      for (const guildData of data) {
        this.cache.set(guildData.guildId, guildData.stickies);
      }

      console.log(`✅ Loaded ${data.length} guilds' sticky messages`);
    } catch (error) {
      console.error('❌ Error loading sticky messages:', error);
      this.cache = new Map();
    }
  }

  private saveToFile(): void {
    try {
      const data: GuildStickyMessages[] = [];
      
      for (const [guildId, stickies] of this.cache.entries()) {
        data.push({ guildId, stickies });
      }

      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error saving sticky messages:', error);
    }
  }

  public add(
    guildId: string,
    channelId: string,
    message: string,
    mode: StickMode,
    threshold: number | undefined,
    inactiveDelay: number | undefined,
    allowMentions: boolean,
    userId: string
  ): { success: boolean; message: string; sticky?: StickyMessage } {
    const stickies = this.cache.get(guildId) || [];

    // Check maximum limit
    if (stickies.length >= this.maxPerGuild) {
      return {
        success: false,
        message: `❌ Không thể tạo quá ${this.maxPerGuild} sticky messages trong server này!`
      };
    }

    // Check if channel already has sticky
    const exists = stickies.some(s => s.channelId === channelId);
    if (exists) {
      return {
        success: false,
        message: '❌ Kênh này đã có sticky message! Xóa sticky cũ trước khi tạo mới.'
      };
    }

    const sticky: StickyMessage = {
      id: `${guildId}-${channelId}`,
      guildId,
      channelId,
      message,
      mode,
      threshold: mode === 'threshold' ? threshold : undefined,
      inactiveDelay: mode === 'inactive' ? inactiveDelay : undefined,
      allowMentions,
      messageCount: 0,
      createdAt: Date.now(),
      createdBy: userId
    };

    stickies.push(sticky);
    this.cache.set(guildId, stickies);
    this.saveToFile();

    return {
      success: true,
      message: '✅ Đã tạo sticky message thành công!',
      sticky
    };
  }

  public remove(guildId: string, channelId: string): { success: boolean; message: string } {
    const stickies = this.cache.get(guildId) || [];
    const index = stickies.findIndex(s => s.channelId === channelId);

    if (index === -1) {
      return {
        success: false,
        message: '❌ Kênh này không có sticky message!'
      };
    }

    // Clear inactivity timer
    const timer = this.inactivityTimers.get(channelId);
    if (timer) {
      clearTimeout(timer);
      this.inactivityTimers.delete(channelId);
    }

    stickies.splice(index, 1);
    this.cache.set(guildId, stickies);
    this.saveToFile();

    return {
      success: true,
      message: '✅ Đã xóa sticky message thành công!'
    };
  }

  public get(guildId: string, channelId: string): StickyMessage | null {
    const stickies = this.cache.get(guildId) || [];
    return stickies.find(s => s.channelId === channelId) || null;
  }

  public list(guildId: string): StickyMessage[] {
    return this.cache.get(guildId) || [];
  }

  public updateMode(guildId: string, channelId: string, newMode: StickMode): { success: boolean; message: string } {
    const stickies = this.cache.get(guildId) || [];
    const sticky = stickies.find(s => s.channelId === channelId);

    if (!sticky) {
      return {
        success: false,
        message: '❌ Kênh này không có sticky message!'
      };
    }

    sticky.mode = newMode;
    this.cache.set(guildId, stickies);
    this.saveToFile();

    return {
      success: true,
      message: `✅ Đã cập nhật mode thành **${newMode}**!`
    };
  }

  public updateThreshold(guildId: string, channelId: string, threshold: number): { success: boolean; message: string } {
    const stickies = this.cache.get(guildId) || [];
    const sticky = stickies.find(s => s.channelId === channelId);

    if (!sticky) {
      return {
        success: false,
        message: '❌ Kênh này không có sticky message!'
      };
    }

    sticky.threshold = threshold;
    this.cache.set(guildId, stickies);
    this.saveToFile();

    return {
      success: true,
      message: `✅ Đã cập nhật threshold thành **${threshold}** tin nhắn!`
    };
  }

  public updateDelay(guildId: string, channelId: string, delay: number): { success: boolean; message: string } {
    const stickies = this.cache.get(guildId) || [];
    const sticky = stickies.find(s => s.channelId === channelId);

    if (!sticky) {
      return {
        success: false,
        message: '❌ Kênh này không có sticky message!'
      };
    }

    sticky.inactiveDelay = delay;
    this.cache.set(guildId, stickies);
    this.saveToFile();

    return {
      success: true,
      message: `✅ Đã cập nhật delay thành **${delay}** giây!`
    };
  }

  public async handleMessage(message: Message): Promise<void> {
    if (!message.guild || message.author.bot) return;

    const sticky = this.get(message.guild.id, message.channel.id);
    if (!sticky) return;

    try {
      if (sticky.mode === 'threshold') {
        await this.handleThresholdMode(message, sticky);
      } else if (sticky.mode === 'inactive') {
        await this.handleInactiveMode(message, sticky);
      }
    } catch (error) {
      console.error('❌ Sticky message handler error:', error);
    }
  }

  private async handleThresholdMode(message: Message, sticky: StickyMessage): Promise<void> {
    sticky.messageCount++;

    if (sticky.messageCount >= (sticky.threshold || 10)) {
      await this.repostSticky(message.channel as TextChannel, sticky);
      sticky.messageCount = 0;
      this.saveToFile();
    }
  }

  private async handleInactiveMode(message: Message, sticky: StickyMessage): Promise<void> {
    // Clear existing timer
    const existingTimer = this.inactivityTimers.get(message.channel.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const delay = (sticky.inactiveDelay || 15) * 1000;
    const timer = setTimeout(async () => {
      await this.repostSticky(message.channel as TextChannel, sticky);
      this.inactivityTimers.delete(message.channel.id);
    }, delay);

    this.inactivityTimers.set(message.channel.id, timer);
  }

  private async repostSticky(channel: TextChannel, sticky: StickyMessage): Promise<void> {
    try {
      // Delete old sticky message
      if (sticky.lastMessageId) {
        try {
          const oldMessage = await channel.messages.fetch(sticky.lastMessageId);
          await oldMessage.delete();
        } catch (err) {
          // Message might already be deleted
        }
      }

      // Post new sticky
      const sent = await channel.send({
        content: sticky.message,
        allowedMentions: sticky.allowMentions ? undefined : { parse: [] }
      });

      sticky.lastMessageId = sent.id;
      sticky.lastPostedAt = Date.now();
      this.saveToFile();
    } catch (error) {
      console.error('❌ Failed to repost sticky:', error);
    }
  }
}

export const stickyMessageManager = new StickyMessageManager();
