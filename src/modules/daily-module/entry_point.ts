import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  // ===== Components V2 =====
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
} from 'discord.js';
import { emojis } from '../../config/emojis';
import { picture, combineFiles } from '../../utils/pictureHelper';
import { getTursoDatabase } from '../../database/turso';
import path from 'path';

// ==================== CONFIGURATION CONSTANTS ====================
const BASE_REWARD = 100;
const STREAK_BONUS_PER_DAY = 10;
const STREAK_BONUS_MAX = 100;
const TIMEZONE = 'Asia/Ho_Chi_Minh';
const TZ_OFFSET_MS = 7 * 60 * 60 * 1000; // Asia/Ho_Chi_Minh = UTC+7

// Role bonus config - roles from shop get % bonus
const ROLE_BONUS_CONFIG = [
  { roleId: process.env.ROLE_CHUTIEM, percent: 10, name: 'Chủ Tiệm' },
  { roleId: process.env.ROLE_BANHCUONCHUA, percent: 10, name: 'Bánh Cuốn Chúa' },
  { roleId: process.env.ROLE_HANHPHI, percent: 8, name: 'Hành Phi Elite' },
  { roleId: process.env.ROLE_BANHMI, percent: 5, name: 'Bánh Mì Fan' },
  { roleId: process.env.ROLE_NUOCCHAM, percent: 3, name: 'Fan Nước Chấm' },
];

// ==================== DATABASE INITIALIZATION ====================
interface UserDailyData {
  user_id: string;
  last_daily: string | null;
  streak: number;
  max_streak: number;
  total_checkins: number;
  balance: number;
  gold_balance: number;
}

// ==================== TIMEZONE-AWARE DATE UTILITIES ====================
/** Ngày hôm nay dạng YYYY-MM-DD theo múi giờ cấu hình */
function getTodayString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}

/** Số ngày giữa hai chuỗi YYYY-MM-DD */
function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

/**
 * Unix timestamp (giây) của 00:00 ngày kế tiếp theo giờ VN.
 * Tính từ chuỗi ngày hôm nay nên không phụ thuộc múi giờ của máy chủ.
 */
function getNextMidnightUnix(): number {
  const [y, m, d] = getTodayString().split('-').map(Number);
  return Math.floor((Date.UTC(y, m - 1, d + 1) - TZ_OFFSET_MS) / 1000);
}

// ==================== DATA ACCESS HELPERS ====================
async function getUserData(userId: string): Promise<UserDailyData> {
  const db = getTursoDatabase();
  const result = await db.execute({
    sql: 'SELECT * FROM daily_users WHERE user_id = ?',
    args: [userId]
  });
  
  if (result.rows.length === 0) {
    return {
      user_id: userId,
      balance: 0,
      gold_balance: 0,
      streak: 0,
      max_streak: 0,
      total_checkins: 0,
      last_daily: null,
    };
  }
  
  const row = result.rows[0];
  const cols = result.columns;
  return {
    user_id: String(row[cols.indexOf('user_id')]),
    balance: Number(row[cols.indexOf('balance')]) || 0,
    gold_balance: Number(row[cols.indexOf('gold_balance')]) || 0,
    streak: Number(row[cols.indexOf('streak')]) || 0,
    max_streak: Number(row[cols.indexOf('max_streak')]) || 0,
    total_checkins: Number(row[cols.indexOf('total_checkins')]) || 0,
    last_daily: row[cols.indexOf('last_daily')] ? String(row[cols.indexOf('last_daily')]) : null,
  };
}

async function hasCheckedInToday(userId: string): Promise<boolean> {
  const db = getTursoDatabase();
  const result = await db.execute({
    sql: 'SELECT last_daily FROM daily_users WHERE user_id = ?',
    args: [userId]
  });
  
  if (result.rows.length === 0) return false;
  
  const lastDaily = result.rows[0][0];
  return !!lastDaily && lastDaily === getTodayString();
}

