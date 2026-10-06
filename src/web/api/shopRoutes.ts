import { Router, Request, Response } from 'express';
import { Client, PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { validateAdminAuth, validateUserId } from '../../utils/validation';

// Helper function to get role color based on item
function getColorForItem(itemId: string): number {
  const colors: any = {
    // Premium (Ultra rare)
    'chutiem': 0xFF1493,           // Deep Pink - Chủ Tiệm
    'banhcuonchua': 0xFFD700,      // Gold - Bánh Cuốn Chúa
    'hanhphi': 0xFF4500,           // Orange Red - Hành Phi Elite
    
    // High tier
    'thitquay': 0xCD5C5C,          // Indian Red - Thịt Quay Lover
    'banhmi': 0xFFA500,            // Orange - Bánh Mì Fan
    'nuoccham': 0x8B4513,          // Saddle Brown - Fan Nước Chấm
    'buncha': 0xD2691E,            // Chocolate - Bún Chả Hà Nội
    
    // Mid tier
    'giocuon': 0x90EE90,           // Light Green - Giò Cuốn Gang
    'comtam': 0xDEB887,            // Burlywood - Cơm Tấm Master
    'banhbao': 0xF5DEB3,           // Wheat - Bánh Bao Squad
    'nemchua': 0xFF6347,           // Tomato - Nem Chua Collector
    
    // Standard tier
    'pho': 0xDAA520,               // Goldenrod - Phở Addict
    'tranmieng': 0xFFB6C1,         // Light Pink - Trân Miệng VIP
    'goimon': 0x90EE90,            // Light Green - Gỏi Cuốn Pro
    'cafe': 0x8B4513,              // Saddle Brown - Cà Phê Sáng
  };
  return colors[itemId] || 0x5865F2;
}

export function createShopRoutes(client: Client): Router {
  const router = Router();

  // Get shop items with stock info
  router.get('/items', (req: Request, res: Response) => {
    const fs = require('fs');
    const path = require('path');
    
    const shopItems = [
      // Page 1 - Premium Roles
      { id: 'chutiem', name: 'Chủ Tiệm', emoji: '🏪', price: 200000, category: 'roles', roleName: 'Chủ Tiệm', limited: true, maxStock: 1 },
      { id: 'banhcuonchua', name: 'Bánh Cuốn Chúa', emoji: '🌯', price: 200000, category: 'roles', roleName: 'Bánh Cuốn Chúa', limited: true, maxStock: 3 },
      { id: 'hanhphi', name: 'Hành Phi Elite', emoji: '🔥', price: 150000, category: 'roles', roleName: 'Hành Phi Elite', limited: true, maxStock: 5 },
      { id: 'banhmi', name: 'Bánh Mì Fan', emoji: '🥖', price: 100000, category: 'roles', roleName: 'Bánh Mì Fan' },
      { id: 'nuoccham', name: 'Fan Nước Chấm', emoji: '🫙', price: 100000, category: 'roles', roleName: 'Fan Nước Chấm', limited: true, maxStock: 10 },
      
      // Page 2 - More Roles
      { id: 'thitquay', name: 'Thịt Quay Lover', emoji: '🍖', price: 120000, category: 'roles', roleName: 'Thịt Quay Lover', limited: true, maxStock: 8 },
      { id: 'giocuon', name: 'Giò Cuốn Gang', emoji: '🥬', price: 90000, category: 'roles', roleName: 'Giò Cuốn Gang' },
      { id: 'banhbao', name: 'Bánh Bao Squad', emoji: '🥟', price: 80000, category: 'roles', roleName: 'Bánh Bao Squad' },
      { id: 'pho', name: 'Phở Addict', emoji: '🍜', price: 70000, category: 'roles', roleName: 'Phở Addict' },
      { id: 'cafe', name: 'Cà Phê Sáng', emoji: '☕', price: 60000, category: 'roles', roleName: 'Cà Phê Sáng' },
      
      // Page 3 - Collector Roles  
      { id: 'nemchua', name: 'Nem Chua Collector', emoji: '🧆', price: 75000, category: 'roles', roleName: 'Nem Chua Collector' },
      { id: 'comtam', name: 'Cơm Tấm Master', emoji: '🍚', price: 85000, category: 'roles', roleName: 'Cơm Tấm Master' },
      { id: 'buncha', name: 'Bún Chả Hà Nội', emoji: '🍲', price: 95000, category: 'roles', roleName: 'Bún Chả Hà Nội' },
      { id: 'goimon', name: 'Gỏi Cuốn Pro', emoji: '🌱', price: 65000, category: 'roles', roleName: 'Gỏi Cuốn Pro' },
      { id: 'tranmieng', name: 'Trân Miệng VIP', emoji: '🍮', price: 70000, category: 'roles', roleName: 'Trân Miệng VIP' },
    ];
    
    // Load inventory to count how many people own each limited item
    const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');
    let inventoryData: any = {};
    if (fs.existsSync(inventoryPath)) {
      try {
        inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
      } catch (e) {
        inventoryData = {};
      }
    }
    
    // Count stock for limited items
    const itemsWithStock = shopItems.map(item => {
      if (item.limited) {
        let soldCount = 0;
        for (const userId in inventoryData) {
          if (inventoryData[userId][item.id]) {
            soldCount++;
          }
        }
        const remaining = item.maxStock! - soldCount;
        return {
          ...item,
          soldCount,
          remaining,
          soldOut: remaining <= 0
        };
      }
      return item;
    });
    
    res.json({
      success: true,
      items: itemsWithStock
    });
  });
  
  // Reset shop data (coins, inventory, roles)
  router.post('/reset', validateAdminAuth, async (req: Request, res: Response) => {
    const { userId } = req.body;
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Reset coins
      const coinsPath = path.join(process.cwd(), 'data', 'coins.json');
      fs.writeFileSync(coinsPath, JSON.stringify({}, null, 2));
      
      // Reset inventory
      const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');
      fs.writeFileSync(inventoryPath, JSON.stringify({}, null, 2));
      
      // Delete shop roles from Discord
      const guild = client.guilds.cache.first();
      let deletedRoles = 0;
      
      if (guild) {
        const shopRoleNames = [
          // New 15 Bánh Cuốn themed roles
          '🏪 Chủ Tiệm',
          '🌯 Bánh Cuốn Chúa',
          '🔥 Hành Phi Elite',
          '🥖 Bánh Mì Fan',
          '🫙 Fan Nước Chấm',
          '🍖 Thịt Quay Lover',
          '🥬 Giò Cuốn Gang',
          '🥟 Bánh Bao Squad',
          '🍜 Phở Addict',
          '☕ Cà Phê Sáng',
          '🧆 Nem Chua Collector',
          '🍚 Cơm Tấm Master',
          '🍲 Bún Chả Hà Nội',
          '🌱 Gỏi Cuốn Pro',
          '🍮 Trân Miệng VIP'
        ];
        
        for (const roleName of shopRoleNames) {
          const role = guild.roles.cache.find(r => r.name === roleName);
          if (role) {
            try {
              await role.delete('Shop reset');
              deletedRoles++;
            } catch (error) {
              console.error(`Failed to delete role ${roleName}:`, error);
            }
          }
        }
      }
      
      console.log(`🔄 Shop reset: coins, inventory cleared, ${deletedRoles} roles deleted`);
      
      res.json({
        success: true,
        message: 'Shop data reset successfully',
        deletedRoles: deletedRoles
      });
      
    } catch (error: any) {
      console.error('Reset error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  // Purchase item from shop
  router.post('/purchase', async (req: Request, res: Response) => {
    console.log('🎯 POST /purchase HIT! Body:', req.body);
    console.log('🎯 Headers:', req.headers);
    const { userId, guildId, itemId } = req.body;
    
    if (!userId || !itemId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId or itemId'
      });
    }
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      const fullItemId = itemId; // Use itemId directly
      console.log(`🔄 Item ID: ${fullItemId}`);
      
      // Shop items with role mapping and limited stock
      const shopItems: any = {
        // Premium Tier (Ultra rare)
        'chutiem': { name: 'Chủ Tiệm', emoji: '🏪', price: 200000, roleName: 'Chủ Tiệm', limited: true, maxStock: 1 },
        'banhcuonchua': { name: 'Bánh Cuốn Chúa', emoji: '🌯', price: 200000, roleName: 'Bánh Cuốn Chúa', limited: true, maxStock: 3 },
        'hanhphi': { name: 'Hành Phi Elite', emoji: '🔥', price: 150000, roleName: 'Hành Phi Elite', limited: true, maxStock: 5 },
        
        // High Tier
        'thitquay': { name: 'Thịt Quay Lover', emoji: '🍖', price: 120000, roleName: 'Thịt Quay Lover', limited: true, maxStock: 8 },
        'banhmi': { name: 'Bánh Mì Fan', emoji: '🥖', price: 100000, roleName: 'Bánh Mì Fan' },
        'nuoccham': { name: 'Fan Nước Chấm', emoji: '🫙', price: 100000, roleName: 'Fan Nước Chấm', limited: true, maxStock: 10 },
        'buncha': { name: 'Bún Chả Hà Nội', emoji: '🍲', price: 95000, roleName: 'Bún Chả Hà Nội' },
        
        // Mid Tier
        'giocuon': { name: 'Giò Cuốn Gang', emoji: '🥬', price: 90000, roleName: 'Giò Cuốn Gang' },
        'comtam': { name: 'Cơm Tấm Master', emoji: '🍚', price: 85000, roleName: 'Cơm Tấm Master' },
        'banhbao': { name: 'Bánh Bao Squad', emoji: '🥟', price: 80000, roleName: 'Bánh Bao Squad' },
        'nemchua': { name: 'Nem Chua Collector', emoji: '🧆', price: 75000, roleName: 'Nem Chua Collector' },
        
        // Standard Tier
        'pho': { name: 'Phở Addict', emoji: '🍜', price: 70000, roleName: 'Phở Addict' },
        'tranmieng': { name: 'Trân Miệng VIP', emoji: '🍮', price: 70000, roleName: 'Trân Miệng VIP' },
        'goimon': { name: 'Gỏi Cuốn Pro', emoji: '🌱', price: 65000, roleName: 'Gỏi Cuốn Pro' },
        'cafe': { name: 'Cà Phê Sáng', emoji: '☕', price: 60000, roleName: 'Cà Phê Sáng' }
      };
      
      const item = shopItems[fullItemId];
      console.log(`🎁 Found item:`, item);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Item not found'
        });
      }
      
      // Check limited stock
      if (item.limited && item.maxStock) {
        // Count how many people already own this item
        const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');
        let inventoryData: any = {};
        if (fs.existsSync(inventoryPath)) {
          inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
        }
        
        let soldCount = 0;
        for (const uid in inventoryData) {
          if (inventoryData[uid][fullItemId]) {
            soldCount++;
          }
        }
        
        console.log(`📦 Limited item: ${soldCount}/${item.maxStock} sold`);
        
        if (soldCount >= item.maxStock) {
          return res.status(400).json({
            success: false,
            error: 'Item sold out',
            soldOut: true,
            maxStock: item.maxStock
          });
        }
      }
      
      // Load user coins
      const coinsPath = path.join(process.cwd(), 'data', 'coins.json');
      let coinsData: any = {};
      if (fs.existsSync(coinsPath)) {
        coinsData = JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
      }
      
      const currentCoins = coinsData[userId] || 0;
      console.log(`💰 User has ${currentCoins} coins, item costs ${item.price}`);
      
      // Check if user has enough coins
      if (currentCoins < item.price) {
        return res.status(400).json({
          success: false,
          error: 'Not enough coins',
          required: item.price,
          current: currentCoins
        });
      }
      
      // Load inventory
      const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');
      let inventoryData: any = {};
      if (fs.existsSync(inventoryPath)) {
        inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
      }
      
      if (!inventoryData[userId]) {
        inventoryData[userId] = {};
      }
      
      // Check if already owned (check both shorthand and full ID)
      if (inventoryData[userId][itemId] || inventoryData[userId][fullItemId]) {
        return res.status(400).json({
          success: false,
          error: 'Item already owned'
        });
      }
      
      // Deduct coins
      coinsData[userId] = currentCoins - item.price;
      fs.writeFileSync(coinsPath, JSON.stringify(coinsData, null, 2));
      console.log(`💸 Deducted ${item.price} coins, new balance: ${coinsData[userId]}`);
      
      // Add to inventory (save with full ID)
      inventoryData[userId][fullItemId] = {
        purchasedAt: Date.now(),
        emoji: item.emoji,
        name: item.name
      };
      fs.writeFileSync(inventoryPath, JSON.stringify(inventoryData, null, 2));
      
      // Try to assign Discord role
      let roleAssigned = false;
      let roleError = null;
      let roleCreated = false;
      
      console.log(`🎭 Starting role assignment for guildId: ${guildId}`);
      
      if (guildId) {
        try {
          const guild = client.guilds.cache.get(guildId);
          console.log(`🏰 Guild found:`, guild ? guild.name : 'NOT FOUND');
          
          if (guild) {
            const member = await guild.members.fetch(userId);
            console.log(`👤 Member found:`, member ? member.user.tag : 'NOT FOUND');
            
            if (member) {
              // Construct role name with emoji
              const roleNameWithEmoji = `${item.emoji} ${item.roleName}`;
              
              // Find role by name (with emoji)
              let role = guild.roles.cache.find(r => r.name === roleNameWithEmoji);
              console.log(`🔍 Looking for role "${roleNameWithEmoji}":`, role ? 'FOUND' : 'NOT FOUND');
              
              // If role doesn't exist, create it!
              if (!role) {
                console.log(`🔨 Creating role "${roleNameWithEmoji}"...`);
                
                // Limited VIP roles - NO special permissions, just cosmetic
                role = await guild.roles.create({
                  name: roleNameWithEmoji,
                  colors: { primaryColor: getColorForItem(fullItemId) || 0x5865F2 },
                  hoist: true, // Display separately in member list
                  mentionable: true, // Can be mentioned with @
                  reason: `Auto-created for shop purchase by ${member.user.tag}`
                });
                
                roleCreated = true;
                console.log(`✅ Created role ${roleNameWithEmoji} (ID: ${role.id}) with color ${getColorForItem(fullItemId).toString(16)}`);
              }
              
              // Assign role to member
              console.log(`➕ Adding role to member...`);
              await member.roles.add(role);
              roleAssigned = true;
              console.log(`✅ Assigned role ${roleNameWithEmoji} to ${member.user.tag}`);
            } else {
              roleError = 'Member not found in guild';
              console.warn(`⚠️ Member ${userId} not found in guild ${guild.name}`);
            }
          } else {
            roleError = 'Guild not found';
            console.warn(`⚠️ Guild ${guildId} not found`);
          }
        } catch (error: any) {
          roleError = error.message;
          console.error('❌ Error with role:', error);
        }
      }
      
      res.json({
        success: true,
        message: `Đã mua ${item.emoji} ${item.name}!`,
        item: {
          id: itemId,
          name: item.name,
          emoji: item.emoji
        },
        newCoins: coinsData[userId],
        roleAssigned: roleAssigned,
        roleCreated: roleCreated,
        roleError: roleError
      });
      
      console.log(`✅ Purchase complete! Sent response.`);
      
    } catch (error: any) {
      console.error('Purchase error:', error);
      res.status(500).json({
        success: false,
        error: 'Purchase failed: ' + error.message
      });
    }
  });
  
  // Revoke/Remove role from user (Admin only)
  router.post('/revoke', validateAdminAuth, async (req: Request, res: Response) => {
    console.log('🔄 POST /revoke HIT! Body:', req.body);
    
    const { itemId, userId, guildId } = req.body;
    
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return res.status(404).json({
          success: false,
          error: 'Guild not found'
        });
      }
      
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Member not found'
        });
      }
      
      // Define shop items (same as in other routes)
      const shopItems = [
        // Premium Tier (Ultra rare)
        { id: 'chutiem', name: 'Chủ Tiệm', emoji: '🏪', price: 200000, roleName: 'Chủ Tiệm', limited: true, maxStock: 1 },
        { id: 'banhcuonchua', name: 'Bánh Cuốn Chúa', emoji: '🌯', price: 200000, roleName: 'Bánh Cuốn Chúa', limited: true, maxStock: 3 },
        { id: 'hanhphi', name: 'Hành Phi Elite', emoji: '🔥', price: 150000, roleName: 'Hành Phi Elite', limited: true, maxStock: 5 },
        
        // High Tier
        { id: 'thitquay', name: 'Thịt Quay Lover', emoji: '🍖', price: 120000, roleName: 'Thịt Quay Lover', limited: true, maxStock: 8 },
        { id: 'banhmi', name: 'Bánh Mì Fan', emoji: '🥖', price: 100000, roleName: 'Bánh Mì Fan' },
        { id: 'nuoccham', name: 'Fan Nước Chấm', emoji: '🫙', price: 100000, roleName: 'Fan Nước Chấm', limited: true, maxStock: 10 },
        { id: 'buncha', name: 'Bún Chả Hà Nội', emoji: '🍲', price: 95000, roleName: 'Bún Chả Hà Nội' },
        
        // Mid Tier
        { id: 'giocuon', name: 'Giò Cuốn Gang', emoji: '🥬', price: 90000, roleName: 'Giò Cuốn Gang' },
        { id: 'comtam', name: 'Cơm Tấm Master', emoji: '🍚', price: 85000, roleName: 'Cơm Tấm Master' },
        { id: 'banhbao', name: 'Bánh Bao Squad', emoji: '🥟', price: 80000, roleName: 'Bánh Bao Squad' },
        { id: 'nemchua', name: 'Nem Chua Collector', emoji: '🧆', price: 75000, roleName: 'Nem Chua Collector' },
        
        // Standard Tier
        { id: 'pho', name: 'Phở Addict', emoji: '🍜', price: 70000, roleName: 'Phở Addict' },
        { id: 'tranmieng', name: 'Trân Miệng VIP', emoji: '🍮', price: 70000, roleName: 'Trân Miệng VIP' },
        { id: 'goimon', name: 'Gỏi Cuốn Pro', emoji: '🌱', price: 65000, roleName: 'Gỏi Cuốn Pro' },
        { id: 'cafe', name: 'Cà Phê Sáng', emoji: '☕', price: 60000, roleName: 'Cà Phê Sáng' }
      ];
      
      // Find item in shop
      const item = shopItems.find((i: any) => i.id === itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Item not found'
        });
      }
      
      console.log(`[Shop] Revoking role: ${item.name} from user ${userId}`);
      
      // Remove from inventory
      const fs = require('fs');
      const path = require('path');
      const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');
      
      let inventoryData: any = {};
      if (fs.existsSync(inventoryPath)) {
        inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
      }
      
      const userInventory = inventoryData[userId] || {};
      
      if (!userInventory[itemId]) {
        return res.status(400).json({
          success: false,
          error: 'User does not own this role'
        });
      }
      
      // Remove from inventory
      delete userInventory[itemId];
      inventoryData[userId] = userInventory;
      fs.writeFileSync(inventoryPath, JSON.stringify(inventoryData, null, 2));
      
      console.log(`[Shop] Removed from inventory`);
      
      // Find and remove Discord role
      const roleName = `${item.emoji} ${item.roleName || item.name}`;
      const existingRole = guild.roles.cache.find((r: any) => r.name === roleName);
      
      // Check if this is a Limited VIP role (ultra premium roles)
      const isLimitedVIP = ['chutiem', 'banhcuonchua', 'hanhphi'].includes(itemId);
      
      let roleRemoved = false;
      let nicknameReset = false;
      let customRoleDeleted = false;
      
      if (existingRole) {
        try {
          await member.roles.remove(existingRole);
          console.log(`[Shop] Role removed from user: ${roleName}`);
          roleRemoved = true;
          
          // Reset nickname if Limited VIP and has custom nickname
          if (isLimitedVIP && member.nickname) {
            try {
              await member.setNickname(null, 'Thu hồi role Limited VIP');
              console.log(`[Shop] Nickname reset for user: ${userId}`);
              nicknameReset = true;
            } catch (err) {
              console.error('[Shop] Cannot reset nickname:', err);
            }
          }
          
          // Delete custom role if Limited VIP
          if (isLimitedVIP) {
            try {
              const customRolesPath = path.join(process.cwd(), 'data', 'vip_custom_roles.json');
              if (fs.existsSync(customRolesPath)) {
                const customRolesData = JSON.parse(fs.readFileSync(customRolesPath, 'utf8'));
                if (customRolesData[userId]) {
                  const customRoleId = customRolesData[userId].roleId;
                  const customRole = guild.roles.cache.get(customRoleId);
                  
                  if (customRole) {
                    await customRole.delete('Thu hồi Limited VIP');
                    console.log(`[Shop] Custom role deleted: ${customRole.name}`);
                    customRoleDeleted = true;
                  }
                  
                  // Remove from database
                  delete customRolesData[userId];
                  fs.writeFileSync(customRolesPath, JSON.stringify(customRolesData, null, 2));
                }
              }
            } catch (err) {
              console.error('[Shop] Cannot delete custom role:', err);
            }
          }
        } catch (error) {
          console.error('[Shop] Error removing role:', error);
        }
      } else {
        console.log(`[Shop] Role not found in Discord: ${roleName}`);
      }
      
      res.json({
        success: true,
        message: 'Role revoked successfully',
        itemId: itemId,
        itemName: item.name,
        roleRemoved: roleRemoved,
        nicknameReset: nicknameReset,
        customRoleDeleted: customRoleDeleted
      });
      
    } catch (error: any) {
      console.error('[Shop] Revoke error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to revoke role: ' + error.message
      });
    }
  });

  return router;
}
