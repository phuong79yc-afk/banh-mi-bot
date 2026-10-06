import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { emojis } from '../../config/emojis';
import fs from 'fs';
import path from 'path';

// ==================== SECURITY CONSTANTS ====================
const TRANSFER_COOLDOWN_MS = 60000; // 1 minute cooldown between transfers
const MAX_TRANSFER_AMOUNT = 1000000; // Max 1M coins per transfer
const LOTTERY_MAX_TICKETS_PER_DAY = 50; // Max 50 tickets per day
const NICKNAME_COOLDOWN_MS = 300000; // 5 minutes cooldown for nickname changes

// ==================== DATA PATHS ====================
const COINS_PATH = path.join(process.cwd(), 'data', 'coins.json');
const INVENTORY_PATH = path.join(process.cwd(), 'data', 'inventory.json');
const VIP_BONUS_COOLDOWN_PATH = path.join(process.cwd(), 'data', 'vip_bonus_cooldown.json');
const TRANSFER_COOLDOWN_PATH = path.join(process.cwd(), 'data', 'vip_transfer_cooldown.json');
const LOTTERY_USAGE_PATH = path.join(process.cwd(), 'data', 'vip_lottery_usage.json');
const NICKNAME_COOLDOWN_PATH = path.join(process.cwd(), 'data', 'vip_nickname_cooldown.json');

// ==================== HELPER FUNCTIONS ====================

// Read JSON file safely
function readJSON(filePath: string): any {
  try {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`[VIP] Error reading ${filePath}:`, error);
    return {};
  }
}

// Write JSON file safely
function writeJSON(filePath: string, data: any): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`[VIP] Error writing ${filePath}:`, error);
    return false;
  }
}

// Check cooldown
function checkCooldown(userId: string, cooldownPath: string, cooldownMs: number): { onCooldown: boolean; timeLeft?: number } {
  const cooldownData = readJSON(cooldownPath);
  const lastUsed = cooldownData[userId];
  
  if (!lastUsed) return { onCooldown: false };
  
  const now = Date.now();
  const timePassed = now - lastUsed;
  
  if (timePassed < cooldownMs) {
    return { onCooldown: true, timeLeft: Math.ceil((cooldownMs - timePassed) / 1000) };
  }
  
  return { onCooldown: false };
}

// Set cooldown
function setCooldown(userId: string, cooldownPath: string): boolean {
  const cooldownData = readJSON(cooldownPath);
  cooldownData[userId] = Date.now();
  return writeJSON(cooldownPath, cooldownData);
}

// Get user balance
function getUserBalance(userId: string): number {
  const coinsData = readJSON(COINS_PATH);
  return coinsData[userId] || 0;
}

// Update user balance
function updateUserBalance(userId: string, amount: number): boolean {
  const coinsData = readJSON(COINS_PATH);
  coinsData[userId] = (coinsData[userId] || 0) + amount;
  return writeJSON(COINS_PATH, coinsData);
}

// Role bonus config - tự động tìm role theo tên
const ROLE_BONUS_CONFIG = [
  { roleName: 'Chủ Tiệm', percent: 10, price: 500000, stock: 1, id: 'chutiem', color: 0xFF0000 },
  { roleName: 'Bánh Cuốn Chúa', percent: 10, price: 200000, stock: 3, id: 'banhcuonchua', color: 0xFFD700 },
  { roleName: 'Hành Phi Elite', percent: 8, price: 150000, stock: 5, id: 'hanhphi', color: 0xFF6B6B },
  { roleName: 'Thịt Quay Lover', percent: 7, price: 120000, stock: 8, id: 'thitquay', color: 0x8B4513 },
  { roleName: 'Giò Cuốn Gang', percent: 6, price: 90000, id: 'giocuon', color: 0x90EE90 },
  { roleName: 'Bún Chả Hà Nội', percent: 6, price: 95000, id: 'buncha', color: 0xD2691E },
  { roleName: 'Bánh Mì Fan', percent: 5, price: 100000, id: 'banhmi', color: 0xF4A460 },
  { roleName: 'Bánh Bao Squad', percent: 5, price: 80000, id: 'banhbao', color: 0xFFE4B5 },
  { roleName: 'Cơm Tấm Master', percent: 5, price: 85000, id: 'comtam', color: 0xD2691E },
  { roleName: 'Phở Addict', percent: 4, price: 70000, id: 'pho', color: 0xFFA500 },
  { roleName: 'Nem Chua Collector', percent: 4, price: 75000, id: 'nemchua', color: 0xFF69B4 },
  { roleName: 'Fan Nước Chấm', percent: 3, price: 100000, stock: 10, id: 'nuoccham', color: 0x87CEEB },
  { roleName: 'Cà Phê Sáng', percent: 3, price: 60000, id: 'cafe', color: 0x6F4E37 },
];

