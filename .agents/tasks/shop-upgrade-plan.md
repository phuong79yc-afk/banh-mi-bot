# Implementation Plan: Shop Multi-Currency Upgrade

## Task Overview
Nâng cấp shop module với multi-currency (Cowoncy 💎, Vé Xanh 🎫, Vé Vàng 🏆), layout 3-cột, tags (BEST_SELLER, PREMIUM, NEW, LIMITED), và backward-compatible migration từ coins cũ.

## Code Analysis

### Current Structure
**Files analyzed:**
- `src/modules/shop-module/entry_point.ts` (738+ lines)
  - Interface `ShopItem`: id, name, description, price (single number), emoji, category, roleColor
  - Array `SHOP_ITEMS`: 28 Vietnamese-themed roles organized by tiers
  - Commands: /shop (with select menus), /inventory, /balance, /revoke (admin)
  - Data structure: coins.json (flat object), inventory.json (nested object)
  
- `src/modules/coins-module/entry_point.ts` (294 lines)
  - Commands: /coins with subcommands (check, add, remove, set, leaderboard)
  - Functions: loadCoins(), saveCoins(), getCoins(), addCoins(), removeCoins(), setCoins()
  - Single currency system (coins)

- `src/config/emojis.ts`
  - Custom animated emojis: success, error, warning, coin, gem, etc.
  - Helper function getEmoji() để format animated emoji strings

### Current Shop Items (28 roles)
**TIER 1: ĐỒ UỐNG & ĂN VẶT (100-200 coins)**
1. ☕ Cà Phê - 100
2. 🧋 Trà Sữa - 120
3. 🍧 Chè - 150
4. 🥖 Bánh Mì - 180
5. 🍱 Xôi - 200

**TIER 2: MÓN PHỔ BIẾN (250-350 coins)**
6. 🌯 Gỏi Cuốn - 250
7. 🍤 Nem Rán - 280
8. 🍜 Phở - 300
9. 🥞 Bánh Xèo - 320
10. 🍲 Bún Bò Huế - 350

**TIER 3: MÓN ĐẶC TRƯNG (400-500 coins)**
11. 🍚 Cơm Tấm - 400
12. 🍖 Bún Chả - 420
13. 🥟 Bánh Cuốn - 450
14. 🍝 Hủ Tiếu - 480
15. 🍜 Mì Quảng - 500

**CULTURE: VĂN HÓA VIỆT (600-800 coins)**
16. 👘 Áo Dài - 600
17. 🎩 Nón Lá - 650
18. 🎊 Tết - 700
19. 🐉 Rồng - 750
20. 🪷 Hoa Sen - 800

**PREMIUM: ĐỊA DANH NỔI TIẾNG (900-1200 coins)**
21. 🏖️ Lăng Cô - 900
22. ⛰️ Hạ Long - 1000
23. 🌃 Sài Gòn - 1100
24. 🏛️ Hà Nội - 1200

**LIMITED VIP: ROLE ĐỘC QUYỀN (1500-3000 coins)**
25. 👑 Chủ Bánh Cuốn - 1500
26. 👨‍🍳 Đầu Bếp - 2000
27. ✨ Huyền Thoại - 2500
28. 🌟 Người Sáng Lập - 3000

### Current Behavior
- Single currency (coins) stored in `data/coins.json`: `{ "userId": amount }`
- Purchase flow: select item → check coins → deduct coins → add to inventory → assign role
- Shop embed: sequential list grouped by tiers with Unicode box drawing headers
- Select menus: 2 menus (15 items + 13 items) due to Discord 25-option limit
- VIP roles (4 LIMITED): give /nickname + /customrole + x2 daily coins

---

## Implementation Plan

### FEATURE 1: Multi-Currency System & Migration
**Dependencies:** None (foundation for all features)

- [ ] 1. Create multi-currency data structure
      - Create interface `CurrencyBalance { cowoncy: number, blueTicket: number, goldTicket: number }` in coins-module
      - Create `data/currencies.json` with structure `{ [userId]: CurrencyBalance }`
      Files: src/modules/coins-module/entry_point.ts, data/currencies.json
      Verify: `npm run build` builds successfully

