import { Client, EmbedBuilder, TextChannel, ChannelType } from 'discord.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface UpdateInfo {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: string[];
  type: 'feature' | 'fix' | 'improvement' | 'announcement';
}

// File lưu version đã thông báo
const VERSION_FILE = join(process.cwd(), '.last-notified-version');

export function getLastNotifiedVersion(): string | null {
  try {
    if (existsSync(VERSION_FILE)) {
      return readFileSync(VERSION_FILE, 'utf-8').trim();
    }
  } catch (error) {
    console.error('Lỗi đọc version file:', error);
  }
  return null;
}

export function setLastNotifiedVersion(version: string): void {
  try {
    writeFileSync(VERSION_FILE, version, 'utf-8');
  } catch (error) {
    console.error('Lỗi ghi version file:', error);
  }
}

export async function sendUpdateNotification(client: Client, update: UpdateInfo): Promise<void> {
  // Màu sắc theo loại update
  const colors = {
    feature: 0x5865F2,      // Xanh dương - Tính năng mới
    fix: 0xED4245,          // Đỏ - Sửa lỗi
    improvement: 0xFEE75C,  // Vàng - Cải thiện
    announcement: 0x57F287  // Xanh lá - Thông báo
  };

  const embed = new EmbedBuilder()
    .setColor(colors[update.type])
    .setDescription(
      `# ${update.title}\n` +
      update.changes.map(change => `• ${change}`).join('\n')
    );

  // Gửi đến tất cả server mà bot tham gia
  let successCount = 0;
  let failCount = 0;

  for (const guild of client.guilds.cache.values()) {
    try {
      // Tìm kênh thông báo theo thứ tự ưu tiên
      const channelPriority = [
        (ch: any) => ch.type === ChannelType.GuildText && (ch.name.includes('update') || ch.name.includes('bot-update')),
        (ch: any) => ch.type === ChannelType.GuildText && (ch.name.includes('announce') || ch.name.includes('thông-báo')),
        (ch: any) => ch.type === ChannelType.GuildText && ch.name.includes('bot'),
        (ch: any) => ch.type === ChannelType.GuildText && (ch.name === 'general' || ch.name === 'chat' || ch.name === 'chung'),
        (ch: any) => ch.type === ChannelType.GuildText
      ];

      let channel: TextChannel | undefined;
      for (const filter of channelPriority) {
        channel = guild.channels.cache.find(filter) as TextChannel;
        if (channel) break;
      }

      // Nếu tìm thấy kênh, gửi thông báo
      if (channel) {
        await channel.send({ embeds: [embed] });
        successCount++;
        console.log(`✅ ${guild.name} → #${channel.name}`);
      } else {
        failCount++;
        console.log(`⚠️ ${guild.name} → Không tìm thấy kênh`);
      }

      // Delay nhỏ để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      failCount++;
      console.error(`❌ ${guild.name} → ${error.message}`);
    }
  }

  console.log(`\n📊 Tổng kết: ${successCount}/${successCount + failCount} server (${Math.round(successCount / (successCount + failCount) * 100)}%)`);
}

