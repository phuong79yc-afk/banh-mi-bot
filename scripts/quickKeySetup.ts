#!/usr/bin/env tsx
/**
 * Quick Multi-Key Setup Tool
 * Opens browsers to help you create multiple API keys quickly
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     🚀 Quick Multi-Key Setup Tool                        ║
║     Tạo nhiều API keys nhanh chóng!                      ║
╚══════════════════════════════════════════════════════════╝

Công cụ này sẽ giúp bạn:
  1. Mở browser đến trang signup
  2. Bạn tạo account và lấy API key
  3. Tool tự động thêm vào .env

⏱️  Thời gian: ~2 phút per key
🎯 Khuyến nghị: Tạo 2-3 keys
  `);

  const provider = await question('Chọn provider (groq/gemini): ');
  
  if (provider !== 'groq' && provider !== 'gemini') {
    console.log('❌ Invalid provider. Use "groq" or "gemini"');
    rl.close();
    return;
  }

  const count = await question('Số lượng keys muốn tạo (1-5): ');
  const keyCount = parseInt(count);
  
  if (isNaN(keyCount) || keyCount < 1 || keyCount > 5) {
    console.log('❌ Invalid count. Use 1-5');
    rl.close();
    return;
  }

  console.log(`\n🎯 Sẽ tạo ${keyCount} ${provider.toUpperCase()} key(s)\n`);

  const keys: string[] = [];

  for (let i = 0; i < keyCount; i++) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 KEY ${i + 1}/${keyCount}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (provider === 'groq') {
      console.log('🌐 Opening Groq Console...');
      console.log('');
      console.log('📋 Steps:');
      console.log('  1. Sign up with a new email');
      console.log('  2. Verify your email');
      console.log('  3. Go to API Keys → Create API Key');
      console.log('  4. Copy the key');
      console.log('');
      
      // Open browser
      openBrowser('https://console.groq.com/keys');
    } else {
      console.log('🌐 Opening Google AI Studio...');
      console.log('');
      console.log('📋 Steps:');
      console.log('  1. Sign in with Google account');
      console.log('  2. Click "Get API Key"');
      console.log('  3. Create API Key');
      console.log('  4. Copy the key');
      console.log('');
      
      // Open browser
      openBrowser('https://makersuite.google.com/app/apikey');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const key = await question('\n🔑 Paste API key here (or "skip" to skip): ');
    
    if (key.toLowerCase() === 'skip') {
      console.log('⏭️  Skipped');
      continue;
    }

    if (key.length < 20) {
      console.log('⚠️  Key looks invalid, but will add anyway');
    }

    keys.push(key.trim());
    console.log(`✅ Key ${i + 1} saved!`);
  }

  if (keys.length === 0) {
    console.log('\n❌ No keys added. Exiting...');
    rl.close();
    return;
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`💾 Saving ${keys.length} key(s) to .env...`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  try {
    const envPath = join(process.cwd(), '.env');
    let envContent = readFileSync(envPath, 'utf-8');

    // Check existing keys
    const keyPrefix = provider === 'groq' ? 'GROQ_API_KEY' : 'GOOGLE_API_KEY';
    const regex = new RegExp(`${keyPrefix}(_\\d+)?=`, 'g');
    const existingKeys = (envContent.match(regex) || []).length;

    console.log(`📊 Existing keys: ${existingKeys}`);
    console.log(`➕ Adding: ${keys.length} new key(s)\n`);

    // Add new keys
    if (!envContent.endsWith('\n')) envContent += '\n';
    envContent += `\n# Added by Quick Key Setup on ${new Date().toISOString()}\n`;

    keys.forEach((key, index) => {
      const keyNum = existingKeys + index + 1;
      const keyName = keyNum === 1 && existingKeys === 0 
        ? keyPrefix 
        : `${keyPrefix}_${keyNum}`;
      
      envContent += `${keyName}=${key}\n`;
      console.log(`  ✅ ${keyName}`);
    });

    writeFileSync(envPath, envContent);
    console.log(`\n✅ Successfully saved to .env!\n`);

    // Reload dotenv
    require('dotenv').config();

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎉 SETUP COMPLETE!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    console.log(`📊 Total keys now: ${existingKeys + keys.length}`);
    console.log(`🔄 Keys will auto-rotate on rate limits`);
    console.log(`⏰ Blocked keys auto-unblock after 5 minutes`);
    console.log(``);
    console.log(`🚀 Next step: Restart bot`);
    console.log(`   npm run build && npm run start\n`);

  } catch (error: any) {
    console.error('❌ Error saving to .env:', error.message);
  }

  rl.close();
}

function openBrowser(url: string) {
  const platform = process.platform;
  
  let command: string;
  if (platform === 'win32') {
    command = `start ${url}`;
  } else if (platform === 'darwin') {
    command = `open ${url}`;
  } else {
    command = `xdg-open ${url}`;
  }

  try {
    spawn(command, { shell: true, detached: true, stdio: 'ignore' });
  } catch (error) {
    console.log(`⚠️  Couldn't open browser. Please open manually: ${url}`);
  }
}

main().catch(console.error);
