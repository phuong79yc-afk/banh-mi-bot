const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const TARGET_GUILD_ID = '1482354951689605150';

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
      console.log('ℹ️  Bot có thể chưa join server này!');
      process.exit(1);
    }
    
    console.log('🎯 Server:', guild.name);
    console.log('📊 Server ID:', guild.id);
    console.log('👥 Members:', guild.memberCount);
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
    console.log('📦 Tổng emoji:', totalEmojis + '/50');
    console.log('🆓 Slots trống:', slotsAvailable + '/50');
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
      console.log(`${i}. ${animated} ${emoji.name} (ID: ${id})`);
      i++;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