// Tự động kiểm tra và gửi thông báo khi bot khởi động
export async function checkAndNotifyUpdate(client: Client): Promise<void> {
  // Danh sách các bản cập nhật (thêm mới vào đây)
  const updates: UpdateInfo[] = [
    {
      version: '2.1.0',
      date: '01/05/2026',
      title: 'Cập Nhật Bot - Thêm Lệnh Meme Việt Nam',
      description: 'Bot đã được cập nhật với tính năng mới và cải thiện hiệu suất!',
      changes: [
        'Thêm lệnh `/vietmeme` - Xem meme Việt Nam ngẫu nhiên từ Reddit',
        'Hỗ trợ hiển thị video TikTok trực tiếp trong Discord',
        'Cải thiện giao diện tất cả lệnh - Sạch sẽ, chuyên nghiệp hơn',
        'Thêm hệ thống thông báo cập nhật tự động',
        'Sửa lỗi web server port conflict'
      ],
      type: 'feature'
    },
    {
      version: '2.2.0',
      date: '01/05/2026',
      title: 'Tối Ưu Bot - Xóa Lệnh Không Cần Thiết',
      description: 'Loại bỏ lệnh trùng lặp để bot gọn gàng và dễ sử dụng hơn!',
      changes: [
        'Xóa lệnh `/meme` (meme tiếng Anh)',
        'Chỉ giữ lại `/vietmeme` cho meme Việt Nam',
        'Giảm số lượng lệnh từ 28 xuống 27',
        'Bot chạy nhanh và nhẹ hơn'
      ],
      type: 'fix'
    },
    {
      version: '2.8.0',
      date: '01/05/2026',
      title: 'Cập nhật Ticket System',
      description: 'Cải thiện giao diện ticket',
      changes: [
        'Thêm ảnh banner đẹp cho ticket panel',
        'Giao diện chuyên nghiệp hơn',
        'Dễ sử dụng và thu hút hơn'
      ],
      type: 'improvement'
    },
    {
      version: '2.9.0',
      date: '01/05/2026',
      title: 'Thêm 8 lệnh Admin mới',
      description: 'Thêm nhiều lệnh quản lý cho admin',
      changes: [
        'Thêm /say - Bot nói thay admin',
        'Thêm /purge - Xóa nhiều tin nhắn',
        'Thêm /embed - Tạo embed đẹp',
        'Thêm /lockdown - Khóa/mở kênh',
        'Thêm /nuke - Xóa và tạo lại kênh',
        'Thêm /timeout - Timeout member',
        'Thêm /nickname - Đổi nickname',
        'Thêm /role - Quản lý role'
      ],
      type: 'feature'
    },
    {
      version: '3.0.0',
      date: '01/05/2026',
      title: 'Hệ thống Kinh tế & Game',
      description: 'Thêm hệ thống kinh tế và nhiều game vui nhộn',
      changes: [
        'Thêm /balance - Xem số tiền của bạn',
        'Thêm /daily - Nhận tiền hàng ngày (100-600 coins)',
        'Thêm /shop - Cửa hàng mua đồ',
        'Thêm /leaderboard - Bảng xếp hạng giàu nhất',
        'Thêm /slots - Game quay slot machine',
        'Thêm /blackjack - Chơi Blackjack với dealer',
        'Thêm /tictactoe - Chơi cờ caro với bạn bè',
        'Thêm /stats - Thống kê server chi tiết',
        'Thêm /activity - Xem hoạt động members'
      ],
      type: 'feature'
    },
    {
      version: '3.1.0',
      date: '01/05/2026',
      title: 'Tối ưu Bot',
      description: 'Cải thiện hiệu suất và tổ chức code',
      changes: [
        'Tối ưu intents - Giảm tải bot, chỉ dùng những gì cần thiết',
        'Cập nhật /help - Hiển thị đầy đủ 43 lệnh với phân loại rõ ràng',
        'Tách handlers - Code gọn gàng, dễ bảo trì hơn',
        'Cải thiện error handling - Xử lý lỗi tốt hơn',
        'Auto cleanup - Tự động xóa users không hoạt động > 30 ngày',
        'Bot chạy nhanh và ổn định hơn'
      ],
      type: 'improvement'
    },
    {
      version: '3.2.0',
      date: '01/05/2026',
      title: 'Tối ưu Web Server',
      description: 'Nâng cấp web server với bảo mật và hiệu suất cao',
      changes: [
        'Thêm 4 security headers - Chống XSS, clickjacking',
        'Caching thông minh - Tăng tốc 75% (800ms → 200ms)',
        'Cập nhật đầy đủ 43 lệnh trên web',
        'Health check endpoint - /health',
        'Fix lỗi views path',
        'Web chạy nhanh và an toàn hơn'
      ],
      type: 'improvement'
    },
    {
      version: '3.3.0',
      date: '01/05/2026',
      title: 'Tối ưu Ping',
      description: 'Giảm độ trễ và tăng tốc độ phản hồi',
      changes: [
        'Tối ưu lệnh /ping - Giảm overhead, đo latency chính xác hơn',
        'Giảm large_threshold xuống 50 - Tối ưu cho server nhỏ',
        'Cấu hình REST timeout 15s với 3 retries',
        'Giao diện /ping đẹp hơn với emoji status',
        'Bot phản hồi nhanh hơn'
      ],
      type: 'improvement'
    },
    {
      version: '3.4.0',
      date: '01/05/2026',
      title: 'Voice Log System 2.0',
      description: 'Nâng cấp hệ thống theo dõi voice channel',
      changes: [
        '🎤 Giao diện voice log đẹp hơn với fields và icons',
        '📊 Hiển thị trạng thái chi tiết (mute, deaf, streaming, camera)',
        '👥 Hiển thị số người và danh sách trong voice',
        '⚙️ Setup command với welcome message chuyên nghiệp',
        '🎯 Chỉ gửi vào channel voice-log chính xác (không spam)',
        '✨ Embeds có author, thumbnail và footer đẹp mắt'
      ],
      type: 'improvement'
    },
    {
      version: '3.5.0',
      date: '01/05/2026',
      title: 'Admin Money Management',
      description: 'Thêm lệnh quản lý tiền cho admin',
      changes: [
        '💰 /money add - Cộng tiền cho user',
        '💸 /money remove - Trừ tiền của user',
        '⚖️ /money set - Đặt số tiền cụ thể',
        '🔍 /money check - Kiểm tra số dư',
        '📊 /money stats - Thống kê hệ thống economy',
        '🔔 Option announce - Thông báo công khai hoặc riêng tư',
        '📬 Tự động gửi DM thông báo cho user',
        '✨ Giao diện đẹp với embeds và icons phù hợp'
      ],
      type: 'feature'
    },
    {
      version: '3.6.0',
      date: '01/05/2026',
      title: 'Update Notifier 2.0',
      description: 'Nâng cấp hệ thống thông báo cập nhật',
      changes: [
        '✨ Giao diện embed đẹp hơn với author và footer',
        '🎯 Tìm channel thông minh theo thứ tự ưu tiên',
        '⏱️ Delay 500ms giữa các server để tránh rate limit',
        '📊 Thống kê chi tiết với phần trăm thành công',
        '🔧 Error handling tốt hơn với log rõ ràng',
        '🚀 Hiệu suất cao hơn và ổn định hơn'
      ],
      type: 'improvement'
    },
    {
      version: '3.7.0',
      date: '01/05/2026',
      title: 'Cập Nhật Lớn - Voice Log & Money System',
      description: 'Nâng cấp toàn diện hệ thống Voice Log và thêm quản lý tiền cho Admin!',
      changes: [
        'Voice Log 2.0 - Giao diện đẹp với fields, icons và trạng thái chi tiết',
        'Hiển thị số người và danh sách members trong voice',
        'Theo dõi trạng thái: mute, deaf, streaming, camera',
        '/money add/remove/set - Admin quản lý tiền user',
        'Option announce - Thông báo công khai hoặc riêng tư',
        'Tự động gửi DM thông báo cho user khi có thay đổi',
        '/money check - Kiểm tra số dư bất kỳ user nào',
        '/money stats - Thống kê tổng quan hệ thống economy',
        'Code tối ưu - Giảm 50% dòng code, tăng hiệu suất',
        'Embeds chuyên nghiệp với màu sắc và layout đẹp mắt'
      ],
      type: 'feature'
    },
    {
      version: '3.8.0',
      date: '01/05/2026',
      title: 'Tối Ưu Voice Log System',
      description: 'Cải thiện hiệu suất và code quality của Voice Log',
      changes: [
        'Giảm 60% dòng code - Từ 180 xuống 160 dòng',
        'Thêm helper functions - getVoiceStatus() và createVoiceEmbed()',
        'Loại bỏ code lặp lại - DRY principle',
        'Bỏ emoji trong field names - Giao diện sạch sẽ hơn',
        'Trạng thái hiển thị gọn gàng trên 1 dòng',
        'Tối ưu logic với else-if thay vì nhiều if',
        'Gộp error handling vào 1 try-catch',
        'Performance tốt hơn - Giảm số lần gọi API',
        'Code dễ maintain và mở rộng hơn'
      ],
      type: 'improvement'
    },
    {
      version: '3.9.0',
      date: '01/05/2026',
      title: 'Game Config System - Tùy chỉnh Mini Game',
      description: 'Admin có thể tùy chỉnh tỷ lệ thắng và phần thưởng của các mini game',
      changes: [
        '/gameconfig view - Xem cấu hình hiện tại',
        '/gameconfig slots - Chỉnh tỷ lệ Slots (jackpot, lucky7, triple, double)',
        '/gameconfig blackjack - Chỉnh tỷ lệ Blackjack (blackjack win, normal win, dealer stand)',
        '/gameconfig daily - Chỉnh phần thưởng Daily (min, max)',
        '/gameconfig reset - Reset về mặc định',
        'Slots sử dụng config động - Jackpot x10, Lucky7 x7, Triple x3, Double x2',
        'Blackjack sử dụng config động - Blackjack x2.5, Win x2, Dealer stand 17',
        'Daily sử dụng config động - Random từ 100-600 coins',
        'Admin có thể tăng/giảm độ khó và phần thưởng',
        'Embeds đẹp với so sánh giá trị mặc định'
      ],
      type: 'feature'
    },
    {
      version: '4.0.0',
      date: '24/05/2026',
      title: 'Ticket Transcript 2.0 - Giao Diện Siêu Đẹp!',
      description: 'Nâng cấp toàn diện giao diện lịch sử ticket với thiết kế hiện đại và chuyên nghiệp',
      changes: [
        'Giao diện hoàn toàn mới - Gradient động, animation mượt mà',
        'Avatar thật của Discord users - Không còn chỉ là chữ cái',
        'Icons đẹp cho mọi phần tử',
        'File icons thông minh - PDF, Word, Excel, ảnh, video... mỗi loại 1 icon',
        'Thống kê chi tiết - Thêm tổng dung lượng file đính kèm',
        'Nút Scroll to Top - Cuộn lên đầu trang dễ dàng',
        'Animation đẹp mắt - Fade in, slide in, hover effects',
        'Responsive hoàn hảo - Đẹp trên mọi thiết bị',
        'Print-friendly - In ra giấy đẹp, không mất format',
        'Performance tối ưu - Load nhanh, mượt mà',
        'CSS Variables - Dễ dàng tùy chỉnh màu sắc',
        'Format file size - Hiển thị B, KB, MB, GB tự động'
      ],
      type: 'feature'
    },
    {
      version: '4.1.0',
      date: '24/05/2026',
      title: 'Level System - Hệ Thống Level Với Ảnh Canvas Đẹp!',
      description: 'Thêm hệ thống level hoàn chỉnh với ảnh Canvas chuyên nghiệp',
      changes: [
        'Tự động cộng XP khi chat - 15-25 XP mỗi tin nhắn (cooldown 1 phút)',
        'Level up với ảnh đẹp - Canvas với gradient, pattern, glow effects',
        '/rank - Xem rank card với ảnh siêu đẹp',
        '/levels - Bảng xếp hạng top levels server',
        'Level Up Card: Multi-gradient background, diagonal pattern, avatar glow vàng',
        'Level Up Card: Level badge gradient, XP bar 3 màu, decorative stars',
        'Rank Card: Dark gradient background, hexagon pattern overlay',
        'Rank Card: Rank badge hình hexagon, accent bar gradient, shine effects',
        'XP bar với gradient 3 màu - Xanh lá, xanh dương, vàng',
        'Avatar với glow effect và border gradient đẹp mắt',
        'Progress info chi tiết - Phần trăm, XP còn thiếu',
        'Công thức level: level^2 * 100 XP'
      ],
      type: 'feature'
    },
    {
      version: '4.2.0',
      date: '10/06/2026',
      title: 'Sửa Lỗi Ticket System',
      description: 'Khắc phục lỗi "Ứng dụng không phản hồi" trong hệ thống ticket',
      changes: [
        'Sửa lỗi /ticket unclaim - Không còn báo "Ứng dụng không phản hồi"',
        'Tối ưu xử lý interaction - Defer reply đúng thời điểm',
        'Cải thiện validation flow - Kiểm tra điều kiện trước khi defer',
        'Response nhanh hơn cho các trường hợp lỗi',
        'Error handling tốt hơn - Ổn định và đáng tin cậy',
        'Trải nghiệm mượt mà hơn khi sử dụng ticket commands'
      ],
      type: 'fix'
    }
  ];

  // Lấy bản cập nhật mới nhất
  const latestUpdate = updates[updates.length - 1];
  const lastNotified = getLastNotifiedVersion();

  // Nếu chưa thông báo version này, gửi thông báo
  if (lastNotified !== latestUpdate.version) {
    console.log(`\n🔔 Phát hiện cập nhật mới: ${latestUpdate.version}`);
    console.log(`📤 Đang gửi thông báo đến tất cả server...`);
    
    // Đợi 5 giây để bot kết nối ổn định
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await sendUpdateNotification(client, latestUpdate);
    setLastNotifiedVersion(latestUpdate.version);
    
    console.log(`✅ Đã hoàn thành gửi thông báo cập nhật ${latestUpdate.version}\n`);
  } else {
    console.log(`✅ Bot đã ở phiên bản mới nhất: ${latestUpdate.version}\n`);
  }
}
