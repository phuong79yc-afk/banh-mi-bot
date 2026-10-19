import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
} from 'discord.js';
import { emojis } from '../../config/emojis';
import { getUser as getDailyUser } from '../balance-module/entry_point';
import fs from 'fs';
import path from 'path';

// For prefix command access
export let shopModuleInstance: any = null;

// ============================================
// COMPONENTS V2 HELPERS
// ============================================

const V2 = MessageFlags.IsComponentsV2;
const V2_EPH = [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] as const;
const NO_PING = { parse: [] as never[] };

const txt = (content: string) => new TextDisplayBuilder().setContent(content);

const sep = (divider = true) =>
  new SeparatorBuilder().setDivider(divider).setSpacing(SeparatorSpacingSize.Small);

const notice = (content: string, color = 0xed4245) =>
  new ContainerBuilder().addTextDisplayComponents(txt(content));

const replyEph = (i: any, content: string, color?: number) =>
  i.reply({ components: [notice(content, color)], flags: V2_EPH });

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
  // Vé Vàng - Premium Item
  {
    id: 'vevang',
    name: 'Vé Vàng',
    description: '💎 Vé vàng đặc biệt - Dùng để đổi quà VIP\n🎁 Không tính daily bonus',
    price: 50000,
    emoji: '🎫',
    tag: 'PREMIUM',
    category: 'bot-roles',
    roleColor: 0xffd700,
  },
  // Page 1 - Premium Roles
  {
    id: 'chutiem',
    name: 'Chủ Tiệm',
    description: '👑 Role đỏ độc nhất - Ông chủ của tiệm bánh cuốn\n🎁 Daily bonus: +10% xu',
    price: 500000,
    emoji: '🏪',
    tag: 'EXCLUSIVE',
    category: 'bot-roles',
    roleColor: 0xff0000,
    stock: 1,
  },
  {
    id: 'banhcuonchua',
    name: 'Bánh Cuốn Chúa',
    description: '🌯 Role vàng độc quyền - Chỉ 3 suất\n🎁 Daily bonus: +10% xu',
    price: 200000,
    emoji: '🌯',
    tag: 'LIMITED',
    category: 'bot-roles',
    roleColor: 0xffd700,
    stock: 3,
  },
  {
    id: 'hanhphi',
    name: 'Hành Phi Elite',
    description: '🔥 Dành cho dân chơi hành phi\n🎁 Daily bonus: +8% xu',
    price: 150000,
    emoji: '🔥',
    tag: 'LIMITED',
    category: 'bot-roles',
    roleColor: 0xff6b6b,
    stock: 5,
  },
  {
    id: 'banhmi',
    name: 'Bánh Mì Fan',
    description: '🥖 Giòn rụm, đầy đủ nhân\n🎁 Daily bonus: +5% xu',
    price: 100000,
    emoji: '🥖',
    tag: 'BEST_SELLER',
    category: 'bot-roles',
    roleColor: 0xf4a460,
  },
  {
    id: 'nuoccham',
    name: 'Fan Nước Chấm',
    description: '🫙 Role xanh cho tín đồ nước chấm\n🎁 Daily bonus: +3% xu',
    price: 100000,
    emoji: '🫙',
    tag: 'LIMITED',
    category: 'bot-roles',
    roleColor: 0x87ceeb,
    stock: 10,
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
    roleColor: 0x8b4513,
    stock: 8,
  },
  {
    id: 'giocuon',
    name: 'Giò Cuốn Gang',
    description: '🥬 Tươi mát với rau sống\n🎁 Daily bonus: +6% xu',
    price: 90000,
    emoji: '🥬',
    category: 'bot-roles',
    roleColor: 0x90ee90,
  },
  {
    id: 'banhbao',
    name: 'Bánh Bao Squad',
    description: '🥟 Xốp mềm, nhân đầy ụ\n🎁 Daily bonus: +5% xu',
    price: 80000,
    emoji: '🥟',
    tag: 'BEST_SELLER',
    category: 'bot-roles',
    roleColor: 0xffe4b5,
  },
  {
    id: 'pho',
    name: 'Phở Addict',
    description: '🍜 Không thể thiếu phở mỗi sáng\n🎁 Daily bonus: +4% xu',
    price: 70000,
    emoji: '🍜',
    category: 'bot-roles',
    roleColor: 0xffa500,
  },
  {
    id: 'cafe',
    name: 'Cà Phê Sáng',
    description: '☕ Không cafe = không sống\n🎁 Daily bonus: +3% xu',
    price: 60000,
    emoji: '☕',
    category: 'bot-roles',
    roleColor: 0x6f4e37,
  },
  // Page 3 - Collector Roles
  {
    id: 'nemchua',
    name: 'Nem Chua Collector',
    description: '🧆 Sưu tầm nem chua khắp nơi\n🎁 Daily bonus: +4% xu',
    price: 75000,
    emoji: '🧆',
    category: 'bot-roles',
    roleColor: 0xff69b4,
  },
  {
    id: 'comtam',
    name: 'Cơm Tấm Master',
    description: '🍚 Chuyên gia cơm tấm sườn\n🎁 Daily bonus: +5% xu',
    price: 85000,
    emoji: '🍚',
    tag: 'PREMIUM',
    category: 'bot-roles',
    roleColor: 0xd2691e,
  },
  {
    id: 'buncha',
    name: 'Bún Chả Hà Nội',
    description: '🍲 Đặc sản Hà thành chính hiệu\n🎁 Daily bonus: +6% xu',
    price: 95000,
    emoji: '🍲',
    category: 'bot-roles',
    roleColor: 0xcd853f,
  },
  {
    id: 'goimon',
    name: 'Gỏi Cuốn Pro',
    description: '🌱 Tươi ngon, healthy\n🎁 Daily bonus: +3% xu',
    price: 65000,
    emoji: '🌱',
    category: 'bot-roles',
    roleColor: 0x32cd32,
  },
  {
    id: 'tranmieng',
    name: 'Trân Miệng VIP',
    description: '🍮 Chuyên gia tráng miệng\n🎁 Daily bonus: +4% xu',
    price: 70000,
    emoji: '🍮',
    category: 'bot-roles',
    roleColor: 0xffdab9,
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
  try {
    return JSON.parse(fs.readFileSync(soldPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveSoldData(data: Record<string, number>): void {
  fs.writeFileSync(soldPath, JSON.stringify(data, null, 2));
}

function getSoldCount(itemId: string): number {
  return loadSold()[itemId] ?? 0;
}

function incrementSold(itemId: string): void {
  const d = loadSold();
  d[itemId] = (d[itemId] ?? 0) + 1;
  saveSoldData(d);
}

function decrementSold(itemId: string): void {
  const d = loadSold();
  d[itemId] = Math.max(0, (d[itemId] ?? 0) - 1);
  saveSoldData(d);
}

// ============================================
// SHOP CARD (Components V2)
// ============================================

function buildShop(client: Client, userId?: string, page: number = 1, disabled = false) {
  const icon = client.user?.displayAvatarURL();

  // Pagination settings
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(SHOP_ITEMS.length / ITEMS_PER_PAGE);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = SHOP_ITEMS.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const fullPrice = SHOP_ITEMS.reduce((a, t) => a + t.price, 0);

  // Banner (nếu có)
  const bannerPath = path.join(process.cwd(), 'assets', 'banners', 'shop-banner.gif');
  const hasBanner = fs.existsSync(bannerPath);
  const files = hasBanner ? [new AttachmentBuilder(bannerPath, { name: 'shop-banner.gif' })] : [];

  const card = new ContainerBuilder();

  if (hasBanner) {
    card.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://shop-banner.gif')),
    );
  }

  // Header
  const header = [
    txt('## 🛒 Cửa Hàng Role Banhcuon'),
    txt(
      `Mua role bằng ${emojis.coin} **Coin** • dùng \`/balance\` để xem số dư\n` +
        `-# Trang ${currentPage}/${totalPages} • ${SHOP_ITEMS.length} roles`,
    ),
  ];

  if (icon) {
    card.addSectionComponents(
      new SectionBuilder().addTextDisplayComponents(...header).setThumbnailAccessory(new ThumbnailBuilder().setURL(icon)),
    );
  } else {
    card.addTextDisplayComponents(...header);
  }

  card.addSeparatorComponents(sep());

  // Items
  pageItems.forEach((item, idx) => {
    const stockLeft = item.stock != null ? Math.max(0, item.stock - getSoldCount(item.id)) : Infinity;
    const stockStr =
      item.stock != null ? ` • ${stockLeft > 0 ? `Còn ${stockLeft}/${item.stock} suất` : '**Hết suất**'}` : '';

    card.addTextDisplayComponents(
      txt(
        `${item.emoji} **${item.name}**${item.tag ? ` \`${item.tag}\`` : ''}\n` +
          `${item.description}\n` +
          `${emojis.coin} **${formatNumber(item.price)}**${stockStr}`,
      ),
    );

    if (idx < pageItems.length - 1) card.addSeparatorComponents(sep(false));
  });

  card.addSeparatorComponents(sep());

  card.addTextDisplayComponents(txt(`${emojis.gift} **Mua full các role** • \`${formatNumber(fullPrice)}\` ${emojis.coin}`));

  // Select menu
  const menuOptions = [
    ...pageItems.map((item) => {
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
      .setEmoji(parseEmoji(emojis.gift) ?? ({ name: '🎁' } as any)),
  ];

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`shop_buy:${currentPage}`)
    .setPlaceholder('🛒 Chọn role bạn muốn mua...')
    .setDisabled(disabled)
    .addOptions(menuOptions);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`shop_page:${currentPage - 1}`)
      .setLabel('◀ Trước')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || currentPage === 1),
    new ButtonBuilder()
      .setCustomId(`shop_refresh:${currentPage}`)
      .setLabel('Refresh')
      .setEmoji(parseEmoji(emojis.refresh) ?? ({ name: '🔄' } as any))
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`shop_page:${currentPage + 1}`)
      .setLabel('Tiếp ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || currentPage === totalPages),
    new ButtonBuilder()
      .setCustomId('shop_vipinfo')
      .setLabel('VIP Info')
      .setEmoji(parseEmoji(emojis.crown) ?? ({ name: '👑' } as any))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );

  card
    .addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu))
    .addActionRowComponents(buttonRow)
    .addTextDisplayComponents(txt('-# Banhcuon-bot • Chọn role ở menu bên dưới'));

  return { components: [card], files, flags: V2 as any };
}