- [ ] 2. Implement backward-compatible migration
      - Write `migrateCoinsToCurrencies()` function: read coins.json → convert to cowoncy (1:1) → write currencies.json → backup coins.json as coins.json.bak
      - Call migration automatically in CoinsModule.initialize() if currencies.json doesn't exist but coins.json exists
      Files: src/modules/coins-module/entry_point.ts
      Verify: Delete currencies.json, run bot, check currencies.json created with migrated data

- [ ] 3. Refactor currency functions
      - Replace `loadCoins()` with `loadCurrencies(): Record<string, CurrencyBalance>`
      - Replace `saveCoins()` with `saveCurrencies(data: Record<string, CurrencyBalance>)`
      - Replace `getCoins(userId)` with `getUserBalance(userId, currency?: 'cowoncy'|'blueTicket'|'goldTicket'): number` (default = cowoncy)
      - Replace `addCoins/removeCoins/setCoins` with `addCurrency/removeCurrency/setCurrency` with currency parameter
      Files: src/modules/coins-module/entry_point.ts
      Verify: `npm run build` builds without errors

- [ ] 4. Update /coins check command
      - Modify handleCheck() to display all 3 currencies in 1 embed
      - Use Unicode box drawing: ╔═══════════════════════╗
      - Format: `💎 Cowoncy: X | 🎫 Vé Xanh: Y | 🏆 Vé Vàng: Z`
      Files: src/modules/coins-module/entry_point.ts
      Verify: Run `/coins check` in Discord, verify shows all 3 currencies

- [ ] 5. Update /coins add/remove/set commands
      - Add `.addStringOption` for currency type ('cowoncy' | 'blueTicket' | 'goldTicket', default = 'cowoncy')
      - Update handleAdd/handleRemove/handleSet to use currency parameter
      - Keep backward compatibility: no currency option = cowoncy
      Files: src/modules/coins-module/entry_point.ts
      Verify: `/coins add @user 100 cowoncy` and `/coins add @user 100 blueTicket` work correctly

- [ ] 6. Update /coins leaderboard command
      - Add `.addStringOption` for currency type
      - Sort users by selected currency (default = cowoncy)
      - Display currency type in embed title
      Files: src/modules/coins-module/entry_point.ts
      Verify: `/coins leaderboard currency:cowoncy` shows top 10, `/coins leaderboard currency:blueTicket` shows different ranking

---

### FEATURE 2: Multi-Currency Pricing, Tags & 3-Column Layout
**Dependencies:** FEAT-001 (requires multi-currency system)

- [ ] 7. Update ShopItem interface with multi-currency prices
      - Change `price: number` to `prices: { cowoncy: number, blueTicket: number, goldTicket: number }`
      - Add `tags: string[]` field
      Files: src/modules/shop-module/entry_point.ts
      Verify: TypeScript compilation succeeds

- [ ] 8. Calculate prices for all 28 items using ratios
      - For each item: `blueTicket = Math.round(cowoncy * 2.5)`, `goldTicket = Math.round(cowoncy / 10)`
      - Update SHOP_ITEMS array: replace `price: X` with `prices: { cowoncy: X, blueTicket: X*2.5, goldTicket: X/10 }`
      - Example: Ca Phê becomes `prices: { cowoncy: 100, blueTicket: 250, goldTicket: 10 }`
      Files: src/modules/shop-module/entry_point.ts
      Verify: All 28 items have 3 prices calculated correctly

- [ ] 9. Assign tags to items
      - BEST_SELLER: pho, tra_sua, ca_phe, bun_cha, banh_mi (5 items)
      - PREMIUM: huyen_thoai, nguoi_sang_lap, hoa_sen (lotus), dragon, ha_long (5 items)
      - LIMITED: chu_banh_cuon, dau_bep, huyen_thoai, nguoi_sang_lap (4 items, note overlap with PREMIUM)
      - NEW: none (0 items)
      - Add to SHOP_ITEMS: `tags: ['BEST_SELLER']` etc.
      Files: src/modules/shop-module/entry_point.ts
      Verify: grep for 'tags:' shows 28 items, count: 5 BEST_SELLER, 5 PREMIUM, 4 LIMITED

