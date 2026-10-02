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

// Data paths
const coinsPath = path.join(process.cwd(), 'data', 'coins.json');
const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');

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
  price: number;
  emoji: string;
  category: string;
  roleColor?: number;
}

interface CoinsData {
  [userId: string]: number;
}

interface InventoryData {
  [userId: string]: {
    [itemId: string]: number;
  };
}

// Shop items - 9 unique roles
const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'banh_cuon_lover',
    name: 'Bánh Cuốn Lover',
    description: 'Dành cho hội mê bánh cuốn chính hiệu',
    price: 350,
    emoji: '🥟',
    category: 'roles',
    roleColor: 0xFFD700
  },
  {
    id: 'vip_member',
    name: 'VIP Member',
    description: 'Thành viên VIP với đặc quyền độc quyền',
    price: 500,
    emoji: '👑',
    category: 'roles',
    roleColor: 0xFF1493
  },
  {
    id: 'supporter',
    name: 'Supporter',
    description: 'Người ủng hộ nhiệt tình của bot',
    price: 300,
    emoji: '💖',
    category: 'roles',
    roleColor: 0xFF69B4
  },
  {
    id: 'gamer',
    name: 'Gamer',
    description: 'Dành cho game thủ chính hiệu',
    price: 400,
    emoji: '🎮',
    category: 'roles',
    roleColor: 0x9370DB
  },
  {
    id: 'music_lover',
    name: 'Music Lover',
    description: 'Hội yêu âm nhạc',
    price: 350,
    emoji: '🎵',
    category: 'roles',
    roleColor: 0x00CED1
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Cú đêm hoạt động ban đêm',
    price: 450,
    emoji: '🦉',
    category: 'roles',
    roleColor: 0x4B0082
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Chim sơn ca online sớm',
    price: 450,
    emoji: '🐦',
    category: 'roles',
    roleColor: 0xFFB6C1
  },
  {
    id: 'artist',
    name: 'Artist',
    description: 'Nghệ sĩ tài năng',
    price: 600,
    emoji: '🎨',
    category: 'roles',
    roleColor: 0xFF6347
  },
  {
    id: 'foodie',
    name: 'Foodie',
    description: 'Hội yêu ẩm thực',
    price: 400,
    emoji: '🍜',
    category: 'roles',
    roleColor: 0x32CD32
  }
];

// Data functions
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
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`🎁 Shop module initialized`);
    this.registerCommands();
    console.log(`✅ Shop module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /shop command
    const shopCommand = {
      data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Xem shop và mua items'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const userId = interaction.user.id;
        const userCoins = getUserCoins(userId);
        
        // Load banner
        const bannerPath = path.join(process.cwd(), 'assets', 'banners', 'shop-banner.gif');
        const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'shop-banner.gif' });
        
        // Create embed
        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setImage('attachment://shop-banner.gif')
          .setAuthor({
            name: '🥟 Cửa Hàng Bánh Cuốn Bot',
            iconURL: interaction.client.user?.displayAvatarURL()
          })
          .setDescription(`Mua các role độc quyền bằng ${emojis.coin} coins!\n━━━━━━━━━━━━━━━━━━━━\n\u200B`);
        
        // Add items
        SHOP_ITEMS.forEach(item => {
          embed.addFields({
            name: `${item.emoji} ${item.name}`,
            value: `${item.description}\n${emojis.coin} **${item.price}** coins`,
            inline: true
          });
        });
        
        // Buttons
        const buttonRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('shop_refresh')
              .setLabel('Làm mới')
              .setEmoji(emojis.refresh)
              .setStyle(ButtonStyle.Secondary)
          );
        
        // Select menu
        const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('shop_buy')
              .setPlaceholder('Chọn role bạn muốn mua')
              .addOptions(
                SHOP_ITEMS.map(item => 
                  new StringSelectMenuOptionBuilder()
                    .setLabel(item.name)
                    .setDescription(`${item.price} coins`)
                    .setValue(item.id)
                    .setEmoji(item.emoji)
                )
              )
          );
        
        const response = await interaction.editReply({
          content: `${emojis.coin} **Số dư:** ${userCoins} coins`,
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
              content: `${emojis.error} Bạn không thể dùng shop này!`,
              flags: 64
            });
            return;
          }
          
          // Refresh button
          if (i.customId === 'shop_refresh') {
            await i.deferUpdate();
            const newCoins = getUserCoins(userId);
            await i.editReply({
              content: `${emojis.coin} **Số dư:** ${newCoins} coins`
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
            
            // Check coins
            const currentCoins = getUserCoins(userId);
            if (currentCoins < item.price) {
              await i.reply({
                content: `${emojis.error} Không đủ coins! Bạn cần **${item.price - currentCoins}** coins nữa.`,
                flags: 64
              });
              return;
            }
            
            // Check if already has role
            const member = i.guild?.members.cache.get(userId);
            if (member?.roles.cache.find(r => r.name === item.name)) {
              await i.reply({
                content: `${emojis.warning} Bạn đã có role này rồi!`,
                flags: 64
              });
              return;
            }
            
            await i.deferReply({ flags: 64 });
            
            try {
              // Remove coins
              removeCoins(userId, item.price);
              
              // Add to inventory
              addToInventory(userId, itemId);
              
              // Create or get role
              let role = i.guild?.roles.cache.find(r => r.name === item.name);
              
              if (!role && i.guild) {
                role = await i.guild.roles.create({
                  name: item.name,
                  color: item.roleColor || 0x5865F2,
                  hoist: true,
                  reason: `Shop purchase by ${i.user.tag}`
                });
              }
              
              // Assign role
              if (role && member) {
                await member.roles.add(role);
              }
              
              const successEmbed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle(`${emojis.success} Mua thành công!`)
                .setDescription(
                  `Bạn đã mua **${item.emoji} ${item.name}**!\n\n` +
                  `${emojis.coin} Tiêu: **-${item.price}** coins\n` +
                  `${emojis.coin} Còn lại: **${getUserCoins(userId)}** coins\n\n` +
                  `${emojis.gift} Role đã được thêm vào!`
                )
                .setFooter({ text: 'Cảm ơn bạn đã ủng hộ!' })
                .setTimestamp();
              
              await i.editReply({
                embeds: [successEmbed]
              });
              
              // Update shop display
              const updatedCoins = getUserCoins(userId);
              await interaction.editReply({
                content: `${emojis.coin} **Số dư:** ${updatedCoins} coins`
              });
              
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
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const userId = interaction.user.id;
        const inventory = getUserInventory(userId);
        const userCoins = getUserCoins(userId);
        
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
          .setDescription(`${emojis.coin} **Balance:** ${userCoins} coins\n━━━━━━━━━━━━━━━━━━━━\n\u200B`)
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
        .setDescription('Xem số coins')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User cần xem')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const coins = getUserCoins(targetUser.id);
        
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
            `${emojis.coin} **Số dư hiện tại:**\n` +
            `**${coins.toLocaleString()}** coins\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `${emojis.sparkles} Kiếm coins từ:\n` +
            `• \`/daily\` - Điểm danh hàng ngày\n` +
            `• \`/quest\` - Hoàn thành nhiệm vụ\n\n` +
            `${emojis.gift} Chi tiêu tại \`/shop\`!`
          )
          .setFooter({ text: `Requested by ${interaction.user.tag}` })
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