// Migration function - no longer needed, coins.json is the single currency source
function migrateCoinsToCowoncy(): void {
  console.log('[Shop] Migration not needed - coins.json is the single currency source');
}

// Busy users set for purchase protection
const busyUsers = new Set<string>();

export default class ShopModule {
  name = 'shop-module';
  description = 'Hệ thống shop và coins';
  version = '3.0.0';
  enabled = true;

  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('🎁 Shop module initialized');
    migrateCoinsToCowoncy();
    this.registerCommands();
    console.log(`✅ Shop module registered ${this.commands.size} commands`);

    // Export instance for prefix commands
    shopModuleInstance = this;
  }

  private registerCommands() {
    // /shop command
    const shopCommand = {
      data: new SlashCommandBuilder().setName('shop').setDescription('� Xem shop và mua bot roles'),

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
          let lastPage = 1;

          const response = await interaction.editReply(buildShop(interaction.client, userId, 1) as any);

          // Collector
          const collector = response.createMessageComponentCollector({ time: 300000 });

          collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
              await replyEph(i, `${emojis.error} Bạn không thể dùng shop này!`);
              return;
            }

            // Pagination button
            if (i.customId.startsWith('shop_page:')) {
              lastPage = parseInt(i.customId.split(':')[1]);
              await i.update(buildShop(i.client, userId, lastPage) as any);
              return;
            }

            // Refresh button
            if (i.customId.startsWith('shop_refresh:')) {
              lastPage = parseInt(i.customId.split(':')[1]);
              await i.update(buildShop(i.client, userId, lastPage) as any);
              return;
            }

            // VIP Info button
            if (i.customId === 'shop_vipinfo') {
              try {
                console.log('[Shop] Looking for vip-info command...');
                console.log('[Shop] Available commands:', Array.from(this.client.commands.keys()).join(', '));
                
                // Try multiple command names
                let vipInfoCommand = this.client.commands.get('vip-info') 
                                  || this.client.commands.get('vipinfo');
                
                if (vipInfoCommand) {
                  console.log('[Shop] Found vip-info command, executing...');
                  await vipInfoCommand.execute(i);
                } else {
                  console.error('[Shop] VIP command not found! Available commands:', this.client.commands.size);
                  await replyEph(
                    i,
                    `${emojis.error} Command /vipinfo không tìm thấy. Bot cần restart để load VIP module.\n\nVui lòng dùng \`/vipinfo\` trực tiếp hoặc liên hệ admin.`,
                  );
                }
              } catch (error) {
                console.error('[Shop] Error calling vip-info from shop:', error);
                await replyEph(
                  i,
                  `${emojis.error} Có lỗi: ${error instanceof Error ? error.message : 'Unknown'}\n\nVui lòng dùng \`/vipinfo\` trực tiếp.`,
                ).catch(() => {});
              }
              return;
            }

            // Buy item
            if (i.customId.startsWith('shop_buy:') && i.isStringSelectMenu()) {
              const currentPage = parseInt(i.customId.split(':')[1]);
              lastPage = currentPage;

              // Defer first to avoid interaction timeout issues
              await i.deferReply({ flags: MessageFlags.Ephemeral });

              const done = (content: string, color = 0xed4245) =>
                i.editReply({ components: [notice(content, color)], flags: V2 });

              if (busyUsers.has(userId)) {
                await done('Đang xử lý lượt mua trước của bạn, đợi một chút nhé.', 0xfaa61a);
                return;
              }

              busyUsers.add(userId);

              try {
                const v = i.values[0];
                let targets = v === 'all' ? [...SHOP_ITEMS] : SHOP_ITEMS.filter((t) => t.id === v);

                if (!targets.length) {
                  await done('Vật phẩm không tồn tại.');
                  return;
                }

                const skipped: string[] = [];
                const guild = i.guild!;
                const member = guild.members.cache.get(userId)!;

                // Filter: skip already-owned and out-of-stock
                targets = targets.filter((t) => {
                  const roleName = `${t.emoji} ${t.name}`;
                  if (member.roles.cache.find((r) => r.name === roleName)) {
                    skipped.push(`${t.name} (đã có)`);
                    return false;
                  }
                  const stockLeft = t.stock != null ? t.stock - getSoldCount(t.id) : Infinity;
                  if (stockLeft <= 0) {
                    skipped.push(`${t.name} (hết suất)`);
                    return false;
                  }
                  return true;
                });

                if (!targets.length) {
                  await done(`Không có gì để mua: ${skipped.join(', ')}.`, 0xfaa61a);
                  return;
                }

                const totalPrice = targets.reduce((a, t) => a + t.price, 0);
                const currentBal = getUserBalance(userId);

                if (currentBal.cowoncy < totalPrice) {
                  await done('Bạn không đủ coin để mua!');
                  return;
                }

                // Deduct FIRST, then assign roles
                if (!deductCurrency(userId, totalPrice)) {
                  await done('Bạn không đủ coin để mua!');
                  return;
                }

                targets.forEach((t) => {
                  if (t.stock != null) incrementSold(t.id);
                });

                try {
                  for (const item of targets) {
                    const roleName = `${item.emoji} ${item.name}`;
                    let role = guild?.roles.cache.find((r) => r.name === roleName);
                    if (!role) {
                      role = await guild.roles.create({
                        name: roleName,
                        color: item.roleColor,
                        hoist: true,
                        reason: 'Shop purchase',
                      });
                    }
                    await member.roles.add(role);
                    addToInventory(userId, item.id);
                  }
                } catch (err) {
                  console.error('[Shop] Role assign error, rolling back:', err);
                  // Rollback currency and stock
                  addCoins(userId, totalPrice);
                  targets.forEach((t) => {
                    if (t.stock != null) decrementSold(t.id);
                  });
                  // Rollback inventory
                  targets.forEach((t) => {
                    const invData = loadInventory();
                    if (invData[userId]?.[t.id]) {
                      invData[userId][t.id] = Math.max(0, invData[userId][t.id] - 1);
                      if (invData[userId][t.id] === 0) delete invData[userId][t.id];
                      saveInventory(invData);
                    }
                  });
                  await done('Bot không thể gắn role (thiếu quyền hoặc role bot thấp hơn). Tiền đã được hoàn lại.');
                  return;
                }

                const newBal = getUserBalance(userId);

                await done(
                  `${emojis.success} Đã mua ${targets.map((t) => `${t.emoji} **${t.name}**`).join(', ')} thành công!\n` +
                    `Số dư còn: ${emojis.coin} **${formatNumber(newBal.cowoncy)}**` +
                    (skipped.length ? `\n-# Bỏ qua: ${skipped.join(', ')}` : ''),
                  0x57f287,
                );

                // Refresh shop card with current page
                await i.message?.edit(buildShop(i.client, userId, currentPage) as any).catch(() => {});
              } finally {
                busyUsers.delete(userId);
              }
            }
          });

          // Hết thời gian: vô hiệu hóa menu và nút (V2 không cho xóa hết components)
          collector.on('end', () => {
            interaction.editReply(buildShop(interaction.client, userId, lastPage, true) as any).catch(() => {});
          });
        } catch (error: any) {
          console.error('[Shop] Error in shop command:', error);
          const errorCard = notice(`${emojis.error} Có lỗi xảy ra khi mở shop! Thử lại sau nhé.`);

          try {
            if (interaction.deferred || interaction.replied) {
              await interaction.editReply({ components: [errorCard], flags: V2 });
            } else {
              await interaction.reply({ components: [errorCard], flags: V2_EPH });
            }
          } catch (replyError) {
            console.error('[Shop] Failed to send error message:', replyError);
          }
        }
      },
    };

    // /inventory command
    const inventoryCommand = {
      data: new SlashCommandBuilder().setName('inventory').setDescription('Xem roles và items đã mua'),

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

        const lines = Object.entries(inventory)
          .map(([itemId, quantity]) => {
            const item = SHOP_ITEMS.find((it) => it.id === itemId);
            return item ? `${item.emoji} **${item.name}** ×${quantity}` : null;
          })
          .filter((l): l is string => !!l);

        if (lines.length === 0) {
          await interaction.editReply({
            components: [notice(`${emojis.error} Inventory của bạn trống!\nDùng \`/shop\` để mua items!`)],
            flags: V2,
          });
          return;
        }

        const card = new ContainerBuilder().addSectionComponents(
            new SectionBuilder()
              .addTextDisplayComponents(
                txt(`## 🎒 Inventory của ${interaction.user.displayName}`),
                txt(`${emojis.coin} **Coin:** ${formatNumber(bal.cowoncy)}`),
              )
              .setThumbnailAccessory(new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ size: 128 }))),
          )
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(lines.join('\n')))
          .addTextDisplayComponents(txt(`-# ${lines.length} loại vật phẩm • <t:${Math.floor(Date.now() / 1000)}:R>`));

        await interaction.editReply({ components: [card], flags: V2 });
      },
    };

    // /balance command
    const balanceCommand = {
      data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Xem số xu, vé vàng và thống kê điểm danh')
        .addUserOption((option) => option.setName('user').setDescription('� User cần xem').setRequired(false)),

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
            components: [notice('Bot không có tài khoản xu.', 0xfaa61a)],
            flags: V2,
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

        // Get daily data for streak info from Turso
        const dailyData = await getDailyUser(targetUser.id);

        const card = new ContainerBuilder().addSectionComponents(
            new SectionBuilder()
              .addTextDisplayComponents(
                txt(`### ${emojis.coin} ${name}`),
                txt(
                  `**${formatNumber(bal.cowoncy)}** ${emojis.coin}  ·  **${dailyData?.gold_balance || 0}** ${emojis.gem}\n` +
                    `${emojis.fire} Streak: **${dailyData?.streak || 0}** ngày  ·  ${emojis.chart} Check-ins: **${dailyData?.total_checkins || 0}** lần`,
                ),
              )
              .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetUser.displayAvatarURL({ size: 128 }))),
          );

        await interaction.editReply({ components: [card], flags: V2 });
      },
    };

    // /revoke command (Admin only)
    const revokeCommand = {
      data: new SlashCommandBuilder()
        .setName('revoke')
        .setDescription('Thu hồi role đã mua ([[Admin]])')
        .addUserOption((option) => option.setName('user').setDescription('� User cần thu hồi role').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }

        const fail = (content: string) => interaction.editReply({ components: [notice(content)], flags: V2 });

        // Check admin
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          return fail(`${emojis.error} Bạn cần quyền Administrator!`);
        }

        const targetUser = interaction.options.getUser('user', true);
        const guild = interaction.guild;
        const member = guild?.members.cache.get(targetUser.id);

        if (!member) {
          return fail(`${emojis.error} Không tìm thấy member!`);
        }

        // Get user's roles from both inventory and Discord
        const inventory = getUserInventory(targetUser.id);
        const userRoles: Array<{ item: ShopItem; inInventory: boolean; inDiscord: boolean }> = [];

        for (const item of SHOP_ITEMS) {
          const roleName = `${item.emoji} ${item.name}`;
          const discordRole = guild?.roles.cache.find((r) => r.name === roleName);
          const hasInInventory = !!inventory[item.id];
          const hasDiscordRole = discordRole && member.roles.cache.has(discordRole.id);

          if (hasInInventory || hasDiscordRole) {
            userRoles.push({ item, inInventory: hasInInventory, inDiscord: !!hasDiscordRole });
          }
        }

        if (userRoles.length === 0) {
          return fail(`${emojis.error} ${targetUser.username} không có role nào để thu hồi!`);
        }

        // Danh sách role
        const roleList = userRoles
          .map((r, i) => {
            const status =
              r.inInventory && r.inDiscord
                ? '✅ Inventory + Discord'
                : r.inInventory
                  ? '📦 Chỉ Inventory'
                  : '🎭 Chỉ Discord';
            return `**${i + 1}.** ${r.item.emoji} **${r.item.name}**\n-# ${status}`;
          })
          .join('\n');

        // Hàng nút (5 nút/hàng) + nút Hủy
        const makeRows = (disabled = false) => {
          const rows: ActionRowBuilder<ButtonBuilder>[] = [];
          let currentRow = new ActionRowBuilder<ButtonBuilder>();

          userRoles.forEach((r, index) => {
            currentRow.addComponents(
              new ButtonBuilder()
                .setCustomId(`revoke_${targetUser.id}_${r.item.id}`)
                .setLabel(`${r.item.emoji} ${r.item.name}`)
                .setStyle(ButtonStyle.Danger)
                .setDisabled(disabled),
            );

            if ((index + 1) % 5 === 0 || index === userRoles.length - 1) {
              rows.push(currentRow);
              currentRow = new ActionRowBuilder<ButtonBuilder>();
            }
          });

          const cancel = new ButtonBuilder()
            .setCustomId('revoke_cancel')
            .setLabel('❌ Hủy')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled);

          const lastRow = rows[rows.length - 1];
          if (lastRow.components.length < 5) lastRow.addComponents(cancel);
          else rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(cancel));

          return rows;
        };

        const buildRevokeCard = (disabled = false) =>
          new ContainerBuilder().addSectionComponents(
              new SectionBuilder()
                .addTextDisplayComponents(
                  txt(`## ${emojis.refresh} Thu Hồi Role`),
                  txt(`**Admin:** ${interaction.user}\n**Target:** ${targetUser} • **${userRoles.length}** role`),
                )
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetUser.displayAvatarURL({ size: 256 }))),
            )
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(`${emojis.document} **Danh sách roles**\n${roleList}`))
            .addSeparatorComponents(sep())
            .addActionRowComponents(...makeRows(disabled))
            .addTextDisplayComponents(
              txt(`-# ${emojis.warning} Bấm nút để thu hồi role • Yêu cầu bởi ${interaction.user.tag}`),
            );

        const response = await interaction.editReply({
          components: [buildRevokeCard()],
          flags: V2,
          allowedMentions: NO_PING,
        });

        // Collector
        const collector = response.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async (i) => {
          if (i.user.id !== interaction.user.id) {
            await replyEph(i, `${emojis.error} Chỉ ${interaction.user} mới có thể dùng nút này!`);
            return;
          }

          // Cancel
          if (i.customId === 'revoke_cancel') {
            await i.update({
              components: [notice('❌ **Đã hủy thu hồi role!**', 0x808080)],
              flags: V2,
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

            const item = SHOP_ITEMS.find((it) => it.id === itemId);

            if (!item) {
              await replyEph(i, `${emojis.error} Role không tồn tại! (ID: ${itemId})`);
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
              const discordRole = guild?.roles.cache.find((r) => r.name === roleName);

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

              const ok = roleRemoved || inventoryRemoved;

              const resultCard = new ContainerBuilder().addSectionComponents(
                  new SectionBuilder()
                    .addTextDisplayComponents(
                      txt(`## ${ok ? emojis.success : emojis.error} Thu Hồi ${ok ? 'Thành Công' : 'Không Thành Công'}`),
                      txt(`**Admin:** ${interaction.user}\n**User:** ${targetUser}\n**Role:** ${item.emoji} ${item.name}`),
                    )
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetUser.displayAvatarURL())),
                )
                .addSeparatorComponents(sep())
                .addTextDisplayComponents(
                  txt(
                    (inventoryRemoved
                      ? `${emojis.success} Đã xóa khỏi inventory\n`
                      : `${emojis.warning} Không có trong inventory\n`) +
                      (roleRemoved
                        ? `${emojis.success} Đã remove Discord role\n`
                        : roleError
                          ? `${emojis.error} ${roleError}\n`
                          : `${emojis.warning} Không có Discord role\n`) +
                      (nicknameReset ? `${emojis.success} Đã reset nickname về mặc định\n` : '') +
                      (customRoleDeleted ? `${emojis.success} Đã xóa custom role` : ''),
                  ),
                )
                .addTextDisplayComponents(
                  txt(`-# Thu hồi bởi ${interaction.user.tag} • <t:${Math.floor(Date.now() / 1000)}:R>`),
                );

              await i.editReply({ components: [resultCard], flags: V2, allowedMentions: NO_PING });

              collector.stop();
            } catch (error) {
              console.error('[Revoke] Error:', error);
              await i.followUp({
                components: [notice(`${emojis.error} Có lỗi xảy ra khi thu hồi role!`)],
                flags: V2_EPH,
              });
            }
          }
        });

        // Hết giờ: vô hiệu hóa nút (collector.stop() thủ công có reason 'user')
        collector.on('end', (_collected, reason) => {
          if (reason !== 'time') return;
          interaction
            .editReply({ components: [buildRevokeCard(true)], flags: V2, allowedMentions: NO_PING })
            .catch(() => {});
        });
      },
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