const fmt = (n: number) => n.toLocaleString('en-US');

// Inventory data path
const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');

// Helper: đọc inventory để đếm số lượng đã bán
function getSoldCount(itemId: string): number {
  if (!fs.existsSync(inventoryPath)) return 0;
  
  try {
    const data = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    let count = 0;
    
    // Đếm số người đã mua role này
    for (const userId in data) {
      const userItems = data[userId];
      if (userItems[itemId]) {
        count += userItems[itemId];
      }
    }
    
    return count;
  } catch {
    return 0;
  }
}

// Các hạng VIP, sắp xếp theo % cao nhất trước (chỉ lấy role tồn tại trong server)
const getTiers = (interaction: ChatInputCommandInteraction) => {
  if (!interaction.guild) return [];
  
  return ROLE_BONUS_CONFIG
    .map(config => {
      // Tìm role theo tên trong guild
      const role = interaction.guild!.roles.cache.find(r => r.name === config.roleName);
      return role ? { ...config, roleId: role.id } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.percent - a.percent);
};

// Format 1 dòng role VIP
function tierLine(tier: ReturnType<typeof getTiers>[0]): string {
  const parts = [`<@&${tier.roleId}> ~ **+${tier.percent}%** ${emojis.coin}`];
  
  if (tier.price) {
    parts.push(`${fmt(tier.price)} ${emojis.coin}`);
    
    if (tier.stock) {
      const sold = getSoldCount(tier.id);
      const remaining = Math.max(0, tier.stock - sold);
      parts.push(`còn ${remaining}/${tier.stock} suất`);
    }
  }
  
  return `> - ${parts.join(' · ')}`;
}

export default class VIPModule {
  name = 'vip-module';
  description = 'Hệ thống hiển thị quyền lợi VIP';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`👑 VIP module initialized`);
    
    // Tự động tạo role trong server khi bot khởi động
    await this.createMissingRoles();
    
    this.registerCommands();
    console.log(`✅ VIP module registered ${this.commands.size} commands`);
  }

  // Tự động tạo các role chưa có trong server
  private async createMissingRoles() {
    try {
      const guildId = process.env.GUILD_ID;
      if (!guildId) {
        console.log('[VIP] No GUILD_ID set, skipping auto role creation');
        return;
      }

      const guild = await this.client.guilds.fetch(guildId);
      if (!guild) {
        console.log('[VIP] Guild not found');
        return;
      }

      let created = 0;
      for (const config of ROLE_BONUS_CONFIG) {
        // Check if role exists
        const existingRole = guild.roles.cache.find(r => r.name === config.roleName);
        
        if (!existingRole) {
          try {
            await guild.roles.create({
              name: config.roleName,
              color: config.color, // Changed from 'color' to 'color' (Discord.js accepts both but prefers 'color')
              reason: 'Auto-created VIP role from shop',
              permissions: []
            });
            created++;
            console.log(`✅ Created role: ${config.roleName}`);
          } catch (error) {
            console.error(`❌ Failed to create role ${config.roleName}:`, error);
          }
        }
      }

      if (created > 0) {
        console.log(`✅ Created ${created} VIP role(s) in guild ${guild.name}`);
      } else {
        console.log(`✅ All VIP roles already exist in guild ${guild.name}`);
      }
    } catch (error) {
      console.error('[VIP] Error creating roles:', error);
    }
  }

  private registerCommands() {
    // /vipinfo command
    const vipCommand = {
      data: new SlashCommandBuilder()
        .setName('vipinfo')
        .setDescription('👑 Xem quyền lợi và hạng VIP'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }

        if (!interaction.guild) {
          await interaction.editReply({ 
            content: 'Lệnh này chỉ có thể sử dụng trong server!' 
          });
          return;
        }

        const list = getTiers(interaction);
        const icon = interaction.client?.user?.displayAvatarURL();

        if (!list.length) {
          await interaction.editReply({ 
            content: 'Chưa có role VIP nào trong server! Hãy tạo các role với tên giống trong shop.' 
          });
          return;
        }

        // Tìm role VIP cao nhất mà user đang có
        const member = interaction.member;
        let myRole: typeof list[0] | undefined;
        
        if (member && 'roles' in member && typeof member.roles === 'object' && member.roles && 'cache' in member.roles) {
          myRole = list.find(t => (member.roles as any).cache.has(t.roleId));
        }

        const status = myRole
          ? `> - <@&${myRole.roleId}> ~ **+${myRole.percent}%** ${emojis.coin}\n> - Mỗi lần điểm danh bạn nhận thêm **+${myRole.percent}%**`
          : `> - Bạn chưa có role VIP\n> - Mua role ở \`/shop\` để nhận thêm xu mỗi lần điểm danh`;

        const embed = new EmbedBuilder()
          .setColor(0xe2b93b)
          .setTitle(`👑 Quyền lợi VIP`)
          .setDescription(`Sở hữu role VIP trong shop để nhận thêm xu mỗi lần điểm danh.\n- **Thưởng thêm** được tính trên tổng tiền điểm danh. Chỉ role có % cao nhất được tính, không cộng dồn.`)
          .setFooter({ 
            text: `Banhcuon-bot • ${interaction.user.username}`,
            iconURL: icon 
          })
          .setTimestamp();

        // Thêm field quyền lợi chung
        embed.addFields({
          name: '🎁 Quyền lợi VIP',
          value: [
            `> • **Bonus xu khi daily** - Nhận thêm % xu mỗi lần điểm danh`,
            `> • **Role màu sắc** - Tên bạn sẽ có màu đẹp trong server`,
            `> • **Đẳng cấp** - Thể hiện đẳng cấp của bạn trong cộng đồng`,
            `> • **Ưu tiên hỗ trợ** - Được hỗ trợ ưu tiên khi cần`,
            `> • **Role giới hạn** - Một số role chỉ có số lượng giới hạn`
          ].join('\n'),
          inline: false
        });

        // Thêm field các lệnh VIP-only
        embed.addFields({
          name: '⭐ Các lệnh VIP độc quyền',
          value: [
            '> • \`/vip-transfer\` - Chuyển xu cho người khác (VIP 5%+)',
            '> • \`/vip-bonus\` - Nhận bonus hàng tuần (VIP 7%+)',
            '> • \`/vip-lottery\` - Tham gia xổ số VIP (VIP 8%+)',
            '> • \`/vip-nickname\` - Đặt nickname tùy chỉnh (VIP 10%)',
            '> • \`/priority-support\` - Hỗ trợ ưu tiên từ admin (Tất cả VIP)'
          ].join('\n'),
          inline: false
        });

        // Chia danh sách role thành 2 field để tránh quá giới hạn 1024 ký tự
        const halfIndex = Math.ceil(list.length / 2);
        const firstHalf = list.slice(0, halfIndex);
        const secondHalf = list.slice(halfIndex);

        embed.addFields(
          { 
            name: '• Các hạng VIP (Phần 1)', 
            value: firstHalf.map(tierLine).join('\n'), 
            inline: false 
          },
          { 
            name: '• Các hạng VIP (Phần 2)', 
            value: secondHalf.map(tierLine).join('\n'), 
            inline: false 
          },
          { 
            name: '• Hạng của bạn', 
            value: status, 
            inline: false 
          }
        );

        // Buttons để mở shop và xem daily
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('open_shop')
              .setLabel('🛒 Mở Shop')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('view_daily')
              .setLabel('📅 Xem Daily')
              .setStyle(ButtonStyle.Success)
          );

        await interaction.editReply({ embeds: [embed], components: [row] });

        // Collector để xử lý button clicks
        const message = await interaction.fetchReply();
        const collector = message.createMessageComponentCollector({ 
          time: 300000 // 5 phút
        });

        collector.on('collect', async (i) => {
          if (i.user.id !== interaction.user.id) {
            await i.reply({ content: 'Bạn không thể sử dụng button này!', ephemeral: true });
            return;
          }

          if (i.customId === 'open_shop') {
            // Use deferUpdate to acknowledge button click, then delegate to shop command
            try {
              await i.deferUpdate();
              const shopCommand = this.client.commands?.get('shop');
              if (shopCommand) {
                // Pass the original interaction, not button interaction
                await shopCommand.execute(interaction);
              } else {
                await interaction.followUp({ content: 'Không tìm thấy lệnh shop!', ephemeral: true });
              }
            } catch (error) {
              console.error('[VIP] Error opening shop:', error);
              await interaction.followUp({ content: 'Có lỗi khi mở shop! Hãy thử lệnh `/shop` thủ công.', ephemeral: true }).catch(() => {});
            }
          } else if (i.customId === 'view_daily') {
            // Use deferUpdate to acknowledge button click, then delegate to daily command
            try {
              await i.deferUpdate();
              const dailyCommand = this.client.commands?.get('daily');
              if (dailyCommand) {
                // Pass the original interaction, not button interaction
                await dailyCommand.execute(interaction);
              } else {
                await interaction.followUp({ content: 'Không tìm thấy lệnh daily!', ephemeral: true });
              }
            } catch (error) {
              console.error('[VIP] Error opening daily:', error);
              await interaction.followUp({ content: 'Có lỗi khi mở daily! Hãy thử lệnh `/daily` thủ công.', ephemeral: true }).catch(() => {});
            }
          }
        });

        collector.on('end', () => {
          // Disable buttons sau khi hết thời gian
          row.components.forEach(button => button.setDisabled(true));
          interaction.editReply({ embeds: [embed], components: [row] }).catch(() => {});
        });
      }
    };

    this.commands.set('vipinfo', vipCommand);

    // Helper function: Check if user has VIP role with minimum percent
    const hasVIPLevel = (interaction: ChatInputCommandInteraction, minPercent: number): boolean => {
      if (!interaction.guild) return false;
      const member = interaction.member;
      if (!member || typeof member.roles === 'string' || !('cache' in member.roles)) return false;

      const list = getTiers(interaction);
      const userRole = list.find(t => (member.roles as any).cache.has(t.roleId));
      return userRole ? userRole.percent >= minPercent : false;
    };

    // /vip-transfer command - Chuyển xu cho người khác (VIP 5%+)
    const vipTransferCommand = {
      data: new SlashCommandBuilder()
        .setName('vip-transfer')
        .setDescription('💸 Chuyển xu cho người khác (VIP 5%+)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Người nhận')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Số lượng xu')
            .setRequired(true)
            .setMinValue(1)),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();

        if (!hasVIPLevel(interaction, 5)) {
          await interaction.editReply('❌ Bạn cần role VIP 5%+ để sử dụng lệnh này!');
          return;
        }

        const targetUser = interaction.options.getUser('user', true);
        const amount = interaction.options.getInteger('amount', true);

        if (targetUser.id === interaction.user.id) {
          await interaction.editReply('❌ Bạn không thể chuyển xu cho chính mình!');
          return;
        }

        if (targetUser.bot) {
          await interaction.editReply('❌ Không thể chuyển xu cho bot!');
          return;
        }

        // Read coins data
        const coinsPath = path.join(process.cwd(), 'data', 'coins.json');
        let coinsData: any = {};
        if (fs.existsSync(coinsPath)) {
          coinsData = JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
        }

        const senderBalance = coinsData[interaction.user.id] || 0;
        if (senderBalance < amount) {
          await interaction.editReply(`❌ Bạn không đủ xu! Số dư hiện tại: ${senderBalance.toLocaleString()} ${emojis.coin}`);
          return;
        }

        // Transfer
        coinsData[interaction.user.id] = senderBalance - amount;
        coinsData[targetUser.id] = (coinsData[targetUser.id] || 0) + amount;
        fs.writeFileSync(coinsPath, JSON.stringify(coinsData, null, 2));

        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle(`${emojis.coin} Chuyển xu thành công`)
          .setDescription(`**${interaction.user.username}** đã chuyển **${amount.toLocaleString()}** ${emojis.coin} cho **${targetUser.username}**`)
          .addFields(
            { name: 'Người gửi', value: `<@${interaction.user.id}>\nSố dư còn: ${coinsData[interaction.user.id].toLocaleString()} ${emojis.coin}`, inline: true },
            { name: 'Người nhận', value: `<@${targetUser.id}>\nSố dư mới: ${coinsData[targetUser.id].toLocaleString()} ${emojis.coin}`, inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    };

    this.commands.set('vip-transfer', vipTransferCommand);

    // /vip-bonus command - Nhận bonus hàng tuần (VIP 7%+)
    const vipBonusCommand = {
      data: new SlashCommandBuilder()
        .setName('vip-bonus')
        .setDescription('🎁 Nhận bonus hàng tuần (VIP 7%+)'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();

        if (!hasVIPLevel(interaction, 7)) {
          await interaction.editReply('❌ Bạn cần role VIP 7%+ để sử dụng lệnh này!');
          return;
        }

        // Check cooldown (7 days)
        const cooldownPath = path.join(process.cwd(), 'data', 'vip_bonus_cooldown.json');
        let cooldownData: any = {};
        if (fs.existsSync(cooldownPath)) {
          cooldownData = JSON.parse(fs.readFileSync(cooldownPath, 'utf8'));
        }

        const lastClaim = cooldownData[interaction.user.id];
        const now = Date.now();
        const weekInMs = 7 * 24 * 60 * 60 * 1000;

        if (lastClaim && now - lastClaim < weekInMs) {
          const timeLeft = weekInMs - (now - lastClaim);
          const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
          await interaction.editReply(`❌ Bạn đã nhận bonus tuần này rồi! Hãy quay lại sau **${daysLeft}** ngày.`);
          return;
        }

        // Give bonus
        const bonusAmount = 50000; // 50k coins
        const coinsPath = path.join(process.cwd(), 'data', 'coins.json');
        let coinsData: any = {};
        if (fs.existsSync(coinsPath)) {
          coinsData = JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
        }

        coinsData[interaction.user.id] = (coinsData[interaction.user.id] || 0) + bonusAmount;
        fs.writeFileSync(coinsPath, JSON.stringify(coinsData, null, 2));

        // Update cooldown
        cooldownData[interaction.user.id] = now;
        fs.writeFileSync(cooldownPath, JSON.stringify(cooldownData, null, 2));

        const embed = new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle(`${emojis.gift} Bonus VIP hàng tuần`)
          .setDescription(`Bạn đã nhận **${bonusAmount.toLocaleString()}** ${emojis.coin}!`)
          .addFields({ name: 'Số dư mới', value: `${coinsData[interaction.user.id].toLocaleString()} ${emojis.coin}`, inline: true })
          .setFooter({ text: 'Hãy quay lại sau 7 ngày để nhận tiếp!' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    };

    // /vip-lottery command - Xổ số VIP (VIP 8%+)
    const vipLotteryCommand = {
      data: new SlashCommandBuilder()
        .setName('vip-lottery')
        .setDescription('🎰 Tham gia xổ số VIP (VIP 8%+)')
        .addIntegerOption(option =>
          option.setName('tickets')
            .setDescription('Số vé mua (10k/vé)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10)),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();

        if (!hasVIPLevel(interaction, 8)) {
          await interaction.editReply('❌ Bạn cần role VIP 8%+ để sử dụng lệnh này!');
          return;
        }

        const tickets = interaction.options.getInteger('tickets', true);
        const ticketPrice = 10000;
        const totalCost = tickets * ticketPrice;

        // Check balance
        const coinsPath = path.join(process.cwd(), 'data', 'coins.json');
        let coinsData: any = {};
        if (fs.existsSync(coinsPath)) {
          coinsData = JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
        }

        const balance = coinsData[interaction.user.id] || 0;
        if (balance < totalCost) {
          await interaction.editReply(`❌ Không đủ xu! Bạn cần ${totalCost.toLocaleString()} ${emojis.coin} (Còn ${balance.toLocaleString()} ${emojis.coin})`);
          return;
        }

        // Play lottery
        const prizes = [
          { name: 'Jackpot', amount: 500000, chance: 0.01 },
          { name: 'Giải Nhất', amount: 200000, chance: 0.05 },
          { name: 'Giải Nhì', amount: 100000, chance: 0.10 },
          { name: 'Giải Ba', amount: 50000, chance: 0.15 },
          { name: 'Giải Khuyến Khích', amount: 20000, chance: 0.20 },
        ];

        let totalWin = 0;
        const results: string[] = [];

        for (let i = 0; i < tickets; i++) {
          const rand = Math.random();
          let won = false;

          for (const prize of prizes) {
            if (rand < prize.chance) {
              totalWin += prize.amount;
              results.push(`🎟️ Vé ${i + 1}: **${prize.name}** - ${prize.amount.toLocaleString()} ${emojis.coin}`);
              won = true;
              break;
            }
          }

          if (!won) {
            results.push(`🎟️ Vé ${i + 1}: Chúc bạn may mắn lần sau`);
          }
        }

        // Update balance
        const netProfit = totalWin - totalCost;
        coinsData[interaction.user.id] = balance + netProfit;
        fs.writeFileSync(coinsPath, JSON.stringify(coinsData, null, 2));

        const embed = new EmbedBuilder()
          .setColor(netProfit >= 0 ? 0x00ff00 : 0xff0000)
          .setTitle(`${emojis.sparkles} Kết quả xổ số VIP`)
          .setDescription(results.join('\n'))
          .addFields(
            { name: 'Chi phí', value: `-${totalCost.toLocaleString()} ${emojis.coin}`, inline: true },
            { name: 'Trúng thưởng', value: `+${totalWin.toLocaleString()} ${emojis.coin}`, inline: true },
            { name: 'Lãi/Lỗ', value: `${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()} ${emojis.coin}`, inline: true },
            { name: 'Số dư mới', value: `${coinsData[interaction.user.id].toLocaleString()} ${emojis.coin}`, inline: false }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    };

    // /vip-nickname command - Đặt nickname (VIP 10%)
    const vipNicknameCommand = {
      data: new SlashCommandBuilder()
        .setName('vip-nickname')
        .setDescription('✨ Đặt nickname tùy chỉnh (VIP 10%)')
        .addStringOption(option =>
          option.setName('nickname')
            .setDescription('Nickname mới (để trống để reset)')
            .setRequired(false)
            .setMaxLength(32)),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();

        if (!hasVIPLevel(interaction, 10)) {
          await interaction.editReply('❌ Bạn cần role VIP 10% để sử dụng lệnh này!');
          return;
        }

        const nickname = interaction.options.getString('nickname');
        const member = interaction.member;

        if (!member || typeof member === 'string' || !('setNickname' in member)) {
          await interaction.editReply('❌ Không thể thay đổi nickname!');
          return;
        }

        try {
          await (member as any).setNickname(nickname);
          
          const embed = new EmbedBuilder()
            .setColor(0xe2b93b)
            .setTitle(`${emojis.sparkles} Đổi nickname thành công`)
            .setDescription(nickname 
              ? `Nickname mới: **${nickname}**` 
              : 'Đã reset nickname về mặc định')
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          await interaction.editReply('❌ Không thể đổi nickname! (Kiểm tra quyền của bot)');
        }
      }
    };

    // /priority-support command - Tất cả VIP
    const prioritySupportCommand = {
      data: new SlashCommandBuilder()
        .setName('priority-support')
        .setDescription('🆘 Yêu cầu hỗ trợ ưu tiên từ admin (Tất cả VIP)')
        .addStringOption(option =>
          option.setName('issue')
            .setDescription('Mô tả vấn đề')
            .setRequired(true)
            .setMaxLength(500)),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ ephemeral: true });

        if (!hasVIPLevel(interaction, 3)) { // Minimum VIP
          await interaction.editReply('❌ Bạn cần role VIP để sử dụng lệnh này!');
          return;
        }

        const issue = interaction.options.getString('issue', true);
        const ownerId = process.env.OWNER_ID;

        if (!ownerId) {
          await interaction.editReply('❌ Chưa cấu hình OWNER_ID trong .env!');
          return;
        }

        try {
          const owner = await this.client.users.fetch(ownerId);
          
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`${emojis.bell} Yêu cầu hỗ trợ VIP`)
            .setDescription(`**Từ:** ${interaction.user.tag} (${interaction.user.id})\n**Server:** ${interaction.guild?.name}\n\n**Vấn đề:**\n${issue}`)
            .setTimestamp();

          await owner.send({ embeds: [embed] });
          await interaction.editReply(`${emojis.success} Đã gửi yêu cầu hỗ trợ đến admin! Bạn sẽ nhận được phản hồi sớm.`);
        } catch (error) {
          await interaction.editReply('❌ Không thể gửi tin nhắn cho admin!');
        }
      }
    };

    this.commands.set('vip-bonus', vipBonusCommand);
    this.commands.set('vip-lottery', vipLotteryCommand);
    this.commands.set('vip-nickname', vipNicknameCommand);
    this.commands.set('priority-support', prioritySupportCommand);
  }

  async cleanup() {
    console.log('🧹 VIP module cleanup');
  }
}
