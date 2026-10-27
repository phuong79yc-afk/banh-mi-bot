import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ContainerBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  MessageFlags,
} from 'discord.js';
import { emojis } from '../../config/emojis';
import { getTursoDatabase } from '../../database/turso';
import path from 'path';

// ==================== DATABASE ====================
interface UserData {
  user_id: string;
  balance: number;
  gold_balance: number;
  streak: number;
  max_streak: number;
  total_checkins: number;
  last_daily: string | null;
}

interface Transaction {
  id: number;
  user_id: string;
  type: string; // 'earn', 'spend', 'transfer', 'admin'
  amount: number;
  currency: string; // 'coins', 'gold'
  description: string;
  timestamp: string;
}

// ==================== HELPER FUNCTIONS ====================
const fmt = (n: number) => n.toLocaleString('vi-VN');
const text = (content: string) => new TextDisplayBuilder().setContent(content);

async function getUser(userId: string): Promise<UserData> {
  const db = getTursoDatabase();
  
  // Ensure user exists
  await db.execute({
    sql: `INSERT OR IGNORE INTO daily_users (user_id, balance, gold_balance, streak, max_streak, total_checkins)
          VALUES (?, 0, 0, 0, 0, 0)`,
    args: [userId]
  });
  
  // Fetch user data
  const result = await db.execute({
    sql: 'SELECT * FROM daily_users WHERE user_id = ?',
    args: [userId]
  });
  
  if (result.rows.length === 0) {
    throw new Error('Failed to fetch user data after insert');
  }
  
  // Map row array to UserData object using column names
  const row = result.rows[0];
  const cols = result.columns;
  return {
    user_id: String(row[cols.indexOf('user_id')]),
    balance: Number(row[cols.indexOf('balance')]) || 0,
    gold_balance: Number(row[cols.indexOf('gold_balance')]) || 0,
    streak: Number(row[cols.indexOf('streak')]) || 0,
    max_streak: Number(row[cols.indexOf('max_streak')]) || 0,
    total_checkins: Number(row[cols.indexOf('total_checkins')]) || 0,
    last_daily: row[cols.indexOf('last_daily')] ? String(row[cols.indexOf('last_daily')]) : null
  };
}

async function getTransactions(userId: string, limit: number = 20): Promise<Transaction[]> {
  const db = getTursoDatabase();
  const result = await db.execute({
    sql: `SELECT * FROM transactions 
          WHERE user_id = ? 
          ORDER BY timestamp DESC 
          LIMIT ?`,
    args: [userId, limit]
  });
  
  const cols = result.columns;
  return result.rows.map((row: any) => ({
    id: Number(row[cols.indexOf('id')]),
    user_id: String(row[cols.indexOf('user_id')]),
    type: String(row[cols.indexOf('type')]),
    amount: Number(row[cols.indexOf('amount')]),
    currency: String(row[cols.indexOf('currency')]),
    description: String(row[cols.indexOf('description')]),
    timestamp: String(row[cols.indexOf('timestamp')])
  }));
}