// ==================== REWARD CALCULATION ====================
interface RewardBreakdown {
  base: number;
  streakBonus: number;
  streakCapped: boolean;
  roleBonus: number;
  roleId?: string;
  rolePercent?: number;
  total: number;
}

function calculateReward(streak: number, interaction: ChatInputCommandInteraction): RewardBreakdown {
  const base = BASE_REWARD;
  const rawStreakBonus = streak * STREAK_BONUS_PER_DAY;
  const streakBonus = Math.min(rawStreakBonus, STREAK_BONUS_MAX);
  const subtotal = base + streakBonus;

  // Role bonus (% cao nhất được tính, không cộng dồn)
  let bestRole: { roleId: string; percent: number } | undefined;
  const member = interaction.member;

  if (member && typeof member.roles !== 'string' && 'cache' in member.roles) {
    for (const config of ROLE_BONUS_CONFIG) {
      if (config.roleId && member.roles.cache.has(config.roleId)) {
        if (!bestRole || config.percent > bestRole.percent) {
          bestRole = { roleId: config.roleId, percent: config.percent };
        }
      }
    }
  }

  const roleBonus = bestRole ? Math.floor((subtotal * bestRole.percent) / 100) : 0;

  return {
    base,
    streakBonus,
    streakCapped: rawStreakBonus >= STREAK_BONUS_MAX,
    roleBonus,
    roleId: bestRole?.roleId,
    rolePercent: bestRole?.percent,
    total: subtotal + roleBonus,
  };
}

// ==================== STREAK LOGIC ====================
interface CheckInResult {
  success: boolean;
  alreadyClaimed?: boolean;
  streak?: number;
}

// ==================== REWARD CALCULATION ====================
interface RewardResult {
  base: number;
  streakBonus: number;
  streakCapped: boolean;
  roleBonus: number;
  roleId: string | null;
  rolePercent: number | null;
  roleName: string | null;
  total: number;
}

function calculateRewards(member: any, streak: number): RewardResult {
  const base = BASE_REWARD;
  const rawStreakBonus = streak * STREAK_BONUS_PER_DAY;
  const streakBonus = Math.min(rawStreakBonus, STREAK_BONUS_MAX);
  const streakCapped = rawStreakBonus >= STREAK_BONUS_MAX;
  
  let roleBonus = 0;
  let roleId: string | null = null;
  let rolePercent: number | null = null;
  let roleName: string | null = null;
  
  // Check role bonuses (highest priority wins)
  for (const config of ROLE_BONUS_CONFIG) {
    if (config.roleId && member.roles.cache.has(config.roleId)) {
      const bonus = Math.floor(base * config.percent / 100);
      if (bonus > roleBonus) {
        roleBonus = bonus;
        roleId = config.roleId;
        rolePercent = config.percent;
        roleName = config.name;
      }
    }
  }
  
  return {
    base,
    streakBonus,
    streakCapped,
    roleBonus,
    roleId,
    rolePercent,
    roleName,
    total: base + streakBonus + roleBonus
  };
}

async function processCheckIn(userId: string): Promise<CheckInResult> {
  const userData = await getUserData(userId);
  const today = getTodayString();

  if (userData.last_daily) {
    const diff = daysBetween(userData.last_daily, today);
    if (diff === 0) return { success: false, alreadyClaimed: true };
    if (diff === 1) return { success: true, streak: userData.streak + 1 }; // Streak tiếp tục
  }

  // Lần đầu, hoặc đứt chuỗi -> về 1
  return { success: true, streak: 1 };
}

// ==================== COMPONENTS V2 HELPERS ====================
const V2 = MessageFlags.IsComponentsV2;
const NO_PING = { parse: [] as never[] };

const COLOR_GREEN = 0x7be0b0;
const COLOR_BLUE = 0x5865f2;
const COLOR_GOLD = 0xffd700;

const fmt = (n: number) => n.toLocaleString('vi-VN');

const text = (content: string) => new TextDisplayBuilder().setContent(content);

const divider = (size: SeparatorSpacingSize = SeparatorSpacingSize.Small) =>
  new SeparatorBuilder().setDivider(true).setSpacing(size);

