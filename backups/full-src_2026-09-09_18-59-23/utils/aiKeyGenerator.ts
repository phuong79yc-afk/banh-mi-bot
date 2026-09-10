/**
 * AI API Key Auto-Generator
 * Automatically generates new API keys when needed using temporary emails
 */

import fetch from 'node-fetch';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

interface TempEmail {
  email: string;
  token: string;
}

class AIKeyGenerator {
  private tempMailAPI = 'https://api.mail.tm'; // Free temp email API
  
  /**
   * Generate a new temporary email address
   */
  async createTempEmail(): Promise<TempEmail> {
    try {
      // Get available domains
      const domainsRes = await fetch(`${this.tempMailAPI}/domains`);
      const domains = await domainsRes.json() as any[];
      const domain = domains[0]?.['hydra:member']?.[0]?.domain || 'mail.tm';
      
      // Generate random email
      const randomName = `aibot_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const email = `${randomName}@${domain}`;
      const password = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      
      // Create account
      await fetch(`${this.tempMailAPI}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: email, password })
      });
      
      // Get auth token
      const loginRes = await fetch(`${this.tempMailAPI}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: email, password })
      });
      
      const { token } = await loginRes.json() as any;
      
      console.log(`✅ Created temp email: ${email}`);
      return { email, token };
      
    } catch (error) {
      console.error('❌ Failed to create temp email:', error);
      throw error;
    }
  }
  
  /**
   * Read emails from temp inbox
   */
  async readEmails(token: string): Promise<any[]> {
    try {
      const res = await fetch(`${this.tempMailAPI}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json() as any;
      return data['hydra:member'] || [];
    } catch (error) {
      console.error('❌ Failed to read emails:', error);
      return [];
    }
  }
  
  /**
   * Auto-generate Groq API key (using Puppeteer for automation)
   */
  async generateGroqKey(): Promise<string | null> {
    console.log('🤖 Attempting to auto-generate Groq API key...');
    
    try {
      // Import puppeteer dynamically
      const puppeteer = await import('puppeteer');
      
      // Create temp email
      const tempEmail = await this.createTempEmail();
      
      // Launch browser
      const browser = await puppeteer.default.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      // Go to Groq signup
      await page.goto('https://console.groq.com/signup', { waitUntil: 'networkidle0' });
      
      // Fill signup form
      await page.type('input[type="email"]', tempEmail.email);
      await page.type('input[type="password"]', 'TempPassword123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for email verification
      console.log('📧 Waiting for verification email...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
      
      // Check emails
      const emails = await this.readEmails(tempEmail.token);
      const verificationEmail = emails.find(e => e.subject?.includes('verify') || e.subject?.includes('Groq'));
      
      if (!verificationEmail) {
        throw new Error('Verification email not received');
      }
      
      // Extract verification link
      const emailContent = verificationEmail.html || verificationEmail.text;
      const verifyLinkMatch = emailContent.match(/https:\/\/console\.groq\.com\/verify\/[^\s"<>]+/);
      
      if (!verifyLinkMatch) {
        throw new Error('Verification link not found in email');
      }
      
      // Click verification link
      await page.goto(verifyLinkMatch[0], { waitUntil: 'networkidle0' });
      
      // Navigate to API keys
      await page.goto('https://console.groq.com/keys', { waitUntil: 'networkidle0' });
      
      // Create API key
      await page.click('button:has-text("Create API Key")');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get API key from page
      const apiKey = await page.evaluate(() => {
        const keyElement = (globalThis as any).document.querySelector('[data-testid="api-key"]');
        return keyElement?.textContent || null;
      });
      
      await browser.close();
      
      if (apiKey) {
        console.log('✅ Successfully generated Groq API key!');
        return apiKey;
      } else {
        throw new Error('Failed to extract API key');
      }
      
    } catch (error) {
      console.error('❌ Auto-generation failed:', error);
      return null;
    }
  }
  
  /**
   * Auto-generate Google Gemini API key
   */
  async generateGeminiKey(): Promise<string | null> {
    console.log('🤖 Attempting to auto-generate Gemini API key...');
    
    try {
      // Similar process for Gemini
      // Note: This is more complex as Google requires phone verification
      console.warn('⚠️ Gemini auto-generation requires phone verification - not fully automated');
      return null;
      
    } catch (error) {
      console.error('❌ Gemini auto-generation failed:', error);
      return null;
    }
  }
  
  /**
   * Add new API key to .env file
   */
  async addKeyToEnv(provider: 'groq' | 'gemini', apiKey: string) {
    try {
      const envPath = join(process.cwd(), '.env');
      let envContent = readFileSync(envPath, 'utf-8');
      
      // Find next available key number
      const regex = provider === 'groq' 
        ? /GROQ_API_KEY(_\d+)?=/g
        : /GOOGLE_API_KEY(_\d+)?=/g;
      
      const matches = envContent.match(regex);
      const nextNum = matches ? matches.length + 1 : 1;
      
      const keyName = provider === 'groq'
        ? nextNum === 1 ? 'GROQ_API_KEY' : `GROQ_API_KEY_${nextNum}`
        : nextNum === 1 ? 'GOOGLE_API_KEY' : `GOOGLE_API_KEY_${nextNum}`;
      
      // Add key to .env
      if (!envContent.endsWith('\n')) envContent += '\n';
      envContent += `\n# Auto-generated on ${new Date().toISOString()}\n`;
      envContent += `${keyName}=${apiKey}\n`;
      
      writeFileSync(envPath, envContent);
      console.log(`✅ Added ${keyName} to .env`);
      
    } catch (error) {
      console.error('❌ Failed to add key to .env:', error);
      throw error;
    }
  }
  
  /**
   * Main function: Auto-generate key when needed
   */
  async generateKeyWhenNeeded(provider: 'groq' | 'gemini'): Promise<boolean> {
    console.log(`🤖 Starting auto-generation for ${provider.toUpperCase()}...`);
    
    let newKey: string | null = null;
    
    if (provider === 'groq') {
      newKey = await this.generateGroqKey();
    } else {
      newKey = await this.generateGeminiKey();
    }
    
    if (newKey) {
      await this.addKeyToEnv(provider, newKey);
      console.log(`✅ Successfully generated and added new ${provider.toUpperCase()} key!`);
      
      // Reload environment variables
      require('dotenv').config();
      
      return true;
    }
    
    return false;
  }
}

export const keyGenerator = new AIKeyGenerator();

// CLI usage
if (require.main === module) {
  const provider = process.argv[2] as 'groq' | 'gemini';
  
  if (!provider || !['groq', 'gemini'].includes(provider)) {
    console.log('Usage: tsx src/utils/aiKeyGenerator.ts [groq|gemini]');
    process.exit(1);
  }
  
  keyGenerator.generateKeyWhenNeeded(provider)
    .then(success => {
      if (success) {
        console.log('✅ Done!');
        process.exit(0);
      } else {
        console.log('❌ Failed to generate key');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
