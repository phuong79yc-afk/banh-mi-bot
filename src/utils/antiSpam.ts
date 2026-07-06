import { Message, GuildMember } from 'discord.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface SpamConfig {
  enabled: boolean;
  maxMessages: number; // Số tin nhắn tối đa trong timeWindow
  timeWindow: number; // Thời gian (giây)
  maxMentions: number; // Số mention tối đa trong 1 tin nhắn
  maxEmojis: number; // Số emoji tối đa trong 1 tin nhắn
  maxLinks: number; // Số link tối đa trong 1 tin nhắn (0 = không giới hạn)
  blockAllLinks: boolean; // Chặn tất cả links
  allowedDomains: string[]; // Domains được phép (whitelist)
  muteDuration: number; // Thời gian mute (phút)
  autoDelete: boolean;
  autoMute: boolean;
  whitelistedRoles: string[];
  whitelistedChannels: string[];
}

interface MessageRecord {
  userId: string;
  channelId: string;
  content: string;
  timestamp: number;
}

interface SpamStats {
  totalDetections: number;
  totalDeletes: number;
  totalMutes: number;
}

class AntiSpamSystem {
  private configs: Map<string, SpamConfig> = new Map();
  private messageRecords: Map<string, MessageRecord[]> = new Map();
  private stats: Map<string, SpamStats> = new Map();
  private configPath: string;

  constructor() {
    this.configPath = join(process.cwd(), 'antispam-config.json');
    this.loadConfigs();
  }