/** Thanh tiến độ ▰▰▰▱▱▱ */
function bar(progress: number, target: number, size = 10): string {
  const ratio = Math.max(0, Math.min(1, progress / target));
  const filled = Math.round(ratio * size);
  return '▰'.repeat(filled) + '▱'.repeat(size - filled);
}

/** Cột mốc streak kế tiếp */
function nextMilestone(streak: number): number {
  if (streak < 7) return 7;
  if (streak < 30) return 30;
  if (streak < 100) return 100;
  return (Math.floor(streak / 100) + 1) * 100;
}

/** Dòng tiến độ streak tới cột mốc */
function streakProgressLine(streak: number): string {
  const target = nextMilestone(streak);
  return `${emojis.fire} \`${bar(streak, target)}\` **${streak}/${target}** ngày`;
}

function milestoneMessage(streak: number): string | null {
  if (streak === 7) return `${emojis.gift} **Cột mốc 1 tuần!** Bạn thật kiên trì!`;
  if (streak === 30) return `${emojis.sparkles} **Cột mốc 1 tháng!** Tuyệt vời!`;
  if (streak === 100) return `${emojis.trophy} **Cột mốc 100 ngày!** Huyền thoại!`;
  if (streak > 0 && streak % 10 === 0) return `${emojis.sparkles} **Cột mốc ${streak} ngày!** Tuyệt vời!`;
  return null;
}

/** Ảnh thumbnail từ pictureHelper */
function loadImages(fallbackAvatar: string) {
  const thumbnail = picture(process.env.DAILY_THUMBNAIL, 'daily-icon.png');
  const files = combineFiles([thumbnail]);

  return {
    thumbUrl: thumbnail ? thumbnail.url : fallbackAvatar,
    files,
  };
}

function addHeader(container: ContainerBuilder, title: string, subtitle: string, thumbUrl: string) {
  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(text(title), text(subtitle))
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbUrl))
  );
}

// ==================== MODULE ====================
export default class DailyModule {
  name = 'daily-module';
  description = 'Hệ thống điểm danh hàng ngày';
  version = '2.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('📅 Daily check-in module initialized');
    this.registerCommands();
    console.log(`✅ Daily module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // ==================== /daily ====================
    const dailyCommand = {
      data: new SlashCommandBuilder().setName('daily').setDescription('Điểm danh hàng ngày để nhận xu'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }

        const userId = interaction.user.id;
        const user = interaction.user;
        const avatar = user.displayAvatarURL({ size: 256 });
        const nextMidnight = getNextMidnightUnix();

        // Bước 1: xử lý điểm danh
        const result = await processCheckIn(userId);

        // ---------- Đã điểm danh hôm nay ----------
        if (result.alreadyClaimed) {
          const data = await getUserData(userId);
          const { thumbUrl, files } = loadImages(avatar);

          const container = new ContainerBuilder();

          addHeader(
            container,
            '# 📅 Điểm danh hằng ngày',
            `### ${emojis.success} Bạn đã điểm danh hôm nay rồi\n-# ${user.username}`,
            thumbUrl
          );

          container
            .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
            .addTextDisplayComponents(
              text(
                [
                  `### ${emojis.fire} Chuỗi hiện tại`,
                  streakProgressLine(data.streak),
                  `-# Kỷ lục: ${data.max_streak} ngày · Tổng: ${data.total_checkins} lần`,
                ].join('\n')
              )
            )
            .addSeparatorComponents(divider())
            .addTextDisplayComponents(
              text(`${emojis.clock} **Điểm danh tiếp:** <t:${nextMidnight}:R>\n-# Banhcuon-bot`)
            );

          await interaction.editReply({
            components: [container],
            flags: V2,
            allowedMentions: NO_PING,
            files: files.length > 0 ? files : undefined,
          });

