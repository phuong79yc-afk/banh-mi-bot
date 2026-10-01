import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
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

// Database paths
const coinsPath = path.join(process.cwd(), 'data', 'coins.json');
const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');

// Ensure data files exist
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
  price: number;
  emoji: string;
  category: 'roles' | 'items' | 'perks' | 'cosmetics';
  stock?: number;
}

interface CoinsData {
  [userId: string]: number;
}

interface InventoryData {
  [userId: string]: {
    [itemId: string]: number;
  };
}

// Shop items
const SHOP_ITEMS: ShopItem[] = [
  // Roles
  {
    id: 'banh_cuon_lover',
    name: 'Bánh Cuốn Lover',
    description: '[BEST SELLER] Dành cho hội mê bánh cuốn chính hiệu',
    price: 350,
    emoji: '🥟',
    category: 'roles'
  },
  {
    id: 'vip_member',
    name: 'VIP Member',
    description: 'Thành viên VIP với nhiều đặc quyền độc quyền',
    price: 500,
    emoji: '👑',
    category: 'roles'
  },
  {
    id: 'supporter',
    name: 'Supporter',
    description: 'Người ủng hộ nhiệt tình của Bánh Cuốn Bot',
    price: 300,
    emoji: '💖',
    category: 'roles'
  },
  {
    id: 'gamer',
    name: 'Gamer',
    description: 'Dành cho những game thủ chính hiệu trong server',
    price: 400,
    emoji: '🎮',
    category: 'roles'
  },
  {
    id: 'music_lover',
    name: 'Music Lover',
    description: 'Hội yêu âm nhạc và thường xuyên nghe nhạc',
    price: 350,
    emoji: '🎵',
    category: 'roles'
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Cú đêm hoạt động vào ban đêm, ngủ ban ngày',
    price: 450,
    emoji: '🦉',
    category: 'roles'
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Chim sơn ca luôn online sớm mỗi ngày',
    price: 450,
    emoji: '🐦',
    category: 'roles'
  },
  {
    id: 'artist',
    name: 'Artist',
    description: 'Nghệ sĩ tài năng với khả năng sáng tạo không giới hạn',
    price: 600,
    emoji: '🎨',
    category: 'roles'
  },
  {
    id: 'foodie',
    name: 'Foodie',
    description: 'Hội yêu ẩm thực và đam mê khám phá món ăn mới',
    price: 400,
    emoji: '🍜',
    category: 'roles'
  }
];

// Load coins
function loadCoins(): CoinsData {
  try {
    return JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
  } catch {
    return {};
  }
}

// Save coins
function saveCoins(data: CoinsData): void {
  fs.writeFileSync(coinsPath, JSON.stringify(data, null, 2));
}

// Get user coins
function getUserCoins(userId: string): number {
  const data = loadCoins();
  return data[userId] || 0;
}

// Add coins
function addCoins(userId: string, amount: number): number {
  const data = loadCoins();
  data[userId] = (data[userId] || 0) + amount;
  saveCoins(data);
  return data[userId];
}

// Remove coins
function removeCoins(userId: string, amount: number): boolean {
  const data = loadCoins();
  const current = data[userId] || 0;
  if (current < amount) return false;
  data[userId] = current - amount;
  saveCoins(data);
  return true;
}

// Load inventory
function loadInventory(): InventoryData {
  try {
    return JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  } catch {
    return {};
  }
}

// Save inventory
function saveInventory(data: InventoryData): void {
  fs.writeFileSync(inventoryPath, JSON.stringify(data, null, 2));
}

// Add item to inventory
function addToInventory(userId: string, itemId: string, quantity: number = 1): void {
  const data = loadInventory();
  if (!data[userId]) data[userId] = {};
  data[userId][itemId] = (data[userId][itemId] || 0) + quantity;
  saveInventory(data);
}

// Get user inventory
function getUserInventory(userId: string): { [itemId: string]: number } {
  const data = loadInventory();
  return data[userId] || {};
}

