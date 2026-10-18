/**
 * Script tự động chuẩn hóa descriptions của tất cả commands
 * - Bỏ emoji ở đầu description
 * - Chuẩn hóa format
 * - Rút gọn text dài
 */

const fs = require('fs');
const path = require('path');

// Danh sách emoji phổ biến cần bỏ
const EMOJI_REGEX = /^[💰📋👑🎁🔒🛡️⛏🎮🎨📅🚀❌✅⚠️🔥💎🌟👥📊🎯🏆💤📃➕➖🔍✏️🔧🤔📜🎒🔄🗑️⏱️🧹🔓👢🔨🎪🌈⚙️📈🗄️🎭💡🎨⚡🌸🍀🎃🎄🎂🎉🎊🏅🏆📌📍🚩🎪🏪🏫]+\s*/;

// Map các cụm từ cần thay thế
const REPLACEMENTS = {
  // Loại bỏ dư thừa
  '(Admin only)': '[Admin]',
  '(admin)': '[Admin]',
  '(Admin)': '[Admin]',
  
  // Chuẩn hóa
  'để trống = bản thân': 'để trống để xem của bạn',
  'để trống = của bạn': 'để trống để xem của bạn',
  '(để trống = bản thân)': '(để trống để xem của bạn)',
  '(tối đa 100)': '',
  '(tối đa 50)': '',
  '(1-50)': '',
  '(tối đa 28 ngày)': '',
  
  // Rút gọn
  'người dùng': 'user',
  'Người dùng': 'User',
  'tự động trả lời': 'autoresponder',
  'Tự động trả lời': 'Autoresponder',
  
  // Fix typos
  'check': 'xem',
};

// Các rule thay thế đặc biệt cho từng loại command
const SPECIAL_RULES = {
  // Daily commands
  'daily': {
    'Điểm danh hàng ngày để nhận thưởng': 'Điểm danh hàng ngày để nhận xu và vé vàng',
    'Xem thống kê điểm danh của bạn': 'Xem thống kê điểm danh và streak',
    'Xem bảng xếp hạng điểm danh': 'Xem top users điểm danh nhiều nhất',
  },
  
  // Shop commands
  'shop': {
    'Xem shop và mua bot roles': 'Xem shop và mua roles hoặc items',
  },
  'inventory': {
    'Xem inventory của bạn': 'Xem roles và items đã mua',
  },
  
  // Moderation commands
  'moderation-kick': {
    'Đuổi người dùng ra khỏi server': 'Kick user ra khỏi server',
  },
  'moderation-ban': {
    'Cấm vĩnh viễn người dùng khỏi server': 'Ban user vĩnh viễn',
  },
  'moderation-timeout': {
    'Cấm người dùng chat tạm thời (tối đa 28 ngày)': 'Timeout user tạm thời (tối đa 28 ngày)',
  },
  'moderation-clear': {
    'Xóa hàng loạt tin nhắn trong kênh (tối đa 100)': 'Xóa tin nhắn hàng loạt (tối đa 100 tin)',
  },
  'moderation-lock': {
    'Khóa kênh (chặn gửi tin nhắn)': 'Khóa kênh để ngăn gửi tin nhắn',
  },
  'moderation-unlock': {
    'Mở khóa kênh (cho phép gửi tin nhắn trở lại)': 'Mở khóa kênh',
  },
  
  // AFK commands
  'afk': {
    'Đặt trạng thái AFK': 'Đặt trạng thái AFK với lý do (tùy chọn)',
  },
  'afk-remove': {
    'Xóa trạng thái AFK': 'Xóa trạng thái AFK của bạn',
  },
  'afk-list': {
    'Xem danh sách người dùng AFK trong server': 'Xem danh sách users đang AFK',
  },
  
  // Giveaway commands
  'giveaway-create': {
    'Tạo giveaway mới': 'Tạo giveaway với phần thưởng và thời gian',
  },
  'giveaway-end': {
    'Kết thúc giveaway sớm': 'Kết thúc giveaway trước thời hạn',
  },
  'giveaway-reroll': {
    'Chọn lại người thắng': 'Chọn lại người thắng ngẫu nhiên',
  },
  'giveaway-list': {
    'Xem danh sách giveaway': 'Xem tất cả giveaways đang chạy',
  },
  'giveaway-delete': {
    'Xóa giveaway': 'Xóa giveaway và hủy hoàn toàn',
  },
  
  // Generator
  'generator': {
    'Tạo cấu trúc server bằng AI: kênh, category, welcome/goodbye tự động': '[Admin] Tạo cấu trúc server tự động bằng AI',
  },
  
  // Settings
  'setting': {
    'Server settings management': '[Admin] Quản lý cài đặt server',
  },
};

function cleanDescription(desc) {
  // Bỏ emoji ở đầu
  let cleaned = desc.replace(EMOJI_REGEX, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  // Apply replacements
  for (const [old, replacement] of Object.entries(REPLACEMENTS)) {
    cleaned = cleaned.replace(new RegExp(old, 'g'), replacement);
  }
  
  // Trim lại
  cleaned = cleaned.trim();
  
  return cleaned;
}

function processFile(filePath) {
  console.log(`\n📄 Processing: ${path.relative(process.cwd(), filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changesCount = 0;
  
  // Find all .setDescription() calls
  const regex = /\.setDescription\(['"]([^'"]+)['"]\)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const originalDesc = match[1];
    let newDesc = cleanDescription(originalDesc);
    
    // Check if needs change
    if (newDesc !== originalDesc) {
      // Extract command name from nearby .setName()
      const nameRegex = /\.setName\(['"]([^'"]+)['"]\)/;
      const beforeMatch = content.substring(Math.max(0, match.index - 500), match.index);
      const nameMatch = beforeMatch.match(nameRegex);
      const cmdName = nameMatch ? nameMatch[1] : 'unknown';
      
      // Apply special rules if exists
      if (SPECIAL_RULES[cmdName] && SPECIAL_RULES[cmdName][newDesc]) {
        newDesc = SPECIAL_RULES[cmdName][newDesc];
      } else if (SPECIAL_RULES[cmdName] && SPECIAL_RULES[cmdName][originalDesc]) {
        newDesc = SPECIAL_RULES[cmdName][originalDesc];
      }
      
      console.log(`  ✏️  ${cmdName}:`);
      console.log(`     ❌ ${originalDesc}`);
      console.log(`     ✅ ${newDesc}`);
      
      // Replace in content
      content = content.replace(match[0], `.setDescription('${newDesc}')`);
      modified = true;
      changesCount++;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  💾 Saved ${changesCount} change(s)`);
    return changesCount;
  } else {
    console.log(`  ✅ No changes needed`);
    return 0;
  }
}

function findModuleFiles(dir) {
  const files = [];
  
  function scan(directory) {
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item === 'entry_point.ts') {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

// Main
console.log('🚀 Starting command description normalization...\n');
console.log('📁 Scanning modules directory...\n');

const modulesDir = path.join(process.cwd(), 'src', 'modules');
const moduleFiles = findModuleFiles(modulesDir);

console.log(`Found ${moduleFiles.length} module files\n`);
console.log('='.repeat(60));

let totalChanges = 0;
for (const file of moduleFiles) {
  totalChanges += processFile(file);
}

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Complete! ${totalChanges} description(s) updated across ${moduleFiles.length} module(s)\n`);
console.log('💡 Next steps:');
console.log('   1. Review changes: git diff');
console.log('   2. Build: npm run build');
console.log('   3. Restart bot: npm start');
console.log('');
