// Giveaway Manager
import fs from 'fs';
import path from 'path';

export interface GiveawayData {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string;
  prize: string;
  hostId: string;
  winners: number;
  entries: string[]; // User IDs
  endsAt: number;
  ended: boolean;
  winnerIds?: string[];
}

class GiveawayManager {
  private giveaways: Map<string, GiveawayData> = new Map();
  private dataPath = path.join(process.cwd(), 'data', 'giveaways.json');

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8'));
        this.giveaways = new Map(Object.entries(data));
      }
      console.log(`✅ Loaded ${this.giveaways.size} giveaway(s)`);
    } catch (error) {
      console.error('❌ Error loading giveaway data:', error);
    }
  }

  private saveData() {
    try {
      const dataDir = path.dirname(this.dataPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(
        this.dataPath,
        JSON.stringify(Object.fromEntries(this.giveaways), null, 2)
      );
    } catch (error) {
      console.error('❌ Error saving giveaway data:', error);
    }
  }

  create(data: GiveawayData) {
    this.giveaways.set(data.id, data);
    this.saveData();
  }

  get(id: string): GiveawayData | undefined {
    return this.giveaways.get(id);
  }

  getByMessage(messageId: string): GiveawayData | undefined {
    return Array.from(this.giveaways.values()).find(g => g.messageId === messageId);
  }

  getAllActive(): GiveawayData[] {
    return Array.from(this.giveaways.values()).filter(g => !g.ended && g.endsAt > Date.now());
  }

  getAllGuild(guildId: string): GiveawayData[] {
    return Array.from(this.giveaways.values()).filter(g => g.guildId === guildId);
  }

  addEntry(giveawayId: string, userId: string): boolean {
    const giveaway = this.giveaways.get(giveawayId);
    if (!giveaway || giveaway.ended) return false;

    if (!giveaway.entries.includes(userId)) {
      giveaway.entries.push(userId);
      this.saveData();
      return true;
    }
    return false;
  }

  removeEntry(giveawayId: string, userId: string): boolean {
    const giveaway = this.giveaways.get(giveawayId);
    if (!giveaway) return false;

    const index = giveaway.entries.indexOf(userId);
    if (index > -1) {
      giveaway.entries.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  end(giveawayId: string, winnerIds: string[]) {
    const giveaway = this.giveaways.get(giveawayId);
    if (!giveaway) return;

    giveaway.ended = true;
    giveaway.winnerIds = winnerIds;
    this.saveData();
  }

  delete(giveawayId: string): boolean {
    const deleted = this.giveaways.delete(giveawayId);
    if (deleted) this.saveData();
    return deleted;
  }

  pickWinners(giveawayId: string): string[] {
    const giveaway = this.giveaways.get(giveawayId);
    if (!giveaway || giveaway.entries.length === 0) return [];

    const winners: string[] = [];
    const entries = [...giveaway.entries];

    for (let i = 0; i < Math.min(giveaway.winners, entries.length); i++) {
      const randomIndex = Math.floor(Math.random() * entries.length);
      winners.push(entries[randomIndex]);
      entries.splice(randomIndex, 1);
    }

    return winners;
  }

  migrateToGuild(fromGuildId: string, toGuildId: string): number {
    let migrated = 0;
    for (const [id, giveaway] of this.giveaways) {
      if (giveaway.guildId === fromGuildId) {
        giveaway.guildId = toGuildId;
        migrated++;
      }
    }
    if (migrated > 0) this.saveData();
    return migrated;
  }
}

export const giveawayManager = new GiveawayManager();
