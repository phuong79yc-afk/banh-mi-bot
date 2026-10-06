# Implementation Plan: Shop Module Refactor

## Overview
Refactor the shop module (`entry_point.ts`) to match a Vietnamese-style Discord shop pattern inspired by the provided Banhcuon bot reference. The main changes involve adding a stock system, rebuilding the shop UI with inline fields, adding purchase protection, and implementing a rollback pattern for safe transactions.

## Codebase Context

**Current State:**
- **Main File:** `c:\projects\code\src\modules\shop-module\entry_point.ts` (858+ lines)
- **Architecture:** TypeScript Discord bot with module system (discord.js v14)
- **Data Storage:** JSON files in `data/` directory
  - `data/currencies.json` - User balances (cowoncy, blueTicket, goldTicket)
  - `data/inventory.json` - User purchased items
  - `data/coins.json` - Legacy coins (migrated to cowoncy)
  - `data/vip_custom_roles.json` - Custom VIP roles
- **Emojis:** Animated emojis from `src/config/emojis.ts` (format: `<a:name:id>`)
- **Build System:** TypeScript → `npm run build` (outputs to `dist/`)
- **Test:** No automated tests found - manual testing via Discord
- **Module Pattern:** Each module exports a class with `initialize()`, `registerCommands()`, and `cleanup()`

**Current Shop Features:**
- 5 bot-related roles with multi-currency pricing (cowoncy, blueTicket, goldTicket)
- `/shop` - Display shop with banner, fields layout, select menu
- `/inventory` - View purchased items
- `/balance` - Check currency balances
- `/revoke` - Admin-only role removal
- Purchase flow: select item → check balance → deduct → create/assign role → update display

**Issues to Fix:**
1. No stock tracking system for limited items
2. No purchase concurrency protection (user can spam purchase button)
3. Purchase handler doesn't rollback currency on role assignment failure
4. Shop embed uses text-table description instead of inline fields
5. Select menu emoji doesn't extract ID properly from animated emoji strings

---

## Implementation Steps

### 1. Create Stock Tracking System

**What:** Add a new JSON-based stock tracking system for limited-quantity items.

**Files to create:**
- `c:\projects\code\data\shop-sold.json` (initial content: `{}`)

**Files to modify:**
- `c:\projects\code\src\modules\shop-module\entry_point.ts`

**Changes:**
- Add `stock?: number` field to `ShopItem` interface (line ~48)
- Add three new functions after `saveInventory()` (around line ~220):
  ```typescript
  const shopSoldPath = path.join(process.cwd(), 'data', 'shop-sold.json');
  
  // Initialize shop-sold.json if not exists
  if (!fs.existsSync(shopSoldPath)) {
    fs.writeFileSync(shopSoldPath, JSON.stringify({}));
  }
  
  type ShopSoldData = Record<string, number>;
  
  function loadShopSold(): ShopSoldData {
    try {
      return JSON.parse(fs.readFileSync(shopSoldPath, 'utf8'));
    } catch {
      return {};
    }
  }
  
  function saveShopSold(data: ShopSoldData): void {
    fs.writeFileSync(shopSoldPath, JSON.stringify(data, null, 2));
  }
  
  function getSoldCount(itemId: string): number {
    const data = loadShopSold();
    return data[itemId] || 0;
  }
  
  function incrementSold(itemId: string): void {
    const data = loadShopSold();
    data[itemId] = (data[itemId] || 0) + 1;
    saveShopSold(data);
  }
  
  function decrementSold(itemId: string): void {
    const data = loadShopSold();
    data[itemId] = Math.max(0, (data[itemId] || 0) - 1);
    saveShopSold(data);
  }
  ```
- Add `stock` field to items in `SHOP_ITEMS` array (lines ~70-125):
  - `bot_supporter`: add `stock: 50`
  - `bot_designer`: add `stock: 30`
  - `bot_developer`: add `stock: 15`
  - Leave `premium_member` and `bot_owner` without stock (unlimited)

