import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder
} from 'discord.js';
import { emojis } from '../../config/emojis';
import Database from 'better-sqlite3';
import path from 'path';

// ==================== DATABASE ====================
const db = new Database(path.join(process.cwd(), 'data', 'economy.db'));

const stmtGetUser = db.prepare('SELECT * FROM daily_users WHERE user_id = ?');
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

// ==================== SLASH COMMAND ====================
const balanceCommand = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('💰 Kiểm tra số dư của bạn')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User cần check (để trống = bản thân)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    // Check if bot
    if (targetUser.bot) {
      return interaction.reply({
        content: 'Bot không có tài khoản xu.',
        flags: 64
      });
    }

    const member = interaction.options.getMember('user') || interaction.member;
    const name = (member as any)?.displayName ?? targetUser.username;
    const userData = getUser(targetUser.id);

    const embed = new EmbedBuilder()
      .setColor(0x4e5058)
      .setDescription(
        `${emojis.coin} | **${name}** đang có **${fmt(userData.balance)}** ${emojis.coin} · **${fmt(userData.gold_balance)}** 💛\n` +
        `🔥 **Streak:** ${userData.streak} ngày | 📊 **Check-ins:** ${userData.total_checkins} lần`
      )
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
    
    console.log('💰 Balance module initialized');
  }
}

export default function (client: Client) {
  return new BalanceModule(client);
}