async function addTransaction(
  userId: string,
  type: 'earn' | 'spend' | 'transfer' | 'admin',
  amount: number,
  currency: 'coins' | 'gold',
  description: string
): Promise<void> {
  const db = getTursoDatabase();
  await db.execute({
    sql: `INSERT INTO transactions (user_id, type, amount, currency, description, timestamp)
          VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    args: [userId, type, amount, currency, description]
  });
}

// Export for other modules
export { addTransaction, getUser };

// ==================== ADMIN: COMPENSATE COMMAND ====================
const compensateCommand = {
  data: new SlashCommandBuilder()
    .setName('compensate')
    .setDescription('[[Admin]] Đền bù xu hoặc vé vàng cho user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User nhận đền bù')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Lý do đền bù')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('coins')
        .setDescription('Số xu đền bù')
        .setRequired(false)
        .setMinValue(1)
    )
    .addIntegerOption(option =>
      option
        .setName('gold')
        .setDescription('Số vé vàng đền bù')
        .setRequired(false)
        .setMinValue(1)
    )
    .setDefaultMemberPermissions(0), // Administrator only

  async execute(interaction: ChatInputCommandInteraction) {
    // Double-check permissions
    if (!interaction.memberPermissions?.has('Administrator')) {
      return interaction.reply({
        content: `${emojis.error || '❌'} Chỉ admin mới có thể dùng lệnh này!`,
        flags: 64
      });
    }

    const targetUser = interaction.options.getUser('user', true);
    const coins = interaction.options.getInteger('coins') || 0;
    const gold = interaction.options.getInteger('gold') || 0;
    const reason = interaction.options.getString('reason', true);

    // Validate
    if (coins <= 0 && gold <= 0) {
      return interaction.reply({
        content: `${emojis.error || '❌'} Phải chọn ít nhất 1 loại tiền (coins hoặc gold)!`,
        flags: 64
      });
    }

    if (targetUser.bot) {
      return interaction.reply({
        content: `${emojis.error || '❌'} Không thể đền bù cho bot!`,
        flags: 64
      });
    }

    try {
      // Get current balance
      const userData = await getUser(targetUser.id);
      
      // Update database
      const db = getTursoDatabase();
      await db.execute({
        sql: `UPDATE daily_users 
              SET balance = balance + ?, gold_balance = gold_balance + ? 
              WHERE user_id = ?`,
        args: [coins, gold, targetUser.id]
      });

      // Record transactions
      if (coins > 0) {
        await addTransaction(targetUser.id, 'admin', coins, 'coins', `Đền bù: ${reason}`);
      }
      if (gold > 0) {
        await addTransaction(targetUser.id, 'admin', gold, 'gold', `Đền bù: ${reason}`);
      }

      // Get new balance
      const newUserData = await getUser(targetUser.id);

      // Confirmation embed
      const embed = new EmbedBuilder()
        .setColor(0x57f287) // Green
        .setTitle('✅ Đền bù thành công!')
        .setDescription(`Đã đền bù cho **${targetUser.username}**`)
        .addFields(
          {
            name: '🎁 Đền bù',
            value: [
              coins > 0 ? `${emojis.coin || '🪙'} **${fmt(coins)}** xu` : '',
              gold > 0 ? `💛 **${fmt(gold)}** vé vàng` : ''
            ].filter(Boolean).join('\n'),
            inline: true
          },
          {
            name: '💰 Số dư mới',
            value: [
              `${emojis.coin || '🪙'} **${fmt(newUserData.balance)}** xu`,
              `💛 **${fmt(newUserData.gold_balance)}** vé vàng`
            ].join('\n'),
            inline: true
          },
          {
            name: '📝 Lý do',
            value: reason,
            inline: false
          }
        )
        .setFooter({ text: `Admin: ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Log to console
      console.log(`[COMPENSATE] ${interaction.user.username} gave ${targetUser.username}: ${coins} coins, ${gold} gold. Reason: ${reason}`);

    } catch (error) {
      console.error('[COMPENSATE] Error:', error);
      await interaction.reply({
        content: `${emojis.error || '❌'} Có lỗi khi đền bù. Vui lòng thử lại!`,
        flags: 64
      });
    }
  }
};

