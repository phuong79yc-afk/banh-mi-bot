# =====================================================
# DELETE ALL EMOJIS FROM DISCORD SERVER
# =====================================================
# Script để xóa tất cả emoji trong Discord server
# Dùng Discord.js để thực hiện
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  XÓA TẤT CẢ EMOJI TRONG DISCORD SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Node.js
Write-Host "[1/3] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js chưa được cài đặt!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Di chuyển về thư mục gốc
Set-Location $PSScriptRoot\..

# Kiểm tra file .env
Write-Host "[2/3] Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "❌ File .env không tồn tại!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ File .env found" -ForegroundColor Green
Write-Host ""

# Chạy script Node.js để xóa emoji
Write-Host "[3/3] Deleting all emojis..." -ForegroundColor Yellow
Write-Host ""

node -e "
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log('✅ Bot đã kết nối: ' + client.user.tag);
  console.log('');
  
  try {
    // Chỉ định server ID cụ thể
    const TARGET_GUILD_ID = '1482354951689605150';
    const guild = client.guilds.cache.get(TARGET_GUILD_ID);
    
    if (!guild) {
      console.log('❌ Không tìm thấy server với ID: ' + TARGET_GUILD_ID);
      console.log('ℹ️  Bot có thể chưa join server này hoặc ID sai!');
      process.exit(1);
    }
    
    console.log('🎯 Server: ' + guild.name);
    console.log('📊 Server ID: ' + guild.id);
    console.log('');
    
    // Fetch tất cả emoji
    const emojis = await guild.emojis.fetch();
    const totalEmojis = emojis.size;
    
    if (totalEmojis === 0) {
      console.log('✅ Server không có emoji nào để xóa!');
      process.exit(0);
    }
    
    console.log('🗑️  Tìm thấy ' + totalEmojis + ' emoji');
    console.log('');
    console.log('⚠️  BẠN CÓ CHẮC MUỐN XÓA TẤT CẢ EMOJI KHÔNG?');
    console.log('   Bot sẽ đợi 5 giây... Nhấn Ctrl+C để hủy!');
    console.log('');
    
    // Đợi 5 giây để user có thể cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🚀 Bắt đầu xóa emoji...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let deleted = 0;
    let failed = 0;
    
    for (const [id, emoji] of emojis) {
      try {
        await emoji.delete();
        deleted++;
        console.log('✅ [' + deleted + '/' + totalEmojis + '] Đã xóa: ' + emoji.name + ' (' + id + ')');
        
        // Delay 500ms giữa mỗi lần xóa để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failed++;
        console.log('❌ [FAIL] Không thể xóa: ' + emoji.name + ' - ' + error.message);
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 KẾT QUẢ:');
    console.log('   ✅ Đã xóa: ' + deleted + ' emoji');
    if (failed > 0) {
      console.log('   ❌ Thất bại: ' + failed + ' emoji');
    }
    console.log('');
    console.log('🎉 HOÀN TẤT!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
});

client.on('error', (error) => {
  console.error('❌ Discord Client Error:', error);
  process.exit(1);
});

// Login
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.log('❌ DISCORD_BOT_TOKEN không được set trong .env!');
  process.exit(1);
}

client.login(token).catch(error => {
  console.error('❌ Không thể login:', error.message);
  process.exit(1);
});
"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SCRIPT HOÀN TẤT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
