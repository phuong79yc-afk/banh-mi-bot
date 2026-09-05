#!/usr/bin/env tsx
/**
 * CLI tool to auto-generate API keys
 * Usage: npm run generate-key groq
 */

import { keyGenerator } from '../src/utils/aiKeyGenerator.js';

const provider = process.argv[2] as 'groq' | 'gemini';

if (!provider || !['groq', 'gemini'].includes(provider)) {
  console.log(`
🤖 AI API Key Auto-Generator

Usage:
  npm run generate-key groq     # Generate Groq API key
  npm run generate-key gemini   # Generate Gemini API key

What it does:
  1. Creates temporary email
  2. Signs up for ${provider || 'API'} account
  3. Verifies email
  4. Generates API key
  5. Adds to .env automatically

⚠️ Note: This is experimental and may not work due to:
  - Captcha challenges
  - Rate limiting
  - Service changes
  
Recommended: Manually create keys (faster & more reliable)
  - Groq: https://console.groq.com
  - Gemini: https://makersuite.google.com/app/apikey
  `);
  process.exit(1);
}

console.log(`\n🤖 Starting auto-generation for ${provider.toUpperCase()}...\n`);
console.log('⏱️ This may take 30-60 seconds...\n');

keyGenerator.generateKeyWhenNeeded(provider)
  .then(success => {
    if (success) {
      console.log('\n✅ Success! New API key added to .env');
      console.log('🔄 Restart your bot to use the new key');
      process.exit(0);
    } else {
      console.log('\n❌ Failed to generate key automatically');
      console.log('\n💡 Manual alternative:');
      
      if (provider === 'groq') {
        console.log('  1. Visit: https://console.groq.com');
        console.log('  2. Sign up (free)');
        console.log('  3. Create API Key');
        console.log('  4. Add to .env: GROQ_API_KEY=gsk_...');
      } else {
        console.log('  1. Visit: https://makersuite.google.com/app/apikey');
        console.log('  2. Sign in with Google');
        console.log('  3. Create API Key');
        console.log('  4. Add to .env: GOOGLE_API_KEY=AIzaSy...');
      }
      
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Please create API key manually (see above)');
    process.exit(1);
  });
