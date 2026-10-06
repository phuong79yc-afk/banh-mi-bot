import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} from 'discord.js';
import { emojis } from '../../config/emojis';
import fs from 'fs';
import path from 'path';

// For prefix command access
export let shopModuleInstance: any = null;

// Data paths
const coinsPath = path.join(process.cwd(), 'data', 'coins.json');
const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');
const customRolesPath = path.join(process.cwd(), 'data', 'vip_custom_roles.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// Initialize data files
if (!fs.existsSync(coinsPath)) {
  fs.writeFileSync(coinsPath, JSON.stringify({}));
}
if (!fs.existsSync(inventoryPath)) {
  fs.writeFileSync(inventoryPath, JSON.stringify({}));
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number; // Single price in cowoncy
  emoji: string;
  tag?: 'BEST_SELLER' | 'PREMIUM' | 'LIMITED' | 'EXCLUSIVE';
  category: 'bot-roles';
  roleColor: number;
  isVIP?: boolean;
  stock?: number;
}

interface CoinsData {
  [userId: string]: number;
}

interface CurrencyBalance {
  cowoncy: number;
}

interface InventoryData {
  [userId: string]: {
    [itemId: string]: number;
  };
}

// Shop items - Bánh Cuốn themed roles with daily bonus info (Page 1 & 2)
const SHOP_ITEMS: ShopItem[] = [
  // Page 1 - Premium Roles
  {
    id: 'chutiem',
    name: 'Chủ Tiệm',
    description: '👑 Role đỏ độc nhất - Ông chủ của tiệm bánh cuốn\n🎁 Daily bonus: +10% xu',
    price: 500000,
    emoji: '🏪',
    tag: 'EXCLUSIVE',
    category: 'bot-roles',
    roleColor: 0xFF0000,
    stock: 1
  },
  {
    id: 'banhcuonchua',
    name: 'Bánh Cuốn Chúa',
    description: '🌯 Role vàng độc quyền - Chỉ 3 suất\n🎁 Daily bonus: +10% xu',
    price: 200000,
    emoji: '🌯',
    tag: 'LIMITED',
    category: 'bot-roles',
    roleColor: 0xFFD700,
    stock: 3
  },
  {
    id: 'hanhphi',
    name: 'Hành Phi Elite',
    description: '🔥 Dành cho dân chơi hành phi\n🎁 Daily bonus: +8% xu',
    price: 150000,
    emoji: '🔥',
    tag: 'LIMITED',
    category: 'bot-roles',
    roleColor: 0xFF6B6B,
    stock: 5
  },
  {
    id: 'banhmi',
    name: 'Bánh Mì Fan',
    description: '🥖 Giòn rụm, đầy đủ nhân\n🎁 Daily bonus: +5% xu',
    price: 100000,
    emoji: '🥖',
    tag: 'BEST_SELLER',
    category: 'bot-roles',
    roleColor: 0xF4A460,
  },
  {
    id: 'nuoccham',
    name: 'Fan Nước Chấm',
    description: '🫙 Role xanh cho tín đồ nước chấm\n🎁 Daily bonus: +3% xu',
    price: 100000,
    emoji: '🫙',
    tag: 'LIMITED',
    category: 'bot-roles',
    roleColor: 0x87CEEB,
    stock: 10
  },
  
  // Page 2 - More Roles
  {
    id: 'thitquay',
    name: 'Thịt Quay Lover',
    description: '🍖 Đam mê thịt quay giòn tan\n🎁 Daily bonus: +7% xu',
    price: 120000,
    emoji: '🍖',
    tag: 'PREMIUM',
    category: 'bot-roles',
    roleColor: 0x8B4513,
    stock: 8
  },
  {
    id: 'giocuon',
    name: 'Giò Cuốn Gang',
    description: '🥬 Tươi mát với rau sống\n🎁 Daily bonus: +6% xu',
    price: 90000,
    emoji: '🥬',
    category: 'bot-roles',
    roleColor: 0x90EE90,
  },
  {
    id: 'banhbao',
    name: 'Bánh Bao Squad',
    description: '🥟 Xốp mềm, nhân đầy ụ\n🎁 Daily bonus: +5% xu',
    price: 80000,
    emoji: '🥟',
    tag: 'BEST_SELLER',
    category: 'bot-roles',
    roleColor: 0xFFE4B5,
  },
  {
    id: 'pho',
    name: 'Phở Addict',
    description: '🍜 Không thể thiếu phở mỗi sáng\n🎁 Daily bonus: +4% xu',
    price: 70000,
    emoji: '🍜',
    category: 'bot-roles',
    roleColor: 0xFFA500,
  },
  {
    id: 'cafe',
    name: 'Cà Phê Sáng',
    description: '☕ Không cafe = không sống\n🎁 Daily bonus: +3% xu',
    price: 60000,
    emoji: '☕',
    category: 'bot-roles',
    roleColor: 0x6F4E37,
  },
  
  // Page 3 - Collector Roles
  {
    id: 'nemchua',
    name: 'Nem Chua Collector',
    description: '🧆 Sưu tầm nem chua khắp nơi\n🎁 Daily bonus: +4% xu',
    price: 75000,
    emoji: '🧆',
    category: 'bot-roles',
    roleColor: 0xFF69B4,
  },
  {
    id: 'comtam',
    name: 'Cơm Tấm Master',
    description: '🍚 Chuyên gia cơm tấm sườn\n🎁 Daily bonus: +5% xu',
    price: 85000,
    emoji: '🍚',
    tag: 'PREMIUM',
    category: 'bot-roles',
    roleColor: 0xD2691E,
  },
  {
    id: 'buncha',
    name: 'Bún Chả Hà Nội',
    description: '🍲 Đặc sản Hà thành chính hiệu\n🎁 Daily bonus: +6% xu',
    price: 95000,
    emoji: '🍲',
    category: 'bot-roles',
    roleColor: 0xCD853F,
  },
  {
    id: 'goimon',
    name: 'Gỏi Cuốn Pro',
    description: '🌱 Tươi ngon, healthy\n🎁 Daily bonus: +3% xu',
    price: 65000,
    emoji: '🌱',
    category: 'bot-roles',
    roleColor: 0x32CD32,
  },
  {
    id: 'tranmieng',
    name: 'Trân Miệng VIP',
    description: '🍮 Chuyên gia tráng miệng\n🎁 Daily bonus: +4% xu',
    price: 70000,
    emoji: '🍮',
    category: 'bot-roles',
    roleColor: 0xFFDAB9,
  },
];

// Legacy coins functions (kept for backwards compatibility with coins-module)
function loadCoins(): CoinsData {
  try {
    return JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveCoins(data: CoinsData): void {
  fs.writeFileSync(coinsPath, JSON.stringify(data, null, 2));
}

function getUserCoins(userId: string): number {
  const data = loadCoins();
  return data[userId] || 0;
}

function addCoins(userId: string, amount: number): number {
  const data = loadCoins();
  data[userId] = (data[userId] || 0) + amount;
  saveCoins(data);
  return data[userId];
}

function removeCoins(userId: string, amount: number): boolean {
  const data = loadCoins();
  const current = data[userId] || 0;
  if (current < amount) return false;
  data[userId] = current - amount;
  saveCoins(data);
  return true;
}

// Currency functions
function getUserBalance(userId: string): CurrencyBalance {
  return { cowoncy: getUserCoins(userId) };
}

function deductCurrency(userId: string, price: number): boolean {
  return removeCoins(userId, price);
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
  return n.toString();
}

function parseEmoji(str: string): { id: string; animated: boolean } | undefined {
  const m = str.match(/<(a?):([\w]+):(\d+)>/);
  if (!m) return undefined;
  return { id: m[3], animated: m[1] === 'a' };
}

function buildShop(client: Client, userId?: string, page: number = 1) {
  const icon = client.user?.displayAvatarURL();
  
  // Pagination settings
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(SHOP_ITEMS.length / ITEMS_PER_PAGE);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = SHOP_ITEMS.slice(startIndex, endIndex);
  
  const fields = pageItems.map(item => {
    const stockLeft = item.stock != null ? Math.max(0, item.stock - getSoldCount(item.id)) : Infinity;
    const priceLines: string[] = [
      `**${formatNumber(item.price)}** ${emojis.coin}`,
    ];
    if (item.stock != null) {
      priceLines.push(stockLeft > 0 ? `Còn ${stockLeft}/${item.stock} suất` : '**Hết suất**');
    }
    return {
      name: '\u200B',
      value: [
        `${item.emoji} **${item.name}**`,
        `${item.tag ? `**[${item.tag}]** ` : ''}${item.description}`,
        priceLines.map(x => `> - ${x}`).join('\n'),
      ].join('\n'),
      inline: true,
    };
  });

  // Full-buy field
  const fullPrice = SHOP_ITEMS.reduce((a, t) => a + t.price, 0);
  fields.push({
    name: '\u200B',
    value: `${emojis.gift} **Mua full các role**\n> - Giá: \`${formatNumber(fullPrice)}\` ${emojis.coin}`,
    inline: false,
  });

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setAuthor({ name: 'Cửa Hàng Role Banhcuon', iconURL: icon })
    .setDescription(
      `Bạn có thể mua các role bằng ${emojis.coin} **Coin**.\nDùng \`/balance\` để xem số dư của bạn.\n\n` +
      `**Trang ${currentPage}/${totalPages}** • ${SHOP_ITEMS.length} roles`
    )
    .addFields(fields)
    .setFooter({ text: `Banhcuon-bot • Chọn role ở menu bên dưới`, iconURL: icon });

  const menuOptions = [
    ...pageItems.map(item => {
      const stockLeft = item.stock != null ? Math.max(0, item.stock - getSoldCount(item.id)) : null;
      const stockStr = stockLeft != null ? ` • còn ${stockLeft}/${item.stock}` : '';
      const tagStr = item.tag ? ` [${item.tag}]` : '';
      const opt = new StringSelectMenuOptionBuilder()
        .setLabel(`${item.name}${tagStr}`)
        .setDescription(`${formatNumber(item.price)} coin${stockStr}`)
        .setValue(item.id);
      const emojiData = parseEmoji(item.emoji);
      if (emojiData) opt.setEmoji(emojiData);
      return opt;
    }),
    new StringSelectMenuOptionBuilder()
      .setLabel('Mua full tất cả role')
      .setDescription(`${formatNumber(fullPrice)} coin`)
      .setValue('all')
      .setEmoji(parseEmoji(emojis.gift) ?? { name: '🎁' } as any),
  ];

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`shop_buy:${currentPage}`)
    .setPlaceholder('🛒 Chọn role bạn muốn mua...')
    .addOptions(menuOptions);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`shop_page:${currentPage - 1}`)
        .setLabel('◀ Trước')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 1),
      new ButtonBuilder()
        .setCustomId(`shop_refresh:${currentPage}`)
        .setLabel('Refresh')
        .setEmoji(parseEmoji(emojis.refresh) ?? { name: '🔄' } as any)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`shop_page:${currentPage + 1}`)
        .setLabel('Tiếp ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages),
      new ButtonBuilder()
        .setCustomId('shop_vipinfo')
        .setLabel('VIP Info')
        .setEmoji(parseEmoji(emojis.crown) ?? { name: '👑' } as any)
        .setStyle(ButtonStyle.Secondary)
    );

  // Load banner if exists
  const bannerPath = path.join(process.cwd(), 'assets', 'banners', 'shop-banner.gif');
  const files = fs.existsSync(bannerPath) 
    ? [new AttachmentBuilder(bannerPath, { name: 'shop-banner.gif' })]
    : [];

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
      buttonRow
    ],
    files
  };
}

