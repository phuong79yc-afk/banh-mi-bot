// Autoresponder Manager - Handle auto-reply based on keywords
import { loadJsonDb, saveJsonDb } from '../../utils/jsonDb';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'autoresponders.json');

export type MatchMode = 'equal' | 'contains' | 'startswith' | 'endswith';

export interface Autoresponder {
  id: string;
  guildId: string;
  trigger: string;
  response: string;
  mode: MatchMode;
  ignoreCase: boolean;
  createdBy: string;
  createdAt: number;
  enabled: boolean;
  cooldownSeconds: number;
}

export interface AutoresponderData {
  [guildId: string]: Autoresponder[];
}

class AutoresponderManager {
  private data: AutoresponderData = {};
  private maxPerGuild = 50;
  private lastTriggered = new Map<string, number>();

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      this.data = loadJsonDb(DB_PATH);
      for (const guildItems of Object.values(this.data)) {
        for (const item of guildItems) {
          if (typeof item.enabled !== 'boolean') item.enabled = true;
          if (!Number.isFinite(item.cooldownSeconds)) item.cooldownSeconds = 10;
        }
      }
      const totalGuilds = Object.keys(this.data).length;
      const totalAutoresponders = Object.values(this.data).reduce((sum, arr) => sum + arr.length, 0);
      console.log(`✅ Loaded ${totalAutoresponders} autoresponders from ${totalGuilds} guilds`);
    } catch (error) {
      console.error('Error loading autoresponders:', error);
      this.data = {};
    }
  }

  private saveData() {
    try {
      saveJsonDb(DB_PATH, this.data);
    } catch (error) {
      console.error('Error saving autoresponders:', error);
    }
  }

  // Add autoresponder
  add(
    guildId: string,
    trigger: string,
    response: string,
    mode: MatchMode = 'contains',
    ignoreCase: boolean = true,
    userId: string,
    cooldownSeconds = 10
  ): { success: boolean; error?: string; autoresponder?: Autoresponder } {
    trigger = trigger.trim();
    response = response.trim();
    if (trigger.length < 1 || trigger.length > 100) {
      return { success: false, error: 'Trigger phải từ 1 đến 100 ký tự.' };
    }
    if (response.length < 1 || response.length > 2000) {
      return { success: false, error: 'Phản hồi phải từ 1 đến 2000 ký tự.' };
    }
    if (!Number.isInteger(cooldownSeconds) || cooldownSeconds < 0 || cooldownSeconds > 3600) {
      return { success: false, error: 'Cooldown phải từ 0 đến 3600 giây.' };
    }
    if (!this.data[guildId]) {
      this.data[guildId] = [];
    }

    // Check limit
    if (this.data[guildId].length >= this.maxPerGuild) {
      return {
        success: false,
        error: `Cannot create more than ${this.maxPerGuild} autoresponders in this guild!`
      };
    }

    // Check if trigger already exists
    const exists = this.data[guildId].some(ar => 
      ar.trigger.toLowerCase() === trigger.toLowerCase()
    );

    if (exists) {
      return {
        success: false,
        error: 'An autoresponder with this trigger already exists. You can only edit or delete it.'
      };
    }

    const autoresponder: Autoresponder = {
      id: `${guildId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      guildId,
      trigger,
      response,
      mode,
      ignoreCase,
      createdBy: userId,
      createdAt: Date.now(),
      enabled: true,
      cooldownSeconds: Math.max(0, cooldownSeconds),
    };

    this.data[guildId].push(autoresponder);
    this.saveData();

    return { success: true, autoresponder };
  }

  // Remove autoresponder
  remove(guildId: string, trigger: string): { success: boolean; error?: string } {
    if (!this.data[guildId]) {
      return { success: false, error: "This guild doesn't have any autoresponders!" };
    }

    const index = this.data[guildId].findIndex(ar => 
      ar.trigger.toLowerCase() === trigger.toLowerCase()
    );

    if (index === -1) {
      return {
        success: false,
        error: `No autoresponder found with trigger "${trigger}"`
      };
    }

    this.data[guildId].splice(index, 1);
    
    // Clean up empty guild data
    if (this.data[guildId].length === 0) {
      delete this.data[guildId];
    }

    this.saveData();
    return { success: true };
  }

  // Get autoresponder by trigger
  get(guildId: string, trigger: string): Autoresponder | null {
    if (!this.data[guildId]) return null;

    return this.data[guildId].find(ar => 
      ar.trigger.toLowerCase() === trigger.toLowerCase()
    ) || null;
  }

  // Get all autoresponders for a guild
  getAll(guildId: string): Autoresponder[] {
    return this.data[guildId] || [];
  }

  // Update match mode
  updateMatchMode(
    guildId: string,
    trigger: string,
    mode: MatchMode
  ): { success: boolean; error?: string } {
    const autoresponder = this.get(guildId, trigger);
    
    if (!autoresponder) {
      return {
        success: false,
        error: `No autoresponder found with trigger "${trigger}"`
      };
    }

    autoresponder.mode = mode;
    this.saveData();

    return { success: true };
  }

  edit(
    guildId: string,
    trigger: string,
    updates: Partial<Pick<Autoresponder, 'trigger' | 'response' | 'mode' | 'ignoreCase' | 'cooldownSeconds'>>
  ): { success: boolean; error?: string; autoresponder?: Autoresponder } {
    const autoresponder = this.get(guildId, trigger);
    if (!autoresponder) return { success: false, error: `Không tìm thấy trigger "${trigger}".` };

    if (updates.trigger !== undefined) {
      updates.trigger = updates.trigger.trim();
      if (!updates.trigger || updates.trigger.length > 100) {
        return { success: false, error: 'Trigger mới phải từ 1 đến 100 ký tự.' };
      }
      if (updates.trigger.toLowerCase() !== trigger.toLowerCase()
        && this.get(guildId, updates.trigger)) {
        return { success: false, error: 'Trigger mới đã tồn tại.' };
      }
    }
    if (updates.response !== undefined) {
      updates.response = updates.response.trim();
      if (!updates.response || updates.response.length > 2000) {
        return { success: false, error: 'Phản hồi mới phải từ 1 đến 2000 ký tự.' };
      }
    }
    if (updates.cooldownSeconds !== undefined
      && (!Number.isInteger(updates.cooldownSeconds) || updates.cooldownSeconds < 0 || updates.cooldownSeconds > 3600)) {
      return { success: false, error: 'Cooldown phải từ 0 đến 3600 giây.' };
    }

    Object.assign(autoresponder, updates);
    this.saveData();
    return { success: true, autoresponder };
  }

  setEnabled(guildId: string, trigger: string, enabled: boolean): { success: boolean; error?: string } {
    const autoresponder = this.get(guildId, trigger);
    if (!autoresponder) return { success: false, error: `Không tìm thấy trigger "${trigger}".` };
    autoresponder.enabled = enabled;
    this.saveData();
    return { success: true };
  }

  // Check message against autoresponders
  checkMessage(guildId: string, message: string, channelId?: string, userId?: string): string | null {
    const autoresponders = this.getAll(guildId);
    if (autoresponders.length === 0) return null;

    for (const ar of autoresponders) {
      if (ar.enabled === false) continue;
      const trigger = ar.ignoreCase ? ar.trigger.toLowerCase() : ar.trigger;
      const msg = ar.ignoreCase ? message.toLowerCase() : message;

      let matched = false;

      switch (ar.mode) {
        case 'equal':
          matched = msg === trigger;
          break;
        case 'contains':
          matched = msg.includes(trigger);
          break;
        case 'startswith':
          matched = msg.startsWith(trigger);
          break;
        case 'endswith':
          matched = msg.endsWith(trigger);
          break;
      }

      if (matched) {
        const cooldownSeconds = ar.cooldownSeconds ?? 10;
        const cooldownKey = `${guildId}:${ar.id}:${channelId ?? 'all'}:${userId ?? 'all'}`;
        if (cooldownSeconds > 0) {
          const now = Date.now();
          const last = this.lastTriggered.get(cooldownKey) ?? 0;
          if (now - last < cooldownSeconds * 1000) continue;
          this.lastTriggered.set(cooldownKey, now);
        }
        return ar.response;
      }
    }

    return null;
  }

  // Replace placeholders in response
  replacePlaceholders(
    response: string,
    context: {
      userId: string;
      username: string;
      displayName: string;
      guildName: string;
      channelName: string;
      messageContent: string;
    }
  ): string {
    return response
      .replace(/{user}/g, context.username)
      .replace(/{user\.mention}/g, `<@${context.userId}>`)
      .replace(/{user\.id}/g, context.userId)
      .replace(/{user\.name}/g, context.username)
      .replace(/{user\.displayname}/g, context.displayName)
      .replace(/{server}/g, context.guildName)
      .replace(/{server\.name}/g, context.guildName)
      .replace(/{channel}/g, context.channelName)
      .replace(/{channel\.name}/g, context.channelName)
      .replace(/{message}/g, context.messageContent)
      .replace(/{message\.content}/g, context.messageContent);
  }

  // Get statistics
  getStats(): { totalGuilds: number; totalAutoresponders: number } {
    return {
      totalGuilds: Object.keys(this.data).length,
      totalAutoresponders: Object.values(this.data).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

export const autoresponderManager = new AutoresponderManager();
