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
}

export interface AutoresponderData {
  [guildId: string]: Autoresponder[];
}

class AutoresponderManager {
  private data: AutoresponderData = {};
  private maxPerGuild = 50;

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      this.data = loadJsonDb(DB_PATH);
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
    userId: string
  ): { success: boolean; error?: string; autoresponder?: Autoresponder } {
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
      createdAt: Date.now()
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

  // Check message against autoresponders
  checkMessage(guildId: string, message: string): string | null {
    const autoresponders = this.getAll(guildId);
    if (autoresponders.length === 0) return null;

    for (const ar of autoresponders) {
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
