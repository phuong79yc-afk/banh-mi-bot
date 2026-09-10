// Conversation Manager - AI Chat Context & Memory
import fs from 'fs';
import path from 'path';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  userId: string;
  guildId: string;
  messages: Message[];
  lastActivity: number;
  model: string;
}

export interface ConversationConfig {
  maxHistory: number;
  contextTimeout: number; // minutes
  systemPrompt: string;
  autoReplyOnMention: boolean;
  allowedChannels: string[];
  blacklistedUsers: string[];
}

class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();
  private config: ConversationConfig;
  private configPath = './data/conversation-config.json';
  private conversationsPath = './data/conversations.json';

  constructor() {
    this.config = this.loadConfig();
    this.loadConversations();
    
    // Auto-cleanup old conversations every 30 minutes
    setInterval(() => this.cleanup(), 30 * 60 * 1000);
  }

  private loadConfig(): ConversationConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('Using default conversation config');
    }

    // Default config
    const defaultConfig: ConversationConfig = {
      maxHistory: 20,
      contextTimeout: 30,
      systemPrompt: 'You are a helpful Discord bot assistant. You communicate in a friendly and professional manner. You can speak both English and Vietnamese.',
      autoReplyOnMention: true,
      allowedChannels: [],
      blacklistedUsers: []
    };

    this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  private saveConfig(config?: ConversationConfig) {
    const configToSave = config || this.config;
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2));
  }

  private loadConversations() {
    try {
      if (fs.existsSync(this.conversationsPath)) {
        const data = fs.readFileSync(this.conversationsPath, 'utf8');
        const conversations = JSON.parse(data);
        
        for (const [key, conv] of Object.entries(conversations)) {
          this.conversations.set(key, conv as Conversation);
        }
        
        console.log(`✅ Loaded ${this.conversations.size} conversation(s)`);
      }
    } catch (error) {
      console.log('No existing conversations to load');
    }
  }

  private saveConversations() {
    try {
      const dir = path.dirname(this.conversationsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = Object.fromEntries(this.conversations.entries());
      fs.writeFileSync(this.conversationsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  private getConversationKey(userId: string, guildId: string): string {
    return `${guildId}-${userId}`;
  }

  getConversation(userId: string, guildId: string): Conversation | undefined {
    const key = this.getConversationKey(userId, guildId);
    const conv = this.conversations.get(key);

    if (conv) {
      // Check if conversation expired
      const now = Date.now();
      const timeout = this.config.contextTimeout * 60 * 1000;
      
      if (now - conv.lastActivity > timeout) {
        console.log(`Conversation expired for ${userId}`);
        this.conversations.delete(key);
        return undefined;
      }
    }

    return conv;
  }

  createOrUpdateConversation(
    userId: string,
    guildId: string,
    userMessage: string,
    assistantMessage: string,
    model: string = 'groq'
  ): Conversation {
    const key = this.getConversationKey(userId, guildId);
    let conv = this.conversations.get(key);

    const now = Date.now();

    if (!conv) {
      // Create new conversation with system prompt
      conv = {
        userId,
        guildId,
        messages: [
          {
            role: 'system',
            content: this.config.systemPrompt,
            timestamp: now
          }
        ],
        lastActivity: now,
        model
      };
    }

    // Add user message
    conv.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: now
    });

    // Add assistant response
    conv.messages.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: now
    });

    // Trim history if too long (keep system prompt + last N messages)
    if (conv.messages.length > this.config.maxHistory + 1) {
      conv.messages = [
        conv.messages[0], // Keep system prompt
        ...conv.messages.slice(-(this.config.maxHistory))
      ];
    }

    conv.lastActivity = now;
    this.conversations.set(key, conv);
    
    // Save periodically (every 5 messages)
    if (conv.messages.length % 5 === 0) {
      this.saveConversations();
    }

    return conv;
  }

  getContext(userId: string, guildId: string): Message[] {
    const conv = this.getConversation(userId, guildId);
    return conv ? conv.messages : [
      {
        role: 'system',
        content: this.config.systemPrompt,
        timestamp: Date.now()
      }
    ];
  }

  clearConversation(userId: string, guildId: string): boolean {
    const key = this.getConversationKey(userId, guildId);
    const deleted = this.conversations.delete(key);
    
    if (deleted) {
      this.saveConversations();
    }
    
    return deleted;
  }

  clearAllConversations(guildId?: string): number {
    let count = 0;
    
    if (guildId) {
      // Clear all conversations in a specific guild
      for (const [key, conv] of this.conversations.entries()) {
        if (conv.guildId === guildId) {
          this.conversations.delete(key);
          count++;
        }
      }
    } else {
      // Clear all conversations
      count = this.conversations.size;
      this.conversations.clear();
    }

    this.saveConversations();
    return count;
  }

  private cleanup() {
    const now = Date.now();
    const timeout = this.config.contextTimeout * 60 * 1000;
    let cleaned = 0;

    for (const [key, conv] of this.conversations.entries()) {
      if (now - conv.lastActivity > timeout) {
        this.conversations.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired conversation(s)`);
      this.saveConversations();
    }
  }

  getConfig(): ConversationConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ConversationConfig>) {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  getStats(guildId?: string): {
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
  } {
    let conversations = Array.from(this.conversations.values());
    
    if (guildId) {
      conversations = conversations.filter(c => c.guildId === guildId);
    }

    const now = Date.now();
    const timeout = this.config.contextTimeout * 60 * 1000;
    const activeConversations = conversations.filter(
      c => now - c.lastActivity <= timeout
    ).length;

    const totalMessages = conversations.reduce(
      (sum, conv) => sum + conv.messages.length,
      0
    );

    return {
      totalConversations: conversations.length,
      activeConversations,
      totalMessages
    };
  }

  isUserBlacklisted(userId: string): boolean {
    return this.config.blacklistedUsers.includes(userId);
  }

  isChannelAllowed(channelId: string): boolean {
    if (this.config.allowedChannels.length === 0) {
      return true; // All channels allowed if list is empty
    }
    return this.config.allowedChannels.includes(channelId);
  }
}

export const conversationManager = new ConversationManager();
