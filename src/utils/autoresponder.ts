// AutoResponder System - Like Supporter
// 50 triggers per server, 4 match modes

import fs from 'fs';
import path from 'path';

export type MatchMode = 'equal' | 'contains' | 'startswith' | 'endswith';

export interface AutoResponder {
  id: string;
  guildId: string;
  trigger: string;
  response: string;
  matchMode: MatchMode;
  ignoreCase: boolean;
  createdAt: number;
  createdBy: string;
  uses: number;
}

export interface GuildAutoResponders {
  guildId: string;
  responders: AutoResponder[];
}

class AutoResponderManager {
  private dataPath: string;
  private cache: Map<string, AutoResponder[]>; // guildId -> responders
  private maxPerGuild: number = 50;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'autoresponders.json');
    this.cache = new Map();
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
        console.log('✅ Created autoresponders.json');
        return;
      }

      const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8')) as GuildAutoResponders[];
      
      for (const guildData of data) {
        this.cache.set(guildData.guildId, guildData.responders);
      }

      console.log(`✅ Loaded ${data.length} guilds' autoresponders`);
    } catch (error) {
      console.error('❌ Error loading autoresponders:', error);
      this.cache = new Map();
    }
  }

  private saveToFile(): void {
    try {
      const data: GuildAutoResponders[] = [];
      
      for (const [guildId, responders] of this.cache.entries()) {
        data.push({ guildId, responders });
      }

      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error saving autoresponders:', error);
    }
  }

  public add(guildId: string, trigger: string, response: string, matchMode: MatchMode, ignoreCase: boolean, userId: string): { success: boolean; message: string; responder?: AutoResponder } {
    const responders = this.cache.get(guildId) || [];

    // Check maximum limit
    if (responders.length >= this.maxPerGuild) {
      return {
        success: false,
        message: `❌ Không thể tạo quá ${this.maxPerGuild} autoresponders trong server này!`
      };
    }

    // Check if trigger already exists (case-insensitive)
    const exists = responders.some(r => 
      r.trigger.toLowerCase() === trigger.toLowerCase() && r.matchMode === matchMode
    );

    if (exists) {
      return {
        success: false,
        message: '❌ Autoresponder với trigger này đã tồn tại! Bạn chỉ có thể edit hoặc xóa.'
      };
    }

    const responder: AutoResponder = {
      id: `${guildId}-${Date.now()}`,
      guildId,
      trigger,
      response,
      matchMode,
      ignoreCase,
      createdAt: Date.now(),
      createdBy: userId,
      uses: 0
    };

    responders.push(responder);
    this.cache.set(guildId, responders);
    this.saveToFile();

    return {
      success: true,
      message: '✅ Đã tạo autoresponder thành công!',
      responder
    };
  }

  public delete(guildId: string, trigger: string): { success: boolean; message: string } {
    const responders = this.cache.get(guildId) || [];
    const index = responders.findIndex(r => r.trigger.toLowerCase() === trigger.toLowerCase());

    if (index === -1) {
      return {
        success: false,
        message: '❌ Không tìm thấy autoresponder với trigger này!'
      };
    }

    responders.splice(index, 1);
    this.cache.set(guildId, responders);
    this.saveToFile();

    return {
      success: true,
      message: '✅ Đã xóa autoresponder thành công!'
    };
  }

  public get(guildId: string, trigger: string): AutoResponder | null {
    const responders = this.cache.get(guildId) || [];
    return responders.find(r => r.trigger.toLowerCase() === trigger.toLowerCase()) || null;
  }

  public list(guildId: string): AutoResponder[] {
    return this.cache.get(guildId) || [];
  }

  public updateMatchMode(guildId: string, trigger: string, newMode: MatchMode): { success: boolean; message: string } {
    const responders = this.cache.get(guildId) || [];
    const responder = responders.find(r => r.trigger.toLowerCase() === trigger.toLowerCase());

    if (!responder) {
      return {
        success: false,
        message: '❌ Không tìm thấy autoresponder với trigger này!'
      };
    }

    responder.matchMode = newMode;
    this.cache.set(guildId, responders);
    this.saveToFile();

    return {
      success: true,
      message: `✅ Đã cập nhật match mode thành **${newMode}**!`
    };
  }

  public check(guildId: string, message: string): AutoResponder | null {
    const responders = this.cache.get(guildId) || [];

    for (const responder of responders) {
      const msg = responder.ignoreCase ? message.toLowerCase() : message;
      const trigger = responder.ignoreCase ? responder.trigger.toLowerCase() : responder.trigger;

      let matched = false;

      switch (responder.matchMode) {
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
        // Increment usage counter
        responder.uses++;
        this.saveToFile();
        return responder;
      }
    }

    return null;
  }

  public getStats(guildId: string): { total: number; mostUsed: AutoResponder | null } {
    const responders = this.cache.get(guildId) || [];
    const mostUsed = responders.length > 0 
      ? responders.reduce((prev, curr) => curr.uses > prev.uses ? curr : prev)
      : null;

    return {
      total: responders.length,
      mostUsed
    };
  }
}

export const autoresponderManager = new AutoResponderManager();