**Verify:** Build the project with `npm run build` and check that `dist/src/modules/shop-module/entry_point.js` compiles without errors. Start the bot and check console for successful module initialization.

---

### 2. Add Purchase Concurrency Protection

**What:** Add a `Set<string>` to track users currently in a purchase transaction, preventing double-purchases from rapid clicking.

**Files to modify:**
- `c:\projects\code\src\modules\shop-module\entry_point.ts`

**Changes:**
- After the `SHOP_ITEMS` array definition (around line ~126), add:
  ```typescript
  // Purchase concurrency protection
  const busyUsers = new Set<string>();
  ```
- In the `shop_buy` handler (inside the collector, around line ~580), wrap the entire purchase logic:
  ```typescript
  if (i.customId === 'shop_buy' && i.isStringSelectMenu()) {
    const userId = i.user.id;
    
    // Check if user is already purchasing
    if (busyUsers.has(userId)) {
      await i.reply({
        content: `⏳ Đang xử lý lượt mua trước của bạn, vui lòng đợi...`,
        flags: 64
      });
      return;
    }
    
    busyUsers.add(userId);
    
    try {
      // ... entire purchase logic stays here ...
    } finally {
      busyUsers.delete(userId);
    }
  }
  ```

**Verify:** Build with `npm run build`. Test in Discord by rapidly clicking the same shop item multiple times - should show "Đang xử lý..." message on second click.

---

### 3. Rebuild `buildShop()` Function with Inline Fields

**What:** Replace the current embed description (text-table format) with inline embed fields for each item, following the Vietnamese shop pattern. Remove the `buildShopDescription()` function entirely.

**Files to modify:**
- `c:\projects\code\src\modules\shop-module\entry_point.ts`

**Changes:**

**Step 3a:** Delete `buildShopDescription()` function (lines ~166-240) and all its helper functions (`padRight`, `formatTag`, `wrapText`).

