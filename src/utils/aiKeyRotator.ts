/**
 * AI API Key Rotation System
 * Automatically switches between multiple API keys when one fails or hits rate limit
 */

interface KeyConfig {
  key: string;
  failCount: number;
  lastFail: number;
  blocked: boolean;
}

class AIKeyRotator {
  private groqKeys: KeyConfig[] = [];
  private geminiKeys: KeyConfig[] = [];
  private currentGroqIndex = 0;
  private currentGeminiIndex = 0;
  
  constructor() {
    this.loadKeysFromEnv();
  }
  
  /**
   * Load all API keys from environment variables
   * Format: GROQ_API_KEY_1, GROQ_API_KEY_2, etc. OR GROQ_API_KEYS (comma-separated)
   */
  private loadKeysFromEnv() {
    // Load Groq keys from GROQ_API_KEYS (comma-separated) first
    if (process.env.GROQ_API_KEYS) {
      const keys = process.env.GROQ_API_KEYS.split(',').map(k => k.trim()).filter(Boolean);
      for (const key of keys) {
        this.groqKeys.push({
          key,
          failCount: 0,
          lastFail: 0,
          blocked: false
        });
      }
    } else {
      // Fallback: Load individual keys GROQ_API_KEY, GROQ_API_KEY_2, etc.
      let i = 1;
      while (true) {
        const key = process.env[`GROQ_API_KEY${i === 1 ? '' : `_${i}`}`];
        if (!key) break;
        
        this.groqKeys.push({
          key,
          failCount: 0,
          lastFail: 0,
          blocked: false
        });
        i++;
      }
    }
    
    // Load Gemini keys from GEMINI_API_KEYS (comma-separated) first
    if (process.env.GEMINI_API_KEYS) {
      const keys = process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(Boolean);
      for (const key of keys) {
        this.geminiKeys.push({
          key,
          failCount: 0,
          lastFail: 0,
          blocked: false
        });
      }
    } else if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      // Fallback: single key from GEMINI_API_KEY or GOOGLE_API_KEY
      const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (key) {
        this.geminiKeys.push({
          key,
          failCount: 0,
          lastFail: 0,
          blocked: false
        });
      }
    } else {
      // Fallback: Load individual keys GOOGLE_API_KEY, GOOGLE_API_KEY_2, etc.
      let i = 1;
      while (true) {
        const key = process.env[`GOOGLE_API_KEY${i === 1 ? '' : `_${i}`}`];
        if (!key) break;
        
        this.geminiKeys.push({
          key,
          failCount: 0,
          lastFail: 0,
          blocked: false
        });
        i++;
      }
    }
    
    console.log(`🔑 Loaded ${this.groqKeys.length} Groq key(s), ${this.geminiKeys.length} Gemini key(s)`);
  }
  
  /**
   * Get current active Groq API key
   */
  getGroqKey(): string | null {
    if (this.groqKeys.length === 0) return null;
    
    // Unblock keys that failed more than 5 minutes ago
    this.unblockOldFailures('groq');
    
    // Find first non-blocked key
    for (let i = 0; i < this.groqKeys.length; i++) {
      const index = (this.currentGroqIndex + i) % this.groqKeys.length;
      if (!this.groqKeys[index].blocked) {
        this.currentGroqIndex = index;
        return this.groqKeys[index].key;
      }
    }
    
    // All keys blocked, use least-recently-failed
    const leastRecentFail = this.groqKeys.reduce((prev, curr) => 
      curr.lastFail < prev.lastFail ? curr : prev
    );
    return leastRecentFail.key;
  }
  
  /**
   * Get current active Gemini API key
   */
  getGeminiKey(): string | null {
    if (this.geminiKeys.length === 0) return null;
    
    this.unblockOldFailures('gemini');
    
    for (let i = 0; i < this.geminiKeys.length; i++) {
      const index = (this.currentGeminiIndex + i) % this.geminiKeys.length;
      if (!this.geminiKeys[index].blocked) {
        this.currentGeminiIndex = index;
        return this.geminiKeys[index].key;
      }
    }
    
    const leastRecentFail = this.geminiKeys.reduce((prev, curr) => 
      curr.lastFail < prev.lastFail ? curr : prev
    );
    return leastRecentFail.key;
  }
  
  /**
   * Mark a key as failed and rotate to next
   */
  markFailed(provider: 'groq' | 'gemini', key: string, error: any) {
    const keys = provider === 'groq' ? this.groqKeys : this.geminiKeys;
    const keyConfig = keys.find(k => k.key === key);
    
    if (!keyConfig) return;
    
    keyConfig.failCount++;
    keyConfig.lastFail = Date.now();
    
    // Block key if rate limit or quota exceeded
    const errorMsg = error?.message || error?.toString() || '';
    if (
      errorMsg.includes('rate_limit') ||
      errorMsg.includes('quota') ||
      errorMsg.includes('429') ||
      keyConfig.failCount >= 3
    ) {
      keyConfig.blocked = true;
      console.warn(`⚠️ ${provider.toUpperCase()} key blocked (fail count: ${keyConfig.failCount})`);
      
      // Rotate to next key
      if (provider === 'groq') {
        this.currentGroqIndex = (this.currentGroqIndex + 1) % this.groqKeys.length;
        console.log(`🔄 Rotated to Groq key #${this.currentGroqIndex + 1}`);
      } else {
        this.currentGeminiIndex = (this.currentGeminiIndex + 1) % this.geminiKeys.length;
        console.log(`🔄 Rotated to Gemini key #${this.currentGeminiIndex + 1}`);
      }
    }
  }
  
  /**
   * Unblock keys that failed more than 5 minutes ago
   */
  private unblockOldFailures(provider: 'groq' | 'gemini') {
    const keys = provider === 'groq' ? this.groqKeys : this.geminiKeys;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    for (const keyConfig of keys) {
      if (keyConfig.blocked && keyConfig.lastFail < fiveMinutesAgo) {
        keyConfig.blocked = false;
        keyConfig.failCount = 0;
        console.log(`✅ ${provider.toUpperCase()} key unblocked after cooldown`);
      }
    }
  }
  
  /**
   * Get status of all keys
   */
  getStatus() {
    return {
      groq: {
        total: this.groqKeys.length,
        active: this.groqKeys.filter(k => !k.blocked).length,
        current: this.currentGroqIndex + 1
      },
      gemini: {
        total: this.geminiKeys.length,
        active: this.geminiKeys.filter(k => !k.blocked).length,
        current: this.currentGeminiIndex + 1
      }
    };
  }
  
  /**
   * Auto-generate new key when all keys are blocked (experimental)
   */
  async autoGenerateKey(provider: 'groq' | 'gemini'): Promise<boolean> {
    console.log(`🤖 Attempting to auto-generate new ${provider.toUpperCase()} key...`);
    
    try {
      const { keyGenerator } = await import('./aiKeyGenerator.js');
      const success = await keyGenerator.generateKeyWhenNeeded(provider);
      
      if (success) {
        // Reload keys from environment
        this.groqKeys = [];
        this.geminiKeys = [];
        this.loadKeysFromEnv();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Auto-generation failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const keyRotator = new AIKeyRotator();