- [ ] 10. Refactor /shop command embed with 3-column layout
      - Replace sequential list with 3-column layout using ║ separator
      - Format each item: `<emoji> <tag_badges> <name>\n💎 <cowoncy> 🎫 <blue> 🏆 <gold>`
      - Tag badges: 🔥 BEST_SELLER, 👑 PREMIUM, ⭐ LIMITED
      - Layout structure:
        ```
        ╔═══ TIER 1 ═══╦═══ TIER 2 ═══╦═══ TIER 3 ═══╗
        ║ Item 1       ║ Item 6       ║ Item 11      ║
        ║ 💎 100 🎫 250║ 💎 250 🎫 625║ 💎 400 🎫 1000║
        ╠══════════════╬══════════════╬══════════════╣
        ```
      - LIMITED VIP section full-width at bottom
      Files: src/modules/shop-module/entry_point.ts
      Verify: `/shop` command shows 3-column layout, tags visible, all prices shown

- [ ] 11. Update select menu descriptions with 3 prices
      - Change description from `💰 ${item.price} coins` to `💎 ${item.prices.cowoncy} | 🎫 ${item.prices.blueTicket} | 🏆 ${item.prices.goldTicket}`
      - Keep within Discord's 100-character description limit
      Files: src/modules/shop-module/entry_point.ts
      Verify: Hover over select menu options, see all 3 prices in description

- [ ] 12. Update /balance command with multi-currency display
      - Replace single coins display with all 3 currencies
      - Use Unicode box drawing for visual structure
      - Format:
        ```
        ╔═════════════════════════════╗
        ║  💎 Cowoncy: 1,000         ║
        ║  🎫 Vé Xanh: 500           ║
        ║  🏆 Vé Vàng: 100           ║
        ╚═════════════════════════════╝
        ```
      Files: src/modules/shop-module/entry_point.ts
      Verify: `/balance` shows all 3 currencies in beautiful format

- [ ] 13. Update /inventory command with multi-currency prices
      - Show item prices in all 3 currencies for each owned item
      Files: src/modules/shop-module/entry_point.ts
      Verify: `/inventory` displays items with 3-price format

---

### FEATURE 3: Multi-Currency Purchase Logic
**Dependencies:** FEAT-001 (currency system), FEAT-002 (pricing defined)

- [ ] 14. Add currency selection buttons to purchase flow
      - When user selects item from menu, show 3 buttons: `💎 Trả Cowoncy`, `🎫 Trả Vé Xanh`, `🏆 Trả Vé Vàng`
      - CustomId format: `purchase_<itemId>_<currency>`
      - Each button shows corresponding price
      Files: src/modules/shop-module/entry_point.ts
      Verify: Select item in shop, see 3 currency buttons appear

- [ ] 15. Implement multi-currency purchase logic
      - Parse customId to extract itemId and currency
      - Get price: `const price = item.prices[currency]`
      - Check balance: `const balance = getUserBalance(userId, currency)`
      - If insufficient: show error embed with current balance and amount needed
      - If sufficient: `removeCurrency(userId, price, currency)`, `addToInventory(userId, itemId)`, assign role
      Files: src/modules/shop-module/entry_point.ts
      Verify: Purchase works with all 3 currencies, correct amount deducted

- [ ] 16. Create purchase confirmation embed
      - Show: item purchased, currency used, amount paid, remaining balance (all 3 currencies)
      - Format:
        ```
        ✅ Mua Thành Công!
        ╔═══════════════════════════╗
        ║  ☕ Cà Phê               ║
        ╚═══════════════════════════╝
        💸 Đã trả: 100 💎 Cowoncy
        
        📊 Số dư còn lại:
        💎 900 | 🎫 1,500 | 🏆 50
        ```
      Files: src/modules/shop-module/entry_point.ts
      Verify: After purchase, confirmation shows all details correctly

