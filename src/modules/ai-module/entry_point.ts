/**
 * AI Module - Enhanced AI chat with context memory
 * Supports: Groq (llama), Gemini (Google), OpenAI (gpt)
 */

import { Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { emojis } from '../../config/emojis';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { keyRotator } from '../../utils/aiKeyRotator';
import { aiUsageTracker } from '../../utils/aiUsageTracker';
import { getCustomEmoji } from '../../utils/customEmoji';

// Conversation memory (channel-based)
const conversationHistory = new Map<string, Array<{ role: string; content: string }>>();
const MAX_HISTORY = 10; // Keep last 10 messages per channel

// Available AI models (Updated for Groq 2026)
const AI_MODELS = {
  groq: {
    'openai/gpt-oss-20b': 'GPT-OSS 20B (Fastest, 1000 T/s)',
    'openai/gpt-oss-120b': 'GPT-OSS 120B (Smart, 500 T/s)',
    'llama-3.1-8b-instant': 'Llama 3.1 8B (Fast)',
  },
  gemini: {
    'gemini-2.0-flash-exp': 'Gemini 2.0 Flash (Latest)',
    'gemini-1.5-pro': 'Gemini 1.5 Pro (Advanced)',
    'gemini-1.5-flash': 'Gemini 1.5 Flash (Fast)',
  }
};

// System prompts (with auto language detection)
const SYSTEM_PROMPTS = {
  default: 'You are a helpful AI assistant in a Discord server. Automatically detect the language of the user\'s message and respond in the SAME language (Vietnamese or English). Be concise, friendly, and informative.',
  creative: 'You are a creative AI that thinks outside the box. Automatically detect the user\'s language and respond in the same language. Be imaginative and original.',
  professional: 'You are a professional AI assistant. Automatically detect the user\'s language and respond in the same language. Be formal, accurate, and detailed.',
  casual: 'You are a casual friend chatting in Discord. Automatically detect the user\'s language and respond in the same language. Be relaxed, use emojis, and keep it fun!',
  technical: 'You are a technical expert. Automatically detect the user\'s language and respond in the same language. Provide detailed, accurate technical information with examples.',
};

export default class AIModule {
  name = 'ai-module';
  description = 'Enhanced AI chat with memory and multiple models';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;
  groqClient: Groq | null = null;
  geminiAI: GoogleGenerativeAI | null = null;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
    this.initializeAI();
  }

  async initialize() {
    console.log('  🤖 AI Module initializing...');
    this.registerCommands();
    console.log(`  ${emojis.success} AI Module ready`);
  }

  private initializeAI() {
    // Initialize Groq
    const groqKey = keyRotator.getGroqKey();
    if (groqKey) {
      this.groqClient = new Groq({ apiKey: groqKey });
      console.log(`  ${emojis.success} Groq initialized`);
    } else {
      console.log(`  ${emojis.warning} No Groq keys available`);
    }

    // Initialize Gemini
    const geminiKey = keyRotator.getGeminiKey();
    if (geminiKey) {
      this.geminiAI = new GoogleGenerativeAI(geminiKey);
      console.log(`  ${emojis.success} Gemini initialized`);
    } else {
      console.log(`  ${emojis.warning} No Gemini keys available`);
    }
  }

  private registerCommands() {
    // /ai - Main chat command
    const aiCommand = {
      data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Chat with AI (with memory) / Trò chuyện với AI (có nhớ context)')
        .addStringOption(option =>
          option
            .setName('message')
            .setDescription('Your message / Tin nhắn của bạn')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('model')
            .setDescription('AI Model / Mô hình AI')
            .setRequired(false)
            .addChoices(
              { name: '⚡ GPT-OSS 20B (Fastest)', value: 'groq:openai/gpt-oss-20b' },
              { name: '🧠 GPT-OSS 120B (Smart)', value: 'groq:openai/gpt-oss-120b' },
              { name: '${emojis.rocket} Llama 3.1 8B (Quick)', value: 'groq:llama-3.1-8b-instant' },
              { name: '${emojis.rocket} Llama 3.1 8B (Fast)', value: 'groq:llama-3.1-8b-instant' },
              { name: '${emojis.sparkles} Gemini 2.0 Flash (New)', value: 'gemini:gemini-2.0-flash-exp' },
              { name: '💎 Gemini 1.5 Pro', value: 'gemini:gemini-1.5-pro' },
              { name: '⚡ Gemini 1.5 Flash', value: 'gemini:gemini-1.5-flash' }
            )
        )
        .addStringOption(option =>
          option
            .setName('style')
            .setDescription('Response style / Phong cách trả lời')
            .setRequired(false)
            .addChoices(
              { name: '📝 Default (Helpful)', value: 'default' },
              { name: '${emojis.art} Creative', value: 'creative' },
              { name: '💼 Professional', value: 'professional' },
              { name: '😄 Casual', value: 'casual' },
              { name: '${emojis.terminal} Technical', value: 'technical' }
            )
        )
        .addBooleanOption(option =>
          option
            .setName('clear_memory')
            .setDescription('Clear conversation history / Xóa lịch sử hội thoại')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await this.handleAIChat(interaction);
      }
    };

    // /ai-memory - View/manage conversation memory
    const memoryCommand = {
      data: new SlashCommandBuilder()
        .setName('ai-memory')
        .setDescription('View or clear AI conversation memory / Xem/xóa bộ nhớ hội thoại AI')
        .addSubcommand(subcommand =>
          subcommand
            .setName('view')
            .setDescription('View conversation history / Xem lịch sử')
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('clear')
            .setDescription('Clear conversation history / Xóa lịch sử')
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await this.handleMemoryCommand(interaction);
      }
    };

    // /ai-models - List available models
    const modelsCommand = {
      data: new SlashCommandBuilder()
        .setName('ai-models')
        .setDescription('List available AI models / Danh sách mô hình AI'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await this.handleModelsCommand(interaction);
      }
    };

    this.commands.set('ai', aiCommand);
    this.commands.set('ai-memory', memoryCommand);
    this.commands.set('ai-models', modelsCommand);
  }

  private async handleAIChat(interaction: ChatInputCommandInteraction) {
    // DEFER IMMEDIATELY to prevent timeout
    await interaction.deferReply();
    
    const message = interaction.options.getString('message', true);
    const modelOption = interaction.options.getString('model') || 'groq:openai/gpt-oss-20b';
    const style = interaction.options.getString('style') || 'default';
    const clearMemory = interaction.options.getBoolean('clear_memory') || false;

    try {
      const channelId = interaction.channelId;

      // Clear memory if requested
      if (clearMemory) {
        conversationHistory.delete(channelId);
        await interaction.editReply('🧹 Conversation memory cleared!');
        return;
      }

      // Check usage limits
      const canUse = await aiUsageTracker.canUse(interaction.user.id);
      if (!canUse) {
        const usage = aiUsageTracker.getUsage(interaction.user.id);
        const embed = new EmbedBuilder()
          .setColor(0xef4444)
          .setTitle(`${getCustomEmoji('ERROR')} Rate Limit`)
          .setDescription(`${emojis.clock} Bạn đã đạt giới hạn ${usage.limit} requests/ngày\n\n💎 Upgrade Premium để unlimited!`)
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Parse model
      const [provider, modelId] = modelOption.split(':');
      
      // Get or create conversation history
      if (!conversationHistory.has(channelId)) {
        conversationHistory.set(channelId, []);
      }
      const history = conversationHistory.get(channelId)!;

      // Add user message to history
      history.push({ role: 'user', content: message });

      // Keep only last MAX_HISTORY messages
      if (history.length > MAX_HISTORY * 2) {
        history.splice(0, history.length - MAX_HISTORY * 2);
      }

      // Generate response
      let response: string;
      if (provider === 'groq') {
        response = await this.chatWithGroq(modelId, style, history);
      } else if (provider === 'gemini') {
        response = await this.chatWithGemini(modelId, style, history);
      } else {
        throw new Error('Invalid model provider');
      }

      // Add AI response to history
      history.push({ role: 'assistant', content: response });

      // Track usage
      await aiUsageTracker.trackUsage(interaction.user.id);

      // Get model display name
      let modelDisplayName = modelId;
      if (provider === 'groq' && AI_MODELS.groq[modelId as keyof typeof AI_MODELS.groq]) {
        modelDisplayName = AI_MODELS.groq[modelId as keyof typeof AI_MODELS.groq];
      } else if (provider === 'gemini' && AI_MODELS.gemini[modelId as keyof typeof AI_MODELS.gemini]) {
        modelDisplayName = AI_MODELS.gemini[modelId as keyof typeof AI_MODELS.gemini];
      }
      
      // Simple text response (no embed)
      const header = `**${interaction.user.username}** asked:\n> ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}\n\n`;
      const footer = `\n\n*Model: ${modelDisplayName} • History: ${Math.floor(history.length / 2)} messages*`;
      
      const fullResponse = header + response + footer;
      
      // If response is too long, send as file
      if (fullResponse.length > 2000) {
        const attachment = new AttachmentBuilder(Buffer.from(response), { name: 'ai-response.txt' });
        await interaction.editReply({ 
          content: `${header}*Response too long, sent as file.*${footer}`,
          files: [attachment] 
        });
      } else {
        await interaction.editReply({ content: fullResponse });
      }

    } catch (error: any) {
      console.error('AI chat error:', error);
      
      await interaction.editReply({ 
        content: `${emojis.error} **AI Error:**\n${error.message || 'Unknown error'}\n\n*Try using a different model with \`model:\` option*` 
      });
    }
  }

  private async chatWithGroq(model: string, style: string, history: Array<{ role: string; content: string }>): Promise<string> {
    if (!this.groqClient) {
      throw new Error('Groq is not initialized');
    }

    const systemPrompt = SYSTEM_PROMPTS[style as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.default;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({ role: h.role as any, content: h.content }))
    ];

    try {
      const completion = await this.groqClient.chat.completions.create({
        model: model.replace('llama-', 'llama3-').replace('-70b', '-70b-versatile').replace('-8b', '-8b-instant'),
        messages: messages as any,
        temperature: style === 'creative' ? 1.2 : 0.7,
        max_tokens: 2000,
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error: any) {
      const groqKey = keyRotator.getGroqKey();
      if (groqKey) {
        keyRotator.markFailed('groq', groqKey, error);
      }
      throw error;
    }
  }

  private async chatWithGemini(model: string, style: string, history: Array<{ role: string; content: string }>): Promise<string> {
    if (!this.geminiAI) {
      throw new Error('Gemini is not initialized');
    }

    const systemPrompt = SYSTEM_PROMPTS[style as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.default;

    try {
      const geminiModel = this.geminiAI.getGenerativeModel({ model });
      
      // Convert history to Gemini format
      const chatHistory = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }));

      const chat = geminiModel.startChat({
        history: chatHistory.slice(0, -1), // Exclude last message (will be sent separately)
        generationConfig: {
          temperature: style === 'creative' ? 1.2 : 0.7,
          maxOutputTokens: 2000,
        },
      });

      const lastMessage = history[history.length - 1];
      const fullPrompt = `${systemPrompt}\n\nUser: ${lastMessage.content}`;
      
      const result = await chat.sendMessage(fullPrompt);
      const response = result.response.text();
      
      return response;
    } catch (error: any) {
      const geminiKey = keyRotator.getGeminiKey();
      if (geminiKey) {
        keyRotator.markFailed('gemini', geminiKey, error);
      }
      throw error;
    }
  }

  private async handleMemoryCommand(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const channelId = interaction.channelId;

    if (subcommand === 'view') {
      const history = conversationHistory.get(channelId);

      if (!history || history.length === 0) {
        const response = { content: '📭 No conversation history in this channel.', flags: 64 };
        if (interaction.deferred) {
          await interaction.editReply(response);
        } else {
          await interaction.reply(response);
        }
        return;
      }

      // Plain text format instead of embed
      const historyText = history
        .map((msg, i) => {
          const preview = msg.content.substring(0, 150);
          const truncated = msg.content.length > 150 ? '...' : '';
          return `**${i + 1}. ${msg.role === 'user' ? '${emojis.user} User' : '🤖 AI'}:**\n${preview}${truncated}`;
        })
        .join('\n\n');

      const fullText = `💭 **Conversation Memory**\n\n${historyText}\n\n*${history.length} messages stored • Use \`/ai-memory clear\` to reset*`;
      
      const response = { content: fullText.substring(0, 2000), flags: 64 };
      if (interaction.deferred) {
        await interaction.editReply(response);
      } else {
        await interaction.reply(response);
      }
    } 
    else if (subcommand === 'clear') {
      conversationHistory.delete(channelId);
      const response = { content: '🧹 Conversation memory cleared!', flags: 64 };
      if (interaction.deferred) {
        await interaction.editReply(response);
      } else {
        await interaction.reply(response);
      }
    }
  }

  private async handleModelsCommand(interaction: ChatInputCommandInteraction) {
    const keyStatus = keyRotator.getStatus();

    // Plain text format instead of embed
    const groqModels = Object.entries(AI_MODELS.groq)
      .map(([key, name]) => `• \`${key}\`\n  ${name}`)
      .join('\n');
      
    const geminiModels = Object.entries(AI_MODELS.gemini)
      .map(([key, name]) => `• \`${key}\`\n  ${name}`)
      .join('\n');

    const text = `🤖 **Available AI Models**\n\n` +
      `**⚡ Groq Models** (${keyStatus.groq.active}/${keyStatus.groq.total} keys active)\n${groqModels}\n\n` +
      `**${emojis.sparkles} Gemini Models** (${keyStatus.gemini.active}/${keyStatus.gemini.total} keys active)\n${geminiModels}\n\n` +
      `*Use: \`/ai message:... model:<name>\`*\n` +
      `*Keys rotate automatically on failure*`;

    const response = { content: text };
    if (interaction.deferred) {
      await interaction.editReply(response);
    } else {
      await interaction.reply(response);
    }
  }

  async shutdown() {
    console.log('  🛑 AI Module shutting down...');
    conversationHistory.clear();
  }
}

// Named export for module loader
export { AIModule };
