const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const TARGET_GUILD_ID = '1482354951689605150';
const DRY_RUN = process.argv[2] === '--dry-run';

// Danh sách emoji cũ cần xóa
const OLD_EMOJI_IDS = [
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

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log('✅ Bot đã kết nối:', client.user.tag);
  console.log('');
  
  try {
    const guild = client.guilds.cache.get(TARGET_GUILD_ID);
    
    if (!guild) {
      console.log('❌ Không tìm thấy server với ID:', TARGET_GUILD_ID);
      process.exit(1);
    }
    
    console.log('🎯 Server:', guild.name);
    console.log('📊 Server ID:', guild.id);
    console.log('');
    
    // Fetch tất cả emoji
    const emojis = await guild.emojis.fetch();
    
    // Tìm emoji cũ
    const oldEmojis = emojis.filter(emoji => OLD_EMOJI_IDS.includes(emoji.id));
    const oldCount = oldEmojis.size;
    
    if (oldCount === 0) {
      console.log('✅ Không tìm thấy emoji cũ nào để xóa!');
      console.log('📊 Tổng emoji hiện tại:', emojis.size);
      process.exit(0);
    }
    
    console.log('🔍 Tìm thấy', oldCount, 'emoji cũ cần xóa');
    console.log('📊 Tổng emoji hiện tại:', emojis.size);
    console.log('➡️  Còn lại sau khi xóa:', emojis.size - oldCount);
    console.log('');
    
    if (DRY_RUN) {
      console.log('🔍 DRY RUN - Danh sách emoji sẽ bị xóa:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      let i = 1;
      for (const [id, emoji] of oldEmojis) {
        console.log(`${i}. ${emoji.name} (ID: ${id})`);
        i++;
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('ℹ️  Để xóa thật, chạy: node scripts/delete-old-emojis.js');
      process.exit(0);
    }
    
    console.log('⚠️  BẠN CÓ CHẮC MUỐN XÓA', oldCount, 'EMOJI CŨ KHÔNG?');
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
        console.log(`✅ [${deleted}/${oldCount}] Đã xóa: ${emoji.name}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failed++;
        console.log(`❌ [FAIL] ${emoji.name}: ${error.message}`);
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 KẾT QUẢ:');
    console.log('   ✅ Đã xóa:', deleted, 'emoji');
    if (failed > 0) {
      console.log('   ❌ Thất bại:', failed, 'emoji');
    }
    console.log('   📊 Emoji còn lại:', emojis.size - deleted);
    console.log('   🆓 Slots trống:', 50 - (emojis.size - deleted) + '/50');
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