// ==================== ADMIN: BULK COMPENSATE COMMAND ====================
const bulkCompensateCommand = {
  data: new SlashCommandBuilder()
    .setName('bulk-compensate')
    .setDescription('[[Admin]] Đền bù hàng loạt cho nhiều users')
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Lý do đền bù')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('filter')
        .setDescription('Lọc users cần đền bù')
        .setRequired(true)
        .addChoices(
          { name: 'Tất cả users', value: 'all' },
          { name: 'Users đã daily hôm nay', value: 'daily-today' },
          { name: 'Users có streak > 0', value: 'has-streak' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('coins')
        .setDescription('Số xu đền bù mỗi người')
        .setRequired(false)
        .setMinValue(1)
    )
    .addIntegerOption(option =>
      option
        .setName('gold')
        .setDescription('Số vé vàng đền bù mỗi người')
        .setRequired(false)
        .setMinValue(1)
    )
    .setDefaultMemberPermissions(0), // Administrator only

  async execute(interaction: ChatInputCommandInteraction) {
    // Double-check permissions
    if (!interaction.memberPermissions?.has('Administrator')) {
      return interaction.reply({
        content: `${emojis.error || '❌'} Chỉ admin mới có thể dùng lệnh này!`,
        flags: 64
      });
    }

    const coins = interaction.options.getInteger('coins') || 0;
    const gold = interaction.options.getInteger('gold') || 0;
    const reason = interaction.options.getString('reason', true);
    const filter = interaction.options.getString('filter', true);

    // Validate
    if (coins <= 0 && gold <= 0) {
      return interaction.reply({
        content: `${emojis.error || '❌'} Phải chọn ít nhất 1 loại tiền!`,
        flags: 64
      });
    }

    await interaction.deferReply();

    try {
      // Get users based on filter
      const db = getTursoDatabase();
      let users: UserData[] = [];
      
      if (filter === 'all') {
        const result = await db.execute('SELECT * FROM daily_users');
        users = result.rows.map((row: any) => {
          const cols = result.columns;
          return {
            user_id: String(row[cols.indexOf('user_id')]),
            balance: Number(row[cols.indexOf('balance')]) || 0,
            gold_balance: Number(row[cols.indexOf('gold_balance')]) || 0,
            streak: Number(row[cols.indexOf('streak')]) || 0,
            max_streak: Number(row[cols.indexOf('max_streak')]) || 0,
            total_checkins: Number(row[cols.indexOf('total_checkins')]) || 0,
            last_daily: row[cols.indexOf('last_daily')] ? String(row[cols.indexOf('last_daily')]) : null
          };
        });
      } else if (filter === 'daily-today') {
        const today = new Date().toISOString().split('T')[0];
        const result = await db.execute({
          sql: 'SELECT * FROM daily_users WHERE last_daily = ?',
          args: [today]
        });
        users = result.rows.map((row: any) => {
          const cols = result.columns;
          return {
            user_id: String(row[cols.indexOf('user_id')]),
            balance: Number(row[cols.indexOf('balance')]) || 0,
            gold_balance: Number(row[cols.indexOf('gold_balance')]) || 0,
            streak: Number(row[cols.indexOf('streak')]) || 0,
            max_streak: Number(row[cols.indexOf('max_streak')]) || 0,
            total_checkins: Number(row[cols.indexOf('total_checkins')]) || 0,
            last_daily: row[cols.indexOf('last_daily')] ? String(row[cols.indexOf('last_daily')]) : null
          };
        });
      } else if (filter === 'has-streak') {
        const result = await db.execute('SELECT * FROM daily_users WHERE streak > 0');
        users = result.rows.map((row: any) => {
          const cols = result.columns;
          return {
            user_id: String(row[cols.indexOf('user_id')]),
            balance: Number(row[cols.indexOf('balance')]) || 0,
            gold_balance: Number(row[cols.indexOf('gold_balance')]) || 0,
            streak: Number(row[cols.indexOf('streak')]) || 0,
            max_streak: Number(row[cols.indexOf('max_streak')]) || 0,
            total_checkins: Number(row[cols.indexOf('total_checkins')]) || 0,
            last_daily: row[cols.indexOf('last_daily')] ? String(row[cols.indexOf('last_daily')]) : null
          };
        });
      }

      if (users.length === 0) {
        return interaction.editReply({
          content: `${emojis.error || '❌'} Không tìm thấy user nào phù hợp!`
        });
      }

      // Confirm with user
      const confirmEmbed = new EmbedBuilder()
        .setColor(0xfee75c) // Yellow
        .setTitle('⚠️ Xác nhận đền bù hàng loạt')
        .setDescription(
          `Sắp đền bù cho **${users.length} users**:\n\n` +
          (coins > 0 ? `${emojis.coin || '🪙'} **${fmt(coins)}** xu/người\n` : '') +
          (gold > 0 ? `💛 **${fmt(gold)}** vé vàng/người\n` : '') +
          `\n**Tổng:** ${fmt(users.length * coins)} xu + ${fmt(users.length * gold)} vé vàng\n\n` +
          `**Lý do:** ${reason}\n\n` +
          `Reply **"confirm"** trong 30 giây để xác nhận.`
        )
        .setFooter({ text: 'Thao tác này không thể hoàn tác!' });

      await interaction.editReply({ embeds: [confirmEmbed] });

      // Wait for confirmation
      const channel = interaction.channel;
      if (!channel || !('awaitMessages' in channel)) {
        return interaction.editReply({
          content: `${emojis.error || '❌'} Không thể xác nhận trong kênh này.`,
          embeds: []
        });
      }

      const filter_msg = (m: any) => m.author.id === interaction.user.id && m.content.toLowerCase() === 'confirm';
      const collected = await channel.awaitMessages({
        filter: filter_msg,
        max: 1,
        time: 30000,
        errors: ['time']
      }).catch(() => null);

      if (!collected || collected.size === 0) {
        return interaction.editReply({
          content: `${emojis.error || '❌'} Đã hủy - không có xác nhận.`,
          embeds: []
        });
      }

      // Execute bulk compensation
      let success = 0;
      for (const user of users) {
        try {
          await db.execute({
            sql: `UPDATE daily_users 
                  SET balance = balance + ?, gold_balance = gold_balance + ? 
                  WHERE user_id = ?`,
            args: [coins, gold, user.user_id]
          });
          
          if (coins > 0) {
            await addTransaction(user.user_id, 'admin', coins, 'coins', `Đền bù hàng loạt: ${reason}`);
          }
          if (gold > 0) {
            await addTransaction(user.user_id, 'admin', gold, 'gold', `Đền bù hàng loạt: ${reason}`);
          }
          
          success++;
        } catch (err) {
          console.error(`[BULK-COMPENSATE] Failed for user ${user.user_id}:`, err);
        }
      }

      // Success embed
      const resultEmbed = new EmbedBuilder()
        .setColor(0x57f287) // Green
        .setTitle('✅ Đền bù hàng loạt thành công!')
        .setDescription(
          `Đã đền bù cho **${success}/${users.length} users**:\n\n` +
          (coins > 0 ? `${emojis.coin || '🪙'} **${fmt(coins)}** xu/người\n` : '') +
          (gold > 0 ? `💛 **${fmt(gold)}** vé vàng/người\n` : '') +
          `\n**Tổng cộng:** ${fmt(success * coins)} xu + ${fmt(success * gold)} vé vàng`
        )
        .addFields({
          name: '📝 Lý do',
          value: reason
        })
        .setFooter({ text: `Admin: ${interaction.user.username}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [resultEmbed] });

      console.log(`[BULK-COMPENSATE] ${interaction.user.username} gave ${success} users: ${coins} coins, ${gold} gold. Reason: ${reason}`);

    } catch (error) {
      console.error('[BULK-COMPENSATE] Error:', error);
      await interaction.editReply({
        content: `${emojis.error || '❌'} Có lỗi khi đền bù hàng loạt!`
      });
    }
  }
};

// ==================== SLASH COMMAND ====================
const balanceCommand = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Kiểm tra số xu và vé vàng')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User cần xem (để trống để xem của bạn)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply();
    } catch (error: any) {
      if (error.code === 10062 || error.code === 40060) return;
      throw error;
    }

    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    // Check if bot
    if (targetUser.bot) {
      return interaction.editReply({
        components: [new ContainerBuilder().addTextDisplayComponents(text(`${emojis.error} Bot không có tài khoản xu.`))],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const member = interaction.options.getMember('user') || interaction.member;
    const name = (member as any)?.displayName ?? targetUser.username;
    const userData = await getUser(targetUser.id);

    const card = new ContainerBuilder()
      .setAccentColor(0x40b8a8)
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            text(`## ${emojis.coin} Ví của ${name}`),
            text(`-# Số dư tài khoản${targetUser.id === interaction.user.id ? ' của bạn' : ''}`),
          )
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetUser.displayAvatarURL({ size: 256 }))),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large),
      )
      .addTextDisplayComponents(
        text(
          [
            `### Số dư hiện tại`,
            `${emojis.coin} **${fmt(userData.balance)}** Coin`,
            `${emojis.gem} **${fmt(userData.gold_balance)}** Gem`,
          ].join('\n'),
        ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(
        text(`${emojis.fire} **Streak:** ${userData.streak} ngày  ·  ${emojis.chart} **Check-in:** ${fmt(userData.total_checkins)} lần`),
        text(`-# Cập nhật lúc <t:${Math.floor(Date.now() / 1000)}:R>`),
      );

    await interaction.editReply({
      components: [card],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
  }
};

// ==================== TRANSACTION HISTORY COMMAND ====================
const transactionHistoryCommand = {
  data: new SlashCommandBuilder()
    .setName('transaction-history')
    .setDescription('Xem lịch sử giao dịch xu và vé vàng')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User cần xem (để trống để xem của bạn)')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('limit')
        .setDescription('Số lượng giao dịch hiển thị')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(50)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const limit = interaction.options.getInteger('limit') || 20;
    
    // Check if bot
    if (targetUser.bot) {
      return interaction.reply({
        content: 'Bot không có lịch sử giao dịch.',
        flags: 64
      });
    }

    const member = interaction.options.getMember('user') || interaction.member;
    const name = (member as any)?.displayName ?? targetUser.username;
    
    const transactions = await getTransactions(targetUser.id, limit);

    if (transactions.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle('📜 Lịch sử giao dịch')
        .setDescription(`**${name}** chưa có giao dịch nào.`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // Format transactions
    const typeEmoji: Record<string, string> = {
      earn: '💰',
      spend: '💸',
      transfer: '💱',
      admin: '👑'
    };

    const currencyEmoji: Record<string, string> = {
      coins: emojis.coin,
      gold: '💛'
    };

    const lines = transactions.map((tx, i) => {
      const sign = tx.type === 'earn' || tx.type === 'admin' ? '+' : '-';
      const emoji = typeEmoji[tx.type] || '💰';
      const curr = currencyEmoji[tx.currency] || emojis.coin;
      const date = new Date(tx.timestamp + 'Z').toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `${emoji} \`${sign}${fmt(Math.abs(tx.amount))}\` ${curr} · ${tx.description}\n-# ${date}`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📜 Lịch sử giao dịch - ${name}`)
      .setDescription(lines.join('\n\n'))
      .setFooter({ text: `Hiển thị ${transactions.length} giao dịch gần nhất` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

// ==================== MODULE CLASS ====================
export class BalanceModule {
  public commands: Collection<string, any>;
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
    this.commands.set(balanceCommand.data.name, balanceCommand);
    this.commands.set(transactionHistoryCommand.data.name, transactionHistoryCommand);
    this.commands.set(compensateCommand.data.name, compensateCommand);
    this.commands.set(bulkCompensateCommand.data.name, bulkCompensateCommand);
    
    console.log('💰 Balance module initialized');
  }
}

export default function (client: Client) {
  return new BalanceModule(client);
}
