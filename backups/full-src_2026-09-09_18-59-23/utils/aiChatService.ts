// AI Chat Service - Handles AI API calls with context
import Groq from 'groq-sdk';
import { conversationManager, Message } from './conversationManager';

interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
  model?: string;
  tokensUsed?: number;
}

class AIChatService {
  private groqClients: Groq[] = [];
  private currentGroqIndex = 0;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Load Groq API keys
    const groqKeys = process.env.GROQ_API_KEYS?.split(',') || [];
    
    if (groqKeys.length === 0) {
      console.warn('⚠️ No GROQ_API_KEYS found for AI chat');
      return;
    }

    this.groqClients = groqKeys.map(key => new Groq({ apiKey: key.trim() }));
    console.log(`✅ AI Chat Service initialized with ${this.groqClients.length} Groq key(s)`);
  }

  private getNextGroqClient(): Groq | null {
    if (this.groqClients.length === 0) return null;
    
    const client = this.groqClients[this.currentGroqIndex];
    this.currentGroqIndex = (this.currentGroqIndex + 1) % this.groqClients.length;
    
    return client;
  }

  async chat(
    userId: string,
    guildId: string,
    userMessage: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<ChatResponse> {
    try {
      const {
        model = 'openai/gpt-oss-20b', // Fastest model (1000 T/s)
        temperature = 0.7,
        maxTokens = 1024
      } = options;

      // Get conversation context
      const context = conversationManager.getContext(userId, guildId);

      // Add current user message to context
      const messages = [
        ...context,
        {
          role: 'user' as const,
          content: userMessage,
          timestamp: Date.now()
        }
      ];

      // Call Groq API
      const groqClient = this.getNextGroqClient();
      
      if (!groqClient) {
        return {
          success: false,
          error: 'No AI API keys configured'
        };
      }

      const completion = await groqClient.chat.completions.create({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature,
        max_tokens: maxTokens,
        top_p: 1,
        stream: false
      });

      const assistantMessage = completion.choices[0]?.message?.content || 'No response';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Update conversation history
      conversationManager.createOrUpdateConversation(
        userId,
        guildId,
        userMessage,
        assistantMessage,
        model
      );

      return {
        success: true,
        message: assistantMessage,
        model,
        tokensUsed
      };

    } catch (error: any) {
      console.error('AI Chat error:', error);
      
      // Handle rate limits
      if (error.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again in a moment.'
        };
      }

      // Handle API errors
      if (error.status === 401) {
        return {
          success: false,
          error: 'Invalid API key configuration'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to generate response'
      };
    }
  }

  async chatStream(
    userId: string,
    guildId: string,
    userMessage: string,
    onChunk: (chunk: string) => void,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<ChatResponse> {
    try {
      const {
        model = 'openai/gpt-oss-20b', // Fastest model (1000 T/s)
        temperature = 0.7,
        maxTokens = 1024
      } = options;

      const context = conversationManager.getContext(userId, guildId);
      const messages = [
        ...context,
        {
          role: 'user' as const,
          content: userMessage,
          timestamp: Date.now()
        }
      ];

      const groqClient = this.getNextGroqClient();
      
      if (!groqClient) {
        return {
          success: false,
          error: 'No AI API keys configured'
        };
      }

      const stream = await groqClient.chat.completions.create({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature,
        max_tokens: maxTokens,
        stream: true
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      // Update conversation history
      conversationManager.createOrUpdateConversation(
        userId,
        guildId,
        userMessage,
        fullResponse,
        model
      );

      return {
        success: true,
        message: fullResponse,
        model
      };

    } catch (error: any) {
      console.error('AI Chat stream error:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to generate response'
      };
    }
  }

  getAvailableModels(): string[] {
    return [
      'openai/gpt-oss-20b', // Fastest (1000 T/s) - default
      'llama-3.1-8b-instant', // Fast and still available
      'llama3-groq-70b-8192-tool-use-preview',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
    ];
  }

  isAvailable(): boolean {
    return this.groqClients.length > 0;
  }
}

export const aiChatService = new AIChatService();
