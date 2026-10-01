# =====================================================
# DELETE SPECIFIC OLD EMOJIS FROM DISCORD SERVER
# =====================================================
# Script để xóa các emoji cũ dựa trên danh sách ID
# =====================================================

param(
    [switch]$DryRun = $false  # Chỉ hiển thị, không xóa thật
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  XÓA EMOJI CŨ KHỎI DISCORD SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - Chỉ hiển thị, không xóa thật" -ForegroundColor Yellow
    Write-Host ""
}

# Danh sách emoji cũ cần xóa (từ file emojis.ts cũ)
$OLD_EMOJI_IDS = @(
    "1547968598113517599",  # lock_transparent
    "1547153565771108382",  # video
    "1547153591205367858",  # wifi
    "1547153659140382780",  # trophy
    "1547153698558316545",  # menu
    "1547153734197444678",  # calendar
    "1547153760877416458",  # add
    "1547153789230911558",  # document
    "1547153819312332862",  # clock
    "1547153870562533386",  # edit
    "1547154019317710858",  # art
    "1547154056210812970",  # loading
    "1547154083318726737",  # refresh
    "1547154122803777627",  # crown
    "1547154183034118154",  # shield
    "1547154229716717568",  # star
    "1547154254790139914",  # remove
    "1547154286033772645",  # copy
    "1547154317545312307",  # flag
    "1547154345114607636",  # save
    "1547154406468878366",  # terminal
    "1547154449502441502",  # unlock
    "1547154482578726934",  # gift
    "1547154559204331550",  # heart
    "1547154595074285689",  # sparkles
    "1547154623473786900",  # music
    "1547154656898322544",  # chart
    "1547154723616989234",  # bell
    "1547154783465508894",  # success
    "1547154820543283230",  # database
    "1547154898855141386",  # users
    "1547154933818724453",  # user
    "1547155077242953811",  # server
    "1547155128673374248",  # warning
    "1547155236744069151",  # search
    "1547155335788367943",  # export
    "1547155419989024768",  # delete
    "1547155554168999996",  # cloud
    "1547155697358217216",  # error
    "1547155806183489656",  # message
    "1547155852740399115",  # link
    "1547155900836610048",  # image
    "1547156020441255966",  # folder
    "1547156080730054676",  # pin
    "1547156118227259413",  # key
    "1547156296229322764",  # tag
    "1547156468703432784",  # info
    "1482354951689605150",  # gaming
    "1548718125644648498",  # voice_128
    "1548718101951025293",  # gaming_128
    "1548718067670978730"   # explosion_128
)

Write-Host "📋 Danh sách emoji cũ: $($OLD_EMOJI_IDS.Count) emoji" -ForegroundColor Cyan
Write-Host ""

# Di chuyển về thư mục gốc
Set-Location $PSScriptRoot\..

# Kiểm tra file .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ File .env không tồn tại!" -ForegroundColor Red
    exit 1
}

# Convert array to JSON string để truyền vào Node.js
$idsJson = $OLD_EMOJI_IDS | ConvertTo-Json -Compress

# Chạy script Node.js
node -e "
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const OLD_IDS = $idsJson;
const DRY_RUN = $($DryRun.ToString().ToLower());

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
    
    // Tìm emoji cũ
    const oldEmojis = emojis.filter(emoji => OLD_IDS.includes(emoji.id));
    const oldCount = oldEmojis.size;
    
    if (oldCount === 0) {
      console.log('✅ Không tìm thấy emoji cũ nào để xóa!');
      console.log('📊 Tổng emoji hiện tại: ' + emojis.size);
      process.exit(0);
    }
    
    console.log('🔍 Tìm thấy ' + oldCount + ' emoji cũ cần xóa');
    console.log('📊 Tổng emoji hiện tại: ' + emojis.size);
    console.log('➡️  Còn lại sau khi xóa: ' + (emojis.size - oldCount));
    console.log('');
    
    if (DRY_RUN) {
      console.log('🔍 DRY RUN - Danh sách emoji sẽ bị xóa:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      let i = 1;
      for (const [id, emoji] of oldEmojis) {
        console.log(i + '. ' + emoji.name + ' (ID: ' + id + ')');
        i++;
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('ℹ️  Để xóa thật, chạy lại script không có flag -DryRun');
      process.exit(0);
    }
    
    console.log('⚠️  BẠN CÓ CHẮC MUỐN XÓA ' + oldCount + ' EMOJI CŨ KHÔNG?');
    console.log('   Bot sẽ đợi 5 giây... Nhấn Ctrl+C để hủy!');
    console.log('');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🚀 Bắt đầu xóa emoji cũ...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let deleted = 0;
    let failed = 0;
    
    for (const [id, emoji] of oldEmojis) {
      try {
        await emoji.delete();
        deleted++;
        console.log('✅ [' + deleted + '/' + oldCount + '] Đã xóa: ' + emoji.name);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failed++;
        console.log('❌ [FAIL] ' + emoji.name + ': ' + error.message);
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 KẾT QUẢ:');
    console.log('   ✅ Đã xóa: ' + deleted + ' emoji');
    if (failed > 0) {
      console.log('   ❌ Thất bại: ' + failed + ' emoji');
    }
    console.log('   📊 Emoji còn lại: ' + (emojis.size - deleted));
    console.log('   🆓 Slots trống: ' + (50 - (emojis.size - deleted)) + '/50');
    console.log('');
    console.log('🎉 HOÀN TẤT! Bây giờ có thể upload 50 emoji mới!');
    
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
