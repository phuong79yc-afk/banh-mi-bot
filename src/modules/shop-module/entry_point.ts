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

// Data paths
const coinsPath = path.join(process.cwd(), 'data', 'coins.json');
const currenciesPath = path.join(process.cwd(), 'data', 'currencies.json');
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
  prices: {
    cowoncy: number;
    blueTicket: number;
    goldTicket: number;
  };
  emoji: string;
  tag?: 'BEST_SELLER' | 'PREMIUM' | 'LIMITED' | 'EXCLUSIVE';
  category: 'bot-roles';
  roleColor: number;
  isVIP?: boolean;
}

interface CoinsData {
  [userId: string]: number;
}

interface CurrencyBalance {
  cowoncy: number;
  blueTicket: number;
  goldTicket: number;
}

interface CurrenciesData {
  [userId: string]: CurrencyBalance;
}

interface InventoryData {
  [userId: string]: {
    [itemId: string]: number;
  };
}

// Shop items - 5 bot-related roles
const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'bot_supporter',
    name: 'Bot Supporter',
    description: 'Ủng hộ bot development',
    prices: { cowoncy: 500000, blueTicket: 100, goldTicket: 10 },
    emoji: '🤖',
    tag: 'BEST_SELLER',
    category: 'bot-roles',
    roleColor: 0x5865F2
  },
  {
    id: 'premium_member',
    name: 'Premium Member',
    description: 'VIP member với nhiều quyền lợi',
    prices: { cowoncy: 1000000, blueTicket: 250, goldTicket: 25 },
    emoji: '⭐',
    tag: 'PREMIUM',
    category: 'bot-roles',
    roleColor: 0xFFD700,
    isVIP: true
  },
  {
    id: 'bot_designer',
    name: 'Bot Designer',
    description: 'Đóng góp ý tưởng design cho bot',
    prices: { cowoncy: 750000, blueTicket: 150, goldTicket: 15 },
    emoji: '🎨',
    category: 'bot-roles',
    roleColor: 0x9B59B6
  },
  {
    id: 'bot_developer',
    name: 'Bot Developer',
    description: 'Contributor chính thức của bot',
    prices: { cowoncy: 2000000, blueTicket: 500, goldTicket: 50 },
    emoji: '💎',
    tag: 'LIMITED',
    category: 'bot-roles',
    roleColor: 0xE74C3C,
    isVIP: true
  },
  {
    id: 'bot_owner',
    name: 'Bot Owner',
    description: 'Role cao nhất - owner và admin',
    prices: { cowoncy: 5000000, blueTicket: 1000, goldTicket: 100 },
    emoji: '👑',
    tag: 'EXCLUSIVE',
    category: 'bot-roles',
    roleColor: 0x000001,
    isVIP: true
  }
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

// Multi-currency functions
function loadCurrencies(): CurrenciesData {
  try {
    if (!fs.existsSync(currenciesPath)) return {};
    return JSON.parse(fs.readFileSync(currenciesPath, 'utf8'));
  } catch { return {}; }
}

function saveCurrencies(data: CurrenciesData): void {
  fs.writeFileSync(currenciesPath, JSON.stringify(data, null, 2));
}

function getUserBalance(userId: string): CurrencyBalance {
  const data = loadCurrencies();
  return data[userId] ?? { cowoncy: 0, blueTicket: 0, goldTicket: 0 };
}

function deductCurrencies(userId: string, prices: { cowoncy: number; blueTicket: number; goldTicket: number }): boolean {
  const data = loadCurrencies();
  const bal = data[userId] ?? { cowoncy: 0, blueTicket: 0, goldTicket: 0 };
  if (bal.cowoncy < prices.cowoncy || bal.blueTicket < prices.blueTicket || bal.goldTicket < prices.goldTicket) return false;
  bal.cowoncy -= prices.cowoncy;
  bal.blueTicket -= prices.blueTicket;
  bal.goldTicket -= prices.goldTicket;
  data[userId] = bal;
  saveCurrencies(data);
  return true;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
  return n.toString();
}