export default class ShopModule {
  name = 'shop-module';
  description = 'Hệ thống shop và coins';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`${emojis.gift} Shop module initialized`);
    this.registerCommands();
    console.log(`${emojis.success} Shop module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /shop command
    const shopCommand = {
      data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Xem shop và mua items'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();
        
        const userId = interaction.user.id;
        const userCoins = getUserCoins(userId);
        
        // Load shop banner
        const bannerPath = path.join(process.cwd(), 'assets', 'banners', 'shop-banner.gif');
        const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'shop-banner.gif' });
        
        // Create embed with fields (3 per row for grid effect)
        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setImage('attachment://shop-banner.gif')
          .setAuthor({
            name: `🥟 Cửa Hàng Bánh Cuốn Bot`,
            iconURL: interaction.client.user?.displayAvatarURL()
          })
          .setDescription(`Mua các role độc quyền bằng ${emojis.coin} **Coins** kiếm được từ /daily và /quest!\n\u200B`);
        
        // Add each item as a field (inline for grid)
        SHOP_ITEMS.forEach(item => {
          embed.addFields({
            name: `${item.emoji} ${item.name}`,
            value: [
              item.description,
              `${emojis.coin} **${item.price}** coins`
            ].join('\n'),
            inline: true
          });
        });
        
        // Add empty field if needed to complete row
        if (SHOP_ITEMS.length % 3 === 2) {
          embed.addFields({ name: '\u200B', value: '\u200B', inline: true });
        }
        
        // Add bundle
        embed.addFields({
          name: '\u200B',
          value: '\u200B',
          inline: false
        });
        embed.addFields({
          name: `${emojis.gift} Bundle: Mua tất cả roles`,
          value: `Giá đặc biệt: **3,500** ${emojis.coin} coins (tiết kiệm 300 coins!)`,
          inline: false
        });
        
        embed.setFooter({
          text: `Bánh Cuốn Bot • Kiếm coins qua /daily và /quest`,
          iconURL: interaction.client.user?.displayAvatarURL()
        });
        
        const buttonRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('shop_refresh')
              .setLabel('🔄 Làm Mới')
              .setStyle(ButtonStyle.Secondary)
          );
        
        const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('shop_buy')
              .setPlaceholder('Chọn role bạn muốn mua')
              .addOptions(
                SHOP_ITEMS.map(item => 
                  new StringSelectMenuOptionBuilder()
                    .setLabel(`${item.name}`)
                    .setDescription(`${item.price}K coins`)
                    .setValue(item.id)
                    .setEmoji(item.emoji)
                )
              )
          );
        
        const response = await interaction.editReply({
          content: `${emojis.coin} **Số dư của bạn:** ${userCoins} coins`,
          embeds: [embed],
          components: [buttonRow, selectMenu],
          files: [bannerAttachment]
        });
        
        const collector = response.createMessageComponentCollector({
          time: 300000
        });
        
        collector.on('collect', async i => {
          if (i.user.id !== interaction.user.id) {
            await i.reply({
              content: `${emojis.error} Bạn không thể sử dụng shop này!`,
              flags: 64
            });
            return;
          }
          
          if (i.customId === 'shop_refresh') {
            await i.deferUpdate();
            const newCoins = getUserCoins(userId);
            await i.editReply({
              content: `${emojis.coin} **Số dư của bạn:** ${newCoins} coins`,
              embeds: [embed],
              components: [buttonRow, selectMenu]
            });
          }
          
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
            
            const currentCoins = getUserCoins(userId);
            
            if (currentCoins < item.price) {
              await i.reply({
                content: `${emojis.error} Bạn không đủ coins! Cần **${item.price}** ${emojis.coin} nhưng chỉ có **${currentCoins}** ${emojis.coin}`,
                flags: 64
              });
              return;
            }
            
            if (removeCoins(userId, item.price)) {
              addToInventory(userId, itemId, 1);
              const newBalance = getUserCoins(userId);
              
              // Nếu là role, tự động tạo và gán role
              let roleAssigned = false;
              let roleCreated = false;
              if (item.category === 'roles') {
                try {
                  const guild = interaction.guild;
                  if (guild) {
                    const member = await guild.members.fetch(userId);
                    
                    // Tìm hoặc tạo role
                    let role = guild.roles.cache.find(r => r.name === item.name);
                    
                    if (!role) {
                      // Tạo role mới với màu ngẫu nhiên
                      const colors = [
                        0xFF69B4, // Hot pink
                        0x9370DB, // Medium purple
                        0x00CED1, // Dark turquoise
                        0xFFD700, // Gold
                        0xFF6347, // Tomato
                        0x32CD32, // Lime green
                      ];
                      const randomColor = colors[Math.floor(Math.random() * colors.length)];
                      
                      role = await guild.roles.create({
                        name: item.name,
                        color: randomColor,
                        reason: `Auto-created by shop purchase - ${item.name}`
                      });
                      roleCreated = true;
                    }
                    
                    // Gán role cho user
                    if (!member.roles.cache.has(role.id)) {
                      await member.roles.add(role);
                      roleAssigned = true;
                    }
                  }
                } catch (error) {
                  console.error(`Error assigning role ${item.name}:`, error);
                }
              }
              
              const purchaseEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`${emojis.success} Mua Thành Công!`)
                .setDescription([
                  `Bạn đã mua **${item.emoji} ${item.name}**!`,
                  '',
                  `${emojis.gift} **Mô tả**: ${item.description}`,
                  `${emojis.trophy} **Giá**: ${item.price} coins`,
                  '',
                  roleCreated ? `${emojis.sparkles} Role mới đã được tạo!` : '',
                  roleAssigned ? `${emojis.success} Role đã được gán cho bạn!` : '',
                  '',
                  `${emojis.coin} **Số dư còn lại**: ${newBalance} coins`
                ].filter(line => line !== '').join('\n'))
                .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
                .setFooter({
                  text: roleAssigned ? `Role ${item.name} đã sẵn sàng!` : `Kiểm tra inventory với /inventory`,
                  iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();
              
              await i.reply({
                embeds: [purchaseEmbed],
                flags: 64
              });
            } else {
              await i.reply({
                content: `${emojis.error} Có lỗi xảy ra khi mua item!`,
                flags: 64
              });
            }
          }
        });
      }
    };

    // /inventory command
    const inventoryCommand = {
      data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Xem inventory của bạn'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();
        
        const userId = interaction.user.id;
        const inventory = getUserInventory(userId);
        const userCoins = getUserCoins(userId);
        
        if (Object.keys(inventory).length === 0) {
          await interaction.editReply({
            content: `${emojis.info} Inventory của bạn đang trống! Mua items từ \`/shop\` nhé!`
          });
          return;
        }
        
        const itemsList = Object.entries(inventory).map(([itemId, quantity]) => {
          const item = SHOP_ITEMS.find(it => it.id === itemId);
          if (!item) return null;
          return `${item.emoji} **${item.name}** x${quantity}\n└ ${item.description}`;
        }).filter(Boolean).join('\n\n');
        
        const embed = new EmbedBuilder()
          .setColor('#5865f2')
          .setAuthor({
            name: `${emojis.gift} Inventory`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setDescription([
            `${emojis.coin} **Số dư**: **${userCoins}** coins`,
            '',
            '━━━━━━━━━━━━━━━━━━━━',
            '',
            itemsList
          ].join('\n'))
          .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
          .setFooter({
            text: `${interaction.user.tag} • ${Object.keys(inventory).length} items`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
      }
    };

    // /balance command
    const balanceCommand = {
      data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Xem số coins của bạn')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User cần xem (để trống để xem của bạn)')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();
        
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const coins = getUserCoins(targetUser.id);
        
        // Load balance banner
        const bannerPath = path.join(process.cwd(), 'assets', 'banners', 'balance-banner.gif');
        const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'balance-banner.gif' });
        
        // Get user's inventory for stats
        const inventory = getUserInventory(targetUser.id);
        const itemCount = Object.keys(inventory).length;
        const totalSpent = Object.entries(inventory).reduce((total, [itemId, quantity]) => {
          const item = SHOP_ITEMS.find(it => it.id === itemId);
          return total + (item ? item.price * quantity : 0);
        }, 0);
        
        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setImage('attachment://balance-banner.gif')
          .setTitle(`${emojis.coin} Số Dư Coins`)
          .setDescription([
            `**${targetUser.displayName}** đang có:`,
            '',
            `━━━━━━━━━━━━━━━━━━━━`,
            '',
            `${emojis.coin} **Số dư hiện tại:** ${coins.toLocaleString()} coins`,
            `${emojis.shopping_bags} **Items sở hữu:** ${itemCount} items`,
            `${emojis.chart} **Tổng đã chi:** ${totalSpent.toLocaleString()} coins`,
            `${emojis.gem} **Tổng tài sản:** ${(coins + totalSpent).toLocaleString()} coins`,
            '',
            `━━━━━━━━━━━━━━━━━━━━`
          ].join('\n'))
          .addFields(
            {
              name: `${emojis.gift} Cách kiếm coins`,
              value: [
                `${emojis.calendar} \`/daily\` - Điểm danh hàng ngày (100-400 ${emojis.coin})`,
                `${emojis.trophy} \`/quest\` - Hoàn thành nhiệm vụ`,
                `${emojis.sparkles} Events & Activities`
              ].join('\n'),
              inline: false
            }
          )
          .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
          .setFooter({ 
            text: `${targetUser.tag} • Mua items tại /shop`,
            iconURL: targetUser.displayAvatarURL()
          })
          .setTimestamp();
        
        await interaction.editReply({ 
          embeds: [embed],
          files: [bannerAttachment]
        });
      }
    };

    this.commands.set('shop', shopCommand);
    this.commands.set('inventory', inventoryCommand);
    this.commands.set('balance', balanceCommand);
  }

  async cleanup() {
    console.log('🧹 Shop module cleanup');
  }
}
