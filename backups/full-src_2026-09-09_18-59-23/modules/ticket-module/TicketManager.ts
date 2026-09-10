// Ticket Manager - Handle ticket data and operations
import { loadJsonDb, saveJsonDb } from '../../utils/jsonDb';
import path from 'path';

export interface TicketConfig {
  guildId: string;
  categoryId?: string; // Category where ticket channels are created
  staffRoleId?: string; // Role that can see all tickets
  logChannelId?: string; // Channel for transcripts
  ticketMessageChannelId?: string; // Channel with create ticket button
  ticketMessageId?: string; // Message with create ticket button
  enabled: boolean;
}

export interface Ticket {
  ticketId: string; // Unique ticket ID (e.g., "ticket-0001")
  channelId: string; // Discord channel ID
  userId: string; // User who created the ticket
  guildId: string;
  createdAt: number;
  closedAt?: number;
  closedBy?: string;
  topic?: string; // Ticket topic/reason
  status: 'open' | 'closed';
  participants: string[]; // User IDs with access
}

class TicketManager {
  private configs: Map<string, TicketConfig> = new Map();
  private tickets: Map<string, Ticket> = new Map(); // channelId -> Ticket
  private ticketCounters: Map<string, number> = new Map(); // guildId -> counter
  private dataPath = path.resolve(__dirname, '../../../data/tickets.json');

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const data = loadJsonDb(this.dataPath);
      
      if (data.configs) {
        for (const config of data.configs) {
          this.configs.set(config.guildId, config);
        }
      }
      
      if (data.tickets) {
        for (const ticket of data.tickets) {
          this.tickets.set(ticket.channelId, ticket);
        }
      }
      
      if (data.counters) {
        for (const [guildId, count] of Object.entries(data.counters)) {
          this.ticketCounters.set(guildId, count as number);
        }
      }
      
      console.log(`✅ Loaded ${this.configs.size} ticket configs, ${this.tickets.size} tickets`);
    } catch (error) {
      console.log('⚠️ No existing ticket data found, starting fresh');
    }
  }

  private saveData() {
    const data = {
      configs: Array.from(this.configs.values()),
      tickets: Array.from(this.tickets.values()),
      counters: Object.fromEntries(this.ticketCounters)
    };
    saveJsonDb(this.dataPath, data);
  }

  // ===== CONFIG MANAGEMENT =====

  getConfig(guildId: string): TicketConfig | null {
    return this.configs.get(guildId) || null;
  }

  updateConfig(guildId: string, updates: Partial<TicketConfig>) {
    const existing = this.configs.get(guildId);
    const config: TicketConfig = {
      ...existing,
      guildId,
      enabled: true,
      ...updates
    };
    this.configs.set(guildId, config);
    this.saveData();
    return config;
  }

  // ===== TICKET MANAGEMENT =====

  private generateTicketId(guildId: string): string {
    const counter = (this.ticketCounters.get(guildId) || 0) + 1;
    this.ticketCounters.set(guildId, counter);
    return `ticket-${counter.toString().padStart(4, '0')}`;
  }

  createTicket(
    guildId: string,
    channelId: string,
    userId: string,
    topic?: string
  ): Ticket {
    const ticketId = this.generateTicketId(guildId);
    
    const ticket: Ticket = {
      ticketId,
      channelId,
      userId,
      guildId,
      createdAt: Date.now(),
      status: 'open',
      topic,
      participants: [userId]
    };
    
    this.tickets.set(channelId, ticket);
    this.saveData();
    return ticket;
  }

  getTicket(channelId: string): Ticket | null {
    return this.tickets.get(channelId) || null;
  }

  getTicketByUser(guildId: string, userId: string): Ticket | null {
    return Array.from(this.tickets.values()).find(
      t => t.guildId === guildId && t.userId === userId && t.status === 'open'
    ) || null;
  }

  getAllTickets(guildId: string, status?: 'open' | 'closed'): Ticket[] {
    return Array.from(this.tickets.values()).filter(
      t => t.guildId === guildId && (!status || t.status === status)
    );
  }

  closeTicket(channelId: string, closedBy: string): Ticket | null {
    const ticket = this.tickets.get(channelId);
    if (!ticket) return null;
    
    ticket.status = 'closed';
    ticket.closedAt = Date.now();
    ticket.closedBy = closedBy;
    
    this.saveData();
    return ticket;
  }

  deleteTicket(channelId: string): boolean {
    const deleted = this.tickets.delete(channelId);
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }

  addParticipant(channelId: string, userId: string): boolean {
    const ticket = this.tickets.get(channelId);
    if (!ticket || ticket.participants.includes(userId)) return false;
    
    ticket.participants.push(userId);
    this.saveData();
    return true;
  }

  removeParticipant(channelId: string, userId: string): boolean {
    const ticket = this.tickets.get(channelId);
    if (!ticket) return false;
    
    const index = ticket.participants.indexOf(userId);
    if (index === -1) return false;
    
    ticket.participants.splice(index, 1);
    this.saveData();
    return true;
  }

  // ===== STATS =====

  getStats(guildId: string) {
    const allTickets = this.getAllTickets(guildId);
    const openTickets = allTickets.filter(t => t.status === 'open');
    const closedTickets = allTickets.filter(t => t.status === 'closed');
    
    return {
      total: allTickets.length,
      open: openTickets.length,
      closed: closedTickets.length
    };
  }

  // Reset ticket counter for a guild (for setup reset)
  resetCounter(guildId: string) {
    this.ticketCounters.set(guildId, 0);
    this.saveData();
  }
}

export const ticketManager = new TicketManager();