          return;
        }

        // ---------- Điểm danh thành công ----------
        const streak = result.streak!;
        const member = interaction.member;
        const rewards = calculateRewards(member, streak);

        const userDataBefore = await getUserData(userId);

        // Perform UPSERT with Turso
        const db = getTursoDatabase();
        await db.execute({
          sql: `INSERT INTO daily_users (user_id, balance, streak, max_streak, total_checkins, last_daily)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                  balance = balance + ?,
                  streak = ?,
                  max_streak = MAX(max_streak, ?),
                  total_checkins = total_checkins + 1,
                  last_daily = ?`,
          args: [
            userId,
            rewards.total,
            streak,
            Math.max(userDataBefore.max_streak, streak),
            1,  // total_checkins insert value (incremented in UPDATE)
            getTodayString(),
            // UPDATE clause values:
            rewards.total,  // balance increment
            streak,
            Math.max(userDataBefore.max_streak, streak),
            getTodayString()
          ]
        });

        const userDataAfter = await getUserData(userId);

        // Ghi nhận tiến độ quest (dynamic import để tránh circular dependency)
        try {
          const { trackCommand } = await import('../quest-module/entry_point');
          trackCommand(userId, 'daily');
        } catch (error) {
          console.error('[Daily] Failed to track quest:', error);
        }

        const { thumbUrl, files } = loadImages(avatar);

        const milestone = milestoneMessage(streak);

        // Chi tiết thưởng
        const rewardLines = [
          `${emojis.coin} **Điểm danh hằng ngày** ─ \`+${fmt(rewards.base)}\``,
          `${emojis.fire} **Chuỗi ${streak} ngày** ─ \`+${fmt(rewards.streakBonus)}\`${rewards.streakCapped ? ' (tối đa)' : ''}`,
        ];

        if (rewards.roleBonus > 0 && rewards.roleId) {
          rewardLines.push(
            `👑 <@&${rewards.roleId}> **+${rewards.rolePercent}%** ─ \`+${fmt(rewards.roleBonus)}\``
          );
        }

        const container = new ContainerBuilder();

        addHeader(
          container,
          '# 📅 Điểm danh hằng ngày',
          `### ${emojis.success} Điểm danh thành công!\n-# ${user.username}`,
          thumbUrl
        );

        container
          .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
          .addTextDisplayComponents(text(rewardLines.join('\n')))
          .addSeparatorComponents(divider())
          .addTextDisplayComponents(
            text(`## ${emojis.sparkles} Tổng nhận: ${fmt(rewards.total)} ${emojis.coin}`)
          )
          .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
          .addTextDisplayComponents(
            text(
              [
                `### ${emojis.fire} Tiến độ chuỗi`,
                streakProgressLine(streak),
                `-# Kỷ lục: ${userDataAfter.max_streak} ngày · Tổng: ${userDataAfter.total_checkins} lần`,
              ].join('\n')
            )
          );

        if (milestone) {
          container.addSeparatorComponents(divider()).addTextDisplayComponents(text(milestone));
        }

        container
          .addSeparatorComponents(divider())
          .addTextDisplayComponents(
            text(
              [
                `💰 **Số dư mới:** \`${fmt(userDataAfter.balance)}\` ${emojis.coin}`,
                `${emojis.clock} **Điểm danh tiếp:** <t:${nextMidnight}:R>`,
                `-# Banhcuon-bot`,
              ].join('\n')
            )
          );

        await interaction.editReply({
          components: [container],
          flags: V2,
          allowedMentions: NO_PING,
          files: files.length > 0 ? files : undefined,
        });
      },
    };

    // ==================== /daily-stats ====================
    const statsCommand = {
      data: new SlashCommandBuilder().setName('daily-stats').setDescription('Xem thống kê điểm danh của bạn'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }

        const userId = interaction.user.id;
        const data = await getUserData(userId);
        const checkedToday = await hasCheckedInToday(userId);

        const container = new ContainerBuilder();

        addHeader(
          container,
          `# ${emojis.chart} Thống kê điểm danh`,
          `-# ${interaction.user.username}`,
          interaction.user.displayAvatarURL({ size: 256 })
        );

        container
          .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
          .addTextDisplayComponents(
            text(
              [
                `${emojis.chart} **Tổng số lần điểm danh:** \`${fmt(data.total_checkins)}\` lần`,
                `${emojis.coin} **Số dư hiện tại:** \`${fmt(data.balance)}\` ${emojis.coin}`,
              ].join('\n')
            )
          )
          .addSeparatorComponents(divider())
          .addTextDisplayComponents(
            text(
              [
                `### ${emojis.trophy} Chuỗi điểm danh`,
                streakProgressLine(data.streak),
                `${emojis.star} **Dài nhất:** \`${data.max_streak}\` ngày`,
              ].join('\n')
            )
          )
          .addSeparatorComponents(divider())
          .addTextDisplayComponents(
            text(
              [
                `${emojis.calendar} **Lần cuối điểm danh:** ${data.last_daily ?? 'Chưa có'}`,
                `${emojis.clock} **Hôm nay:** ${
                  checkedToday ? `${emojis.success} Đã điểm danh` : `${emojis.warning} Chưa điểm danh`
                }`,
              ].join('\n')
            )
          )
          .addTextDisplayComponents(text('-# Banhcuon-bot'));

        await interaction.editReply({ components: [container], flags: V2, allowedMentions: NO_PING });
      },
    };

    // ==================== /daily-leaderboard ====================
    const leaderboardCommand = {
      data: new SlashCommandBuilder().setName('daily-leaderboard').setDescription('Xem bảng xếp hạng điểm danh'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }

        const db = getTursoDatabase();
        const result = await db.execute({
          sql: 'SELECT * FROM daily_users ORDER BY streak DESC, total_checkins DESC LIMIT 10',
          args: []
        });
        
        const leaderboard = result.rows.map((row: any) => {
          const cols = result.columns;
          return {
            user_id: String(row[cols.indexOf('user_id')]),
            balance: Number(row[cols.indexOf('balance')]) || 0,
            gold_balance: Number(row[cols.indexOf('gold_balance')]) || 0,
            streak: Number(row[cols.indexOf('streak')]) || 0,
            max_streak: Number(row[cols.indexOf('max_streak')]) || 0,
            total_checkins: Number(row[cols.indexOf('total_checkins')]) || 0,
            last_daily: row[cols.indexOf('last_daily')] ? String(row[cols.indexOf('last_daily')]) : null
          } as UserDailyData;
        });

        if (leaderboard.length === 0) {
          await interaction.editReply({
            components: [
              new ContainerBuilder().addTextDisplayComponents(text('Chưa có ai điểm danh cả! Hãy là người đầu tiên với `/daily`! 🎯')),
            ],
            flags: V2,
          });
          return;
        }

        const medals = ['🥇', '🥈', '🥉'];

        const line = (entry: UserDailyData, index: number) =>
          `${medals[index] ?? `**${index + 1}.**`} <@${entry.user_id}>\n` +
          `-# ${emojis.fire} ${entry.streak} ngày · ${emojis.chart} ${entry.total_checkins} lần`;

        const top3 = leaderboard.slice(0, 3);
        const rest = leaderboard.slice(3);

        const container = new ContainerBuilder();

        container
          .addTextDisplayComponents(text(`# ${emojis.trophy} Bảng Xếp Hạng Điểm Danh`), text('-# Top 10 người điểm danh nhiều nhất'))
          .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
          .addTextDisplayComponents(text(top3.map((e: any, i: number) => line(e, i)).join('\n\n')));

        if (rest.length) {
          container
            .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
            .addTextDisplayComponents(text(rest.map((e: any, i: number) => line(e, i + 3)).join('\n')));
        }

        container.addTextDisplayComponents(text('-# Banhcuon-bot'));

        await interaction.editReply({ components: [container], flags: V2, allowedMentions: NO_PING });
      },
    };

    this.commands.set('daily', dailyCommand);
    this.commands.set('daily-stats', statsCommand);
    this.commands.set('daily-leaderboard', leaderboardCommand);
  }

  async cleanup() {
    console.log('🧹 Daily module cleanup');
  }
}