// Pad a string to a fixed width (visible characters only, ignores Discord markdown)
function padRight(text: string, width: number): string {
  // Strip markdown for length calculation
  const stripped = text.replace(/[*_~`]/g, '');
  const pad = Math.max(0, width - stripped.length);
  return text + ' '.repeat(pad);
}

function formatTag(tag?: string): string {
  if (!tag) return '';
  if (tag === 'BEST_SELLER') return '[BEST SELLER]';
  return `[${tag}]`;
}

function wrapText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text, ''];
  // Try to break at a space near maxLen
  const breakAt = text.lastIndexOf(' ', maxLen);
  if (breakAt > 0) {
    const line1 = text.slice(0, breakAt);
    const rest = text.slice(breakAt + 1);
    return [line1, rest.length > maxLen ? rest.slice(0, maxLen - 3) + '...' : rest];
  }
  return [text.slice(0, maxLen - 3) + '...', ''];
}

function buildShopDescription(items: ShopItem[], username: string, bal: CurrencyBalance): string {
  const COL = 26; // column width in characters
  let desc = '';

  // Balance header
  desc += `👤 **${username}** | 💎 ${formatNumber(bal.cowoncy)} • 🎫 ${bal.blueTicket} • 🏆 ${bal.goldTicket}\n`;
  desc += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Shop title line
  desc += `Mua các role bằng 💎 Cowoncy, 🎫 Vé Xanh, 🏆 Vé Vàng\n\n`;

  // Split items into rows of 3
  for (let rowStart = 0; rowStart < items.length; rowStart += 3) {
    const row = items.slice(rowStart, rowStart + 3);
    // Pad row to 3 items (empty slots)
    while (row.length < 3) row.push(null as any);

    // Line 1: emoji + name
    const nameLine = row.map(item => {
      if (!item) return padRight('', COL);
      return padRight(`${item.emoji} @${item.name}`, COL);
    }).join('');
    desc += nameLine.trimEnd() + '\n';

    // Line 2: tag (or blank)
    const tagLine = row.map(item => {
      if (!item) return padRight('', COL);
      const tag = formatTag(item.tag);
      return padRight(tag, COL);
    }).join('');
    const tagTrimmed = tagLine.trimEnd();
    if (tagTrimmed.length > 0) desc += tagTrimmed + '\n';

    // Lines 3-4: description (wrapped to 2 lines)
    const descLines: [string, string][] = row.map(item => {
      if (!item) return ['', ''] as [string, string];
      const [l1, l2] = wrapText(item.description, COL - 1);
      return [l1, l2] as [string, string];
    });
    const descLine1 = descLines.map(([l]) => padRight(l, COL)).join('').trimEnd();
    const descLine2 = descLines.map(([, l]) => padRight(l, COL)).join('').trimEnd();
    if (descLine1) desc += descLine1 + '\n';
    if (descLine2) desc += descLine2 + '\n';

    // Blank line between desc and prices
    desc += '\n';

    // Price lines: cowoncy, blueTicket, goldTicket
    const cowoncyLine = row.map(item => {
      if (!item) return padRight('', COL);
      return padRight(`• ${formatNumber(item.prices.cowoncy)} 💎`, COL);
    }).join('').trimEnd();
    desc += cowoncyLine + '\n';

    const blueLine = row.map(item => {
      if (!item) return padRight('', COL);
      return padRight(`• ${item.prices.blueTicket} 🎫`, COL);
    }).join('').trimEnd();
    desc += blueLine + '\n';

    const goldLine = row.map(item => {
      if (!item) return padRight('', COL);
      return padRight(`• ${item.prices.goldTicket} 🏆`, COL);
    }).join('').trimEnd();
    desc += goldLine + '\n';

    // Row separator
    desc += '\n\n';
  }

  return desc;
}

// Migration function
function migrateCoinsToCowoncy(): void {
  if (!fs.existsSync(coinsPath)) return;
  const currencies = loadCurrencies();
  let migrated = 0;
  try {
    const coins: CoinsData = JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
    for (const [userId, amount] of Object.entries(coins)) {
      if (typeof amount === 'number' && amount > 0 && !currencies[userId]) {
        currencies[userId] = { cowoncy: amount, blueTicket: 0, goldTicket: 0 };
        migrated++;
      }
    }
    if (migrated > 0) {
      saveCurrencies(currencies);
      console.log(`[Shop] Migrated ${migrated} users from coins.json to currencies.json`);
    }
  } catch (e) {
    console.error('[Shop] Migration error:', e);
  }
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
  }

  private registerCommands() {
    // /shop command
    const shopCommand = {
      data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Xem shop và mua bot roles'),
      execute: async (interaction: ChatInputCommandInteraction) => {
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
        const bal = getUserBalance(userId);
        
        // Load banner
        const bannerPath = path.join(process.cwd(), 'assets', 'banners', 'shop-banner.gif');
        const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'shop-banner.gif' });
        
        // Create embed with 3-column plain text layout
        const shopDesc = buildShopDescription(SHOP_ITEMS, interaction.user.username, bal);
        
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('🛍️ BOT ROLE SHOP - VIP STORE')
          .setAuthor({
            name: interaction.client.user?.username || 'Bot Shop',
            iconURL: interaction.client.user?.displayAvatarURL()
          })
          .setImage('attachment://shop-banner.gif')
          .setDescription(shopDesc)
          .setFooter({ text: 'Dùng menu bên dưới để mua • Giá = 3 loại tiền' });
        
        // Buttons row
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
        
        // Select menu - single menu with all 5 items
        const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('shop_buy')
              .setPlaceholder('🛒 Chọn role để mua...')
              .addOptions(
                SHOP_ITEMS.map(item => {
                  const tagLabel = item.tag === 'BEST_SELLER' ? 'BEST SELLER' :
                                  item.tag === 'PREMIUM' ? 'PREMIUM' :
                                  item.tag === 'LIMITED' ? 'LIMITED' :
                                  item.tag === 'EXCLUSIVE' ? 'EXCLUSIVE' : '';
                  
                  return new StringSelectMenuOptionBuilder()
                    .setLabel(`${item.emoji} ${item.name}${item.tag ? ' [' + tagLabel + ']' : ''}`)
                    .setDescription(`💎 ${formatNumber(item.prices.cowoncy)} • 🎫 ${item.prices.blueTicket} • 🏆 ${item.prices.goldTicket}`)
                    .setValue(item.id)
                    .setEmoji(item.emoji);
                })
              )
          );
        
        const response = await interaction.editReply({
          embeds: [embed],
          components: [buttonRow, selectMenu],
          files: [bannerAttachment]
        });
        
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
          
          // Refresh button
          if (i.customId === 'shop_refresh') {
            await i.deferUpdate();
            const newBal = getUserBalance(userId);
            const newDesc = buildShopDescription(SHOP_ITEMS, interaction.user.username, newBal);
            embed.setDescription(newDesc);
            await i.editReply({ embeds: [embed] });
            return;
          }
          
          // VIP Info button
          if (i.customId === 'shop_vipinfo') {
            const vipEmbed = new EmbedBuilder()
              .setColor('#FFD700')
              .setTitle('👑 VIP Info - Quyền Lợi Đặc Biệt')
              .setDescription(
                `**✨ QUYỀN LỢI VIP:**\n\n` +
                `**⭐ Premium Member** (1M 💎)\n` +
                `• ✨ /nickname - Đổi tên\n` +
                `• 🎨 /customrole\n` +
                `• 💎 x2 coins /daily\n\n` +
                `**💎 Bot Developer** (2M 💎)\n` +
                `• ✨ /nickname - Đổi tên\n` +
                `• 🎨 /customrole\n` +
                `• 💎 x2 coins /daily\n\n` +
                `**👑 Bot Owner** (5M 💎)\n` +
                `• ✨ /nickname - Đổi tên\n` +
                `• 🎨 /customrole\n` +
                `• 💎 x2 coins /daily\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `💡 Kiếm tiền:\n` +
                `• /daily - Điểm danh hàng ngày\n` +
                `• /quest - Hoàn thành nhiệm vụ`
              )
              .setThumbnail(interaction.user.displayAvatarURL())
              .setFooter({ text: '🎁 VIP = Tạo custom role + x2 coins!' });
            
            await i.reply({
              embeds: [vipEmbed],
              flags: 64
            });
            return;
          }
          
          // Buy item
          if (i.customId === 'shop_buy' && i.isStringSelectMenu()) {
            const itemId = i.values[0];
            const item = SHOP_ITEMS.find(it => it.id === itemId);
            
            if (!item) {
              await i.reply({
                content: `${emojis.error} Item không tồn tại!`,
                flags: 64
              });
              return;
            }
            
            // Check balance
            const currentBal = getUserBalance(userId);
            const shortCowoncy = Math.max(0, item.prices.cowoncy - currentBal.cowoncy);
            const shortBlue = Math.max(0, item.prices.blueTicket - currentBal.blueTicket);
            const shortGold = Math.max(0, item.prices.goldTicket - currentBal.goldTicket);
            
            if (shortCowoncy > 0 || shortBlue > 0 || shortGold > 0) {
              let errorMsg = `❌ Không đủ tiền!\n\n`;
              if (shortCowoncy > 0) errorMsg += `💎 Cowoncy: có ${formatNumber(currentBal.cowoncy)} / cần ${formatNumber(item.prices.cowoncy)} (thiếu ${formatNumber(shortCowoncy)})\n`;
              if (shortBlue > 0) errorMsg += `🎫 Vé Xanh: có ${currentBal.blueTicket} / cần ${item.prices.blueTicket} (thiếu ${shortBlue})\n`;
              if (shortGold > 0) errorMsg += `🏆 Vé Vàng: có ${currentBal.goldTicket} / cần ${item.prices.goldTicket} (thiếu ${shortGold})\n`;
              
              await i.reply({
                content: errorMsg,
                flags: 64
              });
              return;
            }
            
            // Check if already has role
            const member = i.guild?.members.cache.get(userId);
            const roleName = `${item.emoji} ${item.name}`;
            if (member?.roles.cache.find(r => r.name === roleName)) {
              await i.reply({
                content: `${emojis.warning} Bạn đã có role này rồi!`,
                flags: 64
              });
              return;
            }
            
            await i.deferReply({ flags: 64 });
            
            try {
              // Deduct currencies
              if (!deductCurrencies(userId, item.prices)) {
                await i.editReply({
                  content: `${emojis.error} Lỗi khi trừ tiền!`
                });
                return;
              }
              
              // Add to inventory
              addToInventory(userId, item.id);
              
              // Create or get role
              let role = i.guild?.roles.cache.find(r => r.name === roleName);
              
              if (!role && i.guild) {
                role = await i.guild.roles.create({
                  name: roleName,
                  color: item.roleColor,
                  hoist: true,
                  reason: `Shop purchase by ${i.user.tag}`
                });
              }
              
              // Assign role
              if (role && member) {
                await member.roles.add(role);
              }
              
              const newBal = getUserBalance(userId);
              
              const successEmbed = new EmbedBuilder()
                .setColor(item.isVIP ? '#FFD700' : '#57F287')
                .setTitle('✅ Mua Thành Công!')
                .setDescription(
                  `╔═══════════════════════════════╗\n` +
                  `║  ${item.emoji} ${item.name}  ${item.tag ? '[' + (item.tag === 'BEST_SELLER' ? 'BEST SELLER' : item.tag === 'PREMIUM' ? 'PREMIUM' : item.tag === 'LIMITED' ? 'LIMITED' : 'EXCLUSIVE') + ']' : ''}        ║\n` +
                  `╚═══════════════════════════════╝\n\n` +
                  `💎 Cowoncy:   -${formatNumber(item.prices.cowoncy)} (còn ${formatNumber(newBal.cowoncy)})\n` +
                  `🎫 Vé Xanh:   -${item.prices.blueTicket} (còn ${newBal.blueTicket})\n` +
                  `🏆 Vé Vàng:   -${item.prices.goldTicket} (còn ${newBal.goldTicket})\n\n` +
                  `🎁 Role đã thêm vào profile!` +
                  (item.isVIP ?
                    `\n\n╔═══ 👑 QUYỀN LỢI VIP ═══╗\n` +
                    `║ ✨ /nickname - Đổi tên  ║\n` +
                    `║ 🎨 /customrole          ║\n` +
                    `║ 💎 x2 coins /daily      ║\n` +
                    `╚════════════════════════╝` : '')
                )
                .setThumbnail(i.user.displayAvatarURL({ size: 256 }))
                .setFooter({ 
                  text: `🎉 Cảm ơn ${i.user.username} đã ủng hộ!`,
                  iconURL: i.user.displayAvatarURL()
                })
                .setTimestamp();
              
              await i.editReply({
                embeds: [successEmbed]
              });
              
              // Update shop display
              const refreshedDesc = buildShopDescription(SHOP_ITEMS, interaction.user.username, newBal);
              embed.setDescription(refreshedDesc);
              await interaction.editReply({ embeds: [embed] });
              
            } catch (error) {
              console.error('Shop purchase error:', error);
              await i.editReply({
                content: `${emojis.error} Có lỗi xảy ra khi mua item!`
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

    // /inventory command
    const inventoryCommand = {
      data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Xem inventory của bạn'),
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
            `💎 **Cowoncy:** ${formatNumber(bal.cowoncy)}\n` +
            `🎫 **Vé Xanh:** ${bal.blueTicket}\n` +
            `🏆 **Vé Vàng:** ${bal.goldTicket}\n` +
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
        .setDescription('Xem số dư tiền')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User cần xem')
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
        const bal = getUserBalance(targetUser.id);
        const oldCoins = getUserCoins(targetUser.id);
        
        // Load banner
        const bannerPath = path.join(process.cwd(), 'assets', 'banners', 'balance-banner.gif');
        const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'balance-banner.gif' });
        
        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setImage('attachment://balance-banner.gif')
          .setAuthor({
            name: `${targetUser.username}'s Balance`,
            iconURL: targetUser.displayAvatarURL()
          })
          .setDescription(
            `╔═══════════════════════════════╗\n` +
            `║   💰 YOUR BALANCE             ║\n` +
            `╚═══════════════════════════════╝\n\n` +
            `💎 Cowoncy:      ${formatNumber(bal.cowoncy)}\n` +
            `🎫 Vé Xanh:      ${bal.blueTicket}\n` +
            `🏆 Vé Vàng:      ${bal.goldTicket}\n` +
            (oldCoins > 0 ? `\n🪙 Coins (cũ):   ${oldCoins}\n` : '') +
            `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `💡 Kiếm thêm tiền:\n` +
            `• /daily - Điểm danh hàng ngày\n` +
            `• /quest - Hoàn thành nhiệm vụ`
          )
          .setFooter({ text: `Requested by ${interaction.user.tag}` })
          .setTimestamp();
        
        await interaction.editReply({
          embeds: [embed],
          files: [bannerAttachment]
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
          .setTitle(`🔄 Thu Hồi Role - ${targetUser.username}`)
          .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
          .setDescription(
            `**Admin:** ${interaction.user}\n` +
            `**Target:** ${targetUser}\n` +
            `**Tổng roles:** ${userRoles.length}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `📋 **Danh sách roles:**\n\n` +
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
