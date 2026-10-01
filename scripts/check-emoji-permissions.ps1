# =====================================================
# CHECK EMOJI PERMISSIONS & LIST EMOJIS
# =====================================================
# Script để kiểm tra quyền và liệt kê emoji hiện tại
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KIỂM TRA EMOJI & QUYỀN BOT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Di chuyển về thư mục gốc
Set-Location $PSScriptRoot\..

# Kiểm tra file .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ File .env không tồn tại!" -ForegroundColor Red
    exit 1
}

# Chạy script Node.js
node -e "
const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const TARGET_GUILD_ID = '1482354951689605150';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log('✅ Bot đã kết nối: ' + client.user.tag);
  console.log('');
  
  try {
    const guild = client.guilds.cache.get(TARGET_GUILD_ID);
    
    if (!guild) {
      console.log('❌ Không tìm thấy server với ID: ' + TARGET_GUILD_ID);
      console.log('ℹ️  Bot có thể chưa join server này!');
      process.exit(1);
    }
    
    console.log('🎯 Server: ' + guild.name);
    console.log('📊 Server ID: ' + guild.id);
    console.log('👥 Members: ' + guild.memberCount);
    console.log('');
    
    // Kiểm tra quyền của bot
    const botMember = guild.members.cache.get(client.user.id);
    const hasManageEmojis = botMember.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers);
    const hasAdmin = botMember.permissions.has(PermissionFlagsBits.Administrator);
    
    console.log('🔑 QUYỀN CỦA BOT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (hasAdmin) {
      console.log('✅ Administrator: YES (có tất cả quyền)');
    } else {
      console.log('❌ Administrator: NO');
    }
    
    if (hasManageEmojis) {
      console.log('✅ Manage Emojis and Stickers: YES');
    } else {
      console.log('❌ Manage Emojis and Stickers: NO');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    if (!hasManageEmojis && !hasAdmin) {
      console.log('⚠️  CẢNH BÁO: Bot KHÔNG có quyền xóa emoji!');
      console.log('📝 Cấp quyền: Server Settings > Roles > Bot Role > Manage Emojis and Stickers');
      console.log('');
    }
    
    // Fetch tất cả emoji
    const emojis = await guild.emojis.fetch();
    const totalEmojis = emojis.size;
    const slotsAvailable = 50 - totalEmojis;
    
    console.log('📊 THỐNG KÊ EMOJI:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Tổng emoji: ' + totalEmojis + '/50');
    console.log('🆓 Slots trống: ' + slotsAvailable + '/50');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    if (totalEmojis === 0) {
      console.log('✅ Server không có emoji nào!');
      console.log('');
      process.exit(0);
    }
    
    // Liệt kê tất cả emoji
    console.log('📋 DANH SÁCH EMOJI HIỆN TẠI:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let i = 1;
    for (const [id, emoji] of emojis) {
      const animated = emoji.animated ? '🎬' : '🖼️';
      console.log(i + '. ' + animated + ' ' + emoji.name + ' (ID: ' + id + ')');
      i++;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    // Kiểm tra emoji cũ
    const OLD_IDS = [
      '1547968598113517599', '1547153565771108382', '1547153591205367858',
      '1547153659140382780', '1547153698558316545', '1547153734197444678',
      '1547153760877416458', '1547153789230911558', '1547153819312332862',
      '1547153870562533386', '1547154019317710858', '1547154056210812970',
      '1547154083318726737', '1547154122803777627', '1547154183034118154',
      '1547154229716717568', '1547154254790139914', '1547154286033772645',
      '1547154317545312307', '1547154345114607636', '1547154406468878366',
      '1547154449502441502', '1547154482578726934', '1547154559204331550',
      '1547154595074285689', '1547154623473786900', '1547154656898322544',
      '1547154723616989234', '1547154783465508894', '1547154820543283230',
      '1547154898855141386', '1547154933818724453', '1547155077242953811',
      '1547155128673374248', '1547155236744069151', '1547155335788367943',
      '1547155419989024768', '1547155554168999996', '1547155697358217216',
      '1547155806183489656', '1547155852740399115', '1547155900836610048',
      '1547156020441255966', '1547156080730054676', '1547156118227259413',
      '1547156296229322764', '1547156468703432784', '1482354951689605150',
      '1548718125644648498', '1548718101951025293', '1548718067670978730'
    ];
    
    const oldEmojis = emojis.filter(emoji => OLD_IDS.includes(emoji.id));
    
    if (oldEmojis.size > 0) {
      console.log('🔍 PHÁT HIỆN EMOJI CŨ:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Số lượng emoji cũ: ' + oldEmojis.size + '/' + totalEmojis);
      console.log('🆓 Slots sau khi xóa: ' + (50 - totalEmojis + oldEmojis.size) + '/50');
      console.log('');
      console.log('💡 Chạy script sau để xóa emoji cũ:');
      console.log('   .\\scripts\\delete-specific-emojis.ps1 -DryRun');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('✅ Không có emoji cũ nào!');
    }
    
    console.log('');
    console.log('🎉 KIỂM TRA HOÀN TẤT!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
  console.error('❌ Không thể login:', error.message);
  process.exit(1);
});
"