**Step 3b:** Create new helper function after `formatNumber()` (around line ~165):
```typescript
function getStockLeft(itemId: string, stock?: number): number | typeof Infinity {
  if (!stock) return Infinity;
  return Math.max(0, stock - getSoldCount(itemId));
}

function buildShop(client: Client, userId?: string) {
  const icon = client.user?.displayAvatarURL();
  const bal = userId ? getUserBalance(userId) : { cowoncy: 0, blueTicket: 0, goldTicket: 0 };
  
  // Build fields - each item becomes ONE inline field
  const fields = SHOP_ITEMS.map(item => {
    const stockLeft = getStockLeft(item.id, item.stock);
    
    // Build price lines array
    const priceLines: string[] = [
      `**${formatNumber(item.prices.cowoncy)}** ${emojis.gem}`,
      `**${item.prices.blueTicket}** ${emojis.trophy}`,
      `**${item.prices.goldTicket}** 🏆`
    ];
    
    // Add stock info if applicable
    if (item.stock) {
      if (stockLeft > 0) {
        priceLines.push(`Còn ${stockLeft}/${item.stock} suất`);
      } else {
        priceLines.push(`**Hết suất**`);
      }
    }
    
    // Build field value
    const mention = item.roleId ? `<@&${item.roleId}>` : `${item.emoji} **${item.name}**`;
    const tagLabel = item.tag ? `**[${item.tag === 'BEST_SELLER' ? 'BEST SELLER' : item.tag}]** ` : '';
    
    return {
      name: '\u200B', // zero-width space
      value: [
        mention,
        `${tagLabel}${item.description}`,
        priceLines.map(x => `> - ${x}`).join('\n')
      ].join('\n'),
      inline: true
    };
  });
  
  // Add "Buy All" field (non-inline)
  const totalPrices = SHOP_ITEMS.reduce(
    (acc, item) => ({
      cowoncy: acc.cowoncy + item.prices.cowoncy,
      blueTicket: acc.blueTicket + item.prices.blueTicket,
      goldTicket: acc.goldTicket + item.prices.goldTicket
    }),
    { cowoncy: 0, blueTicket: 0, goldTicket: 0 }
  );
  
  fields.push({
    name: '\u200B',
    value: 
      `${emojis.gift} **Mua full các role**\n` +
      `> - Giá: \`${formatNumber(totalPrices.cowoncy)} ${emojis.gem} • ${totalPrices.blueTicket} ${emojis.trophy} • ${totalPrices.goldTicket} 🏆\``,
    inline: false
  });
  
  // Build embed
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setAuthor({
      name: 'Cửa Hàng Role Bot',
      iconURL: icon
    })
    .setDescription(
      `Bạn có thể mua các role trong cửa hàng bằng ${emojis.gem} **Cowoncy** hoặc ${emojis.trophy} **Vé xanh** hoặc 🏆 **Vé vàng**.\n` +
      `Dùng \`/balance\` để xem số dư của bạn.` +
      (userId ? `\n\n👤 **Số dư hiện tại:**\n💎 ${formatNumber(bal.cowoncy)} • 🎫 ${bal.blueTicket} • 🏆 ${bal.goldTicket}` : '')
    )
    .addFields(fields)
    .setFooter({ text: `Bot Shop • Chọn role ở menu bên dưới`, iconURL: icon });
  
  // Build select menu with proper emoji extraction
  const menuOptions = SHOP_ITEMS.map(item => {
    const stockLeft = getStockLeft(item.id, item.stock);
    const stockInfo = item.stock ? ` • còn ${stockLeft}/${item.stock}` : '';
    const tagLabel = item.tag === 'BEST_SELLER' ? ' [BEST SELLER]' :
                     item.tag === 'PREMIUM' ? ' [PREMIUM]' :
                     item.tag === 'LIMITED' ? ' [LIMITED]' :
                     item.tag === 'EXCLUSIVE' ? ' [EXCLUSIVE]' : '';
    
    // Extract emoji ID from animated emoji string: <a:name:id>
    const emojiMatch = item.emoji.match(/<a?:(\w+):(\d+)>/);
    const emojiConfig = emojiMatch ? {
      id: emojiMatch[2],
      name: emojiMatch[1],
      animated: item.emoji.startsWith('<a:')
    } : { name: '❓' };
    
    return new StringSelectMenuOptionBuilder()
      .setLabel(item.name + tagLabel)
      .setDescription(
        `${formatNumber(item.prices.cowoncy)} 💎 • ${item.prices.blueTicket} 🎫 • ${item.prices.goldTicket} 🏆${stockInfo}`
      )
      .setValue(item.id)
      .setEmoji(emojiConfig);
  });
  
  // Add "all" option
  menuOptions.push(
    new StringSelectMenuOptionBuilder()
      .setLabel('Mua full tất cả role')
      .setValue('all')
      .setDescription(`${formatNumber(totalPrices.cowoncy)} 💎 • ${totalPrices.blueTicket} 🎫 • ${totalPrices.goldTicket} 🏆`)
      .setEmoji(emojis.gift.match(/<a?:\w+:(\d+)>/)![1])
  );
  
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('shop_buy')
    .setPlaceholder('🛒 Chọn role bạn muốn mua...')
    .addOptions(menuOptions);
  
  // Buttons
  const buttonRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('shop_refresh')
        .setLabel('🔄 Refresh')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('shop_vipinfo')
        .setLabel('👑 VIP Info')
        .setStyle(ButtonStyle.Secondary)
    );
  
  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
      buttonRow
    ]
  };
}
```

**Step 3c:** Update `/shop` command execute function (around line ~350) to use new `buildShop()`:
```typescript
const userId = interaction.user.id;
const shopMessage = buildShop(interaction.client, userId);

// Add banner if exists
const bannerPath = path.join(process.cwd(), 'assets', 'banners', 'shop-banner.gif');
const files = fs.existsSync(bannerPath) 
  ? [new AttachmentBuilder(bannerPath, { name: 'shop-banner.gif' })]
  : [];

