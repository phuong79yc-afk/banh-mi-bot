# 👑 VIP Module - Hệ Thống VIP Tiers

## ✅ Đã Tạo Xong!

Module VIP đã được tạo với đầy đủ tính năng:

### 📋 Commands

1. **`/vipinfo`** - Xem hạng VIP và quyền lợi hiện tại
   - Hiển thị hạng VIP dựa trên số vé vàng
   - Danh sách quyền lợi của hạng hiện tại
   - Tiến độ lên hạng tiếp theo
   - Weekly bonus amount

2. **`/vip-tiers`** - Xem tất cả 11 hạng VIP
   - VIP 0: Thành Viên (0-9 vé)
   - VIP 1: Bronze 🥉 (10-24 vé)
   - VIP 2: Silver 🥈 (25-49 vé)
   - VIP 3: Gold 🥇 (50-99 vé) - 5,000 xu/tuần
   - VIP 4: Platinum 💎 (100-199 vé) - 7,500 xu/tuần
   - VIP 5: Diamond 💠 (200-399 vé) - 10,000 xu/tuần
   - VIP 6: Master 🌟 (400-699 vé) - 15,000 xu/tuần
   - VIP 7: Grandmaster 👑 (700-999 vé) - 20,000 xu/tuần
   - VIP 8: Legendary 🔥 (1000-1999 vé) - 30,000 xu/tuần
   - VIP 9: Mythic ⚡ (2000-4999 vé) - 50,000 xu/tuần
   - VIP 10: Ultimate 🌈 (5000+ vé) - 100,000 xu/tuần

3. **`/vip-bonus`** - Nhận weekly bonus (VIP 3+)
   - Hiện tại chỉ hiển thị thông tin
   - TODO: Implement claim logic với cooldown

## 🎨 Quyền Lợi Theo Hạng

### VIP 1-2 (Bronze, Silver)
- Bonus % xu khi điểm danh
- Role màu đặc biệt
- Ưu tiên support

### VIP 3-5 (Gold, Platinum, Diamond)
- **Weekly Bonus xu**
- Custom roles
- VIP Lottery
- Transfer xu

### VIP 6-10 (Master → Ultimate)
- Weekly bonus cao
- Custom bot commands
- Exclusive channels
- Hall of Fame
- Vote features mới

## 🚀 Cách Chạy Bot

### Option 1: Chạy trực tiếp với ts-node (KHUYÊN DÙNG)
```bash
# Click double vào file này:
scripts/dev-tools/run-direct.bat

# Hoặc chạy command:
node --expose-gc -r ts-node/register src/index.ts
```

### Option 2: Build rồi chạy
```bash
npm run build
npm start
```

## 📝 Tích Hợp Với Shop

Module VIP đọc data từ `daily_users` table:
- `gold_balance` - Số vé vàng (quyết định hạng VIP)
- `balance` - Số xu

Mỗi lần mua Vé Vàng trong `/shop` tốn 50.000 xu và cộng 1 vé vào `gold_balance`; có thể mua nhiều lần. Trong server mua vé, bot tự tạo và gán role cho các hạng đã đạt. Role các tier thấp hơn được giữ lại; role của tier cao hơn sẽ bị gỡ nếu user xuống hạng.

Lệnh `/vipinfo` và `/vip-tiers` cũng đồng bộ role hiện tại. Lệnh admin cấp vé vàng đồng bộ trong server nơi lệnh được dùng. Bot cần quyền **Manage Roles** và role bot phải nằm cao hơn các role VIP. Shop module có nút "👑 VIP Info" để mở thông tin VIP.

## 🔧 TODO - Các Tính Năng Cần Thêm

1. **`/vip-bonus` claim logic**
   - Thêm column `last_vip_bonus` vào database
   - Check cooldown 7 ngày
   - Cộng xu vào balance

2. **`/vip-transfer`** - Chuyển xu (VIP 5+)

3. **`/vip-lottery`** - Vé số VIP (VIP 4+)

4. **`/vip-stats`** - Thống kê VIP

5. **`/vip-leaderboard`** - Top VIP users

## 📂 File Structure

```
src/modules/vip-module/
└── entry_point.ts
    ├── VIP_TIERS[] - 11 tiers config
    ├── getVIPTier() - Calculate tier by gold tickets
    ├── /vipinfo command
    ├── /vip-tiers command
    └── /vip-bonus command
```

## ✨ Test Commands

Sau khi bot chạy:

```
/vipinfo - Xem hạng VIP của bạn
/vip-tiers - Xem tất cả hạng VIP
/vip-bonus - Test bonus (chỉ hiển thị info)
/shop - Click nút "👑 VIP Info" để test tích hợp
```

---

**Created:** 2026-10-14  
**Status:** ✅ Ready to use (bonus claim chưa có)