- [ ] 17. Implement transaction logging system
      - Create `data/transactions.json` structure: `{ userId, itemId, currency, amount, timestamp }[]`
      - Log every successful purchase with timestamp
      - Create helper functions: `logTransaction(userId, itemId, currency, amount)`, `getTransactions(userId, limit?)`
      Files: src/modules/shop-module/entry_point.ts, data/transactions.json
      Verify: Purchase items, check transactions.json has logs with correct data

- [ ] 18. Handle insufficient balance errors
      - When balance < price: create error embed showing current balance and deficit
      - Format: `❌ Không đủ tiền! Bạn có X, cần Y, thiếu Z`
      - Show all 3 currency balances for reference
      Files: src/modules/shop-module/entry_point.ts
      Verify: Try to purchase expensive item with low balance, see clear error message

- [ ] 19. Verify /revoke compatibility (no changes needed)
      - Existing /revoke should work without modification (doesn't refund money)
      - Test: admin revokes role, inventory cleared, role removed, no currency refund
      Files: src/modules/shop-module/entry_point.ts
      Verify: `/revoke @user` works correctly, no currency returned

- [ ] 20. Verify VIP privileges still work
      - LIMITED roles (chu_banh_cuon, dau_bep, huyen_thoai, nguoi_sang_lap) still give:
        - /nickname permission
        - /customrole permission
        - x2 coins from /daily (note: need to update /daily if exists)
      Files: Verify VIP role checks in other modules (nickname-module, customrole-module, daily-module if they exist)
      Verify: Purchase LIMITED role, test /nickname and /customrole commands work

---

## Price Reference Table

| Item | Tier | Cowoncy 💎 | Vé Xanh 🎫 | Vé Vàng 🏆 | Tags |
|------|------|-----------|-----------|-----------|------|
| Cà Phê | 1 | 100 | 250 | 10 | BEST_SELLER |
| Trà Sữa | 1 | 120 | 300 | 12 | BEST_SELLER |
| Chè | 1 | 150 | 375 | 15 | - |
| Bánh Mì | 1 | 180 | 450 | 18 | BEST_SELLER |
| Xôi | 1 | 200 | 500 | 20 | - |
| Gỏi Cuốn | 2 | 250 | 625 | 25 | - |
| Nem Rán | 2 | 280 | 700 | 28 | - |
| Phở | 2 | 300 | 750 | 30 | BEST_SELLER |
| Bánh Xèo | 2 | 320 | 800 | 32 | - |
| Bún Bò Huế | 2 | 350 | 875 | 35 | - |
| Cơm Tấm | 3 | 400 | 1000 | 40 | - |
| Bún Chả | 3 | 420 | 1050 | 42 | BEST_SELLER |
| Bánh Cuốn | 3 | 450 | 1125 | 45 | - |
| Hủ Tiếu | 3 | 480 | 1200 | 48 | - |
| Mì Quảng | 3 | 500 | 1250 | 50 | - |
| Áo Dài | Culture | 600 | 1500 | 60 | - |
| Nón Lá | Culture | 650 | 1625 | 65 | - |
| Tết | Culture | 700 | 1750 | 70 | - |
| Rồng | Culture | 750 | 1875 | 75 | PREMIUM |
| Hoa Sen | Culture | 800 | 2000 | 80 | PREMIUM |
| Lăng Cô | Premium | 900 | 2250 | 90 | - |
| Hạ Long | Premium | 1000 | 2500 | 100 | PREMIUM |
| Sài Gòn | Premium | 1100 | 2750 | 110 | - |
| Hà Nội | Premium | 1200 | 3000 | 120 | - |
| Chủ Bánh Cuốn | VIP | 1500 | 3750 | 150 | LIMITED |
| Đầu Bếp | VIP | 2000 | 5000 | 200 | LIMITED |
| Huyền Thoại | VIP | 2500 | 6250 | 250 | PREMIUM, LIMITED |
| Người Sáng Lập | VIP | 3000 | 7500 | 300 | PREMIUM, LIMITED |

---

## Migration Strategy

### Phase 1: Data Migration (FEAT-001)
1. **Backup existing data**: Copy `coins.json` to `coins.json.bak`
2. **Create new structure**: Generate `currencies.json` with CurrencyBalance interface
3. **Convert data**: coins → cowoncy (1:1), blueTicket = 0, goldTicket = 0 (initial)
4. **Preserve original**: Keep `coins.json.bak` for rollback if needed

### Phase 2: Code Migration (FEAT-001)
1. **Update interfaces**: CurrencyBalance type
2. **Refactor functions**: Multi-currency support with backward compatibility
3. **Update commands**: /coins subcommands with currency options
4. **Default behavior**: When currency not specified → use cowoncy (backward compatible)

### Phase 3: Shop Integration (FEAT-002 & FEAT-003)
1. **Update prices**: Add 3-currency pricing to all items
2. **Add tags**: Assign BEST_SELLER, PREMIUM, LIMITED tags
3. **Refactor UI**: 3-column layout, tag badges
4. **Purchase flow**: Currency selection buttons → payment → confirmation

---

## Verification Checklist

### Build & Compilation
- [ ] `npm run build` compiles without errors
- [ ] No TypeScript type errors
- [ ] All imports resolve correctly

### Data Migration
- [ ] currencies.json created successfully
- [ ] coins.json backed up as coins.json.bak
- [ ] Existing user balances migrated to cowoncy
- [ ] New users can receive all 3 currencies

### Commands Testing
- [ ] `/coins check` shows all 3 currencies
- [ ] `/coins add @user 100 cowoncy` works
- [ ] `/coins add @user 100 blueTicket` works
- [ ] `/coins add @user 100 goldTicket` works
- [ ] `/coins remove` works for all currencies
- [ ] `/coins set` works for all currencies
- [ ] `/coins leaderboard currency:cowoncy` shows top 10
- [ ] `/coins leaderboard currency:blueTicket` shows different ranking
- [ ] `/balance` displays all 3 currencies beautifully
- [ ] `/shop` shows 3-column layout with tags
- [ ] `/inventory` shows items with 3-price format

### Purchase Flow
- [ ] Select item → see 3 currency buttons
- [ ] Purchase with cowoncy → correct deduction
- [ ] Purchase with blueTicket → correct deduction
- [ ] Purchase with goldTicket → correct deduction
- [ ] Insufficient balance → clear error message
- [ ] Successful purchase → role assigned, inventory updated
- [ ] Confirmation embed shows all details
- [ ] transactions.json logs purchase correctly

### Edge Cases
- [ ] User with 0 balance tries to purchase → error handled
- [ ] User tries to buy item twice → "already have role" message
- [ ] Admin /revoke → role removed, no refund
- [ ] LIMITED VIP purchase → /nickname and /customrole work
- [ ] Select menu descriptions fit in 100 chars
- [ ] 3-column layout doesn't break on mobile Discord

### Visual Testing
- [ ] Shop embed looks beautiful with Unicode box drawing
- [ ] Tags (🔥 👑 ⭐) are visible and appealing
- [ ] 3-column layout is balanced and readable
- [ ] Balance embed is clean and organized
- [ ] Confirmation embed is professional

---

## Rationale for Key Decisions

### 1. Why 3 currencies instead of 1?
- **Gamification**: Multiple currencies add depth and strategy to economy
- **Flexibility**: Users can earn different currencies from different activities
- **Realism**: Matches real-world multi-currency systems (like MMO games)

### 2. Why these ratios? (1 cowoncy = 2.5 blue = 0.1 gold)
- **Cowoncy**: Base currency, 1:1 migration from old coins
- **Blue Ticket**: Common currency, 2.5x easier to earn, for lower-tier items
- **Gold Ticket**: Premium currency, 10x value, for high-tier items
- **Balance**: Creates natural progression (blue for early game, cowoncy for mid, gold for endgame)

### 3. Why backward-compatible migration?
- **Zero downtime**: Existing users don't lose progress
- **Seamless transition**: Old commands still work (default to cowoncy)
- **Safe rollback**: coins.json.bak preserved for emergencies

### 4. Why 3-column layout?
- **Space efficiency**: Fits more items in one embed (Discord 4096 char limit)
- **Visual appeal**: Organized, professional look
- **Readability**: Easy to scan and compare items

### 5. Why these tag assignments?
- **BEST_SELLER**: Most popular Vietnamese foods (pho, banh mi, coffee, bun cha, tra sua)
- **PREMIUM**: High-value cultural icons and legendary items
- **LIMITED**: VIP-only roles with special privileges
- **NEW**: Reserved for future additions

### 6. Why log transactions?
- **Audit trail**: Track all purchases for debugging and analytics
- **Future features**: Enable /history command, refund system, statistics
- **Security**: Detect unusual purchase patterns or exploits

---

## Risks & Mitigations

### Risk 1: Data Migration Failure
- **Mitigation**: Backup coins.json before migration, test on dev environment first
- **Rollback**: Restore from coins.json.bak if migration fails

### Risk 2: Discord Embed Length Limit (4096 chars)
- **Mitigation**: Calculate total character count in 3-column layout, optimize spacing
- **Fallback**: If too long, split into 2 embeds or reduce item descriptions

### Risk 3: Select Menu Option Limit (25 options)
- **Current solution**: Already split into 2 menus (15 + 13)
- **Keep**: No changes needed, works within Discord limits

### Risk 4: Button Limit (5 per row, 25 total)
- **Current solution**: Purchase flow uses 3 buttons (currencies) < 5 limit
- **Safe**: Well within Discord constraints

### Risk 5: Breaking Existing Features
- **Mitigation**: Extensive testing of /coins, /shop, /balance, /inventory, /revoke
- **Backward compatibility**: Default to cowoncy when currency not specified

---

## Dependencies & Order

**Must complete in this exact order:**
1. **FEAT-001 first**: Multi-currency system is foundation for everything
2. **FEAT-002 second**: Pricing and UI require currency system to exist
3. **FEAT-003 last**: Purchase logic depends on both pricing and currency system

**Cannot parallelize**: Each feature builds on the previous one.

---

## Testing Strategy

### Unit Testing (Manual - no test framework detected)
1. Test each function in isolation: getUserBalance, addCurrency, removeCurrency
2. Test edge cases: negative amounts, non-existent users, invalid currencies

### Integration Testing
1. Test full purchase flow: select → choose currency → pay → receive role
2. Test admin flow: add currency → user purchases → admin revokes
3. Test migration: backup coins.json → delete currencies.json → restart bot → verify

### User Acceptance Testing
1. Visual inspection: embeds look good on desktop and mobile
2. User flow: intuitive navigation through shop and purchase
3. Error messages: clear and helpful when issues occur

### Regression Testing
1. Old commands still work: /coins without currency option uses cowoncy
2. Existing roles preserved: users don't lose items after upgrade
3. VIP privileges intact: /nickname and /customrole still work for LIMITED roles

---

## Success Criteria

✅ **All 3 currencies implemented and functional**  
✅ **Migration completes successfully for all users**  
✅ **Shop displays 3-column layout with tags**  
✅ **Purchase flow supports all 3 currencies**  
✅ **Backward compatibility maintained (old commands work)**  
✅ **No data loss during migration**  
✅ **Visual design is beautiful and professional**  
✅ **All 28 roles have correct pricing**  
✅ **Tags assigned correctly (5 BEST_SELLER, 5 PREMIUM, 4 LIMITED)**  
✅ **Transactions logged correctly**  
✅ **VIP privileges still work**  
✅ **No breaking changes to existing features**  

---

## Post-Implementation Tasks

### Documentation
- [ ] Update README.md with new currency system
- [ ] Document currency ratios and earning methods
- [ ] Create user guide for multi-currency purchases

### Monitoring
- [ ] Monitor transactions.json for unusual patterns
- [ ] Track currency distribution across users
- [ ] Analyze popular currency choices for purchases

### Future Enhancements
- [ ] `/history` command to view purchase history
- [ ] `/exchange` command to convert between currencies
- [ ] Dynamic pricing based on supply/demand
- [ ] Seasonal sales and discounts
- [ ] Currency earning from minigames (/daily, /quest, etc.)

---

**Plan created:** 2026-01-XX  
**Estimated completion:** 3-5 hours (depends on testing thoroughness)  
**Complexity:** Medium (requires careful data migration and extensive UI refactoring)
