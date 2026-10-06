import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';
import { emojis } from '../../config/emojis';
import Database from 'better-sqlite3';
import path from 'path';

// ==================== CONFIGURATION ====================
const OWNER_IDS = (process.env.OWNER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const GOLD_EMOJI = '💛';
const GOLD_NAME = 'Vé Vàng';

// ==================== DATABASE ====================
const db = new Database(path.join(process.cwd(), 'data', 'economy.db'));

const stmtGetUser = db.prepare('SELECT * FROM daily_users WHERE user_id = ?');
const stmtUpdateGold = db.prepare(`
  UPDATE daily_users 
  SET gold_balance = gold_balance + ?
  WHERE user_id = ?
`);
const stmtEnsureUser = db.prepare(`
  INSERT OR IGNORE INTO daily_users (user_id, balance, gold_balance, streak, max_streak, total_checkins)
  VALUES (?, 0, 0, 0, 0, 0)
`);

interface UserData {
  user_id: string;
  balance: number;
  gold_balance: number;
  streak: number;
  max_streak: number;
  total_checkins: number;
  last_daily: string | null;
}

// ==================== HELPER FUNCTIONS ====================
const fmt = (n: number) => n.toLocaleString('vi-VN');

function getUser(userId: string): UserData {
  stmtEnsureUser.run(userId);
  return stmtGetUser.get(userId) as UserData;
}

function giveGold(userId: string, amount: number) {
  stmtEnsureUser.run(userId);
  stmtUpdateGold.run(amount, userId);
}

// ==================== SLASH COMMANDS ====================

// Give gold command
const giveGoldCommand = {
  data: new SlashCommandBuilder()
    .setName('givegold')
    .setDescription('🎁 Tặng Vé Vàng cho user (Owner only)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('👤 User nhận vé vàng')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('🔢 Số vé vàng (số âm để thu hồi)')
        .setRequired(true)
        .setMinValue(-100000)
        .setMaxValue(100000)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    // Check if user is owner
    if (!OWNER_IDS.includes(interaction.user.id)) {
      await interaction.reply({
        content: `❌ Chỉ chủ bot mới được dùng lệnh này!`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const targetUser = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);

    if (amount === 0) {
      await interaction.reply({
        content: `❌ Số lượng phải khác 0!`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Get current balance
    const userData = getUser(targetUser.id);
    const oldGold = userData.gold_balance;

    // Give gold (can be negative to take away)
    giveGold(targetUser.id, amount);

    // Get new balance
    const newUserData = getUser(targetUser.id);
    const newGold = Math.max(0, newUserData.gold_balance); // Ensure non-negative

    // If would go negative, set to 0
    if (newGold < 0) {
      stmtUpdateGold.run(-newUserData.gold_balance, targetUser.id);
    }

    const finalGold = Math.max(0, newGold);

    const embed = new EmbedBuilder()
      .setColor(amount > 0 ? 0x43B581 : 0xF04747)
      .setTitle(`${amount > 0 ? '✅' : '⚠️'} ${amount > 0 ? 'Đã tặng' : 'Đã thu hồi'} ${GOLD_NAME}`)
      .setDescription(
        `**Admin:** ${interaction.user}\n` +
        `**User:** ${targetUser}\n` +
        `**${amount > 0 ? 'Tặng' : 'Thu hồi'}:** ${amount > 0 ? '+' : ''}${fmt(amount)} ${GOLD_EMOJI}\n\n` +
        `**${GOLD_NAME} cũ:** \`${fmt(oldGold)}\` ${GOLD_EMOJI}\n` +
        `**${GOLD_NAME} mới:** \`${fmt(finalGold)}\` ${GOLD_EMOJI}`
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setFooter({
        text: `Admin: ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Try to DM user
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(amount > 0 ? 0x43B581 : 0xF04747)
        .setTitle(`${amount > 0 ? '🎁' : '⚠️'} ${amount > 0 ? 'Bạn nhận được' : 'Bạn bị thu hồi'} ${GOLD_NAME}!`)
        .setDescription(
          `${amount > 0 ? 'Admin đã tặng bạn' : 'Admin đã thu hồi'} **${fmt(Math.abs(amount))}** ${GOLD_EMOJI} ${GOLD_NAME}\n\n` +
          `**${GOLD_NAME} hiện tại:** \`${fmt(finalGold)}\` ${GOLD_EMOJI}\n\n` +
          `Dùng \`/convert\` để đổi ${GOLD_NAME} thành xu!`
        )
        .setFooter({
          text: 'Banhcuon-bot',
          iconURL: interaction.client.user?.displayAvatarURL()
        })
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch (error) {
      console.log(`Cannot DM user ${targetUser.tag} - DMs might be disabled`);
    }
  }
};

// Check gold balance
const checkGoldCommand = {
  data: new SlashCommandBuilder()
    .setName('checkgold')
    .setDescription('💰 Kiểm tra Vé Vàng của user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User cần check (để trống = bản thân)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userData = getUser(targetUser.id);

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`💛 ${GOLD_NAME} của ${targetUser.username}`)
      .setDescription(
        `**${GOLD_NAME}:** \`${fmt(userData.gold_balance)}\` ${GOLD_EMOJI}\n` +
        `**Xu (Vé Xanh):** \`${fmt(userData.balance)}\` cowoncy\n\n` +
        `💡 Dùng \`/convert\` để đổi ${GOLD_NAME} thành xu!\n` +
        `Tỷ lệ: **1** ${GOLD_EMOJI} = **25** cowoncy`
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setFooter({
        text: 'Banhcuon-bot',
        iconURL: interaction.client.user?.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

// ==================== MODULE CLASS ====================
export class AdminModule {
  public commands: Collection<string, any>;
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
    
    this.commands.set(giveGoldCommand.data.name, giveGoldCommand);
    this.commands.set(checkGoldCommand.data.name, checkGoldCommand);
    
    console.log('👑 Admin module initialized');
  }
}

export default function (client: Client) {
  return new AdminModule(client);
}