  private loadConfigs(): void {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(data);
        this.configs = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('❌ Lỗi load antispam config:', error);
    }
  }

  private saveConfigs(): void {
    try {
      const obj = Object.fromEntries(this.configs);
      writeFileSync(this.configPath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (error) {
      console.error('❌ Lỗi save antispam config:', error);
    }
  }

  public getConfig(guildId: string): SpamConfig {
    if (!this.configs.has(guildId)) {
      this.configs.set(guildId, {
        enabled: false,
        maxMessages: 5,
        timeWindow: 5,
        maxMentions: 5,
        maxEmojis: 10,
        maxLinks: 0, // 0 = không giới hạn
        blockAllLinks: false,
        allowedDomains: [],
        muteDuration: 5,
        autoDelete: true,
        autoMute: true,
        whitelistedRoles: [],
        whitelistedChannels: []
      });
    }
    return this.configs.get(guildId)!;
  }

  public setEnabled(guildId: string, enabled: boolean): void {
    const config = this.getConfig(guildId);
    config.enabled = enabled;
    this.configs.set(guildId, config);
    this.saveConfigs();
  }

  public updateConfig(guildId: string, updates: Partial<SpamConfig>): void {
    const config = this.getConfig(guildId);
    Object.assign(config, updates);
    this.configs.set(guildId, config);
    this.saveConfigs();
  }

  public addWhitelistedRole(guildId: string, roleId: string): void {
    const config = this.getConfig(guildId);
    if (!config.whitelistedRoles.includes(roleId)) {
      config.whitelistedRoles.push(roleId);
      this.configs.set(guildId, config);
      this.saveConfigs();
    }
  }

  public removeWhitelistedRole(guildId: string, roleId: string): void {
    const config = this.getConfig(guildId);
    config.whitelistedRoles = config.whitelistedRoles.filter(id => id !== roleId);
    this.configs.set(guildId, config);
    this.saveConfigs();
  }

  public addWhitelistedChannel(guildId: string, channelId: string): void {
    const config = this.getConfig(guildId);
    if (!config.whitelistedChannels.includes(channelId)) {
      config.whitelistedChannels.push(channelId);
      this.configs.set(guildId, config);
      this.saveConfigs();
    }
  }

  public removeWhitelistedChannel(guildId: string, channelId: string): void {
    const config = this.getConfig(guildId);
    config.whitelistedChannels = config.whitelistedChannels.filter(id => id !== channelId);
    this.configs.set(guildId, config);
    this.saveConfigs();
  }

  private isWhitelisted(message: Message): boolean {
    if (!message.guild || !message.member) return true;

    const config = this.getConfig(message.guild.id);

    // Check channel whitelist
    if (config.whitelistedChannels.includes(message.channel.id)) {
      return true;
    }

    // Check role whitelist
    const hasWhitelistedRole = message.member.roles.cache.some(role =>
      config.whitelistedRoles.includes(role.id)
    );

    return hasWhitelistedRole;
  }

  private countEmojis(text: string): number {
    // Unicode emoji regex
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    // Custom emoji regex <:name:id> or <a:name:id>
    const customEmojiRegex = /<a?:\w+:\d+>/g;

    const unicodeEmojis = text.match(emojiRegex) || [];
    const customEmojis = text.match(customEmojiRegex) || [];

    return unicodeEmojis.length + customEmojis.length;
  }

  private countMentions(message: Message): number {
    return message.mentions.users.size + message.mentions.roles.size;
  }

  private getOrCreateStats(guildId: string): SpamStats {
    if (!this.stats.has(guildId)) {
      this.stats.set(guildId, {
        totalDetections: 0,
        totalDeletes: 0,
        totalMutes: 0
      });
    }
    return this.stats.get(guildId)!;
  }

  public async checkMessage(message: Message): Promise<void> {
    if (!message.guild || !message.member) return;
    if (message.author.bot) return;

    const config = this.getConfig(message.guild.id);
    if (!config.enabled) return;
    if (this.isWhitelisted(message)) return;

    const guildId = message.guild.id;
    const userId = message.author.id;
    const now = Date.now();
    const stats = this.getOrCreateStats(guildId);

    // Check emoji flood
    const emojiCount = this.countEmojis(message.content);
    if (emojiCount > config.maxEmojis) {
      console.log(`🚨 Emoji flood detected from ${message.author.tag} (${emojiCount} emojis)`);
      stats.totalDetections++;
      await this.handleSpam(message, `Emoji flood (${emojiCount}/${config.maxEmojis})`, config);
      return;
    }

    // Check mention spam
    const mentionCount = this.countMentions(message);
    if (mentionCount > config.maxMentions) {
      console.log(`🚨 Mention spam detected from ${message.author.tag} (${mentionCount} mentions)`);
      stats.totalDetections++;
      await this.handleSpam(message, `Mention spam (${mentionCount}/${config.maxMentions})`, config);
      return;
    }

    // Check message spam
    const recordKey = `${guildId}-${userId}`;
    if (!this.messageRecords.has(recordKey)) {
      this.messageRecords.set(recordKey, []);
    }

    const records = this.messageRecords.get(recordKey)!;
    
    // Add new record
    records.push({
      userId,
      channelId: message.channel.id,
      content: message.content,
      timestamp: now
    });

    // Remove old records
    const timeWindowMs = config.timeWindow * 1000;
    this.messageRecords.set(
      recordKey,
      records.filter(r => now - r.timestamp < timeWindowMs)
    );

    const recentMessages = this.messageRecords.get(recordKey)!;

    // Check if spam
    if (recentMessages.length > config.maxMessages) {
      console.log(`🚨 Message spam detected from ${message.author.tag} (${recentMessages.length}/${config.maxMessages})`);
      stats.totalDetections++;
      await this.handleSpam(message, `Message spam (${recentMessages.length}/${config.maxMessages} trong ${config.timeWindow}s)`, config);
      
      // Clear records after handling
      this.messageRecords.delete(recordKey);
    }
  }

  private async handleSpam(message: Message, reason: string, config: SpamConfig): Promise<void> {
    const stats = this.getOrCreateStats(message.guild!.id);

    try {
      // Delete message
      if (config.autoDelete) {
        await message.delete();
        stats.totalDeletes++;
        console.log(`🗑️ Deleted spam message from ${message.author.tag}`);
      }

      // Mute user
      if (config.autoMute && message.member) {
        await message.member.timeout(
          config.muteDuration * 60 * 1000,
          `Anti-Spam: ${reason}`
        );
        stats.totalMutes++;
        console.log(`🔇 Muted ${message.author.tag} for ${config.muteDuration} minutes`);

        // Send notification
        try {
          if (message.channel.isSendable()) {
            await message.channel.send({
              content: `⚠️ ${message.author} đã bị mute ${config.muteDuration} phút do spam: **${reason}**`,
            });
          }
        } catch (err) {
          console.error('❌ Không thể gửi spam notification:', err);
        }
      }
    } catch (error) {
      console.error('❌ Lỗi xử lý spam:', error);
    }
  }

  public getStats(guildId: string): SpamStats {
    if (!this.stats.has(guildId)) {
      this.stats.set(guildId, {
        totalDetections: 0,
        totalDeletes: 0,
        totalMutes: 0
      });
    }
    return this.stats.get(guildId)!;
  }
}

export const antiSpamSystem = new AntiSpamSystem();