// Migration function - no longer needed, coins.json is the single currency source
function migrateCoinsToCowoncy(): void {
  console.log('[Shop] Migration not needed - coins.json is the single currency source');
}

// Inventory functions
function loadInventory(): InventoryData {
  try {
    return JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveInventory(data: InventoryData): void {
  fs.writeFileSync(inventoryPath, JSON.stringify(data, null, 2));
}

function addToInventory(userId: string, itemId: string, quantity: number = 1): void {
  const data = loadInventory();
  if (!data[userId]) data[userId] = {};
  data[userId][itemId] = (data[userId][itemId] || 0) + quantity;
  saveInventory(data);
}

function getUserInventory(userId: string): { [itemId: string]: number } {
  const data = loadInventory();
  return data[userId] || {};
}

// Stock tracking system
const soldPath = path.join(process.cwd(), 'data', 'shop-sold.json');
if (!fs.existsSync(soldPath)) fs.writeFileSync(soldPath, JSON.stringify({}));

function loadSold(): Record<string, number> {
  try { return JSON.parse(fs.readFileSync(soldPath, 'utf8')); } catch { return {}; }
}
function saveSoldData(data: Record<string, number>): void {
  fs.writeFileSync(soldPath, JSON.stringify(data, null, 2));
}
function getSoldCount(itemId: string): number {
  return loadSold()[itemId] ?? 0;
}
function incrementSold(itemId: string): void {
  const d = loadSold(); d[itemId] = (d[itemId] ?? 0) + 1; saveSoldData(d);
}
function decrementSold(itemId: string): void {
  const d = loadSold(); d[itemId] = Math.max(0, (d[itemId] ?? 0) - 1); saveSoldData(d);
}

// Busy users set for purchase protection
const busyUsers = new Set<string>();

export default class ShopModule {
  name = 'shop-module';
  description = 'Hệ thống shop và coins';
  version = '2.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`🎁 Shop module initialized`);
    migrateCoinsToCowoncy();
    this.registerCommands();
    console.log(`✅ Shop module registered ${this.commands.size} commands`);
    
    // Export instance for prefix commands
    shopModuleInstance = this;
  }

  private registerCommands() {
    // /shop command
    const shopCommand = {
      data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('🛒 Xem shop và mua bot roles'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          // Track quest progress (dynamic import to avoid circular dependency)
          try {
            const { trackCommand } = await import('../quest-module/entry_point');
            trackCommand(interaction.user.id, 'shop');
          } catch (err) {
            console.error('Failed to track quest:', err);
          }
          
          // Check if already deferred/replied (by hook or other code)
          if (!interaction.deferred && !interaction.replied) {
            try {
              await interaction.deferReply();
            } catch (error: any) {
              if (error.code === 10062 || error.code === 40060) return;
              throw error;
            }
          }
          
          const userId = interaction.user.id;
          const shopData = buildShop(interaction.client, userId, 1);
          
          const response = await interaction.editReply(shopData);
          
          // Collector
          const collector = response.createMessageComponentCollector({
            time: 300000
          });
          
          collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
              await i.reply({
                content: `❌ Bạn không thể dùng shop này!`,
                flags: 64
              });
              return;
            }
            
            // Pagination button
            if (i.customId.startsWith('shop_page:')) {
              const targetPage = parseInt(i.customId.split(':')[1]);
              await i.update(buildShop(i.client, userId, targetPage));
              return;
            }
            
            // Refresh button
            if (i.customId.startsWith('shop_refresh:')) {
              const currentPage = parseInt(i.customId.split(':')[1]);
              await i.update(buildShop(i.client, userId, currentPage));
              return;
            }
          
          // VIP Info button
          if (i.customId === 'shop_vipinfo') {
            const vipEmbed = new EmbedBuilder()
              .setColor('#FFD700')
              .setTitle(`${emojis.crown} VIP Info - Quyền Lợi Đặc Biệt`)
              .setDescription(
                `**${emojis.sparkles} QUYỀN LỢI VIP:**\n\n` +
                `**${emojis.star} Premium Member** (100K ${emojis.coin})\n` +
                `• ${emojis.sparkles} /nickname - Đổi tên\n` +
                `• ${emojis.art} /customrole\n` +
                `• ${emojis.gem} x2 coins /daily\n\n` +
                `**${emojis.gem} Bot Developer** (200K ${emojis.coin})\n` +
                `• ${emojis.sparkles} /nickname - Đổi tên\n` +
                `• ${emojis.art} /customrole\n` +
                `• ${emojis.gem} x2 coins /daily\n\n` +
                `**${emojis.crown} Bot Owner** (500K ${emojis.coin})\n` +
                `• ${emojis.sparkles} /nickname - Đổi tên\n` +
                `• ${emojis.art} /customrole\n` +
                `• ${emojis.gem} x2 coins /daily\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `${emojis.info} Kiếm tiền:\n` +
                `• /daily - Điểm danh hàng ngày\n` +
                `• /quest - Hoàn thành nhiệm vụ`
              )
              .setThumbnail(interaction.user.displayAvatarURL())
              .setFooter({ text: `${emojis.gift} VIP = Tạo custom role + x2 coins!` });
            
            await i.reply({
              embeds: [vipEmbed],
              flags: 64
            });
            return;
          }
          
          // Buy item
          if (i.customId.startsWith('shop_buy:') && i.isStringSelectMenu()) {
            // Extract page number from customId
            const currentPage = parseInt(i.customId.split(':')[1]);
            
            // Defer first to avoid interaction timeout issues
            await i.deferReply({ flags: 64 });
            
            if (busyUsers.has(userId)) {
              await i.editReply({ content: 'Đang xử lý lượt mua trước của bạn, đợi một chút nhé.' });
              return;
            }
            busyUsers.add(userId);
            try {
              const v = i.values[0];
              let targets = v === 'all' ? [...SHOP_ITEMS] : SHOP_ITEMS.filter(t => t.id === v);
              if (!targets.length) { 
                await i.editReply({ content: 'Vật phẩm không tồn tại.' });
                return;
              }

              const skipped: string[] = [];
              const guild = i.guild!;
              const member = guild.members.cache.get(userId)!;

              // Filter: skip already-owned and out-of-stock
              targets = targets.filter(t => {
                const roleName = `${t.emoji} ${t.name}`;
                if (member.roles.cache.find(r => r.name === roleName)) { skipped.push(`${t.name} (đã có)`); return false; }
                const stockLeft = t.stock != null ? t.stock - getSoldCount(t.id) : Infinity;
                if (stockLeft <= 0) { skipped.push(`${t.name} (hết suất)`); return false; }
                return true;
              });

              if (!targets.length) {
                await i.editReply({ content: `Không có gì để mua: ${skipped.join(', ')}.` });
                return;
              }

              const totalPrice = targets.reduce((a, t) => a + t.price, 0);
              const currentBal = getUserBalance(userId);
              if (currentBal.cowoncy < totalPrice) {
                await i.editReply({ content: `Bạn không đủ coin để mua!` });
                return;
              }

              // Deduct FIRST, then assign roles
              const oldBalance = getUserCoins(userId);
              if (!deductCurrency(userId, totalPrice)) {
                await i.editReply({ content: `Bạn không đủ coin để mua!` });
                return;
              }
              targets.forEach(t => { if (t.stock != null) incrementSold(t.id); });

              try {
                for (const item of targets) {
                  const roleName = `${item.emoji} ${item.name}`;
                  let role = guild?.roles.cache.find(r => r.name === roleName);
                  if (!role) {
                    role = await guild.roles.create({ name: roleName, color: item.roleColor, hoist: true, reason: 'Shop purchase' });
                  }
                  await member.roles.add(role);
                  addToInventory(userId, item.id);
                }
              } catch (err) {
                console.error('[Shop] Role assign error, rolling back:', err);
                // Rollback currency and stock
                addCoins(userId, totalPrice);
                targets.forEach(t => { if (t.stock != null) decrementSold(t.id); });
                
                // Rollback inventory
                targets.forEach(t => {
                  const invData = loadInventory();
                  if (invData[userId]?.[t.id]) {
                    invData[userId][t.id] = Math.max(0, invData[userId][t.id] - 1);
                    if (invData[userId][t.id] === 0) delete invData[userId][t.id];
                    saveInventory(invData);
                  }
                });
                
                await i.editReply({ content: 'Bot không thể gắn role (thiếu quyền hoặc role bot thấp hơn). Tiền đã được hoàn lại.' });
                return;
              }

              const newBal = getUserBalance(userId);
              await i.editReply({
                content: `Đã mua ${targets.map(t => `${t.emoji} **${t.name}**`).join(' ')} thành công!` +
                  `\nSố dư còn: ${emojis.coin} **${formatNumber(newBal.cowoncy)}**` +
                  (skipped.length ? `\nBỏ qua: ${skipped.join(', ')}.` : ''),
              });

              // Refresh shop embed with current page
              await i.message?.edit(buildShop(i.client, userId, currentPage)).catch(() => {});

            } finally {
              busyUsers.delete(userId);
            }
          }
        });
        
        collector.on('end', () => {
          interaction.editReply({
            components: []
          }).catch(() => {});
        });
        } catch (error: any) {
          console.error('[Shop] Error in shop command:', error);
          const errorMsg = `${emojis.error} Có lỗi xảy ra khi mở shop! Thử lại sau nhé.`;
          
          try {
            if (interaction.deferred || interaction.replied) {
              await interaction.editReply({ content: errorMsg });
            } else {
              await interaction.reply({ content: errorMsg, flags: 64 });
            }
          } catch (replyError) {
            console.error('[Shop] Failed to send error message:', replyError);
          }
        }
      }
    };

    // /inventory command
    const inventoryCommand = {
      data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('🎒 Xem inventory của bạn'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.deferred && !interaction.replied) {
          try {
            await interaction.deferReply();
          } catch (error: any) {
            if (error.code === 10062 || error.code === 40060) return;
            throw error;
          }
        }
        
        const userId = interaction.user.id;
        const inventory = getUserInventory(userId);
        const bal = getUserBalance(userId);
        
        if (Object.keys(inventory).length === 0) {
          await interaction.editReply({
            content: `${emojis.error} Inventory của bạn trống!\nDùng \`/shop\` để mua items!`
          });
          return;
        }
        
        const embed = new EmbedBuilder()
          .setColor('#5865f2')
          .setAuthor({
            name: `${interaction.user.username}'s Inventory`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setDescription(
            `${emojis.coin} **Coin:** ${formatNumber(bal.cowoncy)}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\u200B`
          )
          .setTimestamp();
        
        for (const [itemId, quantity] of Object.entries(inventory)) {
          const item = SHOP_ITEMS.find(i => i.id === itemId);
          if (item) {
            embed.addFields({
              name: `${item.emoji} ${item.name}`,
              value: `Số lượng: **${quantity}**`,
              inline: true
            });
          }
        }
        
        await interaction.editReply({ embeds: [embed] });
      }
    };

    // /balance command
    const balanceCommand = {
      data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('💰 Xem số dư tiền')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('👤 User cần xem')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.deferred && !interaction.replied) {
          try {
            await interaction.deferReply();
          } catch (error: any) {
            if (error.code === 10062 || error.code === 40060) return;
            throw error;
          }
        }
        
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        // Check if bot
        if (targetUser.bot) {
          return interaction.editReply({
            content: 'Bot không có tài khoản xu.'
          });
        }

        // Get member - handle both slash and prefix commands
        let member: any = null;
        try {
          member = interaction.options?.getMember?.('user') || interaction.member;
        } catch (e) {
          // Prefix command - get member from guild
          if (interaction.guild) {
            member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
          }
        }
        
        const name = member?.displayName ?? targetUser.username;
        
        // Get balance from coins.json (shop uses coins.json for cowoncy)
        const bal = getUserBalance(targetUser.id);
        
        // Get daily data for streak info
        const Database = require('better-sqlite3');
        const dbPath = path.join(process.cwd(), 'data', 'economy.db');
        const db = new Database(dbPath);
        const stmtGetUser = db.prepare('SELECT * FROM daily_users WHERE user_id = ?');
        const stmtEnsure = db.prepare(`
          INSERT OR IGNORE INTO daily_users (user_id, balance, gold_balance, streak, max_streak, total_checkins)
          VALUES (?, 0, 0, 0, 0, 0)
        `);
        stmtEnsure.run(targetUser.id);
        const dailyData: any = stmtGetUser.get(targetUser.id);
        
        await interaction.editReply({
          content: `${emojis.coin} | **${name}** đang có **${formatNumber(bal.cowoncy)}** ${emojis.coin} · **${dailyData?.gold_balance || 0}** ${emojis.gem} | ${emojis.fire} Streak: ${dailyData?.streak || 0} ngày · ${emojis.chart} Check-ins: ${dailyData?.total_checkins || 0} lần`
        });
      }
    };

    // /revoke command (Admin only)
    const revokeCommand = {
      data: new SlashCommandBuilder()
        .setName('revoke')
        .setDescription(`🔄 Thu hồi role đã mua (Admin only)`)
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('👤 User cần thu hồi role')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        // Check admin
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          return interaction.editReply({
            content: `${emojis.error} Bạn cần quyền Administrator!`
          });
        }
        
        const targetUser = interaction.options.getUser('user', true);
        const guild = interaction.guild;
        const member = guild?.members.cache.get(targetUser.id);
        
        if (!member) {
          return interaction.editReply({
            content: `${emojis.error} Không tìm thấy member!`
          });
        }
        
        // Get user's roles from both inventory and Discord
        const inventory = getUserInventory(targetUser.id);
        const userRoles: Array<{ item: ShopItem; inInventory: boolean; inDiscord: boolean }> = [];
        
        for (const item of SHOP_ITEMS) {
          const roleName = `${item.emoji} ${item.name}`;
          const discordRole = guild?.roles.cache.find(r => r.name === roleName);
          const hasInInventory = !!inventory[item.id];
          const hasDiscordRole = discordRole && member.roles.cache.has(discordRole.id);
          
          if (hasInInventory || hasDiscordRole) {
            userRoles.push({
              item,
              inInventory: hasInInventory,
              inDiscord: !!hasDiscordRole
            });
          }
        }
        
        if (userRoles.length === 0) {
          return interaction.editReply({
            content: `${emojis.error} ${targetUser.username} không có role nào để thu hồi!`
          });
        }
        
        // Create embed showing all user's roles
        const embed = new EmbedBuilder()
          .setColor('#FF6B6B')
          .setTitle(`${emojis.refresh} Thu Hồi Role - ${targetUser.username}`)
          .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
          .setDescription(
            `**Admin:** ${interaction.user}\n` +
            `**Target:** ${targetUser}\n` +
            `**Tổng roles:** ${userRoles.length}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `${emojis.document} **Danh sách roles:**\n\n` +
            userRoles.map((r, i) => {
              const status = r.inInventory && r.inDiscord ? '✅ Inventory + Discord' : 
                            r.inInventory ? '📦 Chỉ Inventory' : '🎭 Chỉ Discord';
              return `**${i + 1}.** ${r.item.emoji} **${r.item.name}**\n└ ${status}`;
            }).join('\n\n') +
            `\n\n━━━━━━━━━━━━━━━━━━━━\n` +
            `${emojis.warning} Click nút bên dưới để thu hồi role!`
          )
          .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}` })
          .setTimestamp();
        
        // Create buttons
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        let currentRow = new ActionRowBuilder<ButtonBuilder>();
        
        userRoles.forEach((r, index) => {
          const button = new ButtonBuilder()
            .setCustomId(`revoke_${targetUser.id}_${r.item.id}`)
            .setLabel(`${r.item.emoji} ${r.item.name}`)
            .setStyle(ButtonStyle.Danger);
          
          currentRow.addComponents(button);
          
          // 5 buttons per row
          if ((index + 1) % 5 === 0 || index === userRoles.length - 1) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder<ButtonBuilder>();
          }
        });
        
        // Add cancel button in last row
        const lastRow = rows[rows.length - 1];
        if (lastRow.components.length < 5) {
          lastRow.addComponents(
            new ButtonBuilder()
              .setCustomId('revoke_cancel')
              .setLabel('❌ Hủy')
              .setStyle(ButtonStyle.Secondary)
          );
        } else {
          // Create new row for cancel
          const cancelRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('revoke_cancel')
                .setLabel('❌ Hủy')
                .setStyle(ButtonStyle.Secondary)
            );
          rows.push(cancelRow);
        }
        
        const response = await interaction.editReply({
          embeds: [embed],
          components: rows
        });
        
        // Collector
        const collector = response.createMessageComponentCollector({
          time: 300000 // 5 minutes
        });
        
        collector.on('collect', async i => {
          if (i.user.id !== interaction.user.id) {
            await i.reply({
              content: `${emojis.error} Chỉ ${interaction.user} mới có thể dùng nút này!`,
              flags: 64
            });
            return;
          }
          
          // Cancel
          if (i.customId === 'revoke_cancel') {
            await i.update({
              embeds: [embed.setColor('#808080').setDescription(`❌ **Đã hủy thu hồi role!**`)],
              components: []
            });
            collector.stop();
            return;
          }
          
          // Revoke role
          if (i.customId.startsWith('revoke_')) {
            // Format: revoke_userId_itemId
            const parts = i.customId.split('_');
            const userId = parts[1];
            const itemId = parts.slice(2).join('_');
            
            const item = SHOP_ITEMS.find(it => it.id === itemId);
            if (!item) {
              await i.reply({
                content: `${emojis.error} Role không tồn tại! (ID: ${itemId})`,
                flags: 64
              });
              return;
            }
            
            await i.deferUpdate();
            
            try {
              let inventoryRemoved = false;
              let roleRemoved = false;
              let roleError = '';
              let nicknameReset = false;
              let customRoleDeleted = false;
              
              // Check if this is a VIP role
              const isVIP = item.isVIP === true;
              
              // Remove from inventory
              const inv = getUserInventory(userId);
              if (inv[itemId]) {
                const invData = loadInventory();
                if (invData[userId]) {
                  delete invData[userId][itemId];
                  saveInventory(invData);
                  inventoryRemoved = true;
                }
              }
              
              // Remove Discord role
              const roleName = `${item.emoji} ${item.name}`;
              const discordRole = guild?.roles.cache.find(r => r.name === roleName);
              
              if (discordRole && member.roles.cache.has(discordRole.id)) {
                try {
                  const botMember = guild?.members.cache.get(interaction.client.user!.id);
                  const botHighestRole = botMember?.roles.highest;
                  
                  if (botHighestRole && botHighestRole.position <= discordRole.position) {
                    roleError = 'Role của bot thấp hơn role này';
                  } else {
                    await member.roles.remove(discordRole);
                    roleRemoved = true;
                    
                    // Reset nickname if VIP and has custom nickname
                    if (isVIP && member.nickname) {
                      try {
                        await member.setNickname(null, 'Thu hồi role VIP');
                        nicknameReset = true;
                      } catch (err) {
                        console.error('[Revoke] Cannot reset nickname:', err);
                      }
                    }
                    
                    // Delete custom role if VIP
                    if (isVIP && fs.existsSync(customRolesPath)) {
                      try {
                        const customRolesData = JSON.parse(fs.readFileSync(customRolesPath, 'utf8'));
                        if (customRolesData[userId]) {
                          const customRoleId = customRolesData[userId].roleId;
                          const customRole = guild?.roles.cache.get(customRoleId);
                          
                          if (customRole) {
                            await customRole.delete('Thu hồi VIP');
                            customRoleDeleted = true;
                          }
                          
                          // Remove from database
                          delete customRolesData[userId];
                          fs.writeFileSync(customRolesPath, JSON.stringify(customRolesData, null, 2));
                        }
                      } catch (err) {
                        console.error('[Revoke] Cannot delete custom role:', err);
                      }
                    }
                  }
                } catch (err: any) {
                  roleError = err.message || 'Lỗi remove role';
                }
              }
              
              const resultEmbed = new EmbedBuilder()
                .setColor(roleRemoved || inventoryRemoved ? '#57F287' : '#FF6B6B')
                .setTitle(`${emojis.success} Thu Hồi Thành Công`)
                .setDescription(
                  `**Admin:** ${interaction.user}\n` +
                  `**User:** ${targetUser}\n` +
                  `**Role:** ${item.emoji} ${item.name}\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n\n` +
                  (inventoryRemoved ? `${emojis.success} Đã xóa khỏi inventory\n` : `${emojis.warning} Không có trong inventory\n`) +
                  (roleRemoved ? `${emojis.success} Đã remove Discord role\n` : 
                   roleError ? `${emojis.error} ${roleError}\n` : 
                   `${emojis.warning} Không có Discord role\n`) +
                  (nicknameReset ? `${emojis.success} Đã reset nickname về mặc định\n` : '') +
                  (customRoleDeleted ? `${emojis.success} Đã xóa custom role` : '')
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setFooter({ text: `Thu hồi bởi ${interaction.user.tag}` })
                .setTimestamp();
              
              await i.editReply({
                embeds: [resultEmbed],
                components: []
              });
              
              collector.stop();
              
            } catch (error) {
              console.error('[Revoke] Error:', error);
              await i.followUp({
                content: `${emojis.error} Có lỗi xảy ra khi thu hồi role!`,
                flags: 64
              });
            }
          }
        });
        
        collector.on('end', () => {
          interaction.editReply({
            components: []
          }).catch(() => {});
        });
      }
    };
    
    this.commands.set('shop', shopCommand);
    this.commands.set('inventory', inventoryCommand);
    this.commands.set('balance', balanceCommand);
    this.commands.set('revoke', revokeCommand);
  }

  async cleanup() {
    console.log('🧹 Shop module cleanup');
  }
}