const response = await interaction.editReply({
  ...shopMessage,
  files
});
```

**Step 3c:** Update `shop_refresh` button handler (around line ~430) to use new `buildShop()`:
```typescript
if (i.customId === 'shop_refresh') {
  await i.deferUpdate();
  const refreshed = buildShop(i.client, userId);
  await i.editReply(refreshed);
  return;
}
```

**Note:** The item doesn't define `roleId` in the current `SHOP_ITEMS` - roles are created dynamically with name `${emoji} ${name}`. Keep the mention logic as `${item.emoji} **${item.name}**` since roleId is not set.

**TypeScript Gotchas:**
- Animated emoji format: `<a:name:id>` - extract ID with regex `/<a?:\w+:(\d+)>/`
- For `setEmoji()`, pass object: `{ id: string, name: string, animated: boolean }`
- Zero-width space for field name: `'\u200B'`
- Inline fields show 3 per row, add non-inline field to break to new row

**Verify:** Build with `npm run build`. Test `/shop` command in Discord - should see inline fields layout with prices and stock info, not text table. Check that emojis display correctly in select menu.

---

### 4. Rewrite Purchase Handler with Rollback Pattern

**What:** Rewrite the `shop_buy` collector handler to deduct currencies FIRST, then rollback on failure. Add stock checking and "buy all" logic handling skipped items.

**Files to modify:**
- `c:\projects\code\src\modules\shop-module\entry_point.ts`

**Changes:**

Replace the entire `shop_buy` handler (inside collector.on('collect'), around lines ~580-680) with:

```typescript
if (i.customId === 'shop_buy' && i.isStringSelectMenu()) {
  const userId = i.user.id;
  
  // Check if user is already purchasing
  if (busyUsers.has(userId)) {
    await i.reply({
      content: `⏳ Đang xử lý lượt mua trước của bạn, vui lòng đợi...`,
      flags: 64
    });
    return;
  }
  
  busyUsers.add(userId);
  
  try {
    const selectedValue = i.values[0];
    let targetItems: ShopItem[] = [];
    const skipped: string[] = [];
    
    // Handle "all" or single item
    if (selectedValue === 'all') {
      targetItems = SHOP_ITEMS.slice();
    } else {
      const item = SHOP_ITEMS.find(it => it.id === selectedValue);
      if (!item) {
        await i.reply({
          content: `${emojis.error} Item không tồn tại!`,
          flags: 64
        });
        return;
      }
      targetItems = [item];
    }
    
    // Filter out items user already has or out of stock
    const member = i.guild?.members.cache.get(userId);
    targetItems = targetItems.filter(item => {
      const roleName = `${item.emoji} ${item.name}`;
      
      // Check already has role
      if (member?.roles.cache.find(r => r.name === roleName)) {
        skipped.push(`${item.name} (đã có)`);
        return false;
      }
      
      // Check stock
      const stockLeft = getStockLeft(item.id, item.stock);
      if (stockLeft <= 0) {
        skipped.push(`${item.name} (hết suất)`);
        return false;
      }
      
      return true;
    });
    
    // No items to purchase
    if (targetItems.length === 0) {
      await i.reply({
        content: `${emojis.error} Không có gì để mua: ${skipped.join(', ')}.`,
        flags: 64
      });
      return;
    }
    
    // Calculate total price
    const totalPrice = targetItems.reduce(
      (acc, item) => ({
        cowoncy: acc.cowoncy + item.prices.cowoncy,
        blueTicket: acc.blueTicket + item.prices.blueTicket,
        goldTicket: acc.goldTicket + item.prices.goldTicket
      }),
      { cowoncy: 0, blueTicket: 0, goldTicket: 0 }
    );
    
    // Check balance
    const currentBal = getUserBalance(userId);
    const shortCowoncy = Math.max(0, totalPrice.cowoncy - currentBal.cowoncy);
    const shortBlue = Math.max(0, totalPrice.blueTicket - currentBal.blueTicket);
    const shortGold = Math.max(0, totalPrice.goldTicket - currentBal.goldTicket);
    
    if (shortCowoncy > 0 || shortBlue > 0 || shortGold > 0) {
      let errorMsg = `❌ Không đủ tiền!\n\n`;
      if (shortCowoncy > 0) {
        errorMsg += `💎 Cowoncy: có ${formatNumber(currentBal.cowoncy)} / cần ${formatNumber(totalPrice.cowoncy)} (thiếu ${formatNumber(shortCowoncy)})\n`;
      }
      if (shortBlue > 0) {
        errorMsg += `🎫 Vé Xanh: có ${currentBal.blueTicket} / cần ${totalPrice.blueTicket} (thiếu ${shortBlue})\n`;
      }
      if (shortGold > 0) {
        errorMsg += `🏆 Vé Vàng: có ${currentBal.goldTicket} / cần ${totalPrice.goldTicket} (thiếu ${shortGold})\n`;
      }
      
      await i.reply({
        content: errorMsg,
        flags: 64
      });
      return;
    }
    
    // Defer reply before transaction
    await i.deferReply({ flags: 64 });
    
    // ===== START TRANSACTION =====
    // 1. Snapshot old balance for rollback
    const oldBalance = { ...currentBal };
    
    // 2. Deduct currencies FIRST
    if (!deductCurrencies(userId, totalPrice)) {
      await i.editReply({
        content: `${emojis.error} Lỗi khi trừ tiền!`
      });
      return;
    }
    
    // 3. Increment sold count
    targetItems.forEach(item => {
      if (item.stock) {
        incrementSold(item.id);
      }
    });
    
    // 4. Try to assign roles
    try {
      const rolesToAdd: string[] = [];
      
      for (const item of targetItems) {
        const roleName = `${item.emoji} ${item.name}`;
        let role = i.guild?.roles.cache.find(r => r.name === roleName);
        
        // Create role if doesn't exist
        if (!role && i.guild) {
          role = await i.guild.roles.create({
            name: roleName,
            color: item.roleColor,
            hoist: true,
            reason: `Shop purchase by ${i.user.tag}`
          });
        }
        
        if (role) {
          rolesToAdd.push(role.id);
        }
      }
      
      // Add all roles at once
      if (rolesToAdd.length > 0 && member) {
        await member.roles.add(rolesToAdd, 'Shop purchase');
      }
      
      // 5. Add to inventory
      targetItems.forEach(item => {
        addToInventory(userId, item.id);
      });
      
      // ===== SUCCESS =====
      const newBal = getUserBalance(userId);
      
      const successEmbed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('✅ Mua Thành Công!')
        .setDescription(
          `**Đã mua:** ${targetItems.map(t => `${t.emoji} ${t.name}`).join(', ')}\n\n` +
          `💎 Cowoncy: -${formatNumber(totalPrice.cowoncy)} (còn ${formatNumber(newBal.cowoncy)})\n` +
          `🎫 Vé Xanh: -${totalPrice.blueTicket} (còn ${newBal.blueTicket})\n` +
          `🏆 Vé Vàng: -${totalPrice.goldTicket} (còn ${newBal.goldTicket})\n\n` +
          `🎁 Role đã thêm vào profile!` +
          (skipped.length > 0 ? `\n\n**Bỏ qua:** ${skipped.join(', ')}` : '')
        )
        .setThumbnail(i.user.displayAvatarURL({ size: 256 }))
        .setFooter({ 
          text: `Cảm ơn ${i.user.username} đã ủng hộ!`,
          iconURL: i.user.displayAvatarURL()
        })
        .setTimestamp();
      
      await i.editReply({ embeds: [successEmbed] });
      
      // Refresh shop display
      const refreshed = buildShop(i.client, userId);
      await interaction.editReply(refreshed).catch(() => {});
      
    } catch (roleError) {
      // ===== ROLLBACK ON ROLE FAILURE =====
      console.error('[Shop] Role assignment failed:', roleError);
      
      // Restore balance by directly writing old balance
      const allData = loadCurrencies();
      allData[userId] = oldBalance;
      saveCurrencies(allData);
      
      // Decrement sold count
      targetItems.forEach(item => {
        if (item.stock) {
          decrementSold(item.id);
        }
      });
      
      await i.editReply({
        content: 
          `${emojis.error} Lỗi khi gắn role! Có thể do:\n` +
          `• Bot thiếu quyền **Manage Roles**\n` +
          `• Role của bot thấp hơn role cần gắn\n\n` +
          `💰 Tiền của bạn đã được hoàn lại.`
      });
    }
    
  } finally {
    busyUsers.delete(userId);
  }
}
```

**Verify:** Build with `npm run build`. Test in Discord:
1. Purchase a role with sufficient balance → should succeed and refresh shop showing updated stock
2. Purchase with insufficient balance → should show detailed shortage message
3. Purchase an out-of-stock item → should show "hết suất" message
4. Simulate role permission error (remove bot's Manage Roles) → should rollback currency and show error
5. Use "Mua full tất cả role" → should handle multiple items and show skipped list

---

### 5. Update VIP Info Button Handler

**What:** Ensure VIP Info button handler remains unchanged (keep existing functionality).

**Files to modify:**
- None (verify existing code)

**Changes:**
- No changes needed - the `shop_vipinfo` button handler (around line ~460) should remain as-is

**Verify:** Click "👑 VIP Info" button in shop - should display VIP benefits embed.

---

### 6. Final Integration & Testing

**What:** Verify all changes work together and the module initializes correctly.

**Files to modify:**
- None

**Changes:**
- None

**Verify:**
1. Build: `npm run build` - no TypeScript errors
2. Start bot: `node dist/src/index.js` - check console for "🎁 Shop module initialized"
3. Test `/shop` command:
   - Should display inline fields layout (not text table)
   - Each item shows prices and stock info
   - Select menu shows all items with correct emojis
   - "Mua full tất cả role" option exists
4. Test purchase flow:
   - Single item purchase with sufficient balance → success
   - Rapid clicking same item → "Đang xử lý..." message
   - Purchase out-of-stock item → "hết suất" error
   - Purchase without enough currency → detailed shortage message
   - Buy all items → handles skipped items correctly
5. Test stock persistence:
   - Purchase an item
   - Check `data/shop-sold.json` - should show incremented count
   - Restart bot
   - Run `/shop` - stock should be correctly reduced
6. Test other commands still work:
   - `/inventory` - shows purchased items
   - `/balance` - shows currency balances
   - `/revoke` (admin) - removes role and decrements stock

---

## Summary of Changes

**New Files:**
- `c:\projects\code\data\shop-sold.json` - Stock tracking database

**Modified Files:**
- `c:\projects\code\src\modules\shop-module\entry_point.ts`

**Added Functions:**
- `getSoldCount(itemId)` - Get sold count for item
- `incrementSold(itemId)` - Increment sold count
- `decrementSold(itemId)` - Decrement sold count (for rollback)
- `getStockLeft(itemId, stock)` - Calculate remaining stock
- `buildShop(client, userId?)` - New shop builder with inline fields

**Removed Functions:**
- `buildShopDescription()` - Replaced by inline fields
- `padRight()` - No longer needed
- `formatTag()` - Inlined into buildShop
- `wrapText()` - No longer needed

**Modified Constants:**
- `SHOP_ITEMS` - Added `stock` field to 3 items
- Added `busyUsers` Set for concurrency protection

**Modified Handlers:**
- `/shop` command execute - Uses new `buildShop()`
- `shop_refresh` button - Uses new `buildShop()`
- `shop_buy` handler - Complete rewrite with rollback pattern

**Key Technical Details:**
- Emoji extraction: Use regex `/<a?:(\w+):(\d+)>/` to parse animated emoji strings
- Emoji in select menu: Pass `{ id: string, name: string, animated: boolean }`
- Rollback: Save `oldBalance` before deduction, directly write it back on failure
- Stock tracking: Separate JSON file, increment on purchase, decrement on rollback
- Concurrency: Use `Set<string>` with try-finally to ensure cleanup
- Inline fields: Use `'\u200B'` for name, set `inline: true` (3 per row)

**Build Command:** `npm run build`  
**Run Command:** `node dist/src/index.js`  
**No automated tests** - manual testing in Discord required
